import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { handleEduBotUpdate } from '@/lib/bots/edu-bot';
import { isValidWebhookSecret } from '@/lib/edu-telegram-bot';
import { describeError, eduLog, newReqId, requestFacts } from '@/lib/edu-log';

export const dynamic = 'force-dynamic';

// Webhook of the Duxtur Edu login bot (@duxtur_bot). Register it with setWebhook
// (url = https://<serving host>/api/edu-auth/telegram/webhook, secret_token = EDU_TELEGRAM_BOT_SECRET).
// Use the host that answers WITHOUT a redirect (www.duxtur.org in production): Telegram does not follow redirects.
// GET /api/edu-auth/telegram/health shows the registered URL and the exact command to fix it.
// The bot logic itself lives in src/lib/bots/edu-bot.ts: the Render service (services/render-service) runs the same code,
// so the webhook can be registered on either host (see docs/RENDER_SETUP.md).
export async function POST(req: NextRequest) {
  const reqId = newReqId();
  const startedAt = Date.now();

  const secretHeader = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (!isValidWebhookSecret(secretHeader)) {
    // Telegram retries 401s, so a wrong secret shows up as a burst of these lines.
    eduLog('webhook', reqId, 'webhook:unauthorized', {
      hasSecretHeader: !!secretHeader,
      secretConfigured: !!process.env.EDU_TELEGRAM_BOT_SECRET,
      ...requestFacts(req),
      hint: !process.env.EDU_TELEGRAM_BOT_SECRET
        ? 'EDU_TELEGRAM_BOT_SECRET is not set on Vercel: every update is rejected'
        : !secretHeader
          ? 'request has no X-Telegram-Bot-Api-Secret-Token: not from Telegram, or setWebhook was called without secret_token'
          : 'header differs from EDU_TELEGRAM_BOT_SECRET: re-run setWebhook with the same secret_token',
    }, 'warn');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const update = await req.json();
    await handleEduBotUpdate(update, reqId, startedAt);
    return NextResponse.json({ ok: true });
  } catch (error) {
    Sentry.captureException(error);
    eduLog('webhook', reqId, 'webhook:error', { ...describeError(error), tookMs: Date.now() - startedAt }, 'error');
    return NextResponse.json({ ok: true }); // never make Telegram retry-storm
  }
}
