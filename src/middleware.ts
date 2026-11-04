import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { i18n } from "@/i18n-config";
import { isEduPath } from "@/lib/edu-routes";
import { BASE_URL } from "@/lib/seo";

const { auth } = NextAuth(authConfig);

/**
 * The bare domain (duxtur.org) of the main host. Derived from BASE_URL on purpose: canonical-host.test.ts keeps the
 * bare-domain URL out of this file, so the host is never written down twice.
 */
const APEX_HOST = new URL(BASE_URL).hostname.replace(/^www\./, '');

export default async function middleware(request: NextRequest) {
  const { pathname, host } = request.nextUrl;

  // 0. The bare domain goes to the main host with a PERMANENT redirect (308 keeps the method and the body).
  // A temporary one (307, what Vercel sends for a plain domain redirect) lets Google keep both hosts in the index
  // and split the signals between them. This is the fallback from docs/SEO_GROWTH_PLAN.md (P0-2): it only runs
  // when the request reaches the app, so the Vercel domain setting must not intercept duxtur.org first.
  if (host === APEX_HOST) {
    return NextResponse.redirect(new URL(`${BASE_URL}${pathname}${request.nextUrl.search}`), 308);
  }

  // 1. Redirect from *.vercel.app to the main host
  if (host.endsWith('.vercel.app')) {
    return NextResponse.redirect(
      new URL(`${BASE_URL}${pathname}${request.nextUrl.search}`, request.url),
      301
    );
  }

  // 2a. Duxtur Edu is a separate app proxied under /edu: no locale redirect, no portal auth
  if (isEduPath(pathname)) {
    return NextResponse.next();
  }

  // 2. Skip static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 3. Locale detection
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    const locale = i18n.defaultLocale;
    return NextResponse.redirect(
      new URL(`/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}${request.nextUrl.search}`, request.url)
    );
  }

  // 4. Auth
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pre-existing: NextAuth's wrapper is not typed for a plain request
  return (auth as any)(request);
}

export const config = {
  // edu/api/: Study.tj API calls under /edu are forwarded by a rewrite in next.config.ts and need none of the logic above.
  matcher: ['/((?!api|edu/api/|_next/static|_next/image|favicon.ico).*)'],
};
