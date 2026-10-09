/**
 * GEO audit: asks AI assistants the questions a patient in Tajikistan would ask and records
 * whether duxtur.org is cited, and which sites are cited instead.
 *
 * Pure logic lives here so it can be unit-tested; the CLI is scripts/geo-audit.ts.
 * Caveat: these are API calls with the web-search tool switched on, not the ChatGPT / Gemini apps.
 * The apps add their own personalisation and memory, so treat the numbers as a trend, not a ranking.
 */

export type Engine = 'openai' | 'gemini';
export const ENGINES: readonly Engine[] = ['openai', 'gemini'];

export const PROMPT_LANGS = ['ru', 'tg', 'en'] as const;
export const PROMPT_INTENTS = ['clinic', 'doctor', 'symptom', 'booking'] as const;
export type PromptLang = (typeof PROMPT_LANGS)[number];
export type PromptIntent = (typeof PROMPT_INTENTS)[number];

export interface AuditPrompt {
  id: string;
  lang: PromptLang;
  intent: PromptIntent;
  text: string;
}

export interface Citation {
  url: string;
  title: string;
  /** Registrable-looking host without "www.", lower case. "unknown" when it cannot be told. */
  domain: string;
}

export interface Extraction {
  text: string;
  citations: Citation[];
  searchQueries: string[];
}

export interface AnswerResult extends Extraction {
  engine: Engine;
  promptId: string;
  lang: PromptLang;
  intent: PromptIntent;
  ok: boolean;
  error?: string;
  /** The assistant ran at least one web search for this prompt. */
  searched: boolean;
  /** The answer text names Duxtur. */
  mentioned: boolean;
  /** One of the cited sources is our site. */
  cited: boolean;
}

export const OUR_DOMAINS = ['duxtur.org'] as const;

// ---------------------------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------------------------

export function validatePrompts(raw: unknown): AuditPrompt[] {
  if (!Array.isArray(raw) || raw.length === 0) throw new Error('prompts must be a non-empty array');
  const seen = new Set<string>();
  return raw.map((item, i) => {
    const p = item as Partial<AuditPrompt>;
    const where = `prompt #${i + 1}`;
    if (!p || typeof p.id !== 'string' || !p.id.trim()) throw new Error(`${where}: missing id`);
    if (seen.has(p.id)) throw new Error(`${where}: duplicate id "${p.id}"`);
    seen.add(p.id);
    if (!PROMPT_LANGS.includes(p.lang as PromptLang)) throw new Error(`${where} (${p.id}): lang must be one of ${PROMPT_LANGS.join(', ')}`);
    if (!PROMPT_INTENTS.includes(p.intent as PromptIntent)) throw new Error(`${where} (${p.id}): intent must be one of ${PROMPT_INTENTS.join(', ')}`);
    if (typeof p.text !== 'string' || p.text.trim().length < 5) throw new Error(`${where} (${p.id}): text is too short`);
    return { id: p.id, lang: p.lang as PromptLang, intent: p.intent as PromptIntent, text: p.text.trim() };
  });
}

// ---------------------------------------------------------------------------------------------
// Domains
// ---------------------------------------------------------------------------------------------

const DOMAIN_LIKE = /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i;

function stripWww(host: string): string {
  return host.toLowerCase().replace(/^www\./, '');
}

export function domainOf(url: string): string {
  try {
    return stripWww(new URL(url).hostname);
  } catch {
    return 'unknown';
  }
}

export function isOurDomain(domain: string, ours: readonly string[] = OUR_DOMAINS): boolean {
  const d = domain.toLowerCase();
  return ours.some((o) => d === o || d.endsWith(`.${o}`));
}

/** Tracking parameters differ per answer and would make one page look like several. */
function cleanUrl(url: string): string {
  try {
    const u = new URL(url);
    for (const key of [...u.searchParams.keys()]) if (key.startsWith('utm_')) u.searchParams.delete(key);
    return u.toString();
  } catch {
    return url;
  }
}

function dedupe(citations: Citation[]): Citation[] {
  const seen = new Set<string>();
  return citations.filter((c) => (seen.has(c.url) ? false : (seen.add(c.url), true)));
}

// API payloads are untrusted JSON: read them through these instead of trusting their shape.
type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');

// ---------------------------------------------------------------------------------------------
// Response parsing
// ---------------------------------------------------------------------------------------------

/**
 * OpenAI Responses API: `output` holds `web_search_call` items and `message` items; the message's
 * `output_text` parts carry `url_citation` annotations (url/title directly on the annotation).
 */
