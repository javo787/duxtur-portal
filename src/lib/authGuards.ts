import 'server-only';
import { auth } from '@/auth';

export type AppRole = 'portal_admin' | 'doctor' | 'clinic' | 'patient';

/**
 * Проверяет, что у текущей сессии есть одна из allowedRoles, и бросает
 * Error, если нет. Использовать первой строкой в каждом Server Action,
 * который меняет данные или дёргает платный внешний API.
 *
 * Server Actions — это публичные POST-эндпоинты со своим сгенерированным
 * ID, вызываемые напрямую, в обход и UI, и middleware (middleware вообще
 * не видит вызовы server actions так, как видит переходы по страницам).
 * Официальная позиция Next.js: относиться к каждому action как к
 * публичному API-роуту и проверять авторизацию внутри него.
 * https://nextjs.org/docs/app/guides/authentication#server-actions
 */
export async function requireRole(...allowedRoles: AppRole[]) {
  const session = await auth();
  const role = (session?.user as { role?: AppRole } | undefined)?.role;
  const email = session?.user?.email;

  if (!session?.user || !role || !email || !allowedRoles.includes(role)) {
    throw new Error('Unauthorized');
  }

  return { userId: session.user.id as string, email, role };
}
