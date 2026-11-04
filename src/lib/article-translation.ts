import { stripHtml } from '@/lib/utils';
import { ARTICLE_LANGUAGES } from '@/lib/author-types';
import { sanitizeReferences } from '@/lib/article-quality';

/**
 * Translating an article that is already on the site: the translation becomes one more language of the same Article
 * (same address, cover, sources and rating), not a new article. Pure helpers; the server action is translate-article.ts.
 */

export const TRANSLATABLE_FIELDS = [
  'title', 'overview',
  'section1_title', 'section1_content',
  'section2_title', 'section2_content',
  'section3_title', 'section3_content',
  'section4_title', 'section4_content',
  'section5_title', 'section5_content',
] as const;

type Localized = Partial<Record<string, string>> | undefined;
export type TranslatableArticle = { [K in (typeof TRANSLATABLE_FIELDS)[number]]?: Localized } & {
  references?: string[];
};

const text = (value: Localized, language: string) => (value && typeof value[language] === 'string' ? value[language]!.trim() : '');

/** The languages the article is written in (a language counts when it has a title and some text). */
export function languagesOf(article: TranslatableArticle): string[] {
  return ARTICLE_LANGUAGES.filter(language =>
    text(article.title, language) &&
    (text(article.overview, language) || text(article.section1_content, language)));
}

/** The article in one language as plain text with headings — what the translator gets. */
export function articleToSourceText(article: TranslatableArticle, language: string): string {
  const parts: string[] = [];
  const title = text(article.title, language);
  if (title) parts.push(`# ${title}`);
  const overview = text(article.overview, language);
  if (overview) parts.push(overview);
  for (let i = 1; i <= 5; i++) {
    const key = i as 1 | 2 | 3 | 4 | 5;
    const heading = text(article[`section${key}_title`], language);
    const body = text(article[`section${key}_content`], language);
    if (!heading && !body) continue;
    parts.push([heading && `## ${heading}`, body].filter(Boolean).join('\n\n'));
  }
  const refs = (article.references || []).filter(Boolean);
  if (refs.length) parts.push(`## Sources\n${refs.map(r => `- ${r}`).join('\n')}`);
  return parts.join('\n\n');
}

/**
 * The `$set` that adds (or replaces) one language of the article. Sections the translation does not have are emptied,
 * so a shorter translation does not keep the old text of a longer one. Sources are shared by all languages: they are
 * only filled in when the article has none yet.
 */
export function translationUpdate(
  data: Record<string, unknown>,
  language: string,
  existingReferences: string[] = [],
): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  for (const field of TRANSLATABLE_FIELDS) {
    const value = data[field];
    update[`${field}.${language}`] = typeof value === 'string' ? stripHtml(value).trim() : '';
  }
  if (existingReferences.length === 0 && Array.isArray(data.references)) {
    const { references } = sanitizeReferences(data.references);
    if (references.length) update.references = references;
  }
  return update;
}
