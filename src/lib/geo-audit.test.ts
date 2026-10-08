import fs from 'fs';
import path from 'path';
import { describe, expect, it, vi } from 'vitest';
import {
  OPENAI_URL,
  askGemini,
  askOpenAI,
  buildResult,
  domainOf,
  extractGemini,
  extractOpenAI,
  geminiUrl,
  isOurDomain,
  renderMarkdown,
  summarize,
  validatePrompts,
  type AnswerResult,
  type AuditPrompt,
} from './geo-audit';

const PROMPT: AuditPrompt = { id: 'ru-1', lang: 'ru', intent: 'clinic', text: 'Лучшие клиники в Душанбе' };

const openaiResponse = {
  output: [
    { type: 'web_search_call', id: 'ws_1', status: 'completed', action: { type: 'search', query: 'лучшие клиники Душанбе' } },
    {
      type: 'message',
      content: [
        {
          type: 'output_text',
          text: 'Рекомендуют клинику Шифо. Подробнее на Duxtur.',
          annotations: [
            { type: 'url_citation', start_index: 0, end_index: 5, url: 'https://www.duxtur.org/ru/clinics/shifo?utm_source=chatgpt.com', title: 'Шифо' },
            { type: 'url_citation', start_index: 6, end_index: 9, url: 'https://ydoc.tj/clinics/a', title: 'Ydoc' },
            { type: 'url_citation', start_index: 6, end_index: 9, url: 'https://ydoc.tj/clinics/a', title: 'Ydoc again' },
          ],
        },
      ],
    },
  ],
};

const geminiResponse = {
  candidates: [
    {
      content: { parts: [{ text: 'Лучшие клиники: ' }, { text: 'Шифо и другие.' }] },
      groundingMetadata: {
        webSearchQueries: ['лучшие клиники Душанбе', 'лучшие клиники Душанбе'],
        groundingChunks: [
          { web: { uri: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AAA', title: 'duxtur.org' } },
          { web: { uri: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/BBB', title: 'www.2gis.tj' } },
          { web: { uri: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/CCC', title: 'Some page title' } },
        ],
      },
    },
  ],
};

describe('domains', () => {
  it('strips www and lower-cases', () => {
    expect(domainOf('https://WWW.Duxtur.org/ru')).toBe('duxtur.org');
    expect(domainOf('not a url')).toBe('unknown');
  });

  it('recognises our domain and subdomains only', () => {
    expect(isOurDomain('duxtur.org')).toBe(true);
    expect(isOurDomain('blog.duxtur.org')).toBe(true);
    expect(isOurDomain('notduxtur.org')).toBe(false);
    expect(isOurDomain('duxtur.org.evil.example')).toBe(false);
  });
});

describe('extractOpenAI', () => {
  const x = extractOpenAI(openaiResponse);

  it('collects text, search queries and de-duplicated citations without tracking params', () => {
    expect(x.text).toContain('Шифо');
    expect(x.searchQueries).toEqual(['лучшие клиники Душанбе']);
    expect(x.citations.map((c) => c.url)).toEqual(['https://www.duxtur.org/ru/clinics/shifo', 'https://ydoc.tj/clinics/a']);
    expect(x.citations.map((c) => c.domain)).toEqual(['duxtur.org', 'ydoc.tj']);
  });

  it('accepts the nested Chat Completions annotation shape', () => {
    const nested = { output: [{ type: 'message', content: [{ type: 'output_text', text: 'x', annotations: [{ type: 'url_citation', url_citation: { url: 'https://a.example/p', title: 'A' } }] }] }] };
    expect(extractOpenAI(nested).citations).toEqual([{ url: 'https://a.example/p', title: 'A', domain: 'a.example' }]);
  });

  it('survives an empty or odd response', () => {
    expect(extractOpenAI({})).toEqual({ text: '', citations: [], searchQueries: [] });
    expect(extractOpenAI(null)).toEqual({ text: '', citations: [], searchQueries: [] });
  });
});

describe('extractGemini', () => {
  const x = extractGemini(geminiResponse);

  it('joins the text and takes the domain from the chunk title', () => {
    expect(x.text).toBe('Лучшие клиники: Шифо и другие.');
    expect(x.searchQueries).toEqual(['лучшие клиники Душанбе']);
    expect(x.citations.map((c) => c.domain)).toEqual(['duxtur.org', '2gis.tj', 'unknown']);
  });

  it('survives an empty response', () => {
    expect(extractGemini({})).toEqual({ text: '', citations: [], searchQueries: [] });
  });
});

describe('buildResult', () => {
  it('flags cited, mentioned and searched', () => {
    const r = buildResult('openai', PROMPT, extractOpenAI(openaiResponse));
    expect(r).toMatchObject({ ok: true, cited: true, mentioned: true, searched: true, engine: 'openai', promptId: 'ru-1' });
  });

  it('does not count a look-alike domain as ours', () => {
    const r = buildResult('gemini', PROMPT, { text: 'x', searchQueries: ['q'], citations: [{ url: 'u', title: 'notduxtur.org', domain: 'notduxtur.org' }] });
    expect(r.cited).toBe(false);
    expect(r.mentioned).toBe(false);
  });
});

describe('validatePrompts', () => {
  it('accepts a good list and trims text', () => {
    expect(validatePrompts([{ ...PROMPT, text: '  Лучшие клиники  ' }])[0].text).toBe('Лучшие клиники');
  });

  it('rejects duplicates, bad language, bad intent, short text and empty lists', () => {
    expect(() => validatePrompts([PROMPT, PROMPT])).toThrow(/duplicate/);
    expect(() => validatePrompts([{ ...PROMPT, lang: 'de' }])).toThrow(/lang/);
    expect(() => validatePrompts([{ ...PROMPT, intent: 'x' }])).toThrow(/intent/);
    expect(() => validatePrompts([{ ...PROMPT, text: 'ab' }])).toThrow(/short/);
    expect(() => validatePrompts([])).toThrow();
  });

  it('the shipped prompt file is valid and covers every language', () => {
    const raw = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../scripts/geo-audit.prompts.json'), 'utf8'));
    const prompts = validatePrompts(raw);
    expect(new Set(prompts.map((p) => p.lang))).toEqual(new Set(['ru', 'tg', 'en']));
    expect(prompts.length).toBeGreaterThanOrEqual(20);
  });
});

describe('API calls', () => {
  const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

  it('sends the OpenAI request with a Dushanbe location and the key only in the header', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(openaiResponse));
    const r = await askOpenAI(PROMPT, { apiKey: 'sk-test', model: 'm1', fetchImpl: fetchImpl as unknown as typeof fetch });

    expect(r.cited).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(OPENAI_URL);
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk-test');
    expect(JSON.parse(init.body as string)).toEqual({
      model: 'm1',
      input: PROMPT.text,
      tools: [{ type: 'web_search', user_location: { type: 'approximate', country: 'TJ', city: 'Dushanbe' } }],
    });
  });

  it('sends the Gemini request with google_search and the key in a header, not the URL', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(geminiResponse));
    const r = await askGemini(PROMPT, { apiKey: 'g-test', model: 'gem-1', fetchImpl: fetchImpl as unknown as typeof fetch });

    expect(r.cited).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(geminiUrl('gem-1'));
    expect(url).not.toContain('g-test');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('g-test');
    expect(JSON.parse(init.body as string)).toEqual({ contents: [{ role: 'user', parts: [{ text: PROMPT.text }] }], tools: [{ google_search: {} }] });
  });

  it('retries a 429 and then succeeds', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ error: 'slow down' }, 429)).mockResolvedValueOnce(jsonResponse(openaiResponse));
    const r = await askOpenAI(PROMPT, { apiKey: 'k', model: 'm', fetchImpl: fetchImpl as unknown as typeof fetch, retryDelayMs: 0 });
    expect(r.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('does not retry other 4xx errors and reports a short error instead of throwing', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: { message: 'model not found '.repeat(60) } }, 404));
    const r = await askGemini(PROMPT, { apiKey: 'k', model: 'gone', fetchImpl: fetchImpl as unknown as typeof fetch, retryDelayMs: 0 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/^HTTP 404/);
    expect(r.error!.length).toBeLessThan(330);
  });

  it('turns a network failure into a failed result', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('socket hang up');
    });
    const r = await askOpenAI(PROMPT, { apiKey: 'k', model: 'm', fetchImpl: fetchImpl as unknown as typeof fetch, retries: 0 });
    expect(r).toMatchObject({ ok: false, error: 'socket hang up' });
  });
});

