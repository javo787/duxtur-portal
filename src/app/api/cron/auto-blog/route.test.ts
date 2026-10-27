import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ planNext: vi.fn(), saveGenerated: vi.fn(), afterPublish: vi.fn() }));
vi.mock('@/lib/auto-blog/publish', () => {
  class DuplicateTopicError extends Error {}
  return { DuplicateTopicError, planNext: h.planNext, saveGenerated: h.saveGenerated, afterPublish: h.afterPublish };
});

import { DuplicateTopicError } from '@/lib/auto-blog/publish';
import { makeArticle } from '@/lib/auto-blog/test-fixtures';
import { isCronAuthorized } from '@/lib/cron-auth';
import { GET, POST } from './route';

const SECRET = 'test-secret-value';
const auth = { authorization: `Bearer ${SECRET}` };
const get = (qs = '', headers: Record<string, string> = auth) => GET(new NextRequest(`http://localhost/api/cron/auto-blog${qs}`, { headers }));
const post = (body: unknown, headers: Record<string, string> = auth) =>
  POST(new NextRequest('http://localhost/api/cron/auto-blog', { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) }));

const goodBody = () => ({
  topicKey: 'hypertension',
  languages: { ru: makeArticle('ru'), uz: makeArticle('uz') },
  sources: [
    { name: 'MedlinePlus (NLM)', title: 'High Blood Pressure', url: 'https://medlineplus.gov/highbloodpressure.html', license: '' },
    { name: 'Europe PMC', title: 'Review', url: 'https://doi.org/10.1000/abc', license: '' },
  ],
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('CRON_SECRET', SECRET);
  vi.stubEnv('AUTO_BLOG_ENABLED', '');
  h.afterPublish.mockResolvedValue({ revalidated: true, indexNow: null, telegram: true });
});
afterEach(() => vi.unstubAllEnvs());

describe('isCronAuthorized', () => {
  it('fails closed without a configured secret and rejects wrong or malformed headers', () => {
    expect(isCronAuthorized(`Bearer ${SECRET}`, undefined)).toBe(false);
    expect(isCronAuthorized(`Bearer ${SECRET}`, '')).toBe(false);
    expect(isCronAuthorized(null, SECRET)).toBe(false);
    expect(isCronAuthorized('Bearer nope', SECRET)).toBe(false);
    expect(isCronAuthorized(SECRET, SECRET)).toBe(false);
    expect(isCronAuthorized(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });
});

describe('GET /api/cron/auto-blog (plan)', () => {
  it('requires the secret', async () => {
    expect((await get('', {})).status).toBe(401);
    expect((await get('', { authorization: 'Bearer wrong' })).status).toBe(401);
    expect(h.planNext).not.toHaveBeenCalled();
  });

  it('returns the plan, passing force and only the skip keys that are real topics', async () => {
    h.planNext.mockResolvedValue({ due: true, topic: { key: 'migraine' } });
    const res = await get('?force=1&skip=hypertension,evil-key,stroke');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ due: true, topic: { key: 'migraine' } });
    expect(h.planNext).toHaveBeenCalledWith({ force: true, skip: ['hypertension', 'stroke'] });
  });

  it('can be paused with AUTO_BLOG_ENABLED=false, without touching the database', async () => {
    vi.stubEnv('AUTO_BLOG_ENABLED', 'false');
    expect(await (await get()).json()).toEqual({ due: false, reason: 'disabled' });
    expect(h.planNext).not.toHaveBeenCalled();
  });

  it('answers 500 without leaking details when the database fails', async () => {
    h.planNext.mockRejectedValue(new Error('mongodb://user:pass@host exploded'));
    const res = await get();
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('mongodb');
  });
});

describe('POST /api/cron/auto-blog (publish)', () => {
  it('requires the secret', async () => {
    expect((await post(goodBody(), {})).status).toBe(401);
    expect(h.saveGenerated).not.toHaveBeenCalled();
  });

  it('publishes a valid article and reports the result', async () => {
    h.saveGenerated.mockResolvedValue({ slug: 's-12345', languages: ['ru', 'uz'], urls: ['https://www.duxtur.org/ru/blog/s-12345'] });
    const res = await post(goodBody());
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ published: true, slug: 's-12345', revalidated: true, telegram: true });
    expect(h.afterPublish).toHaveBeenCalledOnce();
  });

  it('rejects bad JSON, oversized bodies and invalid articles before touching the database', async () => {
    expect((await post('{not json')).status).toBe(400);
    expect((await post('x'.repeat(400_001))).status).toBe(413);
    const invalid = goodBody();
    invalid.sources = [];
    const res = await post(invalid);
    expect(res.status).toBe(422);
    expect((await res.json()).details).toContain('at least two valid sources are required');
    expect(h.saveGenerated).not.toHaveBeenCalled();
  });

  it('answers 409 for a topic that already has an article, so the runner picks another', async () => {
    h.saveGenerated.mockRejectedValue(new DuplicateTopicError('hypertension'));
    const res = await post(goodBody());
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ published: false, reason: 'duplicate-topic' });
    expect(h.afterPublish).not.toHaveBeenCalled();
  });

  it('is paused by AUTO_BLOG_ENABLED=0', async () => {
    vi.stubEnv('AUTO_BLOG_ENABLED', '0');
    expect(await (await post(goodBody())).json()).toEqual({ published: false, reason: 'disabled' });
    expect(h.saveGenerated).not.toHaveBeenCalled();
  });
});
