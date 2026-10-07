import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const HOST = 'https://www.duxtur.org';
const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000);

vi.mock('@/app/sitemap', () => ({
  default: async () => [
    { url: `${HOST}/ru/blog/fresh`, lastModified: hoursAgo(2) },
    { url: `${HOST}/ru/blog/old`, lastModified: hoursAgo(200) },
    { url: `${HOST}/ru/about` }, // no lastmod known
  ],
}));

const submitToIndexNow = vi.fn();
vi.mock('@/lib/indexnow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/indexnow')>()),
  submitToIndexNow: (...args: unknown[]) => submitToIndexNow(...args),
}));

import { GET } from './route';

const req = (query = '', auth: string | null = 'Bearer s3cret') =>
  new NextRequest(`${HOST}/api/cron/indexnow${query}`, { headers: auth ? { authorization: auth } : {} });

beforeEach(() => {
  vi.stubEnv('CRON_SECRET', 's3cret');
  submitToIndexNow.mockReset();
  submitToIndexNow.mockResolvedValue({ ok: true, submitted: 1, statuses: [200] });
});
afterEach(() => vi.unstubAllEnvs());

describe('IndexNow cron', () => {
  it('rejects requests without the cron secret', async () => {
    expect((await GET(req('', null))).status).toBe(401);
    expect((await GET(req('', 'Bearer wrong'))).status).toBe(401);
    expect(submitToIndexNow).not.toHaveBeenCalled();
  });

  it('fails closed when CRON_SECRET is not configured', async () => {
    vi.stubEnv('CRON_SECRET', '');
    expect((await GET(req('', 'Bearer '))).status).toBe(401);
    expect(submitToIndexNow).not.toHaveBeenCalled();
  });

  it('submits only URLs changed inside the window', async () => {
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(submitToIndexNow).toHaveBeenCalledWith([`${HOST}/ru/blog/fresh`]);
    expect(await res.json()).toMatchObject({ candidates: 1, ok: true });
  });

  it('widens the window with ?hours=', async () => {
    await GET(req('?hours=300'));
    expect(submitToIndexNow).toHaveBeenCalledWith([`${HOST}/ru/blog/fresh`, `${HOST}/ru/blog/old`]);
  });

  it('submits the whole sitemap with ?all=1', async () => {
    await GET(req('?all=1'));
    expect(submitToIndexNow).toHaveBeenCalledWith([`${HOST}/ru/blog/fresh`, `${HOST}/ru/blog/old`, `${HOST}/ru/about`]);
  });

  it('reports 503 when INDEXNOW_KEY is missing', async () => {
    submitToIndexNow.mockResolvedValue({ ok: false, skipped: 'no-key', submitted: 0, statuses: [] });
    expect((await GET(req())).status).toBe(503);
  });
});
