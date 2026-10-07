import { describe, expect, it, vi } from 'vitest';
import {
  INDEXNOW_ENDPOINT,
  chunkUrls,
  getIndexNowKey,
  indexNowKeyLocation,
  normalizeIndexNowUrls,
  submitToIndexNow,
} from './indexnow';

const KEY = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
const HOST = 'https://www.duxtur.org';

const okFetch = (status = 200) => vi.fn(async () => new Response(null, { status }));

describe('getIndexNowKey', () => {
  it('accepts a key of the shape the protocol allows', () => {
    expect(getIndexNowKey({ INDEXNOW_KEY: KEY })).toBe(KEY);
    expect(getIndexNowKey({ INDEXNOW_KEY: `  ${KEY}\n` })).toBe(KEY);
  });

  it('rejects a missing, too short or malformed key', () => {
    expect(getIndexNowKey({})).toBeNull();
    expect(getIndexNowKey({ INDEXNOW_KEY: 'short' })).toBeNull();
    expect(getIndexNowKey({ INDEXNOW_KEY: 'has space in it 123' })).toBeNull();
    expect(getIndexNowKey({ INDEXNOW_KEY: '../../etc/passwd-1234' })).toBeNull();
  });

  it('puts the key file at the site root', () => {
    expect(indexNowKeyLocation(KEY)).toBe(`${HOST}/${KEY}.txt`);
  });
});

describe('normalizeIndexNowUrls', () => {
  it('drops other hosts, http, garbage and fragments, and dedupes', () => {
    const out = normalizeIndexNowUrls([
      `${HOST}/ru/blog/a`,
      `${HOST}/ru/blog/a`,
      `${HOST}/ru/blog/b#comments`,
      'https://duxtur.org/ru/blog/c', // bare host: not the canonical one
      'http://www.duxtur.org/ru/blog/d',
      'https://evil.example/ru/blog/e',
      'not a url',
    ]);
    expect(out).toEqual([`${HOST}/ru/blog/a`, `${HOST}/ru/blog/b`]);
  });

  it('unescapes the XML-escaped query strings the sitemap contains', () => {
    expect(normalizeIndexNowUrls([`${HOST}/ru/clinics?city=x&amp;type=y`])).toEqual([`${HOST}/ru/clinics?city=x&type=y`]);
  });
});

describe('chunkUrls', () => {
  it('splits at the limit', () => {
    expect(chunkUrls([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunkUrls([], 2)).toEqual([]);
  });
});

describe('submitToIndexNow', () => {
  it('posts host, key, keyLocation and the URL list', async () => {
    const fetchImpl = okFetch();
    const res = await submitToIndexNow([`${HOST}/ru`, `${HOST}/tg`], { key: KEY, fetchImpl });

    expect(res).toEqual({ ok: true, submitted: 2, statuses: [200] });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(INDEXNOW_ENDPOINT);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      host: 'www.duxtur.org',
      key: KEY,
      keyLocation: `${HOST}/${KEY}.txt`,
      urlList: [`${HOST}/ru`, `${HOST}/tg`],
    });
  });

  it('does nothing without a key or without URLs on our host', async () => {
    const fetchImpl = okFetch();
    expect(await submitToIndexNow([`${HOST}/ru`], { key: null, fetchImpl })).toMatchObject({ ok: false, skipped: 'no-key' });
    expect(await submitToIndexNow(['https://evil.example/x'], { key: KEY, fetchImpl })).toMatchObject({ ok: true, skipped: 'no-urls' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('counts 202 as accepted and anything else as a failure', async () => {
    expect(await submitToIndexNow([`${HOST}/ru`], { key: KEY, fetchImpl: okFetch(202) })).toMatchObject({ ok: true, submitted: 1 });
    expect(await submitToIndexNow([`${HOST}/ru`], { key: KEY, fetchImpl: okFetch(403) })).toEqual({ ok: false, submitted: 0, statuses: [403] });
    expect(await submitToIndexNow([`${HOST}/ru`], { key: KEY, fetchImpl: okFetch(429) })).toMatchObject({ ok: false });
  });

  it('never throws when the network fails', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('boom');
    });
    expect(await submitToIndexNow([`${HOST}/ru`], { key: KEY, fetchImpl })).toEqual({ ok: false, submitted: 0, statuses: [0] });
  });

  it('sends more than 10 000 URLs in several requests', async () => {
    const fetchImpl = okFetch();
    const urls = Array.from({ length: 10_001 }, (_, i) => `${HOST}/ru/blog/a-${i}`);
    const res = await submitToIndexNow(urls, { key: KEY, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(res).toMatchObject({ ok: true, submitted: 10_001, statuses: [200, 200] });
  });
});
