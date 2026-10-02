import crypto from 'crypto';
import { describeError, eduLog, scrubSecrets } from '@/lib/edu-log';

/**
 * The Duxtur Edu login bot (@duxtur_bot) is separate from the bot that notifies
 * the admin about requests (/api/telegram/webhook), so it has its own env vars:
 *   EDU_TELEGRAM_BOT_TOKEN, EDU_TELEGRAM_BOT_SECRET, EDU_TELEGRAM_BOT_USERNAME (optional).
 */
export function eduBotUsername(): string {
  return process.env.EDU_TELEGRAM_BOT_USERNAME || 'duxtur_bot';
}

/** Constant-time check of Telegram's X-Telegram-Bot-Api-Secret-Token header. Fails closed. */
export function isValidWebhookSecret(headerValue: string | null): boolean {
  const expected = process.env.EDU_TELEGRAM_BOT_SECRET;
  if (!expected || !headerValue) return false;
  const a = Buffer.from(headerValue);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Calls the Telegram Bot API. Never throws; returns whether Telegram accepted the call.
 * Failures are logged with Telegram's own error_code/description (the bot token is scrubbed),
 * e.g. 403 "bot was blocked by the user" or 401 "Unauthorized" (wrong EDU_TELEGRAM_BOT_TOKEN).
 */
export async function callEduBot(method: string, payload: Record<string, unknown>, reqId = '-'): Promise<boolean> {
  const token = process.env.EDU_TELEGRAM_BOT_TOKEN;
  if (!token) {
    eduLog('bot', reqId, 'bot:token-missing', { method, fix: 'set EDU_TELEGRAM_BOT_TOKEN on Vercel and redeploy' }, 'error');
    return false;
  }
  const startedAt = Date.now();
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const tookMs = Date.now() - startedAt;
    if (!res.ok) {
      let telegram: { error_code?: number; description?: string } = {};
      try {
        telegram = await res.json();
      } catch {}
      eduLog('bot', reqId, 'bot:call-failed', {
        method,
        status: res.status,
        telegramErrorCode: telegram.error_code ?? null,
        telegramDescription: telegram.description ? scrubSecrets(telegram.description) : null,
        tookMs,
      }, 'error');
      return false;
    }
    eduLog('bot', reqId, 'bot:call-ok', { method, tookMs });
    return true;
  } catch (err) {
    eduLog('bot', reqId, 'bot:call-error', { method, ...describeError(err), tookMs: Date.now() - startedAt }, 'error');
    return false;
  }
}
