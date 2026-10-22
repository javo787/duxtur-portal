/**
 * Text helpers for site search. Pure functions: no database, usable on the server and in the browser.
 *
 * Why not the database's text index alone: it matches whole words, so "давление" does not find "давления",
 * and the Article index has no Russian stemmer at all. Instead the query is cut into words, each word is
 * trimmed to a stem, and a stem has to appear in the text; ranking and highlighting are done here.
 * A small vocabulary (the words the site itself uses) fixes typos and completes half-typed words.
 */
import { escapeRegExp } from './utils/string';

export const SEARCH_LANGS = ['ru', 'tg', 'uz', 'kk', 'ky'] as const;
export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 100;
const MAX_TOKENS = 6;

/** What a visitor typed, made safe to use: one line, single spaces, at most 100 characters. */
export function normalizeQuery(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY_LENGTH);
}

/** Lower-cased words of at least two characters, without repeats, at most six. */
export function tokenize(query: string): string[] {
  const words = normalizeQuery(query)
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(w => w.length >= MIN_QUERY_LENGTH);
  return [...new Set(words)].slice(0, MAX_TOKENS);
}

/**
 * Cheap morphology for ru, tg, uz, kk, ky: the ending is cut off a long word, so that
 * "давление", "давления" and "давлению" meet on "давлен". Short words stay as they are.
 */
export function stem(token: string): string {
  const n = token.length;
  if (n <= 4) return token;
  if (n <= 6) return token.slice(0, n - 1);
  return token.slice(0, n - 2);
}

export const stemsOf = (query: string): string[] => tokenize(query).map(stem);

export interface Segment {
  text: string;
  match: boolean;
}

/** The text cut into plain and matching parts (a matching part is the whole word that starts with a stem). */
export function splitHighlight(text: string, stems: string[]): Segment[] {
  if (!text || stems.length === 0) return [{ text, match: false }];
  let re: RegExp;
  try {
    // A word start is a stem that is not preceded by a letter or a digit
    re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${stems.map(escapeRegExp).join('|')})[\\p{L}\\p{N}]*`, 'giu');
  } catch {
    return [{ text, match: false }]; // an old browser without lookbehind: no highlight, nothing breaks
  }
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const start = m.index ?? 0;
    if (start > last) out.push({ text: text.slice(last, start), match: false });
    out.push({ text: m[0], match: true });
    last = start + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), match: false });
  return out.length ? out : [{ text, match: false }];
}

/** Markdown and markup removed, whitespace collapsed: text fit for a one-line snippet. */
export function plainText(markdown: string): string {
  return (markdown ?? '').replace(/[#*`_>\[\]]/g, '').replace(/\s+/g, ' ').trim();
}

/** A snippet of about `max` characters around the first match (or the start of the text). */
export function excerptAround(text: string, stems: string[], max = 180): string {
  const clean = plainText(text);
  if (clean.length <= max) return clean;
  const lower = clean.toLowerCase();
  const hits = stems.map(s => lower.indexOf(s)).filter(i => i >= 0);
  const at = hits.length ? Math.min(...hits) : 0;
  let start = Math.max(0, at - Math.floor(max / 3));
  if (start > 0) {
    // do not begin in the middle of a word
    const space = clean.indexOf(' ', start);
    if (space !== -1 && space - start < 20) start = space + 1;
  }
  let end = Math.min(clean.length, start + max);
  if (end < clean.length) {
    const space = clean.lastIndexOf(' ', end);
    if (space > start + max / 2) end = space;
  }
  return `${start > 0 ? '…' : ''}${clean.slice(start, end).trim()}${end < clean.length ? '…' : ''}`;
}

/**
 * How well some texts match the query: a word that starts with a stem counts double a stem inside a word,
 * a field weighs what the caller says (a title more than an overview), and the whole phrase is a bonus.
 */
