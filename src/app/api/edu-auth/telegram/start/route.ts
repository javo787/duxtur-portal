import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { createLogin, START_PREFIX } from '@/lib/edu-telegram-login';
import { eduPreflight, withEduCors } from '@/lib/edu-cors';
import { eduBotUsername } from '@/lib/edu-telegram-bot';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  return eduPreflight(req);
}

// POST /api/edu-auth/telegram/start -> { token, pollSecret, botUrl, expiresInSec }
export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || 'anonymous').split(',')[0].trim();
  const { success } = await rateLimit(`edu_tg_start_${ip}`, 10, 60 * 1000);
  if (!success) {
    return withEduCors(req, NextResponse.json({ error: 'Too many requests' }, { status: 429 }));
  }

  try {
    const { token, pollSecret, expiresInSec } = await createLogin();
    const botUrl = `https://t.me/${eduBotUsername()}?start=${START_PREFIX}${token}`;
    return withEduCors(req, NextResponse.json({ token, pollSecret, botUrl, expiresInSec }));
  } catch (error) {
    Sentry.captureException(error);
    console.error('[edu-auth/start]', error);
    return withEduCors(req, NextResponse.json({ error: 'Server error' }, { status: 500 }));
  }
}
