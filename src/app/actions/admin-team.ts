'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { requireRole } from '@/lib/authGuards';
import { recordAudit } from '@/lib/audit-log';
import { isObjectId } from '@/lib/admin-moderation';

/**
 * Managers are appointed and removed by the administrator only (never by a manager: `requireRole('portal_admin')`).
 * A manager is an existing account that has no other role yet, so nobody loses a doctor or clinic cabinet by being
 * appointed. Removing the role takes effect at once (the role is rechecked in the database, see getStaff); the
 * records the manager managed stay where they are and are the administrator's from then on.
 */

type Result = void | { error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function refresh() {
  revalidatePath('/[lang]/admin/portal/team', 'page');
  revalidatePath('/[lang]/admin/portal/audit', 'page');
}

/** `input` is the submitted form with the `email` of an account that already exists on the portal. */
export async function addManager(input?: unknown): Promise<Result> {
  const admin = await requireRole('portal_admin');
  const raw = (input as { get?: (key: string) => unknown } | null | undefined)?.get?.('email');
  const email = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email)) return { error: 'Введите e-mail аккаунта' };

  await dbConnect();
  const user = await User.findOne({ email }).select('role name').lean<{ _id: unknown; role?: string; name?: string } | null>();
  if (!user) return { error: 'Аккаунта с таким e-mail нет. Человек должен сначала зарегистрироваться или войти на сайт.' };
  if (user.role === 'portal_manager') return { error: 'Этот человек уже менеджер' };
  if (user.role !== 'patient') {
    return { error: 'Менеджером можно сделать только обычный аккаунт. У этого аккаунта другая роль (врач, клиника или администратор).' };
  }

  await User.updateOne({ _id: user._id, role: 'patient' }, { $set: { role: 'portal_manager' } });
  await recordAudit({
    actor: admin, action: 'team.manager_added', entityType: 'user', entityId: String(user._id), entityLabel: email,
  });
  refresh();
}

export async function removeManager(userId: string): Promise<Result> {
  const admin = await requireRole('portal_admin');
  if (!isObjectId(userId)) return { error: 'Некорректный идентификатор' };

  await dbConnect();
  const user = await User.findOneAndUpdate(
    { _id: userId, role: 'portal_manager' }, { $set: { role: 'patient' } }, { projection: 'email' }
  ).lean<{ email?: string } | null>();
  if (!user) return { error: 'Менеджер не найден' };

  await recordAudit({
    actor: admin, action: 'team.manager_removed', entityType: 'user', entityId: userId, entityLabel: user.email,
  });
  refresh();
}
