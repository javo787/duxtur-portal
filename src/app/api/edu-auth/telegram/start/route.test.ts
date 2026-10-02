import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const createLogin = vi.fn();
const rateLimit = vi.fn();

vi.mock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/TelegramLogin', () => ({ default: {} }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...a: unknown[]) => rateLimit(...a) }));
vi.mock('@/lib/edu-telegram-login', async () => {
  const actual = await vi.importActual<typeof import('@/lib/edu-telegram-login')>('@/lib/edu-telegram-login');
  return { ...actual, createLogin: (...a: unknown[]) => createLogin(...a) };
});

import { resetWebhookStateThrottle } from '@/lib/edu-webhook-state';
import { POST } from './route';

const TOKEN = 'a1b2c3'.padEnd(32, 'd');
const POLL = 'f'.repeat(32);

function call(origin: string | null = 'https://duxtur.org') {
  const headers: Record<string, string> = { 'x-forwarded-for': '203.0.113.57' };
  if (origin) headers.origin = origin;
  return POST(new NextRequest('https://duxtur.org/api/edu-auth/telegram/start', { method: 'POST', headers }));
}

let logs: string[];

beforeEach(() => {
  vi.clearAllMocks();
  resetWebhookStateThrottle();
  logs = [];
  vi.spyOn(console, 'log').mockImplementation((l: string) => void logs.push(String(l)));
  vi.spyOn(console, 'warn').mockImplementation((l: string) => void logs.push(String(l)));
  vi.spyOn(console, 'error').mockImplementation((l: string) => void logs.push(String(l)));
  rateLimit.mockResolvedValue({ success: true, count: 1 });
  createLogin.mockResolvedValue({ token: TOKEN, pollSecret: POLL, expiresInSec: 300 });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete process.env.EDU_TELEGRAM_BOT_TOKEN;
});

describe('POST /api/edu-auth/telegram/start', () => {
  it('returns the login and a request id header the browser can read', async () => {
    const res = await call();
    expect(res.status).toBe(200);
    expect((await res.json()).token).toBe(TOKEN);
    expect(res.headers.get('X-Edu-Request-Id')).toMatch(/^[a-f0-9]{8}$/);
    expect(res.headers.get('Access-Control-Expose-Headers')).toBe('X-Edu-Request-Id');
  });

  it('never writes the login token or poll secret to the logs', async () => {
    await call();
    const all = logs.join('\n');
    expect(all).toContain('start:created');
    expect(all).toContain('a1b2c3…');
    expect(all).not.toContain(TOKEN);
    expect(all).not.toContain(POLL);
  });

  it('on a server error answers 500 with the same ref that was logged, plus the env flags', async () => {
    createLogin.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:27017'));
    const res = await call();
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.ref).toBe(res.headers.get('X-Edu-Request-Id'));
    const errorLine = logs.find(l => l.includes('start:error'));
    expect(errorLine).toBeTruthy();
    const parsed = JSON.parse(errorLine!);
    expect(parsed.reqId).toBe(body.ref);
    expect(parsed.message).toContain('ECONNREFUSED');
    expect(parsed.env).toHaveProperty('MONGODB_URI');
  });

  it('answers 429 with a ref when rate limited', async () => {
    rateLimit.mockResolvedValue({ success: false, count: 11 });
    const res = await call();
    expect(res.status).toBe(429);
    expect((await res.json()).ref).toBe(res.headers.get('X-Edu-Request-Id'));
    expect(logs.some(l => l.includes('start:rate-limited'))).toBe(true);
  });

  it('writes the Telegram webhook registration state to the logs after a successful start, without breaking the login', async () => {
    process.env.EDU_TELEGRAM_BOT_TOKEN = '123456:VERY_SECRET_BOT_TOKEN-x';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ ok: true, result: { url: 'https://duxtur.org/api/edu-auth/telegram/webhook', pending_update_count: 0 } })))
    );
    const res = await call();
    expect(res.status).toBe(200);
    await vi.waitFor(() => expect(logs.some(l => l.includes('start:webhook-state'))).toBe(true));
    const line = JSON.parse(logs.find(l => l.includes('start:webhook-state'))!);
    expect(line.status).toBe('broken'); // registered on duxtur.org, request served on duxtur.org/api in this test
    expect(line.reqId).toBe(res.headers.get('X-Edu-Request-Id'));
    expect(logs.join('\n')).not.toContain('VERY_SECRET_BOT_TOKEN');
  });

  it('does not check the webhook when the start failed', async () => {
    process.env.EDU_TELEGRAM_BOT_TOKEN = '123456:TOKEN';
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    createLogin.mockRejectedValue(new Error('db down'));
    await call();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('masks the client IP in the logs', async () => {
    await call();
    expect(logs.join('\n')).toContain('203.0.113.x');
    expect(logs.join('\n')).not.toContain('203.0.113.57');
  });
});
