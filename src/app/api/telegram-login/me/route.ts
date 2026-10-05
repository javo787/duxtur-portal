import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

// GET /api/telegram-login/me -> { connected: boolean } for the signed-in account (401 without a session).
// Lets "Connect Telegram" show whether there is anything left to connect. The Telegram id itself is not sent.
export async function GET() {
  try {
    const userId = ((await auth())?.user as { id?: string } | undefined)?.id;
    if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    await dbConnect();
    const user = await User.findById(userId).select('telegramId').lean<{ telegramId?: number | null } | null>();
    if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    return NextResponse.json({ connected: typeof user.telegramId === 'number' });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
