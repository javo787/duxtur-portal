import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdminPanel = nextUrl.pathname.includes('/admin');
      const isOnWritePage = nextUrl.pathname.includes('/write');

      if ((isOnAdminPanel || isOnWritePage) && !isLoggedIn) {
        return false;
      }
      
      if (isLoggedIn && nextUrl.pathname.includes('/login')) {
         const lang = nextUrl.pathname.split('/')[1] || 'ru';
         return Response.redirect(new URL(`/${lang}/admin/write`, nextUrl));
      }
      
      return true;
    },
    async session({ session, token }: any) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
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
