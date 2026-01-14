import NextAuth from 'next-auth';
import { authConfig } from './auth.config'; // Исправлено: убрали 'src/'
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { i18n } from "./i18n-config"; // Исправлено: убрали 'src/'

// 1. Инициализируем NextAuth
const { auth } = NextAuth(authConfig);

export async function middleware(request: NextRequest) {
  // 2. Логика i18n (Языки)
  const pathname = request.nextUrl.pathname;
  
  // Игнорируем системные файлы
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // файлы (картинки, фавикон)
  ) {
    return NextResponse.next();
  }

  // Проверяем, есть ли язык в URL
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Если языка нет -> редирект на /ru/...
  if (pathnameIsMissingLocale) {
    const locale = i18n.defaultLocale;
    return NextResponse.redirect(
      new URL(`/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, request.url)
    );
  }

  // 3. Вызываем NextAuth (Проверка пароля)
  return auth(request);
}

export const config = {
  // На каких страницах запускать middleware
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
