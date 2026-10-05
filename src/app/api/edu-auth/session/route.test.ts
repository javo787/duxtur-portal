import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const auth = vi.fn();
const findById = vi.fn();
const findDoctor = vi.fn();
const getOrCreateEduUid = vi.fn();
const createEduCustomToken = vi.fn();
const rateLimit = vi.fn();

vi.mock('@/auth', () => ({ auth: () => auth() }));
vi.mock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/User', () => ({ default: { findById: (...a: unknown[]) => findById(...a) } }));
vi.mock('@/models/Doctor', () => ({ default: { findOne: (...a: unknown[]) => findDoctor(...a) } }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...a: unknown[]) => rateLimit(...a) }));
vi.mock('@/lib/edu-custom-token', () => ({ createEduCustomToken: (...a: unknown[]) => createEduCustomToken(...a) }));
vi.mock('@/lib/edu-account-link', () => ({ getOrCreateEduUid: (...a: unknown[]) => getOrCreateEduUid(...a) }));

import { GET, POST } from './route';

const URL_ = 'https://duxtur.org/api/edu-auth/session';
const get = () => GET(new NextRequest(URL_));
const post = (origin: string | null = 'https://duxtur.org') =>
  POST(new NextRequest(URL_, { method: 'POST', headers: origin ? { origin } : {} }));

const portalUser = { _id: { toString: () => 'u1' }, name: 'Dr. Rahimov', email: 'r@mail.org', image: 'i.png', role: 'doctor', eduUid: null };
const withUser = (user: unknown) => findById.mockReturnValue({ select: () => ({ lean: async () => user }) });
const withDoctor = (doctor: unknown) => findDoctor.mockReturnValue({ select: () => ({ lean: async () => doctor }) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({ project_id: 'edu-proj' });
  rateLimit.mockResolvedValue({ success: true, count: 1 });
  auth.mockResolvedValue({ user: { id: 'u1' } });
  withUser(portalUser);
  withDoctor(null);
  getOrCreateEduUid.mockResolvedValue({ eduUid: 'dx_u1', created: true });
  createEduCustomToken.mockResolvedValue('custom.jwt.token');
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
});

describe('GET /api/edu-auth/session', () => {
  it('says nobody is signed in when there is no session', async () => {
    auth.mockResolvedValue(null);
    expect(await (await get()).json()).toEqual({ signedIn: false });
  });

  it('describes the signed-in account and what is linked, and issues no token', async () => {
    withUser({ ...portalUser, eduUid: 'tg_5' });
    const body = await (await get()).json();
    expect(body).toEqual({ signedIn: true, name: 'Dr. Rahimov', email: 'r@mail.org', image: 'i.png', eduUid: 'tg_5', role: 'doctor', doctor: null });
    expect(createEduCustomToken).not.toHaveBeenCalled();
  });

  it('reports the status of the doctor profile, which decides whether this person may write articles', async () => {
    for (const status of ['approved', 'pending', 'rejected', 'banned', 'pre_imported']) {
      withDoctor({ status });
      expect((await (await get()).json()).doctor).toEqual({ status });
    }
    expect(findDoctor).toHaveBeenCalledWith({ userId: portalUser._id });
  });

  it('answers role patient for an account that has none', async () => {
    withUser({ ...portalUser, role: undefined });
    expect((await (await get()).json()).role).toBe('patient');
  });

  it('treats a session whose account no longer exists as signed out', async () => {
    withUser(null);
    expect(await (await get()).json()).toEqual({ signedIn: false });
  });

  it('does not pass on the placeholder address of an account that signed up with Telegram', async () => {
    withUser({ ...portalUser, email: 'tg5.abcdef012345@telegram.invalid', role: 'patient', eduUid: 'tg_5' });
    const body = await (await get()).json();
    expect(body.email).toBe('');
    expect(body.eduUid).toBe('tg_5');
  });
});

describe('POST /api/edu-auth/session', () => {
  it('issues a custom token for the linked Edu uid with the portal facts as claims', async () => {
    const res = await post();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ customToken: 'custom.jwt.token', projectId: 'edu-proj', eduUid: 'dx_u1', created: true });
    expect(getOrCreateEduUid).toHaveBeenCalledWith('u1');
    expect(createEduCustomToken).toHaveBeenCalledWith('dx_u1', {
      provider: 'duxtur',
      portalUserId: 'u1',
      portalRole: 'doctor',
      tgName: 'Dr. Rahimov',
      portalEmail: 'r@mail.org',
    });
  });

  it('sends no placeholder address to Edu for an account that signed up with Telegram', async () => {
    withUser({ ...portalUser, name: '', email: 'tg5.abcdef012345@telegram.invalid', role: 'patient' });
    await post();
    const claims = createEduCustomToken.mock.calls[0][1];
    expect(claims.portalEmail).toBe('');
    expect(claims.tgName).toBe('');
  });

  it('signs in as the old Edu profile when the account is linked to one', async () => {
    getOrCreateEduUid.mockResolvedValue({ eduUid: 'tg_5', created: false });
    const body = await (await post()).json();
    expect(body.eduUid).toBe('tg_5');
    expect(createEduCustomToken.mock.calls[0][0]).toBe('tg_5');
  });

  it('refuses a request that does not come from a duxtur.org page', async () => {
    for (const origin of [null, 'https://evil.example', 'https://duxtur.org.evil.example']) {
      const res = await post(origin);
      expect(res.status).toBe(403);
      expect((await res.json()).code).toBe('bad_origin');
    }
    expect(createEduCustomToken).not.toHaveBeenCalled();
  });

  it('needs a portal session', async () => {
    auth.mockResolvedValue(null);
    const res = await post();
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('not_signed_in');
    expect(getOrCreateEduUid).not.toHaveBeenCalled();
  });

  it('is rate limited', async () => {
    rateLimit.mockResolvedValue({ success: false, count: 21 });
    expect((await post()).status).toBe(429);
    expect(createEduCustomToken).not.toHaveBeenCalled();
  });

  it('answers with a reference, not a stack, when signing fails', async () => {
    createEduCustomToken.mockRejectedValue(new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured'));
    const res = await post();
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error).toBe('Server error');
    expect(body.ref).toBeTruthy();
    expect(JSON.stringify(body)).not.toContain('FIREBASE_SERVICE_ACCOUNT_JSON');
  });
});
