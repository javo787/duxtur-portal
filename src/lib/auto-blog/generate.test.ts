import { describe, expect, it, vi } from 'vitest';
import { GenerationError, generateArticle } from './generate';
import type { JsonRequest, Llm } from './llm';
import { DRAFT_SYSTEM, TRANSLATE_SYSTEM, VERIFY_SYSTEM } from './prompts';
import { makeArticle, makeMaterial } from './test-fixtures';
import type { Lang } from './types';

const LANG_MARKERS: Record<string, Lang> = { Uzbek: 'uz', Tajik: 'tg', Kazakh: 'kk', Kyrgyz: 'ky' };
const langOf = (prompt: string): Lang => LANG_MARKERS[Object.keys(LANG_MARKERS).find((k) => prompt.includes(`into: ${k}`))!];

interface Script {
  draft?: (n: number, req: JsonRequest) => unknown;
  verify?: (n: number) => unknown;
  translate?: (lang: Lang, attempt: number) => unknown;
}

function fakeLlm(script: Script = {}) {
  const counts = { draft: 0, verify: 0, translate: {} as Record<string, number> };
  const requests: JsonRequest[] = [];
  const llm: Llm = {
    async json<T>(req: JsonRequest): Promise<T> {
      requests.push(req);
      if (req.system === DRAFT_SYSTEM) {
        counts.draft++;
        return (script.draft ? script.draft(counts.draft, req) : makeArticle('ru')) as T;
      }
      if (req.system === VERIFY_SYSTEM) {
        counts.verify++;
        return (script.verify ? script.verify(counts.verify) : { unsupported: [] }) as T;
      }
      if (req.system === TRANSLATE_SYSTEM) {
        const lang = langOf(req.prompt);
        counts.translate[lang] = (counts.translate[lang] ?? 0) + 1;
        const out = script.translate ? script.translate(lang, counts.translate[lang]) : makeArticle(lang);
        if (out instanceof Error) throw out;
        return out as T;
      }
      throw new Error('unexpected prompt');
    },
  };
  return { llm, counts, requests };
}

describe('generateArticle', () => {
  it('writes, fact-checks and translates into all five languages', async () => {
    const { llm, counts } = fakeLlm();
    const article = await generateArticle(makeMaterial(), llm);
    expect(Object.keys(article.languages).sort()).toEqual(['kk', 'ky', 'ru', 'tg', 'uz']);
    expect(article.topicKey).toBe('hypertension');
    expect(article.category).toBe('cardiology');
    expect(article.sources.map((s) => s.url)).toEqual(['https://medlineplus.gov/highbloodpressure.html', 'https://doi.org/10.1000/xyz123']);
    expect(counts).toMatchObject({ draft: 1, verify: 1 });
  });

  it('puts the sources in the prompt and tells the model that they are data, not instructions', async () => {
    const { llm, requests } = fakeLlm();
    await generateArticle(makeMaterial(), llm);
    const draft = requests.find((r) => r.system === DRAFT_SYSTEM)!;
    expect(draft.prompt).toContain('<SOURCE_MATERIAL>');
    expect(draft.prompt).toContain('High Blood Pressure');
    expect(DRAFT_SYSTEM).toMatch(/ignore them/i);
    expect(DRAFT_SYSTEM).toMatch(/no drug doses/i);
    expect(draft.temperature).toBeLessThanOrEqual(0.3);
  });

  it('retries a Russian draft that fails validation, telling the model what was wrong', async () => {
    const bad = makeArticle('ru');
    bad.sections = bad.sections.slice(0, 3);
    const { llm, counts, requests } = fakeLlm({ draft: (n) => (n === 1 ? bad : makeArticle('ru')) });
    const log = vi.fn();
    await generateArticle(makeMaterial(), llm, log);
    expect(counts.draft).toBe(2);
    expect(requests.filter((r) => r.system === DRAFT_SYSTEM)[1].prompt).toMatch(/3 sections/);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('draft rejected'));
  });

  it('gives up when the Russian draft keeps failing', async () => {
    const { llm } = fakeLlm({ draft: () => ({ nonsense: true }) });
    await expect(generateArticle(makeMaterial(), llm)).rejects.toBeInstanceOf(GenerationError);
  });

  it('tolerates one unsupported statement but rewrites a draft with more, passing them as feedback', async () => {
    const one = fakeLlm({ verify: () => ({ unsupported: ['one claim'] }) });
    await expect(generateArticle(makeMaterial(), one.llm)).resolves.toBeDefined();
    expect(one.counts.draft).toBe(1);

    const many = fakeLlm({ verify: (n) => ({ unsupported: n === 1 ? ['claim A about 80%', 'claim B', 'claim C'] : [] }) });
    await generateArticle(makeMaterial(), many.llm);
    expect(many.counts).toMatchObject({ draft: 2, verify: 2 });
    const secondDraft = many.requests.filter((r) => r.system === DRAFT_SYSTEM)[1].prompt;
    expect(secondDraft).toContain('claim A about 80%');
    expect(secondDraft).toMatch(/Fix ALL/);
  });

  it('rejects the topic when the rewrite is still unsupported', async () => {
    const { llm } = fakeLlm({ verify: () => ({ unsupported: ['a', 'b', 'c'] }) });
    await expect(generateArticle(makeMaterial(), llm)).rejects.toThrow(/still finds unsupported/);
  });

  it('retries a bad translation once, then leaves that language out instead of failing the article', async () => {
    const log = vi.fn();
    const { llm, counts } = fakeLlm({
      translate: (lang, attempt) => {
        if (lang === 'kk') return makeArticle('ru', { title: 'Это русский текст под видом казахского языка' }); // wrong language, both attempts
        if (lang === 'ky' && attempt === 1) return new Error('503'); // transient, fixed by the retry
        return makeArticle(lang);
      },
    });
    const article = await generateArticle(makeMaterial(), llm, log);
    expect(Object.keys(article.languages).sort()).toEqual(['ky', 'ru', 'tg', 'uz']);
    expect(counts.translate.kk).toBe(2);
    expect(counts.translate.ky).toBe(2);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('kk is left out'));
  });

  it('translates from the Russian text and asks for the right script', async () => {
    const { llm, requests } = fakeLlm();
    await generateArticle(makeMaterial(), llm);
    const tg = requests.find((r) => r.system === TRANSLATE_SYSTEM && r.prompt.includes('into: Tajik'))!;
    expect(tg.prompt).toMatch(/NEVER Persian\/Arabic/);
    expect(tg.prompt).toContain(makeArticle('ru').title);
    const uz = requests.find((r) => r.system === TRANSLATE_SYSTEM && r.prompt.includes('into: Uzbek'))!;
    expect(uz.prompt).toMatch(/LATIN/);
  });
});