export function extractOpenAI(response: unknown): Extraction {
  let text = '';
  const citations: Citation[] = [];
  const searchQueries: string[] = [];

  for (const raw of arr(obj(response).output)) {
    const item = obj(raw);
    if (item.type === 'web_search_call') {
      const action = obj(item.action);
      if (str(action.query)) searchQueries.push(str(action.query));
      searchQueries.push(...arr(action.queries).map(str).filter(Boolean));
      continue;
    }
    if (item.type !== 'message') continue;
    for (const rawPart of arr(item.content)) {
      const part = obj(rawPart);
      if (part.type !== 'output_text') continue;
      text += str(part.text);
      for (const rawAnnotation of arr(part.annotations)) {
        const a = obj(rawAnnotation);
        if (a.type !== 'url_citation') continue;
        const c = a.url_citation ? obj(a.url_citation) : a; // Chat Completions nests it, Responses does not
        if (!str(c.url)) continue;
        const url = cleanUrl(str(c.url));
        citations.push({ url, title: str(c.title), domain: domainOf(url) });
      }
    }
  }
  return { text, citations: dedupe(citations), searchQueries: [...new Set(searchQueries)] };
}

/**
 * Gemini generateContent with the google_search tool: sources are in
 * candidates[0].groundingMetadata.groundingChunks[].web. Their `uri` is a vertexaisearch redirect and
 * `title` is the site's domain, so the domain comes from the title.
 */
export function extractGemini(response: unknown): Extraction {
  const candidate = obj(arr(obj(response).candidates)[0]);
  const text = arr(obj(candidate.content).parts)
    .map((p) => str(obj(p).text))
    .join('');
  const meta = obj(candidate.groundingMetadata);

  const citations: Citation[] = [];
  for (const chunk of arr(meta.groundingChunks)) {
    const web = obj(obj(chunk).web);
    const uri = str(web.uri);
    if (!uri) continue;
    const title = str(web.title);
    let domain: string;
    if (DOMAIN_LIKE.test(title.trim())) domain = stripWww(title.trim());
    else {
      const host = domainOf(uri);
      domain = host.endsWith('vertexaisearch.cloud.google.com') ? 'unknown' : host;
    }
    citations.push({ url: uri, title, domain });
  }
  const searchQueries = arr(meta.webSearchQueries).map(str).filter(Boolean);
  return { text, citations: dedupe(citations), searchQueries: [...new Set(searchQueries)] };
}

export function buildResult(engine: Engine, prompt: AuditPrompt, extraction: Extraction): AnswerResult {
  return {
    ...extraction,
    engine,
    promptId: prompt.id,
    lang: prompt.lang,
    intent: prompt.intent,
    ok: true,
    searched: extraction.searchQueries.length > 0 || extraction.citations.length > 0,
    mentioned: /duxtur/i.test(extraction.text),
    cited: extraction.citations.some((c) => isOurDomain(c.domain)),
  };
}

export function failedResult(engine: Engine, prompt: AuditPrompt, error: string): AnswerResult {
  return {
    engine,
    promptId: prompt.id,
    lang: prompt.lang,
    intent: prompt.intent,
    ok: false,
    error,
    text: '',
    citations: [],
    searchQueries: [],
    searched: false,
    mentioned: false,
    cited: false,
  };
}

// ---------------------------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------------------------

export interface AskOptions {
  apiKey: string;
  model: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  retries?: number;
  /** Base delay for retry back-off; tests set it to 0. */
  retryDelayMs?: number;
}

