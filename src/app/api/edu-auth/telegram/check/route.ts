import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { consumeLogin, displayName, isValidToken } from '@/lib/edu-telegram-login';
import { createEduCustomToken } from '@/lib/firebase-admin';
import { eduPreflight, withEduCors } from '@/lib/edu-cors';
import { describeError, eduLog, envFlags, maskRef, newReqId, requestFacts, verboseLogs } from '@/lib/edu-log';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  return eduPreflight(req);
}

// POST /api/edu-auth/telegram/check { token, pollSecret }
//  -> { status: 'pending' } | { status: 'gone' } | { status: 'approved', customToken, profile }
type Respond = (body: Record<string, unknown>, status?: number) => NextResponse;

export async function POST(req: NextRequest) {
  const reqId = newReqId();
  const startedAt = Date.now();
  const respond: Respond = (body, status = 200) => withEduCors(req, NextResponse.json(body, { status }), reqId);

  // Nothing may escape: an uncaught exception makes Next answer 500 with an empty body and no X-Edu-Request-Id,
  // which is undiagnosable from the browser. Anything unexpected is logged here and returned with its ref.
  try {
    return await handleCheck(req, reqId, startedAt, respond);
  } catch (error) {
    Sentry.captureException(error);
    eduLog('check', reqId, 'check:unhandled', {
      ...describeError(error),
      tookMs: Date.now() - startedAt,
      env: envFlags(),
    }, 'error');
    return respond({ error: 'Server error', ref: reqId }, 500);
  }
}

async function handleCheck(req: NextRequest, reqId: string, startedAt: number, respond: Respond): Promise<NextResponse> {

  const ip = (req.headers.get('x-forwarded-for') || 'anonymous').split(',')[0].trim();
  // Polled every ~2s for up to 5 min from one client: allow generously, but not unbounded.
  const { success, count } = await rateLimit(`edu_tg_check_${ip}`, 90, 60 * 1000);
  if (!success) {
    eduLog('check', reqId, 'check:rate-limited', { count, limit: 90, windowSec: 60 }, 'warn');
    return respond({ error: 'Too many requests', ref: reqId }, 429);
  }

  let body: { token?: unknown; pollSecret?: unknown };
  try {
    body = await req.json();
  } catch (err) {
    eduLog('check', reqId, 'check:bad-json', { ...describeError(err), ...requestFacts(req) }, 'warn');
    return respond({ error: 'Bad request', ref: reqId }, 400);
  }
  if (!isValidToken(body.token) || !isValidToken(body.pollSecret)) {
    eduLog('check', reqId, 'check:invalid-token-format', {
      tokenType: typeof body.token,
      tokenLength: typeof body.token === 'string' ? body.token.length : null,
      pollSecretType: typeof body.pollSecret,
      pollSecretLength: typeof body.pollSecret === 'string' ? body.pollSecret.length : null,
      expected: '32 lowercase hex chars each',
    }, 'warn');
    return respond({ error: 'Bad request', ref: reqId }, 400);
  }
  const tokenRef = maskRef(body.token);

  try {
    const result = await consumeLogin(body.token, body.pollSecret);

    if (result.state === 'pending') {
      if (verboseLogs()) eduLog('check', reqId, 'check:pending', { tokenRef, tookMs: Date.now() - startedAt });
      return respond({ status: 'pending' });
    }
    if (result.state === 'gone') {
      eduLog('check', reqId, 'check:gone', {
        tokenRef,
        meaning: 'no pending/approved login for this token+secret: expired (5 min), already consumed, or never created',
        tookMs: Date.now() - startedAt,
      }, 'warn');
      return respond({ status: 'gone' }, 404);
    }

    const tg = result.telegram;
    eduLog('check', reqId, 'check:approved-consumed', { tokenRef, telegramIdSuffix: String(tg.id).slice(-3), hasUsername: !!tg.username });

    let customToken: string;
    const tokenStartedAt = Date.now();
    try {
      customToken = await createEduCustomToken(`tg_${tg.id}`, {
        provider: 'telegram',
        telegramId: tg.id,
        tgName: displayName(tg).slice(0, 100),
      });
    } catch (err) {
      Sentry.captureException(err);
      // The login row is already marked consumed, so the user has to start over: say so in the log.
      eduLog('check', reqId, 'check:custom-token-failed', {
        tokenRef,
        ...describeError(err),
        tookMs: Date.now() - tokenStartedAt,
        consequence: 'login was already consumed: the next poll returns gone and the user must restart the login',
        hint: 'FIREBASE_SERVICE_ACCOUNT_JSON missing/invalid, or the service account lacks permission (Service Account Token Creator).',
        env: envFlags(),
      }, 'error');
      return respond({ error: 'Server error', ref: reqId }, 500);
    }

    eduLog('check', reqId, 'check:custom-token-created', {
      tokenRef,
      firebaseProjectId: envFlags().firebaseProjectId,
      tokenMs: Date.now() - tokenStartedAt,
      tookMs: Date.now() - startedAt,
    });
    return respond({
      status: 'approved',
      customToken,
      projectId: envFlags().firebaseProjectId,
      profile: { telegramId: tg.id, name: displayName(tg), username: tg.username ?? null },
    });
  } catch (error) {
    Sentry.captureException(error);
    eduLog('check', reqId, 'check:error', { tokenRef, ...describeError(error), tookMs: Date.now() - startedAt, env: envFlags() }, 'error');
    return respond({ error: 'Server error', ref: reqId }, 500);
  }
}
