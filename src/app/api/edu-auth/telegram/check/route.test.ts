import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const consumeLogin = vi.fn();
const createEduCustomToken = vi.fn();

vi.mock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/TelegramLogin', () => ({ default: {} }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
const rateLimit = vi.fn();
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...a: unknown[]) => rateLimit(...a) }));
vi.mock('@/lib/edu-custom-token', () => ({ createEduCustomToken: (...a: unknown[]) => createEduCustomToken(...a) }));
vi.mock('@/lib/edu-telegram-login', async () => {
  const actual = await vi.importActual<typeof import('@/lib/edu-telegram-login')>('@/lib/edu-telegram-login');
  return { ...actual, consumeLogin: (...a: unknown[]) => consumeLogin(...a) };
});

import { POST } from './route';

const TOKEN = 'a1b2c3'.padEnd(32, 'd');
const POLL = 'e'.repeat(32);

function call(body: unknown) {
  return POST(
    new NextRequest('https://duxtur.org/api/edu-auth/telegram/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: 'https://duxtur.org' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  );
}

let logs: string[];

beforeEach(() => {
  vi.clearAllMocks();
  logs = [];
  const sink = (l: string) => void logs.push(String(l));
  vi.spyOn(console, 'log').mockImplementation(sink);
  vi.spyOn(console, 'warn').mockImplementation(sink);
  vi.spyOn(console, 'error').mockImplementation(sink);
  delete process.env.EDU_LOG_VERBOSE;
  rateLimit.mockResolvedValue({ success: true, count: 1 });
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({ project_id: 'edu-proj' });
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
});

describe('POST /api/edu-auth/telegram/check', () => {
  it('pending: answers pending and stays quiet in the logs unless verbose', async () => {
    consumeLogin.mockResolvedValue({ state: 'pending' });
    const res = await call({ token: TOKEN, pollSecret: POLL });
    expect(await res.json()).toEqual({ status: 'pending' });
    expect(logs.join('\n')).not.toContain('check:pending');

    process.env.EDU_LOG_VERBOSE = '1';
    await call({ token: TOKEN, pollSecret: POLL });
    expect(logs.join('\n')).toContain('check:pending');
  });

  it('gone: 404 and a warning that says why', async () => {
    consumeLogin.mockResolvedValue({ state: 'gone' });
    const res = await call({ token: TOKEN, pollSecret: POLL });
    expect(res.status).toBe(404);
    expect(logs.some(l => l.includes('check:gone'))).toBe(true);
  });

  it('approved: returns the custom token and the Firebase project id, without logging the token', async () => {
    consumeLogin.mockResolvedValue({ state: 'approved', telegram: { id: 123456789, firstName: 'Ali' } });
    createEduCustomToken.mockResolvedValue('CUSTOM.TOKEN.VALUE');
    const res = await call({ token: TOKEN, pollSecret: POLL });
    const body = await res.json();
    expect(body.status).toBe('approved');
    expect(body.customToken).toBe('CUSTOM.TOKEN.VALUE');
    expect(body.projectId).toBe('edu-proj');
    const all = logs.join('\n');
    expect(all).toContain('check:custom-token-created');
    expect(all).not.toContain('CUSTOM.TOKEN.VALUE');
    expect(all).not.toContain(TOKEN);
    expect(all).not.toContain('123456789'); // only the last 3 digits are logged
  });

  it('custom token failure: 500 with ref, and the log explains the login is already consumed', async () => {
    consumeLogin.mockResolvedValue({ state: 'approved', telegram: { id: 42, firstName: 'Ali' } });
    createEduCustomToken.mockRejectedValue(new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured'));
    const res = await call({ token: TOKEN, pollSecret: POLL });
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.ref).toBe(res.headers.get('X-Edu-Request-Id'));
    const line = logs.find(l => l.includes('check:custom-token-failed'));
    expect(line).toBeTruthy();
    expect(JSON.parse(line!).consequence).toContain('already consumed');
  });

  it('malformed token: 400 and the log shows type and length, not the value', async () => {
    const res = await call({ token: 'short', pollSecret: POLL });
    expect(res.status).toBe(400);
    const line = logs.find(l => l.includes('check:invalid-token-format'));
    const parsed = JSON.parse(line!);
    expect(parsed.tokenLength).toBe(5);
    expect(line).not.toContain('short');
  });

  it('invalid JSON body: 400', async () => {
    const res = await call('{not json');
    expect(res.status).toBe(400);
    expect(logs.some(l => l.includes('check:bad-json'))).toBe(true);
  });

  it('an unexpected exception anywhere in the handler still answers JSON with a ref and is logged', async () => {
    rateLimit.mockRejectedValue(new Error('redis exploded'));
    const res = await call({ token: TOKEN, pollSecret: POLL });
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.ref).toBe(res.headers.get('X-Edu-Request-Id'));
    const line = logs.find(l => l.includes('check:unhandled'));
    expect(line).toBeTruthy();
    expect(JSON.parse(line!).message).toContain('redis exploded');
  });
});
