import crypto from 'crypto';

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

export async function callEduBot(method: string, payload: Record<string, unknown>): Promise<void> {
  const token = process.env.EDU_TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('[edu-bot] EDU_TELEGRAM_BOT_TOKEN is not configured');
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) console.error(`[edu-bot] ${method} failed with status ${res.status}`);
}
