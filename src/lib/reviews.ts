/**
 * Reviews of doctors, clinics and articles: the rules that do not need a database.
 *
 * What a visitor sees of the author is only ever the masked name ("Жа*** Н."), never the account or its full name.
 * The mask is made when the review is written and stored with it, so reading reviews does not touch accounts at all.
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

export interface ReviewInput {
  rating: number;
  text: string;
  /** true: the page says "Анонимный пациент" instead of the masked name. */
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
  anonymous: boolean;
  /** The masked name; '' when anonymous or when the account had no usable name. */
  author: string;
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
  const anonymous = doc.isAnonymous !== false;
  const doctor = doc.doctorId as { name?: unknown } | null | undefined;
  const doctorName = doctor && typeof doctor === 'object' && typeof doctor.name === 'string' ? doctor.name : undefined;
  return {
    id: doc._id.toString(),
    rating: doc.rating,
    text: doc.text,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : '',
    anonymous,
    author: anonymous ? '' : doc.authorName || '',
    ...(doctorName ? { doctorName } : {}),
  };
}

/** Average of the stars, one decimal, 0 when there are none. */
export function averageRating(sum: number, count: number): number {
  return count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
}
