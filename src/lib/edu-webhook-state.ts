import { describeError, eduLog, scrubSecrets } from '@/lib/edu-log';

/**
 * Is Telegram able to deliver updates of the Duxtur Edu login bot to this server?
 *
 * When it is not, nothing reaches /api/edu-auth/telegram/webhook at all: the login page keeps polling
 * /check ("pending") and the user sees an endless spinner, while the server logs show no error anywhere.
 * That silence is the symptom this module removes: the registration state is written to the logs by the
 * login itself, so the cause is readable in Vercel without calling /health by hand.
 */

export interface WebhookInfo {
  url?: string;
  pending_update_count?: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  ip_address?: string;
}

/** The host that answers WITHOUT a redirect: x-forwarded-host (Vercel) or Host. */
export function servingHostOf(headers: Headers): string {
  return (headers.get('x-forwarded-host') || headers.get('host') || '').split(',')[0].trim();
}

export function expectedWebhookUrl(servingHost: string): string {
  return `https://${servingHost}/api/edu-auth/telegram/webhook`;
}

/** Human-readable reasons why updates would not arrive. An empty list means the registration looks right. */
export function webhookProblems(info: WebhookInfo, servingHost: string): string[] {
  const expectedUrl = expectedWebhookUrl(servingHost);
  const problems: string[] = [];
  if (!info.url) {
    problems.push('no webhook is registered: Telegram sends nothing to the server');
  } else if (info.url !== expectedUrl) {
    // Telegram does not follow redirects, so a webhook on the bare domain is silently dropped when it redirects to www.
    problems.push(
      `webhook points to ${info.url}, but this server answers on ${servingHost}. If the registered host redirects here, ` +
        `Telegram gets a 301/307/308 and drops every update (it does not follow redirects)`
    );
  }
  if (info.last_error_message) {
    problems.push(`Telegram's last delivery error: "${scrubSecrets(String(info.last_error_message))}"`);
  }
  if ((info.pending_update_count ?? 0) > 0) {
    problems.push(`${info.pending_update_count} updates are waiting (the server answered with errors)`);
  }
  return problems;
}

/** The command that fixes a wrong registration. Placeholders only: real secrets never go into logs. */
export function setWebhookFix(servingHost: string): { curl: string; browserUrl: string } {
  const url = expectedWebhookUrl(servingHost);
  return {
    curl: `curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" -d "url=${url}" -d "secret_token=<EDU_TELEGRAM_BOT_SECRET>"`,
    browserUrl: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=${url}&secret_token=<EDU_TELEGRAM_BOT_SECRET>`,
  };
}

const CHECK_EVERY_MS = 5 * 60 * 1000;
const CHECK_TIMEOUT_MS = 4000;
let lastCheckAt = 0;
let inFlight = false;

/** Tests only. */
export function resetWebhookStateThrottle(): void {
  lastCheckAt = 0;
  inFlight = false;
}

/**
 * Asks Telegram (getWebhookInfo) where it delivers updates and logs the verdict as `start:webhook-state`:
 *   info  -> status "ok"
 *   warn  -> status "broken" with `problems` and the exact `fix`
 *   error -> status "error" (bot token rejected, Telegram unreachable) or "skipped" (token not set)
 * At most once per 5 minutes per server instance, never throws, never logs the bot token.
 */
export async function logWebhookState(reqId: string, servingHost: string, now: number = Date.now()): Promise<void> {
  // Preview deployments use their own hostname: comparing it with the production registration would only be noise.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') return;
  if (inFlight || now - lastCheckAt < CHECK_EVERY_MS) return;
  inFlight = true;
  lastCheckAt = now;

  try {
    const token = process.env.EDU_TELEGRAM_BOT_TOKEN;
    if (!token) {
      eduLog('start', reqId, 'start:webhook-state', {
        status: 'skipped',
        reason: 'EDU_TELEGRAM_BOT_TOKEN is not set, so the webhook cannot be checked (and the bot cannot answer users)',
      }, 'error');
      return;
    }

    const startedAt = Date.now();
    const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`, {
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });
    const body = (await res.json()) as { ok?: boolean; result?: WebhookInfo; error_code?: number; description?: string };
    const tookMs = Date.now() - startedAt;

    if (!body.ok) {
      eduLog('start', reqId, 'start:webhook-state', {
        status: 'error',
        telegramErrorCode: body.error_code ?? res.status,
        telegramDescription: scrubSecrets(body.description || res.statusText || ''),
        hint: 'Telegram rejects EDU_TELEGRAM_BOT_TOKEN: copy a fresh token from @BotFather',
        tookMs,
      }, 'error');
      return;
    }

    const info = body.result ?? {};
    const problems = webhookProblems(info, servingHost);
    eduLog('start', reqId, 'start:webhook-state', {
      status: problems.length ? 'broken' : 'ok',
      registeredUrl: info.url || null,
      expectedUrl: expectedWebhookUrl(servingHost),
      pendingUpdates: info.pending_update_count ?? 0,
      lastErrorAt: info.last_error_date ? new Date(info.last_error_date * 1000).toISOString() : null,
      lastErrorMessage: info.last_error_message ? scrubSecrets(String(info.last_error_message)) : null,
      ...(problems.length
        ? {
            problems,
            consequence: 'the user will press Start/Confirm in Telegram, but no request reaches /webhook: the login page waits until it expires',
            fix: setWebhookFix(servingHost),
          }
        : {}),
      tookMs,
    }, problems.length ? 'warn' : 'info');
  } catch (err) {
    eduLog('start', reqId, 'start:webhook-state', {
      status: 'error',
      ...describeError(err),
      hint: 'api.telegram.org is unreachable from the server, or answered with something that is not JSON',
    }, 'error');
  } finally {
    inFlight = false;
  }
}
