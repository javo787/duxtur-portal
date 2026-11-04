/**
 * Quality filters for AI-made articles (the "Написать / Обработать / Перевести" modes of the writing studio).
 *
 * Pure functions with no server or browser dependencies: the server cleans what the model returned, and the editor
 * re-runs the same check live while the author edits, so the warnings always describe the text that will be published.
 */

export type QualityLevel = 'error' | 'warn';
export interface QualityIssue {
  level: QualityLevel;
  code: string;
  message: string;
}
export interface QualityReport {
  score: number;
  issues: QualityIssue[];
}

export interface CheckableArticle {
  title?: string;
  overview?: string;
  sections: { title: string; content: string }[];
  references: string[];
}

export type AiMode = 'write' | 'process' | 'translate';

const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"')\]]+/gi;

/** Every http(s) link in a text, without trailing punctuation. */
export function extractUrls(text: string): string[] {
  const found = text.match(URL_RE) || [];
  return found.map(u => u.replace(/[.,;:!?»”]+$/, '')).map(u => (u.startsWith('http') ? u : `https://${u}`));
}

/**
 * A link to a concrete page, not just a site's home page. Models that are asked for "real sources" love to answer
 * "https://www.thelancet.com" or "https://pubmed.ncbi.nlm.nih.gov/", which look like a source and prove nothing.
 */
export function isDeepLink(url: string): boolean {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) return false;
    const path = u.pathname.replace(/\/+$/, '');
    return path.length > 1 || u.search.length > 1;
  } catch {
    return false;
  }
}

const urlKey = (url: string) => url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/+$/, '').toLowerCase();

/**
 * Cleans the model's references:
 * - drops references whose only link is a bare home page (made-up placeholders);
 * - drops duplicates;
 * - puts back every link that was in the author's own text and that the model left out.
 * References without any link (a book, a national guideline) are kept as they are.
 */
export function sanitizeReferences(aiRefs: unknown, sourceText = ''): { references: string[]; dropped: string[] } {
  const list = Array.isArray(aiRefs) ? aiRefs : typeof aiRefs === 'string' ? aiRefs.split(/\n|;/) : [];
  const references: string[] = [];
  const dropped: string[] = [];
  const seen = new Set<string>();

  for (const raw of list) {
    const ref = String(raw ?? '').replace(/\s+/g, ' ').trim();
    if (!ref || /^source\d*$/i.test(ref) || /\b(title|url)\s*$/i.test(ref)) {
      if (ref) dropped.push(ref);
      continue;
    }
    const urls = extractUrls(ref);
    if (urls.length > 0 && !urls.some(isDeepLink)) {
      dropped.push(ref);
      continue;
    }
    const key = urls.length ? urlKey(urls[0]) : ref.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    references.push(ref);
  }

  for (const url of extractUrls(sourceText)) {
    if (!isDeepLink(url)) continue;
    const key = urlKey(url);
    if (seen.has(key)) continue;
    seen.add(key);
    references.push(url);
  }

  return { references, dropped };
}

// ─── Language checks ────────────────────────────────────────────────────────

const stripUrls = (t: string) => t.replace(URL_RE, ' ');
const letters = (t: string) => stripUrls(t).match(/\p{L}/gu) || [];

/** Share of Latin letters among all letters (URLs and the Latin names of drugs are a small part of a normal text). */
export function latinShare(text: string): number {
  const all = letters(text);
  if (all.length === 0) return 0;
  return all.filter(ch => /[a-z]/i.test(ch)).length / all.length;
}

export const hasArabicScript = (text: string) => /[\u0600-\u06FF]/.test(stripUrls(text));
const TAJIK_LETTERS = /[ҳҷӣӯқғ]/i;
/** Share of letters matching a class. Tajik normally has 3–6% of ҳ ҷ ӣ ӯ қ ғ; a Russian text with a Tajik heading — almost none. */
function letterRate(text: string, re: RegExp): number {
  const all = letters(text);
  return all.length ? all.filter(ch => re.test(ch)).length / all.length : 0;
}
const KAZAKH_LETTERS = /[әғқңөұүһі]/i;
const KYRGYZ_LETTERS = /[ңөү]/i;

// ─── Content checks ─────────────────────────────────────────────────────────

/** Section titles that promise the reader what to do. One per language, plus Russian (doctors often mix). */
const PRACTICAL_RE =
  /(что делать|когда (нужно )?обрат|рекомендац|советы|памятк|профилактик|чӣ (бояд )?кор|тавсия|кай ба духтур|маслиҳат|пешгирӣ|nima qilish|tavsiya|shifokorga|maslahat|oldini olish|не істеу|кеңес|дәрігерге|алдын алу|эмне кылуу|кеңеш|дарыгерге|алдын алуу)/i;

