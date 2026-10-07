import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IdTokenError } from './edu-firebase-id-token';

const rateLimit = vi.fn();
const verify = vi.fn();
const signInWithEdu = vi.fn();
const envFlags = vi.fn();

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...a: unknown[]) => rateLimit(...a) }));
vi.mock('@/lib/edu-firebase-id-token', async () => {
  const actual = await vi.importActual<typeof import('@/lib/edu-firebase-id-token')>('@/lib/edu-firebase-id-token');
  return { ...actual, verifyFirebaseIdToken: (...a: unknown[]) => verify(...a) };
});
vi.mock('@/lib/portal-edu-account', () => ({ signInWithEdu: (...a: unknown[]) => signInWithEdu(...a) }));
vi.mock('@/lib/edu-log', async () => {
  const actual = await vi.importActual<typeof import('@/lib/edu-log')>('@/lib/edu-log');
  return { ...actual, envFlags: () => envFlags() };
});

import { EduSignInFailure, authorizeEduSignIn } from './portal-edu-signin';

const USER = { id: 'u1', email: 'a@b.tj', role: 'patient', name: 'Ali', image: '' };
const failureOf = async (p: Promise<unknown>) => {
  try { await p; } catch (e) { return e instanceof EduSignInFailure ? e.code : `other:${(e as Error).message}`; }
  return 'no failure';
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  rateLimit.mockResolvedValue({ success: true, count: 1 });
  envFlags.mockReturnValue({ firebaseProjectId: 'duxtur-edu' });
  verify.mockResolvedValue({ uid: 'tg_1', provider: 'custom', authTime: 1 });
  signInWithEdu.mockResolvedValue({ ok: true, user: USER, created: false });
});

describe('authorizeEduSignIn', () => {
  it('verifies the token for this Firebase project and returns the portal user', async () => {
    expect(await authorizeEduSignIn({ idToken: 'a.b.c' }, '203.0.113.5')).toEqual(USER);
    expect(verify).toHaveBeenCalledWith('a.b.c', { projectId: 'duxtur-edu' });
    expect(signInWithEdu).toHaveBeenCalledWith({ uid: 'tg_1', provider: 'custom', authTime: 1 });
  });

  it('refuses a token that does not verify, without looking at any account', async () => {
    verify.mockRejectedValue(new IdTokenError('bad-signature'));
    expect(await failureOf(authorizeEduSignIn({ idToken: 'forged' }, 'ip'))).toBe('invalid_token');
    expect(signInWithEdu).not.toHaveBeenCalled();
  });

  it('reports "server" (not "invalid token") when Google\'s keys cannot be loaded', async () => {
    verify.mockRejectedValue(new IdTokenError('keys-unavailable'));
    expect(await failureOf(authorizeEduSignIn({ idToken: 't' }, 'ip'))).toBe('server');
  });

  it('is rate limited per address', async () => {
    rateLimit.mockResolvedValue({ success: false, count: 21 });
    expect(await failureOf(authorizeEduSignIn({ idToken: 't' }, '203.0.113.5'))).toBe('rate_limited');
    expect(rateLimit).toHaveBeenCalledWith('portal_edu_signin_203.0.113.5', 20, 60000);
    expect(verify).not.toHaveBeenCalled();
  });

  it('hands the reasons the person can act on back as codes', async () => {
    for (const code of ['doctor_not_approved', 'role_not_allowed', 'email_in_use', 'unsupported'] as const) {
      signInWithEdu.mockResolvedValueOnce({ ok: false, code });
      expect(await failureOf(authorizeEduSignIn({ idToken: 't' }, 'ip'))).toBe(code);
    }
  });

  it('fails closed when the project is not configured or something throws', async () => {
    envFlags.mockReturnValue({ firebaseProjectId: null });
    expect(await failureOf(authorizeEduSignIn({ idToken: 't' }, 'ip'))).toBe('server');
    envFlags.mockReturnValue({ firebaseProjectId: 'duxtur-edu' });
    signInWithEdu.mockRejectedValueOnce(new Error('mongo down'));
    expect(await failureOf(authorizeEduSignIn({ idToken: 't' }, 'ip'))).toBe('server');
  });

  it('never writes the token into the log', async () => {
    const lines: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((l: string) => void lines.push(String(l)));
    vi.spyOn(console, 'warn').mockImplementation((l: string) => void lines.push(String(l)));
    verify.mockRejectedValueOnce(new IdTokenError('expired'));
    await failureOf(authorizeEduSignIn({ idToken: 'SECRET.TOKEN.VALUE' }, 'ip'));
    await authorizeEduSignIn({ idToken: 'SECRET.TOKEN.VALUE' }, 'ip');
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.join('\n')).not.toContain('SECRET.TOKEN.VALUE');
  });
});
