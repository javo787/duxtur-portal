import { SECTION_COUNT, type ArticleSection, type Lang, type LocalizedArticle } from './types';

/**
 * Checks that run on every generated text before it is published. They catch what a model does when it
 * misbehaves: wrong script (Persian for Tajik, Russian passed off as Kazakh), HTML or headings in the body,
 * a truncated answer, and drug doses, which this portal never prints in automatic articles.
 */

const count = (text: string, re: RegExp) => (text.match(re) ?? []).length;
const CYRILLIC = /[\u0400-\u04FF]/g;
const LATIN = /[A-Za-z]/g;
const ARABIC_OR_CJK = /[\u0600-\u06FF\u0750-\u077F\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]/;

/** Letters that exist in that language's Cyrillic but not in Russian. Real text of any length has plenty. */
const SPECIFIC_LETTERS: Partial<Record<Lang, RegExp>> = {
  tg: /[ӣӯқғҳҷ]/gi,
  kk: /[әғқңөұүһі]/gi,
  ky: /[ңөү]/gi,
};

/** "5 mg", "200 мг", "1000 IU", "600 МЕ" and similar: a dose. \b does not work next to Cyrillic, hence lookarounds. */
const DOSE = /(?<![\p{L}\d])\d+(?:[.,]\d+)?\s?(?:мг|мкг|mg|mcg|µg|μg|IU|МЕ|ME)(?![\p{L}])/iu;

const HTML_TAG = /<\/?[a-z][^>]*>/i;
const HEADING_LINE = /^\s{0,3}#{1,6}\s/m;
const URL_IN_TEXT = /https?:\/\/|www\./i;

/** Cleans what is cheap to clean (tags, headings), so validation only rejects real problems. */
export function sanitizeText(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/^\s{0,3}#{1,6}\s+(.+)$/gm, '**$1**')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Turns an untrusted object (model output, request body) into a LocalizedArticle, or null if the shape is wrong. */
export function toLocalized(raw: unknown): LocalizedArticle | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.title !== 'string' || typeof r.overview !== 'string' || !Array.isArray(r.sections)) return null;
  const sections: ArticleSection[] = [];
  for (const s of r.sections) {
    if (!s || typeof s !== 'object') return null;
    const { title, content } = s as Record<string, unknown>;
    if (typeof title !== 'string' || typeof content !== 'string') return null;
    sections.push({ title: sanitizeText(title).replace(/\*\*/g, '').replace(/\n/g, ' '), content: sanitizeText(content) });
  }
  return { title: sanitizeText(r.title).replace(/\*\*/g, '').replace(/\n/g, ' '), overview: sanitizeText(r.overview), sections };
}

export const fullText = (a: LocalizedArticle): string => [a.title, a.overview, ...a.sections.flatMap((s) => [s.title, s.content])].join('\n');

/** Problems found in one language version. Empty array = fine. `reference` is the Russian original, for translations. */
export function validateLocalized(lang: Lang, a: LocalizedArticle, reference?: LocalizedArticle): string[] {
  const errors: string[] = [];
  const text = fullText(a);

  if (a.title.length < 15 || a.title.length > 160) errors.push(`title length ${a.title.length} (need 15-160)`);
  if (a.overview.length < 120 || a.overview.length > 700) errors.push(`overview length ${a.overview.length} (need 120-700)`);
  if (a.sections.length !== SECTION_COUNT) errors.push(`${a.sections.length} sections (need ${SECTION_COUNT})`);

  const minBody = lang === 'ru' ? 350 : 250;
  a.sections.forEach((s, i) => {
    if (s.title.length < 3 || s.title.length > 140) errors.push(`section ${i + 1}: title length ${s.title.length}`);
    if (s.content.length < minBody) errors.push(`section ${i + 1}: body too short (${s.content.length})`);
    if (s.content.length > 4500) errors.push(`section ${i + 1}: body too long (${s.content.length})`);
  });

  if (HTML_TAG.test(text)) errors.push('contains HTML');
  if (HEADING_LINE.test(a.sections.map((s) => s.content).join('\n'))) errors.push('contains markdown headings');
  if (URL_IN_TEXT.test(text)) errors.push('contains a link (sources are listed separately)');
  if (ARABIC_OR_CJK.test(text)) errors.push('contains Arabic or CJK script');
  if (DOSE.test(text)) errors.push('contains a drug dose');

  const cyr = count(text, CYRILLIC);
  const lat = count(text, LATIN);
  const cyrShare = cyr + lat === 0 ? 0 : cyr / (cyr + lat);
  if (lang === 'uz') {
    if (cyrShare > 0.05) errors.push(`Uzbek must be Latin script (Cyrillic share ${(cyrShare * 100).toFixed(0)}%)`);
  } else if (cyrShare < 0.8) {
    errors.push(`${lang} must be Cyrillic (Cyrillic share ${(cyrShare * 100).toFixed(0)}%)`);
  }

  const specific = SPECIFIC_LETTERS[lang];
  if (specific && count(text, specific) < 8) errors.push(`does not look like ${lang}: too few language-specific letters`);

  if (reference && lang !== 'ru') {
    const ratio = text.length / Math.max(1, fullText(reference).length);
    if (ratio < 0.5 || ratio > 1.9) errors.push(`length ratio to the Russian text is ${ratio.toFixed(2)}`);
    if (a.title.trim() === reference.title.trim()) errors.push('title was not translated');
  }

  return errors;
}
