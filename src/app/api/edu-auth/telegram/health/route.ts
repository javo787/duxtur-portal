import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { describeError, eduLog, envFlags, newReqId, requestFacts, scrubSecrets } from '@/lib/edu-log';
import { eduBotUsername } from '@/lib/edu-telegram-bot';

export const dynamic = 'force-dynamic';

/**
 * GET /api/edu-auth/telegram/health  (header: X-Edu-Health-Key: <EDU_TELEGRAM_BOT_SECRET>)
 *
 * One call that checks every link of the Telegram login chain and says which one is broken:
 *   env vars -> MongoDB -> Firebase service account (signs a throw-away custom token)
 *   -> Telegram bot token (getMe) -> webhook registration (getWebhookInfo).
 * Secrets are never returned: only booleans, the bot username, the Firebase project id and
 * Telegram's own webhook status. Without the key the route answers 404, as if it did not exist.
 *
 *   curl -s -H "X-Edu-Health-Key: $EDU_TELEGRAM_BOT_SECRET" https://duxtur.org/api/edu-auth/telegram/health | jq
 */

type CheckStatus = 'ok' | 'fail' | 'warn' | 'skipped';
interface Check {
  status: CheckStatus;
  detail?: unknown;
  fix?: string;
  ms?: number;
}

