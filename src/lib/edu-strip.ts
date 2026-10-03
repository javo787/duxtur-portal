import { i18n } from '../i18n-config';

// First path segment (after the locale) of pages where the strip would be noise: accounts, admin areas, auth flows.
const HIDDEN_SECTIONS = new Set([
  'admin',
  'login',
  'register',
  'signup',
  'forgot-password',
  'reset-password',
  'clinic', // /clinic/admin, /clinic/register (public clinic pages are under /clinics)
]);

/**
 * The strip is the one shared entry point to /edu for pages that have their own, differently built headers
 * (blog, doctors, search, about, ...). Hidden on the home page, whose header already carries the link, and in
 * account/admin/auth areas.
 */
export function shouldShowEduStrip(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return false;

  const [first, ...rest] = segments;
  const hasLocale = (i18n.locales as readonly string[]).includes(first);
  const section = hasLocale ? rest[0] : first;

  if (!section) return false; // locale root = home page
  return !HIDDEN_SECTIONS.has(section);
}
