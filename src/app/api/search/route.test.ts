import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const rateLimit = vi.fn();
const articleFind = vi.fn();
const doctorFind = vi.fn();

vi.mock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...a: unknown[]) => rateLimit(...a) }));

/** Mongoose-like chain: every step returns the chain, `.lean()` resolves with `rows`. */
function chain(rows: unknown[]) {
  const c: Record<string, unknown> = {};
  for (const m of ['hint', 'sort', 'limit', 'populate']) c[m] = () => c;
  c.lean = () => Promise.resolve(rows);
  return c;
}
vi.mock('@/models/Article', () => ({ default: { find: (...a: unknown[]) => articleFind(...a) } }));
vi.mock('@/models/Doctor', () => ({ default: { find: (...a: unknown[]) => doctorFind(...a) } }));

import { GET } from './route';

function call(qs: string, ip = '203.0.113.9, 10.0.0.1') {
  return GET(new NextRequest(`https://duxtur.org/api/search?${qs}`, { headers: { 'x-forwarded-for': ip } }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  rateLimit.mockResolvedValue({ success: true, count: 1 });
  // text search finds nothing, so the route falls back to the regex search
  articleFind.mockImplementation(() => chain([]));
  doctorFind.mockImplementation(() => chain([]));
});

describe('GET /api/search', () => {
  it('rate-limits by the client address only, not the whole x-forwarded-for chain', async () => {
    await call('q=abc');
    expect(rateLimit).toHaveBeenCalledWith('203.0.113.9', 30, 60_000);
  });

  it('returns empty lists for a missing or blank query without touching the database', async () => {
    for (const qs of ['', 'q=', 'q=%20%20']) {
      const res = await call(qs);
      expect(await res.json()).toEqual({ articles: [], doctors: [] });
    }
    expect(articleFind).not.toHaveBeenCalled();
    expect(doctorFind).not.toHaveBeenCalled();
  });

  it('escapes regex metacharacters in the fallback search', async () => {
    await call('q=' + encodeURIComponent('(a+)+$'));
    const articleFallback = articleFind.mock.calls[1][0].$or[0]['title.ru'];
    const doctorFallback = doctorFind.mock.calls[1][0].$or[0].name;
    expect(articleFallback.$regex).toBe('\\(a\\+\\)\\+\\$');
    expect(doctorFallback.$regex).toBe('\\(a\\+\\)\\+\\$');
    // the pattern must be a literal now: it matches the text itself, nothing else
    expect(new RegExp(articleFallback.$regex, 'i').test('x (a+)+$ y')).toBe(true);
    expect(new RegExp(articleFallback.$regex, 'i').test('aaaa')).toBe(false);
  });

  it('cuts overlong queries', async () => {
    await call('q=' + 'a'.repeat(5000));
    const sent = articleFind.mock.calls[0][0].$text.$search as string;
    expect(sent).toHaveLength(100);
  });

  it('falls back to ru for an unknown lang so it cannot pick an arbitrary field path', async () => {
    await call('q=abc&lang=' + encodeURIComponent('title.ru"}),$where:1//'));
    const or = articleFind.mock.calls[1][0].$or;
    expect(Object.keys(or[0])).toEqual(['title.ru']);
    expect(Object.keys(or[1])).toEqual(['overview.ru']);
  });

  it('honours a supported lang', async () => {
    await call('q=abc&lang=tg');
    const or = articleFind.mock.calls[1][0].$or;
    expect(Object.keys(or[0])).toEqual(['title.tg']);
  });

  it('answers 429 when the limit is hit', async () => {
    rateLimit.mockResolvedValue({ success: false, count: 31 });
    const res = await call('q=abc');
    expect(res.status).toBe(429);
    expect(articleFind).not.toHaveBeenCalled();
  });
});
