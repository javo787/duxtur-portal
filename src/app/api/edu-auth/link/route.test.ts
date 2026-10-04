import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const auth = vi.fn();
const verify = vi.fn();
const linkEduUid = vi.fn();
const unlinkEduUid = vi.fn();
const rateLimit = vi.fn();

vi.mock('@/auth', () => ({ auth: () => auth() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...a: unknown[]) => rateLimit(...a) }));
vi.mock('@/lib/edu-account-link', () => ({
  linkEduUid: (...a: unknown[]) => linkEduUid(...a),
  unlinkEduUid: (...a: unknown[]) => unlinkEduUid(...a),
}));
vi.mock('@/lib/edu-firebase-id-token', async () => {
  const actual = await vi.importActual<typeof import('@/lib/edu-firebase-id-token')>('@/lib/edu-firebase-id-token');
  return { ...actual, verifyFirebaseIdToken: (...a: unknown[]) => verify(...a) };
});

import { DELETE, POST } from './route';
import { IdTokenError } from '@/lib/edu-firebase-id-token';

const URL_ = 'https://duxtur.org/api/edu-auth/link';
const post = (body: unknown, origin: string | null = 'https://duxtur.org') =>
  POST(new NextRequest(URL_, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(origin ? { origin } : {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }));
const del = (origin: string | null = 'https://duxtur.org') =>
  DELETE(new NextRequest(URL_, { method: 'DELETE', headers: origin ? { origin } : {} }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({ project_id: 'edu-proj' });
  rateLimit.mockResolvedValue({ success: true, count: 1 });
  auth.mockResolvedValue({ user: { id: 'u1' } });
  verify.mockResolvedValue({ uid: 'tg_123', provider: 'custom', authTime: 1 });
  linkEduUid.mockResolvedValue({ ok: true, eduUid: 'tg_123', alreadyLinked: false });
  unlinkEduUid.mockResolvedValue('tg_123');
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
});

describe('POST /api/edu-auth/link', () => {
  it('links the Edu uid proved by the ID token to the signed-in portal account', async () => {
    const res = await post({ idToken: 'id.token.value' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ linked: true, eduUid: 'tg_123', alreadyLinked: false });
    expect(verify).toHaveBeenCalledWith('id.token.value', { projectId: 'edu-proj' });
    expect(linkEduUid).toHaveBeenCalledWith('u1', 'tg_123');
  });

  it('takes the uid only from the verified token, never from the body', async () => {
    await post({ idToken: 'id.token.value', eduUid: 'tg_VICTIM', uid: 'tg_VICTIM' });
    expect(linkEduUid).toHaveBeenCalledWith('u1', 'tg_123');
  });

  it('refuses requests that do not come from a duxtur.org page, before anything is verified', async () => {
    for (const origin of [null, 'https://evil.example']) {
      const res = await post({ idToken: 'x' }, origin);
      expect(res.status).toBe(403);
    }
    expect(verify).not.toHaveBeenCalled();
    expect(linkEduUid).not.toHaveBeenCalled();
  });

  it('needs a portal session', async () => {
    auth.mockResolvedValue(null);
    const res = await post({ idToken: 'x' });
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('not_signed_in');
    expect(verify).not.toHaveBeenCalled();
  });

  it('refuses a token that does not verify', async () => {
    verify.mockRejectedValue(new IdTokenError('bad-signature'));
    const res = await post({ idToken: 'forged' });
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('invalid_id_token');
    expect(linkEduUid).not.toHaveBeenCalled();
  });

  it('says 503, not 401, when Google\'s keys cannot be fetched', async () => {
    verify.mockRejectedValue(new IdTokenError('keys-unavailable'));
    expect((await post({ idToken: 'x' })).status).toBe(503);
  });

  it.each([
    ['edu_uid_taken', 409],
    ['portal_already_linked', 409],
    ['invalid_uid', 409],
    ['not_found', 404],
  ])('turns the refusal %s into HTTP %i with a readable message', async (code, status) => {
    linkEduUid.mockResolvedValue({ ok: false, code });
    const res = await post({ idToken: 'x' });
    const body = await res.json();
    expect(res.status).toBe(status);
    expect(body.code).toBe(code);
    expect(body.error).toMatch(/\w/);
  });

  it('rejects a body that is not JSON and a missing token', async () => {
    expect((await post('not json')).status).toBe(400);
    verify.mockRejectedValue(new IdTokenError('malformed'));
    expect((await post({})).status).toBe(401);
  });

  it('is rate limited', async () => {
    rateLimit.mockResolvedValue({ success: false, count: 11 });
    expect((await post({ idToken: 'x' })).status).toBe(429);
    expect(verify).not.toHaveBeenCalled();
  });

  it('does not run without the Firebase project configured', async () => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    expect((await post({ idToken: 'x' })).status).toBe(500);
    expect(verify).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/edu-auth/link', () => {
  it('unlinks the signed-in account', async () => {
    const res = await del();
    expect(await res.json()).toEqual({ unlinked: true });
    expect(unlinkEduUid).toHaveBeenCalledWith('u1');
  });

  it('reports that there was nothing to unlink', async () => {
    unlinkEduUid.mockResolvedValue(null);
    expect(await (await del()).json()).toEqual({ unlinked: false });
  });

  it('refuses foreign origins and signed-out requests', async () => {
    expect((await del('https://evil.example')).status).toBe(403);
    auth.mockResolvedValue(null);
    expect((await del()).status).toBe(401);
    expect(unlinkEduUid).not.toHaveBeenCalled();
  });
});
