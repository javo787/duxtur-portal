import { createHash } from 'crypto';
import { COMMON_SPECIALTIES } from '../../clinic-constants';
import { cleanText, nameKey, normalizePhones } from '../normalize';
import type { ClinicType, RawClinic } from '../types';
import { robotsAllows } from './website';

/**
 * ScrapeGraphAI adapter for directory sites (ydoc.tj, samt.tj).
 *
 * Data principles (PARSING_ROADMAP.md):
 *  - facts only: name, address, phones, links, logo/photo URLs, specialty labels;
 *  - NO ratings, review counts, doctor counts or descriptive prose: they are not in the
 *    extraction schema and `parseClinicItems` whitelists fields, so even a chatty model
 *    reply cannot smuggle them into the database;
 *  - robots.txt is checked before every page is sent to ScrapeGraphAI;
 *  - the API is metered: bounded retries, no retry on auth/validation errors, page cap,
 *    stop on repeated pages, optional response cache.
 */

export const SGAI_EXTRACT_URL = 'https://v2-api.scrapegraphai.com/api/extract';

// ---------------------------------------------------------------------------
// Extraction prompts and JSON schemas
// ---------------------------------------------------------------------------

const CLINIC_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Clinic name exactly as written on the page' },
    address: { type: 'string', description: 'Street address only' },
    phones: { type: 'array', items: { type: 'string' } },
    profileUrl: { type: 'string', description: "Absolute URL of this clinic's page on the same site" },
    website: { type: 'string', description: "The clinic's own website, if shown" },
    email: { type: 'string' },
    logoUrl: { type: 'string', description: 'Absolute URL of the clinic logo image' },
    photoUrls: { type: 'array', items: { type: 'string' }, description: 'Absolute URLs of up to 3 photos of the clinic building or interior' },
    specialties: { type: 'array', items: { type: 'string' }, description: 'Medical specialty or service labels as written on the page' },
  },
  required: ['name'],
} as const;

export const LISTING_SCHEMA = {
  type: 'object',
  properties: { clinics: { type: 'array', items: CLINIC_ITEM_SCHEMA } },
  required: ['clinics'],
} as const;

export const PROFILE_SCHEMA = {
  type: 'object',
  properties: { clinic: CLINIC_ITEM_SCHEMA },
  required: ['clinic'],
} as const;

const FACTS_ONLY =
  'Return facts that are literally visible on the page. If a field is not shown, omit it; never guess or infer. ' +
  'Do NOT return ratings, review counts, reviews, doctor counts, prices, promotional text or descriptions.';

export const LISTING_PROMPT =
  'This is a directory listing of medical clinics. Extract EVERY clinic card on the page (do not skip any, do not invent any). ' +
  'For each: name, address, phone numbers, the absolute URL of its page on this site, its logo image URL and its specialty labels. ' +
  FACTS_ONLY;

export const PROFILE_PROMPT =
  'This is the page of ONE medical clinic. Extract: name, address, all phone numbers, the clinic\'s own website and e-mail, ' +
  'the logo image URL, up to 3 photo URLs of the building or interior (not doctors, not ads), and the specialty labels. ' +
  FACTS_ONLY;

// ---------------------------------------------------------------------------
// Parsing and mapping
// ---------------------------------------------------------------------------

export interface ClinicItem {
  name: string;
  address?: string;
  phones: string[];
  profileUrl?: string;
  website?: string;
  email?: string;
  logoUrl?: string;
  photoUrls: string[];
  /** Raw labels as written on the source; mapped to canonical ids in toRawClinic. */
  specialties: string[];
}

function toHttpsUrl(value: unknown, base: string): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const u = new URL(value.trim(), base);
    return u.protocol === 'https:' ? u.href : undefined;
  } catch {
    return undefined;
  }
}

function strings(value: unknown): string[] {
  const list = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  return list.map(v => cleanText(v)).filter(Boolean);
}

function rowsOf(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;
  if (json && typeof json === 'object') {
    const o = json as Record<string, unknown>;
    if (Array.isArray(o.clinics)) return o.clinics;
    if (Array.isArray(o.items)) return o.items;
    if (o.clinic && typeof o.clinic === 'object' && !Array.isArray(o.clinic)) return [o.clinic];
  }
  return [];
}

/**
 * Turns whatever the extraction returned into clean items. Whitelists fields on purpose:
 * anything not listed here (ratings, reviews, prose, ...) is dropped.
 */
