import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  session: null as unknown,
  limits: [] as boolean[],
  createReview: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/auth', () => ({ auth: vi.fn(async () => mocks.session) }));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(async () => ({ success: mocks.limits.length ? mocks.limits.shift()! : true, count: 1 })),
}));
vi.mock('@/lib/review-service', () => ({ createReview: mocks.createReview }));

import { postReview } from './review-http';

const doctorTarget = () => ({ kind: 'doctor' as const, id: 'bbbbbbbbbbbbbbbbbbbbbbbb' });
const post = (body: unknown, raw?: string) =>
  postReview(
    new Request('https://duxtur.org/api/reviews', { method: 'POST', body: raw ?? JSON.stringify(body), headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' } }),
    doctorTarget,
  );
const good = { rating: 5, text: 'Очень помог, спасибо.' };

beforeEach(() => {
  mocks.session = { user: { id: 'aaaaaaaaaaaaaaaaaaaaaaaa' } };
  mocks.limits = [];
  mocks.createReview.mockReset();
  mocks.createReview.mockResolvedValue({ ok: true });
});

describe('POST of a review', () => {
  it('writes the review of a signed-in person and answers with nothing but success', async () => {
    const res = await post({ ...good, isAnonymous: true });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ success: true });
    expect(mocks.createReview).toHaveBeenCalledWith(doctorTarget(), 'aaaaaaaaaaaaaaaaaaaaaaaa', { rating: 5, text: good.text, isAnonymous: true });
  });

  it('asks a visitor to sign in, before anything is written', async () => {
    mocks.session = null;
    const res = await post(good);
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('auth_required');
    mocks.session = { user: {} };
    expect((await post(good)).status).toBe(401);
    expect(mocks.createReview).not.toHaveBeenCalled();
  });

  it('tells apart too many requests from this address and from this person', async () => {
    mocks.limits = [false];
    expect((await post(good)).status).toBe(429);
    mocks.limits = [true, false];
    expect((await post(good)).status).toBe(429);
    expect(mocks.createReview).not.toHaveBeenCalled();
  });

  it('names what is wrong with the review', async () => {
    expect(await (await post({ ...good, rating: 9 })).json()).toEqual({ error: 'rating' });
    expect(await (await post({ ...good, text: 'ок' })).json()).toEqual({ error: 'text_short' });
    expect(await (await post({ ...good, text: 'а'.repeat(501) })).json()).toEqual({ error: 'text_long' });
    expect((await post(null, 'not json')).status).toBe(400);
    expect((await post([])).status).toBe(400);
    expect(mocks.createReview).not.toHaveBeenCalled();
  });

  it('rejects a request that names no subject', async () => {
    const res = await postReview(new Request('https://duxtur.org/api/reviews', { method: 'POST', body: JSON.stringify(good) }), () => null);
    expect(res.status).toBe(400);
  });

  it.each([
    ['not_found', 404],
    ['own', 403],
    ['duplicate', 409],
    ['no_user', 401],
  ])('answers %s with %i', async (code, status) => {
    mocks.createReview.mockResolvedValue({ ok: false, code });
    const res = await post(good);
    expect(res.status).toBe(status);
    expect((await res.json()).error).toBe(code === 'no_user' ? 'auth_required' : code);
  });

  it('does not leak what went wrong inside', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.createReview.mockRejectedValue(new Error('mongo exploded at 10.0.0.5'));
    const res = await post(good);
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('mongo');
  });
});
