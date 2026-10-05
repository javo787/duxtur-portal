import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { rateLimit } from '@/lib/rate-limit';
import { consumeLogin, isValidToken } from '@/lib/edu-telegram-login';
import { attachTelegram } from '@/lib/portal-telegram-account';
import { isSameOrigin } from '@/lib/same-origin';
import { describeError, eduLog, maskRef, newReqId } from '@/lib/edu-log';

export const dynamic = 'force-dynamic';

const CONFLICT_MESSAGES = {
  telegram_taken: 'This Telegram account is already connected to another duxtur.org account.',
  already_has_telegram: 'Another Telegram account is already connected to this duxtur.org account.',
  not_found: 'Account not found.',
} as const;

// POST /api/telegram-login/link { token, pollSecret } -> { linked: true, eduUid }
// Connects the Telegram user who confirmed in the bot to the signed-in account.
//
// Three things must all hold, and any one missing refuses the call:
//  - the request comes from a page of this site (a forged cross-site request would attach a STRANGER's Telegram to
//    this account, which is a way into it);
//  - a portal session exists;
//  - the login being used was started by this same user (consumeLogin matches its userId), so a login made by anybody
//    else, with any token they could obtain, is useless here.
export async function POST(req: NextRequest) {
  const reqId = newReqId();
  const respond = (body: Record<string, unknown>, status = 200) =>
    NextResponse.json(body, { status, headers: { 'X-Edu-Request-Id': reqId } });

  if (!isSameOrigin(req)) {
    eduLog('portal-tg', reqId, 'link:origin-refused', { origin: req.headers.get('origin') }, 'warn');
    return respond({ error: 'Forbidden', code: 'bad_origin', ref: reqId }, 403);
  }

  try {
    const userId = ((await auth())?.user as { id?: string } | undefined)?.id;
    if (!userId) return respond({ error: 'Not signed in', code: 'not_signed_in', ref: reqId }, 401);

    const ip = (req.headers.get('x-forwarded-for') || 'anonymous').split(',')[0].trim();
    const { success } = await rateLimit(`portal_tg_link_${ip}`, 20, 60 * 1000);
    if (!success) return respond({ error: 'Too many requests', code: 'rate_limited', ref: reqId }, 429);

    let body: { token?: unknown; pollSecret?: unknown };
    try {
      body = await req.json();
    } catch {
      return respond({ error: 'Bad request', ref: reqId }, 400);
    }
    if (!isValidToken(body.token) || !isValidToken(body.pollSecret)) return respond({ error: 'Bad request', ref: reqId }, 400);

    const login = await consumeLogin(body.token, body.pollSecret, { purpose: 'portal_link', userId });
    if (login.state !== 'approved') {
      eduLog('portal-tg', reqId, 'link:not-approved', { tokenRef: maskRef(body.token), state: login.state }, 'warn');
      return respond({ error: 'Login not approved', code: login.state === 'pending' ? 'pending' : 'gone', ref: reqId }, login.state === 'pending' ? 409 : 404);
    }

    const result = await attachTelegram(userId, login.telegram);
    if (!result.ok) {
      eduLog('portal-tg', reqId, 'link:refused', { code: result.code }, 'warn');
      return respond({ error: CONFLICT_MESSAGES[result.code], code: result.code, ref: reqId }, 409);
    }
    eduLog('portal-tg', reqId, 'link:attached', { alreadyLinked: result.alreadyLinked, eduLinked: !!result.eduUid });
    return respond({ linked: true, eduUid: result.eduUid });
  } catch (error) {
    Sentry.captureException(error);
    eduLog('portal-tg', reqId, 'link:error', describeError(error), 'error');
    return respond({ error: 'Server error', ref: reqId }, 500);
  }
}