function keyMatches(header: string | null): boolean {
  const expected = process.env.EDU_TELEGRAM_BOT_SECRET;
  if (!expected || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function timed<T>(fn: () => Promise<T>, timeoutMs = 8000): Promise<{ value: T; ms: number }> {
  const startedAt = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${timeoutMs} ms`)), timeoutMs);
  });
  try {
    const value = await Promise.race([fn(), timeout]);
    return { value, ms: Date.now() - startedAt };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

interface TelegramResponse {
  ok: boolean;
  result?: Record<string, unknown>;
  error_code?: number;
  description?: string;
}

async function telegramApi(method: string): Promise<TelegramResponse> {
  const token = process.env.EDU_TELEGRAM_BOT_TOKEN;
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`);
  return res.json();
}

export async function GET(req: NextRequest) {
  const reqId = newReqId();

  if (!keyMatches(req.headers.get('x-edu-health-key'))) {
    eduLog('health', reqId, 'health:denied', { ...requestFacts(req), secretConfigured: !!process.env.EDU_TELEGRAM_BOT_SECRET }, 'warn');
    return new NextResponse(null, { status: 404 });
  }

  const ip = (req.headers.get('x-forwarded-for') || 'anonymous').split(',')[0].trim();
  const { success } = await rateLimit(`edu_tg_health_${ip}`, 6, 60 * 1000);
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const checks: Record<string, Check> = {};
  const flags = envFlags();

  // 1) Configuration presence (no values)
  const missing: string[] = [];
  if (!flags.MONGODB_URI) missing.push('MONGODB_URI');
  if (!flags.EDU_TELEGRAM_BOT_TOKEN) missing.push('EDU_TELEGRAM_BOT_TOKEN');
  if (!flags.EDU_TELEGRAM_BOT_SECRET) missing.push('EDU_TELEGRAM_BOT_SECRET');
  if (flags.FIREBASE_SERVICE_ACCOUNT_JSON !== 'ok') missing.push(`FIREBASE_SERVICE_ACCOUNT_JSON (${flags.FIREBASE_SERVICE_ACCOUNT_JSON})`);
  checks.env = {
    status: missing.length ? 'fail' : 'ok',
    detail: flags,
    ...(missing.length ? { fix: `Set on Vercel (Production) and redeploy: ${missing.join(', ')}` } : {}),
  };

  // 2) MongoDB (dynamic import: lib/mongodb throws at import time when MONGODB_URI is missing)
  if (!flags.MONGODB_URI) {
    checks.mongodb = { status: 'skipped', detail: 'MONGODB_URI is not set' };
  } else {
    try {
      const { value, ms } = await timed(async () => {
        const { default: dbConnect } = await import('@/lib/mongodb');
        const mongoose = await dbConnect();
        await mongoose.connection.db!.admin().ping();
        const { default: TelegramLogin } = await import('@/models/TelegramLogin');
        const pending = await TelegramLogin.countDocuments({ status: 'pending', expiresAt: { $gt: new Date() } });
        return { pendingLogins: pending };
      });
      checks.mongodb = { status: 'ok', detail: value, ms };
    } catch (err) {
      checks.mongodb = {
        status: 'fail',
        detail: describeError(err),
        fix: 'Database unreachable: check MONGODB_URI and the Atlas Network Access allowlist (Vercel needs 0.0.0.0/0 or its IP ranges).',
      };
    }
  }

  // 3) Firebase service account: sign a throw-away custom token for a fake uid locally (nothing is created in Firebase)
  if (flags.FIREBASE_SERVICE_ACCOUNT_JSON !== 'ok') {
    checks.firebase = { status: 'skipped', detail: 'FIREBASE_SERVICE_ACCOUNT_JSON is not set or not valid JSON' };
  } else {
    try {
      const { value, ms } = await timed(async () => {
        const { createEduCustomToken } = await import('@/lib/edu-custom-token');
        const token = await createEduCustomToken('tg_healthcheck', { provider: 'healthcheck' });
        return { customTokenLength: token.length };
      });
      checks.firebase = {
        status: 'ok',
        detail: { ...value, projectId: flags.firebaseProjectId, note: 'must equal NEXT_PUBLIC_FIREBASE_PROJECT_ID of the Active Study build' },
        ms,
      };
    } catch (err) {
      checks.firebase = {
        status: 'fail',
        detail: describeError(err),
        fix: 'FIREBASE_SERVICE_ACCOUNT_JSON is incomplete or its private_key is damaged: paste the whole key file of the Firebase project that active_study uses.',
      };
    }
  }

  // 4) Telegram bot token + username
  if (!flags.EDU_TELEGRAM_BOT_TOKEN) {
    checks.telegramBot = { status: 'skipped', detail: 'EDU_TELEGRAM_BOT_TOKEN is not set' };
    checks.telegramWebhook = { status: 'skipped', detail: 'EDU_TELEGRAM_BOT_TOKEN is not set' };
  } else {
    try {
      const { value, ms } = await timed(() => telegramApi('getMe'));
      if (!value.ok) {
        checks.telegramBot = {
          status: 'fail',
          detail: { errorCode: value.error_code, description: scrubSecrets(value.description || '') },
          fix: 'Telegram rejects the bot token: copy a fresh token from @BotFather into EDU_TELEGRAM_BOT_TOKEN.',
          ms,
        };
      } else {
        const actual = value.result?.username as string | undefined;
        const configured = eduBotUsername();
        const same = !!actual && actual.toLowerCase() === configured.toLowerCase();
        checks.telegramBot = {
          status: same ? 'ok' : 'fail',
          detail: { botUsername: actual, usernameUsedInLinks: configured, canJoinGroups: value.result?.can_join_groups },
          ...(same ? {} : { fix: `Login links point to t.me/${configured} but the token belongs to @${actual}. Set EDU_TELEGRAM_BOT_USERNAME=${actual}.` }),
          ms,
        };
      }
    } catch (err) {
      checks.telegramBot = { status: 'fail', detail: { ...describeError(err) }, fix: 'api.telegram.org is unreachable from the server.' };
    }

    // 5) Webhook registration: the usual reason for "I pressed Start and nothing happened"
    try {
      const { value, ms } = await timed(() => telegramApi('getWebhookInfo'));
      if (!value.ok) {
        checks.telegramWebhook = { status: 'fail', detail: { errorCode: value.error_code, description: scrubSecrets(value.description || '') }, ms };
      } else {
        const info = (value.result ?? {}) as {
          url?: string;
          pending_update_count?: number;
          last_error_date?: number;
          last_error_message?: string;
          max_connections?: number;
          ip_address?: string;
        };
        // Telegram does not follow redirects, so the webhook must be registered on the host that answers
        // directly. That is the host this very request came in on (www.duxtur.org in production, where the
        // bare domain redirects), not a hardcoded one.
        const servingHost = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0].trim();
        const expectedUrl = `https://${servingHost}/api/edu-auth/telegram/webhook`;
        const problems: string[] = [];
        if (!info.url) problems.push('no webhook is registered: Telegram sends nothing to the server');
        else if (info.url !== expectedUrl) {
          problems.push(
            `webhook points to ${info.url}, but this server answers on ${servingHost}. If the registered host redirects here, ` +
              `Telegram gets a 301/307/308 and drops every update (it does not follow redirects)`
          );
        }
        if (info.last_error_message) {
          problems.push(`Telegram's last delivery error: "${scrubSecrets(String(info.last_error_message))}"`);
        }
        if ((info.pending_update_count ?? 0) > 0) problems.push(`${info.pending_update_count} updates are waiting (the server answered with errors)`);
        checks.telegramWebhook = {
          status: problems.length ? 'fail' : 'ok',
          detail: {
            url: info.url || null,
            pendingUpdates: info.pending_update_count ?? 0,
            lastErrorAt: info.last_error_date ? new Date(info.last_error_date * 1000).toISOString() : null,
            lastErrorMessage: info.last_error_message ? scrubSecrets(String(info.last_error_message)) : null,
            expectedUrl,
            maxConnections: info.max_connections ?? null,
            ipAddress: info.ip_address ?? null,
          },
          ...(problems.length
            ? {
                problems,
                fix: 'Re-register: curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" -d "url=' + expectedUrl + '" -d "secret_token=<EDU_TELEGRAM_BOT_SECRET>"',
              }
            : {}),
          ms,
        } as Check;
      }
    } catch (err) {
      checks.telegramWebhook = { status: 'fail', detail: { ...describeError(err) }, fix: 'api.telegram.org is unreachable from the server.' };
    }
  }

  const failed = Object.entries(checks).filter(([, c]) => c.status === 'fail').map(([name]) => name);
  const summary = { ok: failed.length === 0, failed, checkedAt: new Date().toISOString(), reqId };
  eduLog('health', reqId, 'health:result', { ...summary, statuses: Object.fromEntries(Object.entries(checks).map(([k, c]) => [k, c.status])) }, failed.length ? 'warn' : 'info');
  return NextResponse.json({ ...summary, checks }, { status: failed.length ? 503 : 200, headers: { 'Cache-Control': 'no-store' } });
}
