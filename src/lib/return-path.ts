import { eduReturnPath } from '@/lib/edu-return';
import { i18n } from '@/i18n-config';

/**
 * Where a sign-in or sign-up page may send the person afterwards ("?next=...").
 *
 * `next` comes from a link anybody can craft, so only two kinds of plain path pass:
 *  - Duxtur Edu (/edu, /edu/...): see edu-return.ts;
 *  - the page of a doctor, clinic or article they came from to leave a review: /<lang>/doctor/<id>,
 *    /<lang>/clinics/<slug>, /<lang>/blog/<slug>.
 * No other host, no protocol-relative "//", no query or fragment, no "..": anything else is ignored and the person
 * lands where they would have landed anyway.
 */

const SEGMENT = '(?:[A-Za-z0-9._~-]|%[0-9A-Fa-f]{2})+';
const REVIEW_PAGE = new RegExp(`^/(?:${i18n.locales.join('|')})/(?:doctor|clinics|blog)/${SEGMENT}/?$`);

function isDotSegment(segment: string): boolean {
  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    return true;
  }
  // "%2e%2e" is ".." to a URL parser, and an encoded slash or backslash would add a path level behind our back.
  return /^\.+$/.test(decoded) || /[\\/]/.test(decoded);
}

export function reviewReturnPath(value: unknown): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 300) return null;
  if (!REVIEW_PAGE.test(raw)) return null;
  if (raw.split('/').some(isDotSegment)) return null;
  return raw;
}

export function returnPath(value: unknown): string | null {
  return eduReturnPath(value) ?? reviewReturnPath(value);
}
