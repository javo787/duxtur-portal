import type { NextAuthConfig } from 'next-auth';

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

      if (pathname.includes('/admin/write')) {
        if (!isLoggedIn) {
          const lang = pathname.split('/')[1] || 'ru';
          return Response.redirect(new URL(`/${lang}/login`, nextUrl));
        }
        return true;
      }

      if (isLoggedIn && pathname.includes('/login')) {
        const lang = pathname.split('/')[1] || 'ru';
        if (role === 'portal_admin') {
          return Response.redirect(new URL(`/${lang}/admin/portal`, nextUrl));
        }
        if (role === 'clinic') {
          return Response.redirect(new URL(`/${lang}/clinic/admin`, nextUrl));
        }
        return Response.redirect(new URL(`/${lang}/admin`, nextUrl));
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
