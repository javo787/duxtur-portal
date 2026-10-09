/**
 * Reviews of doctors, clinics and articles: the rules that do not need a database.
 *
 * Under a review visitors see one label, chosen by the author: their name as it is in the account ("Жавохир Нурматов"),
 * or, with "hide the name", the masked one ("Жа*** Н."). The label is made when the review is written and stored with
 * it, so reading reviews never touches accounts, and a hidden name is never stored in full next to the review: who
 * wrote it is for the administrator to see through the account link, nobody else.
 */

export const REVIEW_TEXT_MIN = 10;
/** Same as `maxlength` of the Review model, which counts UTF-16 units like String#length. */
export const REVIEW_TEXT_MAX = 500;

/**
 * "Жавохир Нурматов" -> "Жа*** Н."; "Анна" -> "Ан***"; "Ли Ван" -> "Л*** В.".
 * The first name keeps its first two letters (one if it is short), the second word only an initial; only letters
 * count, so a Telegram name like "🔥 javo_77" gives "ja***". "" when there is no usable name: the page then says
 * "Пациент" instead of inventing one.
 */
export function maskName(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const words = raw
    .normalize('NFC')
    .split(/\s+/)
    .map(word => Array.from(word).filter(ch => /[\p{L}\p{M}]/u.test(ch)).join(''))
    .filter(word => /\p{L}/u.test(word));
  if (words.length === 0) return '';

  const first = Array.from(words[0]);
  let masked = `${first.slice(0, first.length >= 4 ? 2 : 1).join('')}***`;
  if (words[1]) masked += ` ${Array.from(words[1])[0].toUpperCase()}.`;
  return masked;
}

/** The account name as people write it: letters and spaces, one line, not too long. '' when there is nothing to show. */
export function cleanName(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const name = raw
    .normalize('NFC')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
    .trim();
  return /\p{L}/u.test(name) ? name : '';
}

/** What goes under the review: the name, or the masked name when the author chose to hide it. */
export function displayName(raw: unknown, hide: boolean): string {
  return hide ? maskName(raw) : cleanName(raw);
}

export interface ReviewInput {
  rating: number;
  text: string;
  /** true: "hide the name", the page shows the masked name instead of the full one. */
  isAnonymous: boolean;
}

export type ReviewInputError = 'rating' | 'text_short' | 'text_long';

export function parseReviewInput(body: unknown): { ok: true; value: ReviewInput } | { ok: false; error: ReviewInputError } {
  const input = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;

  const rating = input.rating;
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: 'rating' };
  }

  const text = (typeof input.text === 'string' ? input.text : '')
    // control characters (but not line breaks) have no place in a review
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (text.length < REVIEW_TEXT_MIN) return { ok: false, error: 'text_short' };
  if (text.length > REVIEW_TEXT_MAX) return { ok: false, error: 'text_long' };

  return { ok: true, value: { rating, text, isAnonymous: input.isAnonymous === true } };
}

/** The only shape of a review that leaves the server for visitors. */
export interface PublicReview {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
  /** The name, or the masked name, as the author chose; '' when the account had none (or an old anonymous review). */
  author: string;
  /** Old review written as anonymous, with no name under it: the page says "Анонимный пациент". */
  anonymous: boolean;
  /** Clinic page only: the doctor the review is about. */
  doctorName?: string;
}

interface StoredReview {
  _id: { toString(): string };
  rating: number;
  text: string;
  createdAt?: Date | string;
  isAnonymous?: boolean;
  authorName?: string;
  doctorId?: unknown;
}

export function toPublicReview(doc: StoredReview): PublicReview {
  const author = typeof doc.authorName === 'string' ? doc.authorName : '';
  const doctor = doc.doctorId as { name?: unknown } | null | undefined;
  const doctorName = doctor && typeof doctor === 'object' && typeof doctor.name === 'string' ? doctor.name : undefined;
  return {
    id: doc._id.toString(),
    rating: doc.rating,
    text: doc.text,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : '',
    author,
    anonymous: !author && doc.isAnonymous !== false,
    ...(doctorName ? { doctorName } : {}),
  };
}

/** Average of the stars, one decimal, 0 when there are none. */
export function averageRating(sum: number, count: number): number {
  return count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
}