/** Promises a medical text must not make. */
const HYPE_RE =
  /(100\s*%\s*(излеч|эффект|гарант|natija|шифо)|гарантир|чудо-?средств|навсегда изба|без побочн|кафолат|мӯъҷиза|kafolat|mo['ʻ]?jiza|кепілдік|гарантия)/i;

const words = (t: string) => stripUrls(t).split(/\s+/).filter(w => /\p{L}/u.test(w));
const numbers = (t: string) => new Set(stripUrls(t).match(/\d+(?:[.,]\d+)?\s*%/g)?.map(n => n.replace(/\s/g, '').replace(',', '.')) || []);

const issue = (level: QualityLevel, code: string, message: string): QualityIssue => ({ level, code, message });

/**
 * What an editor would say about the article before it goes out. Errors are things readers will notice at once
 * (wrong alphabet, empty text); warnings are things that make the article weaker in search and in trust.
 */
export function checkArticleQuality(
  article: CheckableArticle,
  language: string,
  sourceText = '',
  mode: AiMode = 'write',
): QualityReport {
  const issues: QualityIssue[] = [];
  const sections = article.sections.filter(s => s.title.trim() || s.content.trim());
  const body = [article.title, article.overview, ...sections.map(s => `${s.title}\n${s.content}`)].join('\n');
  const wordCount = words(body).length;

  // Alphabet
  if (['tg', 'ru', 'kk', 'ky'].includes(language)) {
    if (hasArabicScript(body)) issues.push(issue('error', 'arabic_script', 'В тексте есть арабская/персидская графика — нужна кириллица.'));
    if (latinShare(body) > 0.2) issues.push(issue('error', 'latin_script', 'Слишком много латиницы — текст должен быть на кириллице.'));
  }
  if (language === 'tg' && wordCount > 50 && letterRate(body, TAJIK_LETTERS) < 0.005) {
    issues.push(issue('error', 'not_tajik', 'Нет букв ҳ, ҷ, ӣ, ӯ, қ, ғ — похоже, текст на русском, а не на таджикском.'));
  }
  if (language === 'kk' && wordCount > 50 && !KAZAKH_LETTERS.test(body)) {
    issues.push(issue('error', 'not_kazakh', 'Нет казахских букв (ә, ғ, қ, ң, ө, ұ, ү, һ, і) — похоже, текст не на казахском.'));
  }
  if (language === 'ky' && wordCount > 50 && !KYRGYZ_LETTERS.test(body)) {
    issues.push(issue('warn', 'not_kyrgyz', 'Нет кыргызских букв (ң, ө, ү) — проверьте язык текста.'));
  }
  if (language === 'uz' && wordCount > 50 && latinShare(body) < 0.5) {
    issues.push(issue('warn', 'uz_cyrillic', 'Узбекский текст не на латинице — на сайте принята латиница.'));
  }

  // Size and structure
  if (wordCount < 150) issues.push(issue('error', 'too_short', `Слишком короткий текст (${wordCount} слов).`));
  else if (wordCount < 400) issues.push(issue('warn', 'short', `Короткая статья (${wordCount} слов). В поиске лучше работают 600–1500 слов.`));

  if (sections.length < 3) issues.push(issue('warn', 'few_sections', 'Меньше 3 разделов — статью трудно читать и цитировать.'));
  if (!sections.some(s => PRACTICAL_RE.test(s.title))) {
    issues.push(issue('warn', 'no_practical', 'Нет практического раздела («Что делать», «Когда обратиться к врачу», «Тавсияҳо»).'));
  }

  const title = (article.title || '').trim();
  if (title.length > 90) issues.push(issue('warn', 'long_title', `Заголовок длинный (${title.length} символов): Google обрежет его после ~60–70.`));
  const overviewWords = words(article.overview || '').length;
  if (overviewWords < 15) issues.push(issue('warn', 'weak_overview', 'Короткое вступление: первые 2–3 предложения решают, дочитают ли статью.'));

  const longParagraph = sections.some(s => s.content.split(/\n\s*\n/).some(p => words(p).length > 130));
  if (longParagraph) issues.push(issue('warn', 'long_paragraph', 'Есть абзацы длиннее 130 слов — разбейте их, с телефона такие не читают.'));

  if (HYPE_RE.test(body)) issues.push(issue('warn', 'hype', 'Есть обещания вроде «гарантирует», «100%», «без побочных» — так нельзя писать о лечении.'));

  // Sources
  const deep = article.references.filter(r => extractUrls(r).some(isDeepLink)).length;
  if (article.references.length === 0) issues.push(issue('warn', 'no_sources', 'Нет источников. Добавьте 2–3 ссылки на конкретные страницы (ВОЗ, PubMed, Минздрав).'));
  else if (deep < 2) issues.push(issue('warn', 'weak_sources', 'Меньше 2 источников со ссылкой на конкретную страницу.'));

  // What the AI lost from the author's text
  if (sourceText.trim().length > 1500) {
    const srcWords = words(sourceText).length;
    const keep = mode === 'translate' ? 0.6 : mode === 'write' ? 0.45 : 0.3;
    if (srcWords > 0 && wordCount / srcWords < keep) {
      issues.push(issue('warn', 'content_lost', `ИИ сократил текст до ${Math.round((wordCount / srcWords) * 100)}% от исходного — проверьте, не пропали ли разделы.`));
    }
    const srcNums = numbers(sourceText);
    if (srcNums.size >= 3) {
      const out = numbers(body);
      const kept = [...srcNums].filter(n => out.has(n)).length;
      if (kept / srcNums.size < 0.5) issues.push(issue('warn', 'numbers_lost', `Из ${srcNums.size} цифр (%) исходного текста осталось ${kept} — проверьте статистику.`));
    }
  }

  const penalty = issues.reduce((sum, i) => sum + (i.level === 'error' ? 25 : 8), 0);
  return { score: Math.max(0, 100 - penalty), issues };
}

/** The editor's raw AI JSON (section1_title … section5_content) as a checkable article. */
export function aiDataToCheckable(data: Record<string, unknown>): CheckableArticle {
  const sections: { title: string; content: string }[] = [];
  for (let i = 1; i <= 8; i++) {
    const title = String(data[`section${i}_title`] ?? '');
    const content = String(data[`section${i}_content`] ?? '');
    if (title || content) sections.push({ title, content });
  }
  const refs = data.references;
  return {
    title: String(data.title ?? ''),
    overview: String(data.overview ?? ''),
    sections,
    references: Array.isArray(refs) ? refs.map(String) : [],
  };
}
