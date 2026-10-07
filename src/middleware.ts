import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { i18n } from "@/i18n-config";
import { isEduPath } from "@/lib/edu-routes";
import { BASE_URL } from "@/lib/seo";

const { auth } = NextAuth(authConfig);

export default async function middleware(request: NextRequest) {
  const { pathname, host } = request.nextUrl;

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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
