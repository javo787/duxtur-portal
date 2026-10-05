import * as Sentry from '@sentry/nextjs';
import { rateLimit } from '@/lib/rate-limit';
import { consumeLogin, isValidToken } from '@/lib/edu-telegram-login';
import { PortalSignInUser, signInWithTelegram } from '@/lib/portal-telegram-account';
import { describeError, eduLog, maskRef, maskIp, newReqId } from '@/lib/edu-log';

/**
 * The `authorize` step of the "telegram" credentials provider (see src/auth.ts).
 *
 * The browser has been polling /api/telegram-login/status and calls signIn('telegram', { token, pollSecret }) once the
 * login is approved. Here the login is used up (exactly once, and only if it was started for a duxtur.org sign-in),
 * and the Telegram id it carries is turned into a portal account. Anything that goes wrong answers null, which
 * next-auth reports to the browser as a failed sign-in; the reason goes to the log.
 */
export async function authorizeTelegramLogin(
  credentials: Partial<Record<string, unknown>> | undefined,
  ip: string
): Promise<PortalSignInUser | null> {
  const reqId = newReqId();
  const token = credentials?.token;
  const pollSecret = credentials?.pollSecret;
  if (!isValidToken(token) || !isValidToken(pollSecret)) {
    eduLog('portal-tg', reqId, 'signin:bad-credentials', { tokenType: typeof token }, 'warn');
    return null;
  }

  try {
    const { success } = await rateLimit(`portal_tg_signin_${ip}`, 20, 60 * 1000);
    if (!success) {
      eduLog('portal-tg', reqId, 'signin:rate-limited', { ip: maskIp(ip) }, 'warn');
      return null;
    }

    const login = await consumeLogin(token, pollSecret, { purpose: 'portal' });
    if (login.state !== 'approved') {
      eduLog('portal-tg', reqId, 'signin:not-approved', { tokenRef: maskRef(token), state: login.state }, 'warn');
      return null;
    }

    const result = await signInWithTelegram(login.telegram);
    if (!result.ok) {
      eduLog('portal-tg', reqId, 'signin:refused', { tokenRef: maskRef(token), code: result.code }, 'warn');
      return null;
    }
    eduLog('portal-tg', reqId, result.created ? 'signin:registered' : 'signin:ok', {
      tokenRef: maskRef(token),
      role: result.user.role,
      telegramIdSuffix: String(login.telegram.id).slice(-3),
    });
    return result.user;
  } catch (error) {
    Sentry.captureException(error);
    eduLog('portal-tg', reqId, 'signin:error', describeError(error), 'error');
    return null;
  }
}
