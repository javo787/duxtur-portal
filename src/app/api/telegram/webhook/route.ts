import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import { handleAdminBotUpdate, isAdminWebhookAuthorized } from '@/lib/bots/admin-bot';

// Webhook of the admin/doctor bot. The logic is in src/lib/bots/admin-bot.ts and is shared with the Render service
// (services/render-service), so the webhook can be registered on either host (see docs/RENDER_SETUP.md).
export async function POST(req: NextRequest) {
  if (!isAdminWebhookAuthorized(req.headers.get('X-Telegram-Bot-Api-Secret-Token'), req.nextUrl.searchParams.get('secret'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await handleAdminBotUpdate(await req.json());
    if (result === 'rate_limited') return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    Sentry.captureException(error); console.error(error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}
