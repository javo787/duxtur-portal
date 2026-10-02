import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn().mockResolvedValue({ success: true, count: 1 }) }));

import { GET } from './route';

const SECRET = 'health-secret_123';

function call(key: string | null, host = 'duxtur.org') {
  const headers: Record<string, string> = { host };
  if (key !== null) headers['x-edu-health-key'] = key;
  return GET(new NextRequest(`https://${host}/api/edu-auth/telegram/health`, { headers }));
}

const ENV_KEYS = ['EDU_TELEGRAM_BOT_SECRET', 'EDU_TELEGRAM_BOT_TOKEN', 'MONGODB_URI', 'FIREBASE_SERVICE_ACCOUNT_JSON', 'EDU_TELEGRAM_BOT_USERNAME'];

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  for (const k of ENV_KEYS) delete process.env[k];
  process.env.EDU_TELEGRAM_BOT_SECRET = SECRET;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  for (const k of ENV_KEYS) delete process.env[k];
});

describe('GET /api/edu-auth/telegram/health', () => {
  it('pretends not to exist without the key, with a wrong key, or when no secret is configured', async () => {
    expect((await call(null)).status).toBe(404);
    expect((await call('nope')).status).toBe(404);
    delete process.env.EDU_TELEGRAM_BOT_SECRET;
    expect((await call(SECRET)).status).toBe(404);
  });

  it('names every missing env var and skips the checks that depend on them', async () => {
    const res = await call(SECRET);
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.failed).toContain('env');
    expect(body.checks.env.fix).toContain('MONGODB_URI');
    expect(body.checks.env.fix).toContain('EDU_TELEGRAM_BOT_TOKEN');
    expect(body.checks.mongodb.status).toBe('skipped');
    expect(body.checks.firebase.status).toBe('skipped');
    expect(body.checks.telegramBot.status).toBe('skipped');
  });

  it('flags a bot token that belongs to another username and an unregistered webhook, without returning secrets', async () => {
    process.env.EDU_TELEGRAM_BOT_TOKEN = '123456:VERY_SECRET_TOKEN';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const method = String(url).split('/').pop();
        if (method === 'getMe') return new Response(JSON.stringify({ ok: true, result: { username: 'other_bot' } }));
        return new Response(JSON.stringify({ ok: true, result: { url: '', pending_update_count: 0 } }));
      })
    );
    const res = await call(SECRET);
    const body = await res.json();
    expect(body.checks.telegramBot.status).toBe('fail');
    expect(body.checks.telegramBot.fix).toContain('EDU_TELEGRAM_BOT_USERNAME=other_bot');
    expect(body.checks.telegramWebhook.status).toBe('fail');
    expect(body.checks.telegramWebhook.problems[0]).toContain('no webhook is registered');
    const text = JSON.stringify(body);
    expect(text).not.toContain('VERY_SECRET_TOKEN');
    expect(text).not.toContain(SECRET);
  });

  it('reports a rejected bot token with Telegram\'s own description', async () => {
    process.env.EDU_TELEGRAM_BOT_TOKEN = '123456:BAD';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ ok: false, error_code: 401, description: 'Unauthorized' })))
    );
    const body = await (await call(SECRET)).json();
    expect(body.checks.telegramBot.status).toBe('fail');
    expect(body.checks.telegramBot.detail.errorCode).toBe(401);
    expect(body.checks.telegramBot.fix).toContain('@BotFather');
  });

  it('expects the webhook on the host that serves the request (www in production) and explains the redirect trap', async () => {
    process.env.EDU_TELEGRAM_BOT_TOKEN = '123456:TOKEN';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const method = String(url).split('/').pop();
        if (method === 'getMe') return new Response(JSON.stringify({ ok: true, result: { username: 'duxtur_bot' } }));
        return new Response(
          JSON.stringify({ ok: true, result: { url: 'https://duxtur.org/api/edu-auth/telegram/webhook', pending_update_count: 3, last_error_message: 'Wrong response from the webhook: 308 Permanent Redirect' } })
        );
      })
    );
    const body = await (await call(SECRET, 'www.duxtur.org')).json();
    const hook = body.checks.telegramWebhook;
    expect(hook.status).toBe('fail');
    expect(hook.detail.expectedUrl).toBe('https://www.duxtur.org/api/edu-auth/telegram/webhook');
    expect(hook.problems.join(' ')).toContain('does not follow redirects');
    expect(hook.problems.join(' ')).toContain('308 Permanent Redirect');
    expect(hook.fix).toContain('url=https://www.duxtur.org/api/edu-auth/telegram/webhook');
  });

  it('is happy when the registered webhook matches the serving host', async () => {
    process.env.EDU_TELEGRAM_BOT_TOKEN = '123456:TOKEN';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const method = String(url).split('/').pop();
        if (method === 'getMe') return new Response(JSON.stringify({ ok: true, result: { username: 'duxtur_bot' } }));
        return new Response(JSON.stringify({ ok: true, result: { url: 'https://www.duxtur.org/api/edu-auth/telegram/webhook', pending_update_count: 0 } }));
      })
    );
    const body = await (await call(SECRET, 'www.duxtur.org')).json();
    expect(body.checks.telegramWebhook.status).toBe('ok');
  });
});
