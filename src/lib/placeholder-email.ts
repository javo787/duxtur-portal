import crypto from 'crypto';

/**
 * Telegram gives no e-mail, but the rest of the portal looks users up by e-mail, so a person who signs up with Telegram
 * gets a placeholder address. `.invalid` is reserved (RFC 2606) and can never receive mail; the random part means
 * nobody can register an address like it in advance. It is hidden wherever an address could be shown or used.
 */
export const PLACEHOLDER_EMAIL_DOMAIN = 'telegram.invalid';

export function placeholderEmail(telegramId: number, random: string = crypto.randomBytes(6).toString('hex')): string {
  return `tg${telegramId}.${random}@${PLACEHOLDER_EMAIL_DOMAIN}`;
}

export function isPlaceholderEmail(email: unknown): boolean {
  return typeof email === 'string' && email.toLowerCase().endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`);
}

/** The address to show or send to: empty for a placeholder. */
export function realEmail(email: unknown): string {
  return typeof email === 'string' && !isPlaceholderEmail(email) ? email : '';
}
