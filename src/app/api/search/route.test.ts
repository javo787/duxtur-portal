import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Regression test: the visitor's text must never reach the database as a pattern or as a field name.
const calls = vi.hoisted(() => ({ articleFilters: [] as unknown[], doctorFilters: [] as unknown[] }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn(async () => ({ success: true })) }));
const chain = (sink: unknown[]) => (filter: unknown) => {
  sink.push(filter);
  const c: Record<string, unknown> = {};
  for (const m of ['hint', 'sort', 'limit', 'populate']) c[m] = () => c;
  c.lean = () => Promise.resolve([]); // nothing found by the text index: the pattern fallback runs
  return c;
};
vi.mock('@/models/Article', () => ({ default: { find: (f: unknown) => chain(calls.articleFilters)(f) } }));
vi.mock('@/models/Doctor', () => ({ default: { find: (f: unknown) => chain(calls.doctorFilters)(f) } }));

import { GET } from './route';

const get = (qs: string) => GET(new NextRequest(`http://localhost/api/search?${qs}`));
const patterns = (filters: unknown[]) => JSON.stringify(filters.slice(1)); // [0] is the text-index query

beforeEach(() => {
  calls.articleFilters.length = 0;
  calls.doctorFilters.length = 0;
});

describe('GET /api/search', () => {
  it('escapes what was typed before it becomes a pattern', async () => {
    const res = await get(`q=${encodeURIComponent('(a+)+$')}&type=all`);
    expect(res.status).toBe(200);
    // as a pattern "(a+)+$" would be catastrophic; escaped it is plain text
    expect(patterns(calls.articleFilters)).toContain('\\\\(a\\\\+\\\\)\\\\+\\\\$');
    expect(patterns(calls.doctorFilters)).toContain('\\\\(a\\\\+\\\\)\\\\+\\\\$');
  });

  it('does not fail on text that is not a valid pattern', async () => {
    for (const q of ['[', '\\', '*', '(?<=x)', '{1,2}']) expect((await get(`q=${encodeURIComponent(q)}`)).status).toBe(200);
  });

  it('cuts a very long query', async () => {
    await get(`q=${'а'.repeat(5000)}`);
    const text = patterns(calls.articleFilters);
    expect(text.length).toBeLessThan(1000);
  });

  it('only builds field names from our own languages', async () => {
    await get(`q=давление&lang=${encodeURIComponent('ru.$where')}`);
    const text = patterns(calls.articleFilters);
    expect(text).toContain('title.ru');
    expect(text).not.toContain('$where');
    await get('q=давление&lang=tg');
    expect(patterns(calls.articleFilters)).toContain('title.tg');
  });

  it('answers an empty query without touching the database', async () => {
    const res = await get('q=%20%20');
    expect(await res.json()).toEqual({ articles: [], doctors: [] });
    expect(calls.articleFilters).toHaveLength(0);
  });
});
