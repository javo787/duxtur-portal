/**
 * SEO of one article page (/[lang]/blog/[slug]): the text of the meta tags and the JSON-LD.
 *
 * Kept out of the page so it can be unit-tested (article-seo.test.ts). The page passes plain values in
 * (strings, ISO dates), never a Mongo document.
 */
import { BASE_URL, buildBreadcrumbJsonLd } from '@/lib/seo';
import { cleanJsonLd, cleanText, ogImageUrl, OG_IMAGE_SIZE, truncateAtWord } from '@/lib/clinic-seo';

/** Google shows ~155-160 characters of a description on desktop, less on mobile. */
export const META_DESCRIPTION_MAX = 160;
/** Titles longer than this get cut in the results; the " | Duxtur.org" suffix is then dropped. */
export const TITLE_MAX = 60;
const TITLE_SUFFIX = ' | Duxtur.org';
const WORDS_PER_MINUTE = 200;

/**
 * Markdown (what the editor stores) to plain text for meta tags and JSON-LD. Without this the description
 * shows "**Важно:**" or "## Симптомы" in the search results and in link previews.
 */
export function markdownToPlainText(md: string | null | undefined): string {
  if (!md) return '';
  const text = md
    .replace(/<[^>]+>/g, ' ') // HTML
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links: keep the text
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // headings
    .replace(/^\s{0,3}>\s?/gm, '') // quotes
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, '') // list markers
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(^|[\s(])[*_]([^*_\n]+)[*_](?=[\s).,;:!?]|$)/g, '$1$2') // italic
    .replace(/`{1,3}([^`]*)`{1,3}/g, '$1') // code
    .replace(/~~(.*?)~~/g, '$1') // strikethrough
    .replace(/^\s*([-*_]\s*){3,}$/gm, ' '); // horizontal rules
  return cleanText(text);
}

/**
 * The meta description: plain text, cut on a word (never "взрослого " or "эффективны"). When a sentence
 * ends late enough, it stops there instead, so the snippet reads as a whole thought.
 */
export function articleMetaDescription(overview: string | null | undefined, max = META_DESCRIPTION_MAX): string {
  const text = markdownToPlainText(overview);
  if (Array.from(text).length <= max) return text;
  const head = Array.from(text).slice(0, max).join('');
  const sentenceEnd = Math.max(head.lastIndexOf('. '), head.lastIndexOf('! '), head.lastIndexOf('? '));
  if (sentenceEnd >= max * 0.6) return head.slice(0, sentenceEnd + 1);
  return truncateAtWord(text, max);
}

/**
 * The <title>. The root layout appends " | Duxtur.org"; when that pushes the title past what search engines
 * show, the article title is used alone (`absolute`), so the cut never falls on the article's own words.
 */
export function articleSeoTitle(title: string): string | { absolute: string } {
  const clean = cleanText(title);
  return Array.from(clean + TITLE_SUFFIX).length <= TITLE_MAX ? clean : { absolute: clean };
}

/** Words and reading time, counted the same way for the meta tags, the page and the JSON-LD. */
export function readingStats(parts: (string | null | undefined)[]): { wordCount: number; minutes: number } {
  const text = markdownToPlainText(parts.filter(Boolean).join('\n\n'));
  const wordCount = text ? text.split(/\s+/).length : 0;
  return { wordCount, minutes: Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE)) };
}

export type ArticleOgImage = { url: string; width?: number; height?: number; alt: string };

/**
 * The link-preview image: the article image cropped to 1200x630 JPEG on Cloudinary, the generated /og card
 * when the article has no image.
 */
export function articleOgImage(image: string | undefined, args: { title: string; author: string; lang: string }): ArticleOgImage {
  const og = ogImageUrl(image);
  if (og) return { url: og.url, alt: args.title, ...(og.transformed ? OG_IMAGE_SIZE : {}) };
  const qs = new URLSearchParams({ title: args.title, author: args.author || 'Duxtur', lang: args.lang });
  return { url: `${BASE_URL}/og?${qs.toString()}`, alt: args.title, ...OG_IMAGE_SIZE };
}

/** A reference line ("PubMed — https://...") to a schema.org CreativeWork; plain text when there is no link. */
export function referenceToCitation(ref: string): Record<string, string> | string | undefined {
  const line = cleanText(ref);
  if (!line) return undefined;
  const m = line.match(/https?:\/\/[^\s]+/) || line.match(/(?:^|\s)(www\.[^\s]+)/);
  if (!m) return line;
  const raw = (m[1] || m[0]).replace(/[),.;]+$/, '');
  const url = raw.startsWith('http') ? raw : `https://${raw}`;
  const name = cleanText(line.replace(m[1] || m[0], '').replace(/^[-–—:\s]+|[-–—:\s]+$/g, ''));
  return { '@type': 'CreativeWork', ...(name ? { name } : {}), url };
}

