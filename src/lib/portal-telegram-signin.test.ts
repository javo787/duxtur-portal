import { describe, it, expect, vi, beforeEach } from 'vitest';

const rateLimit = vi.fn();
const consumeLogin = vi.fn();
const signInWithTelegram = vi.fn();

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...a: unknown[]) => rateLimit(...a) }));
vi.mock('@/lib/edu-telegram-login', async () => {
  const actual = await vi.importActual<typeof import('@/lib/edu-telegram-login')>('@/lib/edu-telegram-login');
  return { ...actual, consumeLogin: (...a: unknown[]) => consumeLogin(...a) };
});
vi.mock('@/lib/portal-telegram-account', () => ({ signInWithTelegram: (...a: unknown[]) => signInWithTelegram(...a) }));
vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('@/models/TelegramLogin', () => ({ default: {} }));

import { authorizeTelegramLogin } from './portal-telegram-signin';

const TOKEN = 'a'.repeat(32);
const SECRET = 'b'.repeat(32);
const USER = { id: 'u1', email: 'tg1.x@telegram.invalid', role: 'patient', name: 'Ali', image: '' };
let logs: string[];

beforeEach(() => {
  vi.clearAllMocks();
  logs = [];
  vi.spyOn(console, 'log').mockImplementation((l: string) => void logs.push(String(l)));
  vi.spyOn(console, 'warn').mockImplementation((l: string) => void logs.push(String(l)));
  vi.spyOn(console, 'error').mockImplementation((l: string) => void logs.push(String(l)));
  rateLimit.mockResolvedValue({ success: true, count: 1 });
  consumeLogin.mockResolvedValue({ state: 'approved', telegram: { id: 555, firstName: 'Ali' } });
  signInWithTelegram.mockResolvedValue({ ok: true, user: USER, created: true });
});

describe('authorizeTelegramLogin', () => {
  it('turns an approved portal login into the portal user', async () => {
    expect(await authorizeTelegramLogin({ token: TOKEN, pollSecret: SECRET }, '203.0.113.5')).toEqual(USER);
    expect(consumeLogin).toHaveBeenCalledWith(TOKEN, SECRET, { purpose: 'portal' });
    expect(signInWithTelegram).toHaveBeenCalledWith({ id: 555, firstName: 'Ali' });
  });

  it('answers null for anything that is not a well-formed token pair, without touching the database', async () => {
    expect(await authorizeTelegramLogin(undefined, 'ip')).toBeNull();
    expect(await authorizeTelegramLogin({ token: 'short', pollSecret: SECRET }, 'ip')).toBeNull();
    expect(await authorizeTelegramLogin({ token: TOKEN, pollSecret: { $ne: 1 } }, 'ip')).toBeNull();
    expect(consumeLogin).not.toHaveBeenCalled();
  });

  it('answers null when the login is not approved (still pending, gone, or made for something else)', async () => {
    for (const state of ['pending', 'gone']) {
      consumeLogin.mockResolvedValueOnce({ state });
      expect(await authorizeTelegramLogin({ token: TOKEN, pollSecret: SECRET }, 'ip')).toBeNull();
    }
    expect(signInWithTelegram).not.toHaveBeenCalled();
  });

  it('answers null when the account may not use Telegram sign-in', async () => {
    signInWithTelegram.mockResolvedValueOnce({ ok: false, code: 'role_not_allowed' });
    expect(await authorizeTelegramLogin({ token: TOKEN, pollSecret: SECRET }, 'ip')).toBeNull();
  });

  it('is rate limited per address', async () => {
    rateLimit.mockResolvedValueOnce({ success: false, count: 21 });
    expect(await authorizeTelegramLogin({ token: TOKEN, pollSecret: SECRET }, '203.0.113.5')).toBeNull();
    expect(rateLimit).toHaveBeenCalledWith('portal_tg_signin_203.0.113.5', 20, 60000);
    expect(consumeLogin).not.toHaveBeenCalled();
  });

  it('never throws and never logs the token or the poll secret', async () => {
    signInWithTelegram.mockRejectedValueOnce(new Error('db down'));
    expect(await authorizeTelegramLogin({ token: TOKEN, pollSecret: SECRET }, 'ip')).toBeNull();
    await authorizeTelegramLogin({ token: TOKEN, pollSecret: SECRET }, 'ip');
    const all = logs.join('\n');
    expect(all).toContain('signin:error');
    expect(all).toContain('signin:registered');
    expect(all).not.toContain(TOKEN);
    expect(all).not.toContain(SECRET);
  });
});
