import * as cheerio from 'cheerio';
import robotsParser from 'robots-parser';
import { cleanText, normalizePhones } from '../normalize';
import type { ClinicType, RawClinic } from '../types';

/**
 * Clinic-website adapter: reads a clinic's OWN public page for facts only
 * (name, phone, address, coordinates). Descriptions / bios are never copied.
 * Respects robots.txt and identifies itself.
 */

export const USER_AGENT = 'duxtur.org-ingest/1.0 (+https://duxtur.org; contact: admin@duxtur.org)';

const CLINIC_TYPES = new Set([
  'MedicalClinic', 'Hospital', 'MedicalOrganization', 'MedicalBusiness',
  'Dentist', 'Physician', 'DiagnosticLab', 'LocalBusiness', 'Organization',
]);

function asArray<T>(v: T | T[] | undefined): T[] {
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
}

type LdNode = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const obj = (v: unknown): LdNode => (v && typeof v === 'object' && !Array.isArray(v) ? (v as LdNode) : {});

function flattenLd(node: unknown, acc: LdNode[] = []): LdNode[] {
  if (!node || typeof node !== 'object') return acc;
  if (Array.isArray(node)) { node.forEach(n => flattenLd(n, acc)); return acc; }
  const n = node as LdNode;
  acc.push(n);
  if (n['@graph']) flattenLd(n['@graph'], acc);
  return acc;
}

function ldType(node: LdNode): ClinicType | null {
  const types = asArray(node['@type'] as string | string[] | undefined);
  if (!types.some(t => CLINIC_TYPES.has(t))) return null;
  if (types.includes('Hospital')) return 'hospital';
  if (types.includes('Dentist')) return 'dental_clinic';
  return 'clinic';
}

export function extractFromHtml(html: string, pageUrl: string): RawClinic | null {
  const $ = cheerio.load(html);
  const url = new URL(pageUrl);
  const host = url.hostname.replace(/^www\./, '');

  let ld: LdNode | null = null;
  let type: ClinicType = 'clinic';
  $('script[type="application/ld+json"]').each((_, el) => {
    if (ld) return;
    try {
      for (const node of flattenLd(JSON.parse($(el).text()))) {
        const t = ldType(node);
        if (t && str(node.name)) { ld = node; type = t; break; }
      }
    } catch { /* malformed JSON-LD is common; ignore */ }
  });
  const data: LdNode = ld ?? {};

  const name = cleanText(str(data.name) || $('meta[property="og:site_name"]').attr('content') || '');
  if (!name) return null;

  const phoneText = [
    ...asArray(data.telephone as string | string[] | undefined),
    ...$('a[href^="tel:"]').map((_, a) => ($(a).attr('href') || '').slice(4)).get(),
  ].join(';');

  const addr = data.address;
  const addrObj = obj(addr);
  const address = typeof addr === 'string' ? addr : str(addrObj.streetAddress);
  const city = str(addrObj.addressLocality);

  const geo = obj(data.geo);
  const lat = Number(geo.latitude);
  const lng = Number(geo.longitude);
  const mail = ($('a[href^="mailto:"]').first().attr('href') || '').slice(7).split('?')[0];

  return {
    source: 'website',
    sourceId: host,
    sourceUrl: pageUrl,
    name,
    type,
    address: cleanText(address) || undefined,
    city: cleanText(city) || undefined,
    lat: Number.isFinite(lat) && lat !== 0 ? lat : undefined,
    lng: Number.isFinite(lng) && lng !== 0 ? lng : undefined,
    phones: normalizePhones(phoneText),
    website: `${url.origin}/`,
    email: cleanText(str(data.email) || mail) || undefined,
  };
}

export async function robotsAllows(
  url: string,
  fetchImpl: typeof fetch = fetch,
  cache = new Map<string, ReturnType<typeof robotsParser> | null>()
): Promise<boolean> {
  const origin = new URL(url).origin;
  if (!cache.has(origin)) {
    try {
      const res = await fetchImpl(`${origin}/robots.txt`, { headers: { 'User-Agent': USER_AGENT } });
      cache.set(origin, res.ok ? robotsParser(`${origin}/robots.txt`, await res.text()) : null);
    } catch {
      cache.set(origin, null); // no robots.txt reachable -> nothing forbids us
    }
  }
  const robots = cache.get(origin);
  return robots ? robots.isAllowed(url, USER_AGENT) !== false : true;
}

export interface WebsiteResult {
  url: string;
  record?: RawClinic;
  skipped?: string;
}

export async function fetchWebsiteClinics(
  urls: string[],
  opts: { fetchImpl?: typeof fetch; delayMs?: number } = {}
): Promise<WebsiteResult[]> {
  const f = opts.fetchImpl ?? fetch;
  const delay = opts.delayMs ?? 2000;
  const robotsCache = new Map<string, ReturnType<typeof robotsParser> | null>();
  const results: WebsiteResult[] = [];

  for (const url of urls) {
    try {
      if (!(await robotsAllows(url, f, robotsCache))) {
        results.push({ url, skipped: 'blocked by robots.txt' });
        continue;
      }
      const res = await f(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' } });
      if (!res.ok) { results.push({ url, skipped: `HTTP ${res.status}` }); continue; }
      const record = extractFromHtml(await res.text(), url);
      results.push(record ? { url, record } : { url, skipped: 'no clinic data found on page' });
    } catch (e) {
      results.push({ url, skipped: `fetch failed: ${e instanceof Error ? e.message : String(e)}` });
    }
    if (delay > 0) await new Promise(r => setTimeout(r, delay));
  }
  return results;
}
