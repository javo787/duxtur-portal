import crypto from 'crypto';

/**
 * Structured, secret-free logging for the Duxtur Edu Telegram login
 * (/api/edu-auth/telegram/{start,check,webhook,health}).
 *
 * One JSON object per line, so Vercel's log search works on any field:
 *   scope:"edu-tg:start"  reqId:"a1b2c3d4"  event:"start:created"
 * The reqId is also returned to the browser in the X-Edu-Request-Id header and shown in the
 * Active Study diagnostics panel, which ties a client-side line to the server-side lines.
 *
 * Never log: login tokens, poll secrets, custom tokens, the bot token, webhook secrets, service-account keys.
 * Use maskRef() for tokens and the booleans from envFlags() for configuration.
 */

export const REQUEST_ID_HEADER = 'X-Edu-Request-Id';

const SECRET_KEY_RE = /(token|secret|password|authorization|private_key|apikey|credential)/i;
// Names that are safe on purpose because the caller already masked the value.
const SAFE_KEYS = new Set(['tokenRef', 'tokenType', 'tokenLength', 'pollSecretType', 'pollSecretLength']);

/** Per-poll "pending" lines are noisy (one per 2 s per client): only with EDU_LOG_VERBOSE=1. */
export function verboseLogs(): boolean {
  return process.env.EDU_LOG_VERBOSE === '1';
}

export function newReqId(): string {
  return crypto.randomBytes(4).toString('hex');
}

/** First 6 chars: enough to match a client line to a server line, useless for an attacker. */
export function maskRef(value: unknown): string | null {
  return typeof value === 'string' && value ? `${value.slice(0, 6)}…` : null;
}

/** "203.0.113.57" -> "203.0.113.x"; IPv6 -> first 3 groups. */
export function maskIp(ip: string): string {
  if (ip.includes(':')) return `${ip.split(':').slice(0, 3).join(':')}:…`;
  const parts = ip.split('.');
  return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.x` : ip;
}

export function redact(value: unknown, depth = 0): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (depth > 3) return '[truncated]';
  if (Array.isArray(value)) return value.slice(0, 20).map(v => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    // A boolean or a number cannot carry a secret, and flags such as { EDU_TELEGRAM_BOT_TOKEN: true } are
    // exactly what the logs are for: only strings and objects under a secret-looking key are hidden.
    const harmless = typeof v === 'boolean' || typeof v === 'number' || v === null || v === undefined;
    out[k] = SECRET_KEY_RE.test(k) && !SAFE_KEYS.has(k) && !harmless ? '[redacted]' : redact(v, depth + 1);
  }
  return out;
}

export type EduLogLevel = 'info' | 'warn' | 'error';

export function eduLog(
  scope: 'start' | 'check' | 'webhook' | 'health' | 'bot' | 'sso' | 'link',
  reqId: string,
  event: string,
  data: Record<string, unknown> = {},
  level: EduLogLevel = 'info'
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    scope: scope === 'sso' || scope === 'link' ? `edu-account:${scope}` : `edu-tg:${scope}`,
    reqId,
    event,
    ...(redact(data) as Record<string, unknown>),
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export function describeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    const e = err as Error & { code?: unknown; cause?: unknown };
    return {
      name: e.name,
      message: scrubSecrets(e.message),
      ...(typeof e.code === 'string' || typeof e.code === 'number' ? { code: e.code } : {}),
      ...(e.cause instanceof Error ? { cause: scrubSecrets(e.cause.message) } : {}),
      stack: scrubSecrets(e.stack?.split('\n').slice(0, 5).join(' | ') ?? ''),
    };
  }
  return { message: scrubSecrets(String(err)) };
}

/** Telegram API URLs contain the bot token (".../bot<id>:<secret>/method"): cut it out of any text we log. */
export function scrubSecrets(text: string): string {
  let out = text.replace(/bot\d+:[A-Za-z0-9_-]+/g, 'bot<redacted>');
  for (const name of ['EDU_TELEGRAM_BOT_TOKEN', 'EDU_TELEGRAM_BOT_SECRET']) {
    const v = process.env[name];
    if (v) out = out.split(v).join('<redacted>');
  }
  return out;
}

/** Configuration presence as booleans/safe values only, to find "env var missing on Vercel" quickly. */
export function envFlags(): Record<string, unknown> {
  let firebaseProjectId: string | null = null;
  let firebaseJson: 'missing' | 'invalid-json' | 'ok' = 'missing';
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      firebaseJson = 'ok';
      firebaseProjectId = typeof parsed.project_id === 'string' ? parsed.project_id : null;
    } catch {
      firebaseJson = 'invalid-json';
    }
  }
  let eduAppOriginHost: string | null = null;
  try {
    if (process.env.EDU_APP_ORIGIN) eduAppOriginHost = new URL(process.env.EDU_APP_ORIGIN).host;
  } catch {
    eduAppOriginHost = '(invalid URL)';
  }
  return {
    MONGODB_URI: !!process.env.MONGODB_URI,
    EDU_TELEGRAM_BOT_TOKEN: !!process.env.EDU_TELEGRAM_BOT_TOKEN,
    EDU_TELEGRAM_BOT_SECRET: !!process.env.EDU_TELEGRAM_BOT_SECRET,
    EDU_TELEGRAM_BOT_USERNAME: process.env.EDU_TELEGRAM_BOT_USERNAME || '(unset, default duxtur_bot)',
    FIREBASE_SERVICE_ACCOUNT_JSON: firebaseJson,
    firebaseProjectId,
    EDU_APP_ORIGIN_host: eduAppOriginHost,
    EDU_ALLOWED_ORIGINS: !!process.env.EDU_ALLOWED_ORIGINS,
    UPSTASH_REDIS: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
  };
}

/** Request facts that explain most routing/CORS/CSP problems. */
export function requestFacts(req: Request): Record<string, unknown> {
  const h = req.headers;
  const forwarded = (h.get('x-forwarded-for') || '').split(',')[0].trim();
  let refererHost: string | null = null;
  try {
    const r = h.get('referer');
    if (r) refererHost = new URL(r).host;
  } catch {}
  return {
    method: req.method,
    url: new URL(req.url).pathname,
    host: h.get('host'),
    origin: h.get('origin'),
    refererHost,
    secFetchSite: h.get('sec-fetch-site'),
    ip: forwarded ? maskIp(forwarded) : null,
    ua: (h.get('user-agent') || '').slice(0, 90),
  };
}
