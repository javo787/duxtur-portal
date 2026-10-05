import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { rateLimit } from '@/lib/rate-limit';
import { isValidToken, peekLogin } from '@/lib/edu-telegram-login';
import { isSameOrigin } from '@/lib/same-origin';
import { describeError, eduLog, newReqId, verboseLogs } from '@/lib/edu-log';

export const dynamic = 'force-dynamic';

// POST /api/telegram-login/status { token, pollSecret, mode } -> { status: 'pending' | 'approved' | 'gone' }
// Polled every couple of seconds by the page that is waiting for the person to confirm in the bot. It never uses
// the login up: that happens when the page signs in (mode login) or calls /link (mode link).
export async function POST(req: NextRequest) {
  const reqId = newReqId();
  const respond = (body: Record<string, unknown>, status = 200) =>
    NextResponse.json(body, { status, headers: { 'X-Edu-Request-Id': reqId } });

  if (!isSameOrigin(req)) return respond({ error: 'Forbidden', code: 'bad_origin', ref: reqId }, 403);

  try {
    const ip = (req.headers.get('x-forwarded-for') || 'anonymous').split(',')[0].trim();
    const { success } = await rateLimit(`portal_tg_status_${ip}`, 90, 60 * 1000);
    if (!success) return respond({ error: 'Too many requests', code: 'rate_limited', ref: reqId }, 429);

    let body: { token?: unknown; pollSecret?: unknown; mode?: unknown };
    try {
      body = await req.json();
    } catch {
      return respond({ error: 'Bad request', ref: reqId }, 400);
    }
    if (!isValidToken(body.token) || !isValidToken(body.pollSecret) || (body.mode !== 'login' && body.mode !== 'link')) {
      return respond({ error: 'Bad request', ref: reqId }, 400);
    }

    let userId: string | undefined;
    if (body.mode === 'link') {
      userId = ((await auth())?.user as { id?: string } | undefined)?.id;
      if (!userId) return respond({ error: 'Not signed in', code: 'not_signed_in', ref: reqId }, 401);
    }

    const status = await peekLogin(body.token, body.pollSecret, {
      purpose: body.mode === 'link' ? 'portal_link' : 'portal',
      userId,
    });
    if (verboseLogs()) eduLog('portal-tg', reqId, 'status:polled', { mode: body.mode, status });
    return respond({ status }, status === 'gone' ? 404 : 200);
  } catch (error) {
    Sentry.captureException(error);
    eduLog('portal-tg', reqId, 'status:error', describeError(error), 'error');
    return respond({ error: 'Server error', ref: reqId }, 500);
  }
}