export function relevance(parts: { text: string; weight: number }[], stems: string[], phrase: string): number {
  const starts = stems.map(s => new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(s)}`, 'iu'));
  const p = phrase.toLowerCase();
  let score = 0;
  for (const { text, weight } of parts) {
    if (!text) continue;
    const lower = text.toLowerCase();
    stems.forEach((s, i) => {
      if (starts[i].test(text)) score += 2 * weight;
      else if (lower.includes(s)) score += weight;
    });
    if (p.length >= MIN_QUERY_LENGTH && lower.includes(p)) score += 3 * weight;
  }
  return score;
}

// ───────── Typos and completions ─────────
// About one query in five has a typo, mostly on phones, and a search that answers "nothing found" to
// "кардеология" loses the visitor (Baymard 2026). The words the site itself uses are the dictionary.

/** The words the site uses, with how many texts use each (a commoner word wins a tie). */
export type Vocabulary = ReadonlyMap<string, number>;

/** Damerau-Levenshtein distance (two letters swapped count as one change); gives up above `max`. */
export function editDistance(a: string, b: string, max = 2): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > max) return max + 1;
  let beforePrev: number[] = [];
  let prev = Array.from({ length: lb + 1 }, (_, j) => j);
  for (let i = 1; i <= la; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= lb; j++) {
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, beforePrev[j - 2] + 1);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    beforePrev = prev;
    prev = cur;
  }
  return prev[lb];
}

/**
 * The vocabulary word a mistyped word was meant to be, or null: the word is fine (some site word starts with its
 * stem), too short to guess (under 4 letters), or nothing is close enough. One change is allowed in short words,
 * two in long ones; the start of a longer word counts too, so a word still being typed is corrected as well.
 */
export function correctToken(token: string, vocab: Vocabulary): string | null {
  if (token.length < 4) return null;
  const st = stem(token);
  for (const w of vocab.keys()) if (w.startsWith(st)) return null;
  const max = token.length <= 5 ? 1 : 2;
  type Pick = { w: string; d: number; n: number };
  const better = (a: Pick, b: Pick | null) => !b || a.d < b.d || (a.d === b.d && (a.n > b.n || (a.n === b.n && a.w.length < b.w.length)));
  let whole: Pick | null = null; // the word was typed completely, with a mistake
  let start: Pick | null = null; // the word is still being typed, with a mistake
  for (const [w, n] of vocab) {
    if (w.length < 4) continue;
    const dw = editDistance(token, w, max);
    if (dw <= max && better({ w, d: dw, n }, whole)) whole = { w, d: dw, n };
    if (w.length > token.length) {
      const ds = editDistance(token, w.slice(0, token.length), max);
      if (ds <= max && better({ w, d: ds, n }, start)) start = { w, d: ds, n };
    }
  }
  // A whole-word match beats a half-word match, however common the other word is
  return (whole ?? start)?.w ?? null;
}

/** The query with every mistyped word replaced, or null when nothing needed (or could be) corrected. */
export function correctQuery(query: string, vocab: Vocabulary): string | null {
  const tokens = tokenize(query);
  if (tokens.length === 0) return null;
  let changed = false;
  const fixed = tokens.map(t => {
    const c = correctToken(t, vocab);
    if (c) changed = true;
    return c ?? t;
  });
  return changed ? fixed.join(' ') : null;
}

/** The query with its last, half-typed word completed by the commonest site words that start with it. */
export function completions(query: string, vocab: Vocabulary, limit = 2): string[] {
  const words = normalizeQuery(query).toLowerCase().split(' ');
  const last = words[words.length - 1] ?? '';
  if (last.length < MIN_QUERY_LENGTH) return [];
  const head = words.slice(0, -1).join(' ');
  return [...vocab]
    .filter(([w]) => w.startsWith(last) && w !== last)
    .sort((x, y) => y[1] - x[1] || x[0].length - y[0].length || x[0].localeCompare(y[0]))
    .slice(0, limit)
    .map(([w]) => (head ? `${head} ${w}` : w));
}
