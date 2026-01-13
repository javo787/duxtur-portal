import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n } from './i18n-config';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

function getLocale(request: NextRequest): string | undefined {
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value;
  if (localeCookie && i18n.locales.includes(localeCookie as any)) {
    return localeCookie;
  }

  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  // @ts-ignore
  return matchLocale(languages, i18n.locales, i18n.defaultLocale);
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Если путь уже содержит локаль (например /ru/...), ничего не делаем
  const pathnameHasLocale = i18n.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Если локали нет, определяем её и редиректим
  const locale = getLocale(request);
  
  // Создаем новый URL
  const newUrl = new URL(
    `/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`,
    request.url
  );

  // Важно: сохраняем параметры запроса (например ?search=...)
  newUrl.search = request.nextUrl.search;
  
  return NextResponse.redirect(newUrl);
}

export const config = {
  // Исправленный matcher: исключаем все системные файлы, картинки и API
  matcher: [
    '/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|site.webmanifest).*)',
  ],
};