describe('summarize / renderMarkdown', () => {
  const mk = (over: Partial<AnswerResult>): AnswerResult => ({
    engine: 'openai', promptId: 'p', lang: 'ru', intent: 'clinic', ok: true, text: '', citations: [], searchQueries: [],
    searched: true, mentioned: false, cited: false, ...over,
  });
  const cite = (domain: string) => ({ url: `https://${domain}/x`, title: '', domain });

  const results: AnswerResult[] = [
    mk({ promptId: 'a', cited: true, mentioned: true, citations: [cite('duxtur.org'), cite('ydoc.tj')] }),
    mk({ promptId: 'b', lang: 'tg', intent: 'doctor', citations: [cite('ydoc.tj'), cite('ydoc.tj')] }),
    mk({ promptId: 'c', searched: false }),
    mk({ promptId: 'd', ok: false, error: 'HTTP 500' }),
    mk({ engine: 'gemini', promptId: 'a', cited: false, citations: [cite('2gis.tj')] }),
  ];

  it('counts per engine, language and intent; failures are separate', () => {
    const s = summarize(results);
    expect(s.openai).toMatchObject({ total: 3, failed: 1, cited: 1, mentioned: 1, searched: 2 });
    expect(s.openai!.byLang).toMatchObject({ ru: { total: 2, cited: 1 }, tg: { total: 1, cited: 0 } });
    expect(s.openai!.byIntent.doctor.total).toBe(1);
    expect(s.gemini).toMatchObject({ total: 1, cited: 0 });
  });

  it('counts a domain once per question and ranks it', () => {
    expect(summarize(results).openai!.topDomains).toEqual([
      { domain: 'ydoc.tj', prompts: 2 },
      { domain: 'duxtur.org', prompts: 1 },
    ]);
  });

  it('ignores engines with no results and renders a report', () => {
    const s = summarize(results.filter((r) => r.engine === 'openai'));
    expect(s.gemini).toBeUndefined();
    const md = renderMarkdown(s, { date: '2026-10-08', models: { openai: 'm1' }, promptCount: 4 });
    expect(md).toContain('# GEO audit — 2026-10-08');
    expect(md).toContain('duxtur.org cited: 1/3 (33%)');
    expect(md).toContain('duxtur.org: 1 ← us');
    expect(md).not.toContain('Gemini');
  });
});
