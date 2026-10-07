// Relative on purpose: next.config.ts imports this file and is loaded without the "@/" alias.
import { BASE_URL } from './seo';

/**
 * IndexNow (https://www.indexnow.org): tells Bing and the other participating engines which URLs changed,
 * so they re-crawl within hours instead of weeks. ChatGPT search leans on Bing's index, so a page Bing
 * has not seen cannot be retrieved there. Google does not take part in IndexNow.
 *
 * The key is public by design (it is served as /<key>.txt); it only proves that the host is ours.
 */

export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
/** The protocol's limit for one request. */
export const INDEXNOW_MAX_URLS = 10_000;
/** Allowed key shape per the protocol: 8-128 chars, letters, digits and dashes. */
export const INDEXNOW_KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;
/** Same shape for next.config.ts rewrites (path-to-regexp syntax). */
export const INDEXNOW_KEY_FILE_SOURCE = '/:key([A-Za-z0-9-]{8,128}).txt';

export function getIndexNowKey(env: Record<string, string | undefined> = process.env): string | null {
  const key = env.INDEXNOW_KEY?.trim();
  return key && INDEXNOW_KEY_PATTERN.test(key) ? key : null;
}

export function indexNowKeyLocation(key: string): string {
  return `${BASE_URL}/${key}.txt`;
}

/**
 * Keeps only absolute https URLs on our own host, without fragments, once each.
 * Sitemap entries are XML-escaped (&amp;), the API wants the plain URL.
 */
export function normalizeIndexNowUrls(urls: readonly string[], baseUrl: string = BASE_URL): string[] {
  const host = new URL(baseUrl).host;
  const seen = new Set<string>();
  for (const raw of urls) {
    let url: URL;
    try {
      url = new URL(raw.replace(/&amp;/g, '&'));
    } catch {
      continue;
    }
    if (url.protocol !== 'https:' || url.host !== host) continue;
    url.hash = '';
    seen.add(url.toString());
  }
  return [...seen];
}

export function chunkUrls<T>(items: readonly T[], size: number = INDEXNOW_MAX_URLS): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

export interface IndexNowResult {
  ok: boolean;
  /** Why nothing was sent. */
  skipped?: 'no-key' | 'no-urls';
  /** URLs accepted by the API (200 or 202). */
  submitted: number;
  /** HTTP status per request; 0 means the request itself failed (network, timeout). */
  statuses: number[];
}

/**
 * 200 = accepted, 202 = accepted but key validation still pending. Anything else (400 bad request,
 * 403 key not found at keyLocation, 422 URLs not on the host, 429 too many requests) is a failure.
 * Never throws: a failed ping must not break the caller.
 */
export async function submitToIndexNow(
  urls: readonly string[],
  opts: { key?: string | null; fetchImpl?: typeof fetch; baseUrl?: string } = {},
): Promise<IndexNowResult> {
  const key = opts.key === undefined ? getIndexNowKey() : opts.key;
  if (!key) return { ok: false, skipped: 'no-key', submitted: 0, statuses: [] };

  const baseUrl = opts.baseUrl ?? BASE_URL;
  const list = normalizeIndexNowUrls(urls, baseUrl);
  if (list.length === 0) return { ok: true, skipped: 'no-urls', submitted: 0, statuses: [] };

  const doFetch = opts.fetchImpl ?? fetch;
  const host = new URL(baseUrl).host;
  const keyLocation = `${baseUrl}/${key}.txt`;

  const statuses: number[] = [];
  let submitted = 0;
  for (const batch of chunkUrls(list)) {
    try {
      const res = await doFetch(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ host, key, keyLocation, urlList: batch }),
        signal: AbortSignal.timeout(10_000),
      });
      statuses.push(res.status);
      if (res.status === 200 || res.status === 202) submitted += batch.length;
    } catch {
      statuses.push(0);
    }
  }
  return { ok: statuses.every((s) => s === 200 || s === 202), submitted, statuses };
}