const iso = (d: unknown): string | undefined => {
  if (!d) return undefined;
  const date = new Date(d as string);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

/** The latest of the dates: an article re-checked by a doctor is a modified article. */
export function latestIso(...dates: unknown[]): string | undefined {
  const times = dates.map(iso).filter((v): v is string => !!v).map(v => Date.parse(v));
  return times.length ? new Date(Math.max(...times)).toISOString() : undefined;
}

type PersonRef = { name: string; url?: string; jobTitle?: string };

export type ArticleJsonLdInput = {
  url: string;
  lang: string;
  title: string;
  description: string;
  image: ArticleOgImage;
  datePublished?: unknown;
  dateModified?: unknown;
  lastReviewed?: unknown;
  wordCount: number;
  minutes: number;
  /** Localized category name, when the article has one. */
  section?: string;
  sectionUrl?: string;
  /** Editorial byline, doctor, or nobody (auto-blog): never an invented person. */
  author: ({ kind: 'editorial' } & PersonRef) | ({ kind: 'person' } & PersonRef) | null;
  reviewer?: PersonRef | null;
  references?: string[];
  views?: number;
  sectionIds: string[];
  breadcrumb: { home: string; blog: string };
};

/** Article + MedicalWebPage JSON-LD. Empty fields are dropped (cleanJsonLd), so validators stay quiet. */
export function buildArticleJsonLd(a: ArticleJsonLdInput) {
  const publisher = {
    '@type': 'Organization',
    '@id': `${BASE_URL}/#organization`,
    name: 'Duxtur.org',
    url: BASE_URL,
    logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png`, width: 96, height: 96 },
  };
  const author =
    a.author?.kind === 'editorial'
      ? { '@type': 'Organization', '@id': a.author.url, name: a.author.name, url: a.author.url }
      : a.author?.kind === 'person'
        ? { '@type': 'Person', '@id': a.author.url, name: a.author.name, jobTitle: a.author.jobTitle, url: a.author.url }
        : { '@type': 'Organization', '@id': `${BASE_URL}/#organization`, name: 'Duxtur.org', url: BASE_URL };

  const crumbs = [
    { name: a.breadcrumb.home, url: `/${a.lang}` },
    { name: a.breadcrumb.blog, url: `/${a.lang}/blog` },
    ...(a.section && a.sectionUrl ? [{ name: a.section, url: a.sectionUrl }] : []),
    { name: a.title, url: a.url },
  ];
  const { '@context': _ctx, ...breadcrumb } = buildBreadcrumbJsonLd(crumbs);
  void _ctx;

  const published = iso(a.datePublished);
  const doc = {
    '@context': 'https://schema.org',
    '@type': ['Article', 'MedicalWebPage'],
    '@id': `${a.url}#article`,
    url: a.url,
    mainEntityOfPage: a.url,
    headline: Array.from(a.title).length <= 110 ? a.title : truncateAtWord(a.title, 110),
    name: a.title,
    description: a.description,
    image: { '@type': 'ImageObject', url: a.image.url, width: a.image.width, height: a.image.height },
    datePublished: published,
    dateModified: latestIso(a.dateModified, a.lastReviewed) ?? published,
    lastReviewed: iso(a.lastReviewed),
    inLanguage: a.lang,
    isAccessibleForFree: true,
    wordCount: a.wordCount,
    timeRequired: `PT${a.minutes}M`,
    articleSection: a.section,
    author,
    publisher,
    reviewedBy: a.reviewer?.name
      ? { '@type': 'Person', '@id': a.reviewer.url, name: a.reviewer.name, url: a.reviewer.url }
      : undefined,
    citation: (a.references ?? []).map(referenceToCitation),
    medicalAudience: { '@type': 'MedicalAudience', audienceType: 'Patient' },
    speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.article-overview'] },
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/ReadAction',
      userInteractionCount: a.views ?? 0,
    },
    hasPart: a.sectionIds.map(id => ({ '@type': 'WebPageElement', isAccessibleForFree: true, cssSelector: `#${id}` })),
    isPartOf: { '@type': 'WebSite', '@id': `${BASE_URL}/#website`, name: 'Duxtur.org', url: BASE_URL },
    breadcrumb,
  };
  return cleanJsonLd(doc) as Record<string, unknown>;
}
