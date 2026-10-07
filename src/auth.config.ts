import type { NextAuthConfig } from 'next-auth';
import { eduReturnPath } from '@/lib/edu-return';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as any)?.role;
      const pathname = nextUrl.pathname;

      if (pathname.includes('/admin/portal')) {
        if (!isLoggedIn || role !== 'portal_admin') {
          const lang = pathname.split('/')[1] || 'ru';
          return Response.redirect(new URL(`/${lang}/login`, nextUrl));
        }
        return true;
      }

      // Кабинет врача — ровно "/xx/admin" без вложенных сегментов.
      // Точный паттерн вместо .includes('/admin'), чтобы не задеть
      // /admin/portal (обработан выше) и /clinic/admin.
      // (Старая проверка на "/admin/write" была мёртвой веткой — такого
      // роута больше нет, WriteTab теперь просто вкладка внутри /admin.)
      if (/^\/[a-z]{2}\/admin\/?$/.test(pathname)) {
        const lang = pathname.split('/')[1] || 'ru';
        if (!isLoggedIn) {
          return Response.redirect(new URL(`/${lang}/login`, nextUrl));
        }
        // Signed in, but not (yet) a doctor: the writing studio is their place. It used to send them to the login
        // page, which sent them back here (a loop) for anyone signed in as a patient.
        if (role !== 'doctor') {
          const home = role === 'portal_admin' ? `/${lang}/admin/portal` : role === 'clinic' ? `/${lang}/clinic/admin` : `/${lang}/write`;
          return Response.redirect(new URL(home, nextUrl));
        }
        return true;
      }

      // Came here from Duxtur Edu ("Sign in with e-mail") and is signed in already: straight back to Edu.
      const back = eduReturnPath(nextUrl.searchParams.get('next'));
      if (isLoggedIn && back && /^\/[a-z]{2}\/(login|signup)\/?$/.test(pathname)) {
        return Response.redirect(new URL(back, nextUrl));
      }

      if (isLoggedIn && pathname.includes('/login')) {
        const lang = pathname.split('/')[1] || 'ru';
        if (role === 'portal_admin') {
          return Response.redirect(new URL(`/${lang}/admin/portal`, nextUrl));
        }
        if (role === 'clinic') {
          return Response.redirect(new URL(`/${lang}/clinic/admin`, nextUrl));
        }
        return Response.redirect(new URL(role === 'doctor' ? `/${lang}/admin` : `/${lang}/write`, nextUrl));
      }

      return true;
    },
    async session({ session, token }: any) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as any).role;
      }
      return token;
    }
  },
  providers: [],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
} satisfies NextAuthConfig;
