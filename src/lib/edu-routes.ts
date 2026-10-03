import { i18n } from '../i18n-config';

/** Duxtur Edu (active_study) is mounted under this path via a rewrite in next.config.ts. */
export const EDU_BASE = '/edu';

export function isEduPath(pathname: string): boolean {
  return pathname === EDU_BASE || pathname.startsWith(`${EDU_BASE}/`);
}

/**
 * Every page of the portal lives under a locale prefix, so people (and links in articles, bots, search
 * engines) naturally type /ru/edu. Edu is one app for all locales, mounted at /edu without a prefix:
 * send /<locale>/edu[/...] there instead of letting it fall into the [lang] tree and 404.
 *
 * Temporary (307) on purpose: a permanent redirect is cached by browsers for a long time, and Edu may get
 * localized entry pages later. Relative import above: next.config.ts loads this file without the @/ alias.
 */
export const eduLocaleRedirects = [
  {
    source: `/:lang(${i18n.locales.join('|')})${EDU_BASE}/:path*`,
    destination: `${EDU_BASE}/:path*`,
    permanent: false,
  },
];
