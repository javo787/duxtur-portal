import 'server-only';
import { auth } from '@/auth';
import { isStaffRole, type Staff } from '@/lib/admin-access';

export type AppRole = 'portal_admin' | 'portal_manager' | 'doctor' | 'clinic' | 'patient';

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

/**
 * The signed-in member of the portal team, or null. An administrator is taken from the session as before. A manager's
 * role is checked against the database every time: the role in the session token lasts up to 30 days, and taking the
 * role away must work at once, not at the next sign-in.
 */
export async function getStaff(): Promise<Staff | null> {
  const session = await auth();
  const user = session?.user as { id?: string; email?: string | null; role?: string } | undefined;
  if (!user?.id || !user.email || !isStaffRole(user.role)) return null;

  if (user.role === 'portal_manager') {
    const { default: dbConnect } = await import('@/lib/mongodb');
    const { default: User } = await import('@/models/User');
    await dbConnect();
    const current = await User.findById(user.id).select('role').lean<{ role?: string } | null>();
    if (current?.role !== 'portal_manager') return null;
  }
  return { userId: user.id, email: user.email, role: user.role };
}

/** First line of every server action of the portal team (administrator or manager). Throws for anybody else. */
export async function requireStaff(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) throw new Error('Unauthorized');
  return staff;
}
