import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const auth = vi.fn();
const rateLimit = vi.fn();
const createLogin = vi.fn();
const peekLogin = vi.fn();
const consumeLogin = vi.fn();
const attachTelegram = vi.fn();

vi.mock('@/auth', () => ({ auth: () => auth() }));
vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('@/models/TelegramLogin', () => ({ default: {} }));
vi.mock('@/models/User', () => ({ default: {} }));
vi.mock('@/models/Doctor', () => ({ default: {} }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...a: unknown[]) => rateLimit(...a) }));
vi.mock('@/lib/edu-telegram-login', async () => {
  const actual = await vi.importActual<typeof import('@/lib/edu-telegram-login')>('@/lib/edu-telegram-login');
  return {
    ...actual,
    createLogin: (...a: unknown[]) => createLogin(...a),
    peekLogin: (...a: unknown[]) => peekLogin(...a),
    consumeLogin: (...a: unknown[]) => consumeLogin(...a),
  };
});
vi.mock('@/lib/portal-telegram-account', () => ({ attachTelegram: (...a: unknown[]) => attachTelegram(...a) }));

import { POST as start } from './start/route';
import { POST as status } from './status/route';
import { POST as link } from './link/route';

const TOKEN = 'a'.repeat(32);
const SECRET = 'b'.repeat(32);
const HOST = 'www.duxtur.org';

function post(route: typeof start, path: string, body: unknown, headers: Record<string, string> = {}) {
  return route(
    new NextRequest(`https://${HOST}/api/telegram-login/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', host: HOST, origin: `https://${HOST}`, 'x-forwarded-for': '203.0.113.9', 'user-agent': 'Mozilla/5.0 (Linux; Android 14) Chrome/126.0.0.0 Mobile Safari/537.36', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  rateLimit.mockResolvedValue({ success: true, count: 1 });
  auth.mockResolvedValue(null);
  createLogin.mockResolvedValue({ token: TOKEN, pollSecret: SECRET, expiresInSec: 300 });
  peekLogin.mockResolvedValue('pending');
  consumeLogin.mockResolvedValue({ state: 'approved', telegram: { id: 555, firstName: 'Ali' } });
  attachTelegram.mockResolvedValue({ ok: true, alreadyLinked: false, eduUid: 'tg_555' });
});

describe('POST /api/telegram-login/start', () => {
  it('starts a sign-in with no session, and tells the bot where the request came from', async () => {
    const res = await post(start, 'start', { mode: 'login' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ token: TOKEN, pollSecret: SECRET, expiresInSec: 300 });
    expect(body.botUrl).toBe(`https://t.me/duxtur_bot?start=login_${TOKEN}`);
    expect(createLogin).toHaveBeenCalledWith({ purpose: 'portal', userId: undefined, requestHint: 'Chrome, Android' });
  });

  it('ties a "connect Telegram" login to the signed-in user, and needs a session for it', async () => {
    expect((await post(start, 'start', { mode: 'link' })).status).toBe(401);
    expect(createLogin).not.toHaveBeenCalled();

    auth.mockResolvedValue({ user: { id: 'u1' } });
    expect((await post(start, 'start', { mode: 'link' })).status).toBe(200);
    expect(createLogin).toHaveBeenCalledWith(expect.objectContaining({ purpose: 'portal_link', userId: 'u1' }));
  });

  it('refuses a request from another site, an unknown mode and broken JSON', async () => {
    expect((await post(start, 'start', { mode: 'login' }, { origin: 'https://evil.example' })).status).toBe(403);
    expect((await post(start, 'start', { mode: 'admin' })).status).toBe(400);
    expect((await post(start, 'start', 'not json')).status).toBe(400);
    expect(createLogin).not.toHaveBeenCalled();
  });

  it('is rate limited', async () => {
    rateLimit.mockResolvedValueOnce({ success: false, count: 11 });
    expect((await post(start, 'start', { mode: 'login' })).status).toBe(429);
  });
});

describe('POST /api/telegram-login/status', () => {
  it('reports pending and approved without using the login up', async () => {
    expect(await (await post(status, 'status', { token: TOKEN, pollSecret: SECRET, mode: 'login' })).json()).toEqual({ status: 'pending' });
    peekLogin.mockResolvedValue('approved');
    expect(await (await post(status, 'status', { token: TOKEN, pollSecret: SECRET, mode: 'login' })).json()).toEqual({ status: 'approved' });
    expect(peekLogin).toHaveBeenCalledWith(TOKEN, SECRET, { purpose: 'portal', userId: undefined });
    expect(consumeLogin).not.toHaveBeenCalled();
  });

  it('answers 404 "gone" for an unknown or expired login', async () => {
    peekLogin.mockResolvedValue('gone');
    const res = await post(status, 'status', { token: TOKEN, pollSecret: SECRET, mode: 'login' });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ status: 'gone' });
  });

  it('looks at a "connect" login only as the user who started it', async () => {
    expect((await post(status, 'status', { token: TOKEN, pollSecret: SECRET, mode: 'link' })).status).toBe(401);
    auth.mockResolvedValue({ user: { id: 'u1' } });
    await post(status, 'status', { token: TOKEN, pollSecret: SECRET, mode: 'link' });
    expect(peekLogin).toHaveBeenCalledWith(TOKEN, SECRET, { purpose: 'portal_link', userId: 'u1' });
  });

  it('refuses malformed tokens, another site and a missing mode', async () => {
    expect((await post(status, 'status', { token: 'x', pollSecret: SECRET, mode: 'login' })).status).toBe(400);
    expect((await post(status, 'status', { token: TOKEN, pollSecret: SECRET })).status).toBe(400);
    expect((await post(status, 'status', { token: TOKEN, pollSecret: SECRET, mode: 'login' }, { origin: 'https://evil.example' })).status).toBe(403);
    expect(peekLogin).not.toHaveBeenCalled();
  });
});