export function parseClinicItems(json: unknown, pageUrl: string): ClinicItem[] {
  const out: ClinicItem[] = [];
  for (const row of rowsOf(json)) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const name = cleanText(r.name);
    if (name.length < 2) continue;

    const photoUrls = [
      ...new Set(
        strings(r.photoUrls ?? r.photos)
          .map(u => toHttpsUrl(u, pageUrl))
          .filter((u): u is string => !!u)
      ),
    ];
    const email = cleanText(r.email).toLowerCase();

    out.push({
      name,
      address: cleanText(r.address) || undefined,
      phones: strings(r.phones ?? r.phone),
      profileUrl: toHttpsUrl(r.profileUrl, pageUrl),
      website: cleanText(r.website) || undefined,
      email: email.includes('@') ? email : undefined,
      logoUrl: toHttpsUrl(r.logoUrl, pageUrl),
      photoUrls,
      specialties: strings(r.specialties),
    });
  }
  return out;
}

const KNOWN_SPECIALTY_IDS = new Set(COMMON_SPECIALTIES.map(s => s.id));
const L = '(?<![\\p{L}\\p{N}])'; // start of word, Unicode-aware (JS \b only knows ASCII)
const END = '(?![\\p{L}\\p{N}])';
const rule = (id: string, pattern: string): [string, RegExp] => [id, new RegExp(pattern, 'iu')];

const SPECIALTY_RULES: [string, RegExp][] = [
  rule('cardiology', `${L}кардиолог`),
  rule('neurology', `${L}(?:невролог|невропатолог)`),
  rule('dentistry', `${L}(?:стоматолог|зубн|ортодонт)`),
  rule('pediatrics', `${L}(?:педиатр|детск)`),
  rule('dermatology', `${L}(?:дерматолог|дерматовенеролог)`),
  rule('ophthalmology', `${L}(?:офтальмолог|окулист|глазн)`),
  rule('surgery', `${L}хирург`),
  rule('gynecology', `${L}(?:гинеколог|акушер)`),
  rule('ultrasound', `${L}(?:узи${END}|ультразвук)`),
  rule('mri', `${L}(?:мрт${END}|магнитно[\\s-]резонанс)`),
  rule('tests', `${L}(?:анализ|лаборатор)`),
  rule('general', `${L}(?:терапевт|общая медицина|врач общей практики)`),
  rule('endocrinology', `${L}эндокринолог`),
  rule('urology', `${L}уролог`),
  rule('orthopedics', `${L}(?:травматолог|ортопед)`),
  rule('gastroenterology', `${L}гастроэнтеролог`),
  rule('ent', `${L}(?:лор${END}|отоларинголог|оториноларинголог)`),
  rule('oncology', `${L}онколог`),
  rule('genetics', `${L}(?:генетик|генетическ)`),
  rule('physiotherapy', `${L}физиотерап`),
];

/** Source labels -> canonical ids. Unknown labels are dropped, never invented. */
export function mapSpecialties(labels: string[]): string[] {
  const out: string[] = [];
  for (const label of labels) {
    for (const [id, re] of SPECIALTY_RULES) {
      if (KNOWN_SPECIALTY_IDS.has(id) && re.test(label) && !out.includes(id)) out.push(id);
    }
  }
  return out;
}

export function inferType(name: string): ClinicType {
  if (/стоматолог|dental/i.test(name)) return 'dental_clinic';
  if (/роддом|родильн|перинатал|maternity/i.test(name)) return 'maternity';
  if (/больниц|госпитал|hospital/i.test(name)) return 'hospital';
  if (/поликлиник/i.test(name)) return 'polyclinic';
  if (/диагностическ/i.test(name)) return 'diagnostic_center';
  if (/глазн|офтальмолог|окулист/i.test(name)) return 'eye_clinic';
  if (/реабилитац/i.test(name)) return 'rehabilitation';
  return 'clinic';
}

function sourceIdFromUrl(url: string): string | undefined {
  try {
    const path = new URL(url).pathname.toLowerCase().replace(/\/+$/, '');
    return path || undefined;
  } catch {
    return undefined;
  }
}

export interface RawContext {
  source: 'ydoc' | 'samt';
  city?: string;
  pageUrl: string;
}

