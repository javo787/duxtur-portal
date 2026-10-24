import * as cheerio from 'cheerio';
import type { SourceMaterial, SourceRef, Topic } from './types';

/**
 * Source material for an article. Only sources that may be reused freely:
 *
 *  - MedlinePlus health topics (U.S. National Library of Medicine). Public domain, free API without a key.
 *  - Europe PMC: abstracts of recent open-access reviews. Free API without a key. They are used as facts for
 *    the model to rewrite from, never copied, and always credited in the article's source list.
 *
 * Healthline, Mayo Clinic and similar sites are NOT used: translating their articles is still copying
 * them, and a link back does not give the right to republish.
 */

const USER_AGENT = 'duxtur-auto-blog/1.0 (+https://www.duxtur.org)';
const MEDLINEPLUS_ENDPOINT = 'https://wsearch.nlm.nih.gov/ws/query';
const EUROPE_PMC_ENDPOINT = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search';

/** Hosts a source URL may point to. The publishing endpoint rejects anything else. */
export const ALLOWED_SOURCE_HOSTS = ['medlineplus.gov', 'nlm.nih.gov', 'europepmc.org', 'ebi.ac.uk', 'doi.org', 'ncbi.nlm.nih.gov'];

export const isAllowedSourceUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    return ALLOWED_SOURCE_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
};

type FetchLike = typeof fetch;

async function fetchText(url: string, fetchImpl: FetchLike, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { headers: { 'User-Agent': USER_AGENT, Accept: '*/*' }, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${new URL(url).hostname}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/** HTML fragment to readable plain text, keeping paragraph and list breaks. */
export function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<\/(p|div|h[1-6]|ul|ol|li)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ');
  const text = cheerio.load(`<div>${withBreaks}</div>`).text();
  return text
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── MedlinePlus ─────────────────────────────────────────────────────────────

export function parseMedlinePlus(xml: string, maxDocs = 2): { ref: SourceRef; text: string }[] {
  const $ = cheerio.load(xml, { xmlMode: true });
  const out: { ref: SourceRef; text: string }[] = [];
  $('document').each((_, el) => {
    if (out.length >= maxDocs) return;
    const node = $(el);
    const url = (node.attr('url') ?? '').trim();
    // The docs spell the field both "FullSummary" and "fullSummary": match without regard to case.
    const field = (name: string) =>
      node
        .find('content')
        .filter((_, c) => ($(c).attr('name') ?? '').toLowerCase() === name.toLowerCase())
        .first()
        .text();
    const title = htmlToText(field('title'));
    const text = htmlToText(field('FullSummary') || field('snippet'));
    if (!title || text.length < 200 || !isAllowedSourceUrl(url)) return;
    out.push({
      ref: { name: 'MedlinePlus (NLM)', title, url, license: 'MedlinePlus.gov, U.S. National Library of Medicine (public domain unless otherwise noted)' },
      text: text.slice(0, 6000),
    });
  });
  return out;
}

// ─── Europe PMC ──────────────────────────────────────────────────────────────

interface EuropePmcRecord {
  id?: string;
  source?: string;
  doi?: string;
  title?: string;
  abstractText?: string;
  journalTitle?: string;
  journalInfo?: { journal?: { title?: string } };
  pubYear?: string;
  license?: string;
}

export function parseEuropePmc(json: unknown, maxDocs = 4): { ref: SourceRef; text: string }[] {
  const results = (json as { resultList?: { result?: EuropePmcRecord[] } } | null)?.resultList?.result;
  if (!Array.isArray(results)) return [];
  const out: { ref: SourceRef; text: string }[] = [];
  for (const r of results) {
    if (out.length >= maxDocs) break;
    const title = htmlToText(r.title ?? '').replace(/\.$/, '');
    const abstract = htmlToText(r.abstractText ?? '');
    if (!title || abstract.length < 400) continue;
    const url = r.doi ? `https://doi.org/${r.doi}` : r.id && r.source ? `https://europepmc.org/article/${r.source}/${r.id}` : '';
    if (!isAllowedSourceUrl(url)) continue;
    const journal = [r.journalTitle ?? r.journalInfo?.journal?.title, r.pubYear].filter(Boolean).join(', ');
    out.push({
      ref: {
        name: journal ? `Europe PMC: ${journal}` : 'Europe PMC',
        title,
        url,
        license: r.license ? `Open access (${r.license})` : 'Open access (Europe PMC)',
      },
      text: abstract.slice(0, 4000),
    });
  }
  return out;
}

const escapeQuery = (q: string) => q.replace(/["\\]/g, ' ').trim();

// ─── Gathering ───────────────────────────────────────────────────────────────

export interface GatherOptions {
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  now?: Date;
  log?: (message: string) => void;
}

export async function gatherMaterial(topic: Topic, opts: GatherOptions = {}): Promise<SourceMaterial> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 20_000;
  const log = opts.log ?? (() => undefined);
  const year = (opts.now ?? new Date()).getUTCFullYear();
  const q = escapeQuery(topic.query);

  const medline = async () => {
    // NLM asks for a constant `tool` value, allows 85 requests/min per IP (we send 1) and wants the data credited to MedlinePlus.gov.
    const url = `${MEDLINEPLUS_ENDPOINT}?db=healthTopics&term=${encodeURIComponent(q)}&retmax=3&tool=duxtur-auto-blog`;
    return parseMedlinePlus(await fetchText(url, fetchImpl, timeoutMs));
  };

  const europePmc = async () => {
    const search = async (extra: string) => {
      // `sort_cited:y` is Europe PMC's own in-query syntax for "most cited first".
      const query = `("${q}") AND OPEN_ACCESS:y AND HAS_ABSTRACT:y AND PUB_YEAR:[${year - 5} TO ${year}]${extra} sort_cited:y`;
      const url = `${EUROPE_PMC_ENDPOINT}?query=${encodeURIComponent(query)}&format=json&resultType=core&pageSize=8`;
      return parseEuropePmc(JSON.parse(await fetchText(url, fetchImpl, timeoutMs)));
    };
    const reviews = await search(' AND (PUB_TYPE:"Review" OR PUB_TYPE:"review-article")');
    return reviews.length >= 2 ? reviews : await search('');
  };

  const [m, e] = await Promise.allSettled([medline(), europePmc()]);
  if (m.status === 'rejected') log(`MedlinePlus failed for "${topic.query}": ${String(m.reason)}`);
  if (e.status === 'rejected') log(`Europe PMC failed for "${topic.query}": ${String(e.reason)}`);

  return {
    topic,
    passages: [...(m.status === 'fulfilled' ? m.value : []), ...(e.status === 'fulfilled' ? e.value : [])],
  };
}

/** Enough to write a solid article from: some substance and at least two distinct sources. */
export function isSufficient(material: SourceMaterial): boolean {
  const chars = material.passages.reduce((n, p) => n + p.text.length, 0);
  const distinct = new Set(material.passages.map((p) => p.ref.url)).size;
  return chars >= 1800 && distinct >= 2;
}

/** Unique sources in order of appearance. */
export const sourceRefs = (material: SourceMaterial): SourceRef[] => {
  const seen = new Set<string>();
  return material.passages.map((p) => p.ref).filter((r) => (seen.has(r.url) ? false : (seen.add(r.url), true)));
};
