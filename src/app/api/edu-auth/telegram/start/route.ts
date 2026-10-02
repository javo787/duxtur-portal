import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { createLogin, START_PREFIX } from '@/lib/edu-telegram-login';
import { eduPreflight, withEduCors } from '@/lib/edu-cors';
import { eduBotUsername } from '@/lib/edu-telegram-bot';
import { describeError, eduLog, envFlags, maskRef, newReqId, requestFacts } from '@/lib/edu-log';

export const dynamic = 'force-dynamic';

// Logged once per cold start, so a deploy with a missing env var is visible without any request failing first.
let envLogged = false;

export async function OPTIONS(req: NextRequest) {
  const reqId = newReqId();
  eduLog('start', reqId, 'start:preflight', requestFacts(req));
  return eduPreflight(req);
}

// POST /api/edu-auth/telegram/start -> { token, pollSecret, botUrl, expiresInSec }
export async function POST(req: NextRequest) {
  const reqId = newReqId();
  const startedAt = Date.now();
  const respond = (body: Record<string, unknown>, status = 200) =>
    withEduCors(req, NextResponse.json(body, { status }), reqId);

  if (!envLogged) {
    envLogged = true;
    eduLog('start', reqId, 'start:cold-start-env', envFlags());
  }
  eduLog('start', reqId, 'start:received', requestFacts(req));

  try {
    const ip = (req.headers.get('x-forwarded-for') || 'anonymous').split(',')[0].trim();
    const { success, count } = await rateLimit(`edu_tg_start_${ip}`, 10, 60 * 1000);
    if (!success) {
      eduLog('start', reqId, 'start:rate-limited', { count, limit: 10, windowSec: 60 }, 'warn');
      return respond({ error: 'Too many requests', ref: reqId }, 429);
    }

    const dbStartedAt = Date.now();
    const { token, pollSecret, expiresInSec } = await createLogin();
    const dbMs = Date.now() - dbStartedAt;

    const botUsername = eduBotUsername();
    const botUrl = `https://t.me/${botUsername}?start=${START_PREFIX}${token}`;
    eduLog('start', reqId, 'start:created', {
      tokenRef: maskRef(token),
      botUsername,
      expiresInSec,
      dbMs,
      tookMs: Date.now() - startedAt,
    });
    return respond({ token, pollSecret, botUrl, expiresInSec });
  } catch (error) {
    Sentry.captureException(error);
    eduLog('start', reqId, 'start:error', {
      ...describeError(error),
      tookMs: Date.now() - startedAt,
      env: envFlags(),
      hint: 'Check MONGODB_URI / database reachability (Atlas IP allowlist). Full flags are in env.',
    }, 'error');
    return respond({ error: 'Server error', ref: reqId }, 500);
  }
}
