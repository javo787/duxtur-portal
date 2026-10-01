import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { consumeLogin, displayName, isValidToken } from '@/lib/edu-telegram-login';
import { createEduCustomToken } from '@/lib/firebase-admin';
import { eduPreflight, withEduCors } from '@/lib/edu-cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  return eduPreflight(req);
}

// POST /api/edu-auth/telegram/check { token, pollSecret }
//  -> { status: 'pending' } | { status: 'gone' } | { status: 'approved', customToken, profile }
export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || 'anonymous').split(',')[0].trim();
  // Polled every ~2s for up to 5 min from one client: allow generously, but not unbounded.
  const { success } = await rateLimit(`edu_tg_check_${ip}`, 90, 60 * 1000);
  if (!success) {
    return withEduCors(req, NextResponse.json({ error: 'Too many requests' }, { status: 429 }));
  }

  let body: { token?: unknown; pollSecret?: unknown };
  try {
    body = await req.json();
  } catch {
    return withEduCors(req, NextResponse.json({ error: 'Bad request' }, { status: 400 }));
  }
  if (!isValidToken(body.token) || !isValidToken(body.pollSecret)) {
    return withEduCors(req, NextResponse.json({ error: 'Bad request' }, { status: 400 }));
  }

  try {
    const result = await consumeLogin(body.token, body.pollSecret);
    if (result.state === 'pending') {
      return withEduCors(req, NextResponse.json({ status: 'pending' }));
    }
    if (result.state === 'gone') {
      return withEduCors(req, NextResponse.json({ status: 'gone' }, { status: 404 }));
    }

    const tg = result.telegram;
    const customToken = await createEduCustomToken(`tg_${tg.id}`, {
      provider: 'telegram',
      telegramId: tg.id,
    });
    return withEduCors(
      req,
      NextResponse.json({
        status: 'approved',
        customToken,
        profile: { telegramId: tg.id, name: displayName(tg), username: tg.username ?? null },
      })
    );
  } catch (error) {
    Sentry.captureException(error);
    console.error('[edu-auth/check]', error);
    return withEduCors(req, NextResponse.json({ error: 'Server error' }, { status: 500 }));
  }
}