export const OPENAI_URL = 'https://api.openai.com/v1/responses';
export const geminiUrl = (model: string) => `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

async function postJson(url: string, headers: Record<string, string>, body: unknown, opts: AskOptions): Promise<unknown> {
  const doFetch = opts.fetchImpl ?? fetch;
  const retries = opts.retries ?? 2;
  let lastError = 'unknown error';

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, (opts.retryDelayMs ?? 2000) * attempt));
    try {
      const res = await doFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(opts.timeoutMs ?? 120_000),
      });
      if (res.ok) return await res.json();
      const snippet = (await res.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 300);
      lastError = `HTTP ${res.status}${snippet ? `: ${snippet}` : ''}`;
      if (res.status !== 429 && res.status < 500) break; // 4xx other than 429 will not get better
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(lastError);
}

/** `web_search` with an approximate user location in Dushanbe, so results are localised the way a user there would see them. */
export async function askOpenAI(prompt: AuditPrompt, opts: AskOptions): Promise<AnswerResult> {
  try {
    const json = await postJson(
      OPENAI_URL,
      { Authorization: `Bearer ${opts.apiKey}` },
      {
        model: opts.model,
        input: prompt.text,
        tools: [{ type: 'web_search', user_location: { type: 'approximate', country: 'TJ', city: 'Dushanbe' } }],
      },
      opts,
    );
    return buildResult('openai', prompt, extractOpenAI(json));
  } catch (e) {
    return failedResult('openai', prompt, e instanceof Error ? e.message : String(e));
  }
}

/** Gemini has no user-location setting for Search grounding; the language of the question is the only locale signal. */
export async function askGemini(prompt: AuditPrompt, opts: AskOptions): Promise<AnswerResult> {
  try {
    const json = await postJson(
      geminiUrl(opts.model),
      { 'x-goog-api-key': opts.apiKey },
      { contents: [{ role: 'user', parts: [{ text: prompt.text }] }], tools: [{ google_search: {} }] },
      opts,
    );
    return buildResult('gemini', prompt, extractGemini(json));
  } catch (e) {
    return failedResult('gemini', prompt, e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------------------------

export interface Rate {
  total: number;
  cited: number;
  mentioned: number;
  searched: number;
}

export interface EngineSummary extends Rate {
  failed: number;
  byLang: Record<string, Rate>;
  byIntent: Record<string, Rate>;
  /** Domains cited most often (counted once per prompt), our own included. */
  topDomains: { domain: string; prompts: number }[];
}

export type Summary = Partial<Record<Engine, EngineSummary>>;

function emptyRate(): Rate {
  return { total: 0, cited: 0, mentioned: 0, searched: 0 };
}

function add(rate: Rate, r: AnswerResult) {
  rate.total++;
  if (r.cited) rate.cited++;
  if (r.mentioned) rate.mentioned++;
  if (r.searched) rate.searched++;
}

export function summarize(results: readonly AnswerResult[], topN = 15): Summary {
  const summary: Summary = {};
  for (const engine of ENGINES) {
    const mine = results.filter((r) => r.engine === engine);
    if (mine.length === 0) continue;

    const s: EngineSummary = { ...emptyRate(), failed: 0, byLang: {}, byIntent: {}, topDomains: [] };
    const domainPrompts = new Map<string, Set<string>>();

    for (const r of mine) {
      if (!r.ok) {
        s.failed++;
        continue;
      }
      add(s, r);
      add((s.byLang[r.lang] ??= emptyRate()), r);
      add((s.byIntent[r.intent] ??= emptyRate()), r);
      for (const c of r.citations) {
        if (c.domain === 'unknown') continue;
        if (!domainPrompts.has(c.domain)) domainPrompts.set(c.domain, new Set());
        domainPrompts.get(c.domain)!.add(r.promptId);
      }
    }
    s.topDomains = [...domainPrompts.entries()]
      .map(([domain, set]) => ({ domain, prompts: set.size }))
      .sort((a, b) => b.prompts - a.prompts || a.domain.localeCompare(b.domain))
      .slice(0, topN);
    summary[engine] = s;
  }
  return summary;
}

const pct = (n: number, total: number) => (total === 0 ? '—' : `${Math.round((n / total) * 100)}%`);

export function renderMarkdown(summary: Summary, meta: { date: string; models: Partial<Record<Engine, string>>; promptCount: number }): string {
  const lines: string[] = [
    `# GEO audit — ${meta.date}`,
    '',
    `${meta.promptCount} questions per engine. API calls with web search on, not the consumer apps: use the numbers as a trend.`,
    '',
  ];
  for (const engine of ENGINES) {
    const s = summary[engine];
    if (!s) continue;
    lines.push(`## ${engine === 'openai' ? 'ChatGPT (OpenAI API)' : 'Gemini (Google Search grounding)'} — \`${meta.models[engine] ?? '?'}\``, '');
    lines.push(`- Answered: ${s.total}${s.failed ? `, failed: ${s.failed}` : ''}`);
    lines.push(`- Ran a web search: ${s.searched}/${s.total} (${pct(s.searched, s.total)})`);
    lines.push(`- **duxtur.org cited: ${s.cited}/${s.total} (${pct(s.cited, s.total)})**`);
    lines.push(`- Duxtur named in the text: ${s.mentioned}/${s.total} (${pct(s.mentioned, s.total)})`, '');

    const table = (title: string, rows: Record<string, Rate>) => {
      lines.push(`| ${title} | questions | cited | named |`, '|---|---|---|---|');
      for (const [key, r] of Object.entries(rows)) lines.push(`| ${key} | ${r.total} | ${r.cited} | ${r.mentioned} |`);
      lines.push('');
    };
    table('language', s.byLang);
    table('intent', s.byIntent);

    lines.push('Most cited sites (number of questions):', '');
    for (const d of s.topDomains) lines.push(`- ${d.domain}: ${d.prompts}${isOurDomain(d.domain) ? ' ← us' : ''}`);
    lines.push('');
  }
  return lines.join('\n');
}
