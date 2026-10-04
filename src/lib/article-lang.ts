/**
 * Which language an article can be shown in.
 *
 * Article fields are { ru, tg, uz, kk, ky } objects and many articles exist in only one or two
 * languages. Picking each field on its own ("ui language, else Russian") gives an empty body when
 * the article exists only in Tajik and the reader is on /ru, and can mix languages inside one page.
 * Here the whole article is shown in ONE language, and the page says so when it is not the reader's.
 */

export const ARTICLE_LANGS = ['ru', 'tg', 'uz', 'kk', 'ky'] as const;
export type ArticleLang = (typeof ARTICLE_LANGS)[number];

/** Each language written in itself: safe to show to anyone, no grammar cases needed. */
export const LANG_ENDONYMS: Record<ArticleLang, string> = {
  ru: 'Русский',
  tg: 'Тоҷикӣ',
  uz: 'Oʻzbekcha',
  kk: 'Қазақша',
  ky: 'Кыргызча',
};

type Multilingual = Partial<Record<string, string>> | null | undefined;
type ArticleLike = {
  title?: Multilingual;
  overview?: Multilingual;
  symptoms?: Multilingual;
  causes?: Multilingual;
  diagnosis_treatment?: Multilingual;
  prevention?: Multilingual;
  [key: string]: unknown;
};

const filled = (v: unknown): boolean => typeof v === 'string' && v.trim().length > 0;
const isArticleLang = (l: string): l is ArticleLang => (ARTICLE_LANGS as readonly string[]).includes(l);

function hasBody(a: ArticleLike, l: ArticleLang): boolean {
  const legacy = [a.symptoms, a.causes, a.diagnosis_treatment, a.prevention];
  const dynamic = [1, 2, 3, 4, 5].map(i => a[`section${i}_content`] as Multilingual);
  return [...legacy, ...dynamic].some(f => filled(f?.[l]));
}

/** For lists and cards, where only the title and the overview are loaded. */
export function previewLanguages(a: ArticleLike): ArticleLang[] {
  return ARTICLE_LANGS.filter(l => filled(a.title?.[l]) && filled(a.overview?.[l]));
}

/**
 * Languages the article can really be read in: title, overview and at least one section.
 * A title translated on its own does not make a language available. If no language has sections
 * (a short article), a title and an overview are enough.
 */
export function articleLanguages(a: ArticleLike): ArticleLang[] {
  const full = previewLanguages(a).filter(l => hasBody(a, l));
  return full.length > 0 ? full : previewLanguages(a);
}

export interface Resolved {
  /** Language every field of the page is taken from. */
  contentLang: ArticleLang;
  /** Languages the article exists in (drives hreflang and the switch links). */
  available: ArticleLang[];
  /** True when contentLang differs from the language the reader asked for. */
  isFallback: boolean;
}

function resolveFrom(available: ArticleLang[], requested: string): Resolved {
  const want = isArticleLang(requested) ? requested : 'ru';
  if (available.includes(want)) return { contentLang: want, available, isFallback: false };
  // Not available in the requested language. Russian first (the common second language of the
  // region), then the rest in a fixed order. If the article has no text at all, keep the request.
  const contentLang = ARTICLE_LANGS.find(l => available.includes(l)) ?? want;
  return { contentLang, available, isFallback: contentLang !== want };
}

export const resolveArticleLanguage = (a: ArticleLike, requested: string): Resolved =>
  resolveFrom(articleLanguages(a), requested);

export const resolvePreviewLanguage = (a: ArticleLike, requested: string): Resolved =>
  resolveFrom(previewLanguages(a), requested);

/** For lists: like the preview, but an article that has only a title is still listed, in the language of that title. */
export function resolveListLanguage(a: ArticleLike, requested: string): Resolved {
  const r = resolvePreviewLanguage(a, requested);
  if (r.available.length > 0) return r;
  return resolveFrom(ARTICLE_LANGS.filter(l => filled(a.title?.[l])), requested);
}

/**
 * canonical and hreflang only for languages that have the text. A hreflang pointing at a page that
 * shows another language is wrong, and the canonical of such a page must be the real version.
 */
export function buildArticleAlternates(baseUrl: string, slug: string, available: ArticleLang[], contentLang: ArticleLang) {
  const url = (l: string) => `${baseUrl}/${l}/blog/${slug}`;
  const languages: Record<string, string> = {};
  for (const l of available) languages[l] = url(l);
  languages['x-default'] = url(available.includes('ru') ? 'ru' : contentLang);
  return { canonical: url(contentLang), languages };
}
