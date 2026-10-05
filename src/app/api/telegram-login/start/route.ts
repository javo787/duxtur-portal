import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { rateLimit } from '@/lib/rate-limit';
import { createLogin, START_PREFIX } from '@/lib/edu-telegram-login';
import { eduBotUsername } from '@/lib/edu-telegram-bot';
import { isSameOrigin } from '@/lib/same-origin';
import { describeRequest } from '@/lib/request-hint';
import { describeError, eduLog, maskRef, newReqId } from '@/lib/edu-log';

export const dynamic = 'force-dynamic';

// POST /api/telegram-login/start { mode: 'login' | 'link' } -> { token, pollSecret, botUrl, expiresInSec }
//  login: sign in or register on duxtur.org with Telegram (no session needed)
//  link:  connect Telegram to the account that is signed in now; the login is tied to that user
export async function POST(req: NextRequest) {
  const reqId = newReqId();
  const respond = (body: Record<string, unknown>, status = 200) =>
    NextResponse.json(body, { status, headers: { 'X-Edu-Request-Id': reqId } });

  if (!isSameOrigin(req)) {
    eduLog('portal-tg', reqId, 'start:origin-refused', { origin: req.headers.get('origin') }, 'warn');
    return respond({ error: 'Forbidden', code: 'bad_origin', ref: reqId }, 403);
  }

  try {
    const ip = (req.headers.get('x-forwarded-for') || 'anonymous').split(',')[0].trim();
    const { success } = await rateLimit(`portal_tg_start_${ip}`, 10, 60 * 1000);
    if (!success) return respond({ error: 'Too many requests', code: 'rate_limited', ref: reqId }, 429);

    let mode: unknown;
    try {
      mode = (await req.json())?.mode;
    } catch {
      mode = undefined;
    }
    if (mode !== 'login' && mode !== 'link') return respond({ error: 'Bad request', ref: reqId }, 400);

    let userId: string | undefined;
    if (mode === 'link') {
      const session = await auth();
      userId = (session?.user as { id?: string } | undefined)?.id;
      if (!userId) return respond({ error: 'Not signed in', code: 'not_signed_in', ref: reqId }, 401);
    }

    const { token, pollSecret, expiresInSec } = await createLogin({
      purpose: mode === 'link' ? 'portal_link' : 'portal',
      userId,
      requestHint: describeRequest(req.headers),
    });
    eduLog('portal-tg', reqId, 'start:created', { mode, tokenRef: maskRef(token), expiresInSec });
    return respond({
      token,
      pollSecret,
      botUrl: `https://t.me/${eduBotUsername()}?start=${START_PREFIX}${token}`,
      expiresInSec,
    });
  } catch (error) {
    Sentry.captureException(error);
    eduLog('portal-tg', reqId, 'start:error', describeError(error), 'error');
    return respond({ error: 'Server error', ref: reqId }, 500);
  }
}
