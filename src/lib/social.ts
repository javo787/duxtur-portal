/**
 * Social-link normalization shared by the admin editor, the owner dashboard and the public pages.
 *
 * Facebook is stored as a full https URL: its page addresses come in several shapes
 * (/username, /profile.php?id=..., /p/Page-Name-123...), so a bare handle is not enough.
 */

const FB_HOSTS = new Set([
  'facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com', 'mbasic.facebook.com',
  'fb.com', 'www.fb.com', 'fb.me',
]);
const FB_HANDLE = /^@?[A-Za-z0-9.]{5,50}$/;
const FB_HOST_PREFIX = /^(www\.|m\.|web\.|mbasic\.)?(facebook\.com|fb\.com|fb\.me)(\/|$)/i;
// Paths that are actions (sharing, login...), not pages.
const FB_ACTION_PATHS = /^\/(sharer|share|dialog|login|plugins|tr|l\.php|recover)(\/|\.php|$)/i;

/** Returns the canonical https URL, or null when the input is not a Facebook page/profile link. */
export function normalizeFacebookUrl(input: string): string | null {
  const raw = (input ?? '').trim();
  if (!raw) return null;
  if (/[\s<>"'`\\]/.test(raw)) return null;

  if (FB_HANDLE.test(raw) && !raw.includes('.com') && !raw.includes('.me')) {
    return `https://www.facebook.com/${raw.replace(/^@/, '')}`;
  }

  const withProto = /^https?:\/\//i.test(raw) ? raw : FB_HOST_PREFIX.test(raw) ? `https://${raw}` : null;
  if (!withProto) return null;

  let u: URL;
  try {
    u = new URL(withProto);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  if (!FB_HOSTS.has(u.hostname.toLowerCase())) return null;

  const path = u.pathname.replace(/\/+$/, '');
  if (!path || path === '/') return null;
  if (FB_ACTION_PATHS.test(path)) return null;

  let query = '';
  if (/^\/profile\.php$/i.test(path)) {
    const id = u.searchParams.get('id');
    if (!id || !/^\d{5,25}$/.test(id)) return null;
    query = `?id=${id}`;
  }
  return `https://www.facebook.com${path}${query}`;
}

/** For rendering stored values (anything unsafe or malformed yields null, never a clickable link). */
export function facebookHref(stored?: string | null): string | null {
  return stored ? normalizeFacebookUrl(stored) : null;
}
