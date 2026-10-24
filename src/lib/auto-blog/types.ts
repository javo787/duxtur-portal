/**
 * Shared types and constants of the auto-blog pipeline.
 *
 * Kept free of Next.js and mongoose imports on purpose: the generation half runs in a GitHub Action
 * (scripts/auto-blog.ts) and the publishing half runs inside the app (api/cron/auto-blog).
 */

export const LANGS = ['ru', 'uz', 'tg', 'kk', 'ky'] as const;
export type Lang = (typeof LANGS)[number];

/** Same values as the `category` enum of the Article model. */
export const CATEGORIES = [
  'cardiology',
  'neurology',
  'dentistry',
  'pediatrics',
  'dermatology',
  'ophthalmology',
  'surgery',
  'gynecology',
  'general',
] as const;
export type Category = (typeof CATEGORIES)[number];

/** The Article model has five section slots (section1..section5). */
export const SECTION_COUNT = 5;

/**
 * One article every 3 days. The scheduler fires daily and the plan endpoint answers "not due" until
 * this many hours have passed since the last auto article. 70 instead of 72 so that a run a few minutes
 * earlier than the previous one (GitHub cron jitter) is not pushed to the next day.
 */
export const MIN_INTERVAL_HOURS = 70;

export interface Topic {
  /** Stable id, stored on the article as topicKey (unique): a topic is never published twice. */
  key: string;
  category: Category;
  /** English search phrase for MedlinePlus and Europe PMC. */
  query: string;
}

export interface SourceRef {
  /** Publisher, e.g. "MedlinePlus (NLM)". */
  name: string;
  title: string;
  url: string;
  /** Short license note shown nowhere but kept for the record. */
  license: string;
}

/** What the model is allowed to base the article on. */
export interface SourceMaterial {
  topic: Topic;
  /** Plain-text passages, each already labelled with the source it came from. */
  passages: { ref: SourceRef; text: string }[];
}

export interface ArticleSection {
  title: string;
  content: string;
}

/** The article in ONE language. */
export interface LocalizedArticle {
  title: string;
  overview: string;
  sections: ArticleSection[];
}

/** Ready to publish: all languages plus where it came from. */
export interface GeneratedArticle {
  topicKey: string;
  category: Category;
  /** Languages that passed validation. `ru` is always present. */
  languages: Partial<Record<Lang, LocalizedArticle>>;
  sources: SourceRef[];
}