export function toRawClinic(item: ClinicItem, ctx: RawContext): RawClinic | null {
  const name = cleanText(item.name);
  if (!name) return null;

  const sourceId =
    (item.profileUrl && sourceIdFromUrl(item.profileUrl)) ||
    `name:${createHash('sha1')
      .update(`${nameKey(name)}|${cleanText(item.address).toLowerCase()}`)
      .digest('hex')
      .slice(0, 12)}`;

  const specialties = mapSpecialties(item.specialties);
  return {
    source: ctx.source,
    sourceId,
    sourceUrl: item.profileUrl ?? ctx.pageUrl,
    name,
    type: inferType(name),
    address: cleanText(item.address) || undefined,
    city: ctx.city,
    phones: [...new Set(item.phones.flatMap(p => normalizePhones(p)))],
    website: cleanText(item.website) || undefined,
    email: item.email,
    logoUrl: item.logoUrl,
    photoUrls: item.photoUrls,
    ...(specialties.length ? { specialties } : {}),
  };
}

// ---------------------------------------------------------------------------
// Per-source settings and short-lived signed URLs
// ---------------------------------------------------------------------------

export const SOURCE_CONFIG = {
  ydoc: {
    label: 'ydoc.tj',
    defaultListingUrl: 'https://ydoc.tj/dushanbe/top/medcentr/',
    city: 'Душанбе',
    /** Hosts logos/photos may be downloaded from (besides the clinic's own site). */
    imageHosts: ['ydoc.tj'],
  },
  samt: {
    label: 'samt.tj',
    defaultListingUrl: 'https://samt.tj/clinics?city=1&hf_type=4',
    city: 'Душанбе',
    // samt.tj serves logos from presigned S3 links on this host (valid for ~5 minutes).
    imageHosts: ['samt.tj', 's3.regru.cloud'],
  },
} as const;

/** Presigned storage links (AWS-style) carry a credential and expire within minutes. */
export function isSignedUrl(url: string): boolean {
  return /[?&]X-Amz-Signature=/i.test(url);
}

/** For reports and logs: a presigned URL is reduced to its path, a plain URL is untouched. */
export function redactSignedUrl(url: string | undefined): string | undefined {
  if (!url || !isSignedUrl(url)) return url;
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return undefined;
  }
}

/** Deep copy without presigned URLs: they must not be cached, they are dead by the next run. */
function stripSignedUrls(value: unknown): unknown {
  if (typeof value === 'string') return isSignedUrl(value) ? undefined : value;
  if (Array.isArray(value)) return value.map(stripSignedUrls).filter(v => v !== undefined);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const clean = stripSignedUrls(v);
      if (clean !== undefined) out[k] = clean;
    }
    return out;
  }
  return value;
}

// ---------------------------------------------------------------------------
// ScrapeGraphAI client
// ---------------------------------------------------------------------------

const defaultSleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export interface ExtractOptions {
  apiKey: string;
  url: string;
  prompt: string;
  schema: object;
  fetchImpl?: typeof fetch;
  sleepImpl?: (ms: number) => Promise<void>;
  /** Retries AFTER the first attempt, for 408/429/5xx and network errors only. */
  maxRetries?: number;
  baseDelayMs?: number;
  timeoutMs?: number;
}

/** One metered extraction call. Returns the structured payload (`json`, or legacy `result`). */
export async function extractWithScrapeGraph(opts: ExtractOptions): Promise<unknown> {
  const f = opts.fetchImpl ?? fetch;
  const sleep = opts.sleepImpl ?? defaultSleep;
  const maxRetries = opts.maxRetries ?? 3;
  const base = opts.baseDelayMs ?? 1000;
  const body = JSON.stringify({ url: opts.url, prompt: opts.prompt, schema: opts.schema });

  for (let attempt = 0; ; attempt++) {
    let status = 0;
    let detail = '';
    let retryAfterMs = 0;
    try {
      const res = await f(SGAI_EXTRACT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'SGAI-APIKEY': opts.apiKey },
        body,
        signal: AbortSignal.timeout(opts.timeoutMs ?? 120_000),
      });
      status = res.status;
      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>;
        const payload = data?.json ?? data?.result;
        if (payload === undefined || payload === null) throw new NoRetryError('ScrapeGraphAI returned no data for this page');
        return payload;
      }
      detail = (await res.text()).slice(0, 200);
      retryAfterMs = Number(res.headers.get('retry-after')) * 1000 || 0;
    } catch (e) {
      if (e instanceof NoRetryError) throw e;
      detail = errMsg(e); // network error or timeout: retryable, status stays 0
    }

    if (status === 401 || status === 403) {
      throw new Error(`ScrapeGraphAI rejected the API key (${status}). Check SGAI_API_KEY. ${detail}`.trim());
    }
    const retryable = status === 0 || status === 408 || status === 429 || status >= 500;
    if (!retryable) throw new Error(`ScrapeGraphAI request failed (${status}): ${detail}`);
    if (attempt >= maxRetries) {
      throw new Error(`ScrapeGraphAI failed after ${attempt + 1} attempts (last status ${status || 'network error'}): ${detail}`);
    }
    await sleep(Math.max(base * 2 ** attempt + Math.floor(Math.random() * 250), retryAfterMs));
  }
}