describe('POST /api/telegram-login/link', () => {
  beforeEach(() => auth.mockResolvedValue({ user: { id: 'u1' } }));

  it('connects the confirmed Telegram to the signed-in account', async () => {
    const res = await post(link, 'link', { token: TOKEN, pollSecret: SECRET });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ linked: true, eduUid: 'tg_555' });
    expect(consumeLogin).toHaveBeenCalledWith(TOKEN, SECRET, { purpose: 'portal_link', userId: 'u1' });
    expect(attachTelegram).toHaveBeenCalledWith('u1', { id: 555, firstName: 'Ali' });
  });

  it('refuses a forged request from another site, so a stranger\'s Telegram cannot be attached to this account', async () => {
    const res = await post(link, 'link', { token: TOKEN, pollSecret: SECRET }, { origin: 'https://evil.example' });
    expect(res.status).toBe(403);
    expect(consumeLogin).not.toHaveBeenCalled();
    expect(attachTelegram).not.toHaveBeenCalled();
  });

  it('needs a session', async () => {
    auth.mockResolvedValue(null);
    expect((await post(link, 'link', { token: TOKEN, pollSecret: SECRET })).status).toBe(401);
    expect(consumeLogin).not.toHaveBeenCalled();
  });

  it('says "pending" until the person confirms in the bot, and "gone" when there is nothing to use', async () => {
    consumeLogin.mockResolvedValueOnce({ state: 'pending' });
    const pending = await post(link, 'link', { token: TOKEN, pollSecret: SECRET });
    expect(pending.status).toBe(409);
    expect((await pending.json()).code).toBe('pending');

    consumeLogin.mockResolvedValueOnce({ state: 'gone' });
    const gone = await post(link, 'link', { token: TOKEN, pollSecret: SECRET });
    expect(gone.status).toBe(404);
    expect(attachTelegram).not.toHaveBeenCalled();
  });

  it('reports a Telegram that belongs to another account, or a second Telegram on this one', async () => {
    attachTelegram.mockResolvedValueOnce({ ok: false, code: 'telegram_taken' });
    const taken = await post(link, 'link', { token: TOKEN, pollSecret: SECRET });
    expect(taken.status).toBe(409);
    expect((await taken.json()).code).toBe('telegram_taken');

    attachTelegram.mockResolvedValueOnce({ ok: false, code: 'already_has_telegram' });
    expect((await (await post(link, 'link', { token: TOKEN, pollSecret: SECRET })).json()).code).toBe('already_has_telegram');
  });

  it('refuses malformed tokens', async () => {
    expect((await post(link, 'link', { token: 'x', pollSecret: SECRET })).status).toBe(400);
    expect((await post(link, 'link', {})).status).toBe(400);
  });
});
