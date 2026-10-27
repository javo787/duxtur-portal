import { DRAFT_SYSTEM, TRANSLATE_SYSTEM, VERIFY_SYSTEM, draftPrompt, translatePrompt, verifyPrompt } from './prompts';
import { sourceRefs } from './sources';
import type { Llm } from './llm';
import { toLocalized, validateLocalized } from './validate';
import type { GeneratedArticle, Lang, LocalizedArticle, SourceMaterial } from './types';

/** A topic the pipeline could not turn into a publishable article. The caller moves on to the next topic. */
export class GenerationError extends Error {}

/** More unsupported statements than this and the draft is rewritten (then rejected if it happens again). */
const MAX_UNSUPPORTED = 1;

const TRANSLATIONS: Exclude<Lang, 'ru'>[] = ['uz', 'tg', 'kk', 'ky'];

type Log = (message: string) => void;

async function draftRussian(material: SourceMaterial, llm: Llm, feedback: string[] | undefined, log: Log): Promise<LocalizedArticle> {
  let problems: string[] = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    const raw = await llm.json({
      system: DRAFT_SYSTEM,
      prompt: draftPrompt(material, [...(feedback ?? []), ...problems]),
      temperature: 0.3,
      maxOutputTokens: 16_000,
    });
    const article = toLocalized(raw);
    problems = article ? validateLocalized('ru', article) : ['answer does not have title, overview and sections'];
    if (article && problems.length === 0) return article;
    log(`Russian draft rejected (attempt ${attempt}): ${problems.join('; ')}`);
  }
  throw new GenerationError(`Russian draft failed validation: ${problems.join('; ')}`);
}

async function unsupportedClaims(material: SourceMaterial, article: LocalizedArticle, llm: Llm): Promise<string[]> {
  const raw = (await llm.json({
    system: VERIFY_SYSTEM,
    prompt: verifyPrompt(material, article),
    temperature: 0,
    maxOutputTokens: 4_000,
  })) as { unsupported?: unknown };
  return Array.isArray(raw?.unsupported) ? raw.unsupported.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : [];
}

async function translate(ru: LocalizedArticle, lang: Exclude<Lang, 'ru'>, llm: Llm, log: Log): Promise<LocalizedArticle | null> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const article = toLocalized(await llm.json({ system: TRANSLATE_SYSTEM, prompt: translatePrompt(ru, lang), temperature: 0.2, maxOutputTokens: 16_000 }));
      const problems = article ? validateLocalized(lang, article, ru) : ['answer does not have title, overview and sections'];
      if (article && problems.length === 0) return article;
      log(`${lang} translation rejected (attempt ${attempt}): ${problems.join('; ')}`);
    } catch (e) {
      log(`${lang} translation failed (attempt ${attempt}): ${(e as Error).message}`);
    }
  }
  return null;
}

/**
 * Source material -> article in up to five languages.
 *
 * 1. Russian draft written only from the sources (validated, one retry).
 * 2. Fact-check pass: a second call lists statements the sources do not support. Too many -> rewrite once with
 *    those statements as feedback; still too many -> the topic is rejected. This is a safety net, not a
 *    guarantee: it is the same model family checking its own output.
 * 3. Translation into uz, tg, kk, ky, one at a time (free-tier rate limits), each validated. A language that
 *    fails twice is left out: the site shows an article only in the languages it really has.
 */
export async function generateArticle(material: SourceMaterial, llm: Llm, log: Log = () => undefined): Promise<GeneratedArticle> {
  let ru = await draftRussian(material, llm, undefined, log);

  let unsupported = await unsupportedClaims(material, ru, llm);
  if (unsupported.length > MAX_UNSUPPORTED) {
    log(`Fact-check found ${unsupported.length} unsupported statements, rewriting: ${unsupported.join(' | ')}`);
    ru = await draftRussian(material, llm, unsupported, log);
    unsupported = await unsupportedClaims(material, ru, llm);
    if (unsupported.length > MAX_UNSUPPORTED) {
      throw new GenerationError(`Fact-check still finds unsupported statements after a rewrite: ${unsupported.join(' | ')}`);
    }
  }

  const languages: GeneratedArticle['languages'] = { ru };
  for (const lang of TRANSLATIONS) {
    const translated = await translate(ru, lang, llm, log);
    if (translated) languages[lang] = translated;
    else log(`WARNING: ${lang} is left out of this article`);
  }

  return { topicKey: material.topic.key, category: material.topic.category, languages, sources: sourceRefs(material) };
}
