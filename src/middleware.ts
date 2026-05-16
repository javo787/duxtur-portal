import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { i18n } from "@/i18n-config";

const { auth } = NextAuth(authConfig);

export default async function middleware(request: NextRequest) {
  const { pathname, host } = request.nextUrl;

  // 1. Redirect from *.vercel.app to duxtur.org
  if (host.endsWith('.vercel.app')) {
    return NextResponse.redirect(
      new URL(`https://duxtur.org${pathname}${request.nextUrl.search}`, request.url),
      301
    );
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
  return (auth as any)(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
