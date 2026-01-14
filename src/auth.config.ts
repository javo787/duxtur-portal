import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login', // Если не авторизован, кидаем сюда
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdminPanel = nextUrl.pathname.includes('/admin');
      const isOnWritePage = nextUrl.pathname.includes('/write');

      // ЗАЩИТА РОУТОВ
      // Если пытается зайти в админку или редактор без логина -> на страницу входа
      if ((isOnAdminPanel || isOnWritePage) && !isLoggedIn) {
        return false;
      }
      
      // Если уже вошел и пытается открыть /login -> кидаем в админку
      if (isLoggedIn && nextUrl.pathname.includes('/login')) {
         // Получаем язык из URL или дефолтный
         const lang = nextUrl.pathname.split('/')[1] || 'ru';
         return Response.redirect(new URL(`/${lang}/admin/write`, nextUrl));
      }
      
      return true;
    },
    // Добавляем ID пользователя в сессию, чтобы искать его профиль
    async session({ session, token }: any) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id; // sub - это стандартное поле для ID
      }
      return token;
    }
  },
  providers: [], // Провайдеры подключены в auth.ts
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 дней (Врач не вводит пароль месяц)
  },
} satisfies NextAuthConfig;