class NoRetryError extends Error {}

// ---------------------------------------------------------------------------
// Listing pagination
// ---------------------------------------------------------------------------

export interface ResponseCache {
  get(key: string): unknown | undefined;
  set(key: string, value: unknown): void;
}

export type StopReason = 'max_pages' | 'empty_page' | 'no_new_items' | 'robots' | 'error';

export interface CollectOptions {
  listingUrl: string;
  apiKey: string;
  maxPages: number;
  delayMs?: number;
  cache?: ResponseCache;
  fetchImpl?: typeof fetch;
  sleepImpl?: (ms: number) => Promise<void>;
  maxRetries?: number;
}

export function pageUrl(listingUrl: string, page: number): string {
  if (page <= 1) return listingUrl;
  const u = new URL(listingUrl);
  u.searchParams.set('page', String(page));
  return u.href;
}

const itemKey = (i: ClinicItem) => i.profileUrl ?? `${nameKey(i.name)}|${cleanText(i.address).toLowerCase()}`;

/** Cached, robots-aware single extraction. Throws on API errors. */
async function cachedExtract(
  url: string,
  prompt: string,
  schema: object,
  o: Pick<CollectOptions, 'apiKey' | 'delayMs' | 'cache' | 'fetchImpl' | 'sleepImpl' | 'maxRetries'>
): Promise<unknown> {
  const cached = o.cache?.get(url);
  if (cached !== undefined) return cached;
  const json = await extractWithScrapeGraph({
    apiKey: o.apiKey, url, prompt, schema,
    fetchImpl: o.fetchImpl, sleepImpl: o.sleepImpl, maxRetries: o.maxRetries,
  });
  o.cache?.set(url, stripSignedUrls(json));
  const delay = o.delayMs ?? 1500;
  if (delay > 0) await (o.sleepImpl ?? defaultSleep)(delay);
  return json;
}

/** Walks `?page=N` until an empty page, a page with nothing new, an error or `maxPages`. */
export async function collectListing(opts: CollectOptions): Promise<{
  items: ClinicItem[];
  pages: number;
  stoppedBecause: StopReason;
  errors: string[];
}> {
  const robotsCache = new Map();
  const seen = new Set<string>();
  const items: ClinicItem[] = [];
  const errors: string[] = [];
  let stoppedBecause: StopReason = 'max_pages';
  let pages = 0;

  for (let page = 1; page <= opts.maxPages; page++) {
    const url = pageUrl(opts.listingUrl, page);
    if (!(await robotsAllows(url, opts.fetchImpl ?? fetch, robotsCache))) {
      errors.push(`page ${page}: blocked by robots.txt (${url})`);
      stoppedBecause = 'robots';
      break;
    }

    let json: unknown;
    try {
      json = await cachedExtract(url, LISTING_PROMPT, LISTING_SCHEMA, opts);
    } catch (e) {
      errors.push(`page ${page}: ${errMsg(e)}`);
      stoppedBecause = 'error';
      break;
    }
    pages++;

    const rows = parseClinicItems(json, url);
    if (rows.length === 0) { stoppedBecause = 'empty_page'; break; }

    let added = 0;
    for (const row of rows) {
      const key = itemKey(row);
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(row);
      added++;
    }
    if (added === 0) { stoppedBecause = 'no_new_items'; break; }
  }
  return { items, pages, stoppedBecause, errors };
}

// ---------------------------------------------------------------------------
// Image URL safety
// ---------------------------------------------------------------------------

/**
 * Images are downloaded server-side, so only https URLs on hosts we expect (the directory itself
 * and the clinic's own site) are accepted. IP literals and local names are always refused.
 */
export function isAllowedImageUrl(url: string, allowedHosts: readonly string[]): boolean {
  let u: URL;
  try { u = new URL(url); } catch { return false; }
  if (u.protocol !== 'https:') return false;
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return false;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.startsWith('[') || host.includes(':')) return false;
  return allowedHosts.some(h => {
    const a = h.toLowerCase();
    return host === a || host.endsWith(`.${a}`);
  });
}
