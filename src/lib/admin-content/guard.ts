import 'server-only';
import { redirect } from 'next/navigation';
import { getStaff } from '@/lib/authGuards';
import type { Staff } from '@/lib/admin-access';

/** Page-level guard for the whole team (middleware lets the same roles in; this is defense in depth and the manager's role is rechecked in the database). */
export async function assertStaffPage(lang: string): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) redirect(`/${/^[a-z]{2}$/.test(lang) ? lang : 'ru'}/login`);
  return staff;
}

/** Pages only the administrator may open (the team page). A manager is sent back to the panel. */
export async function assertAdminPage(lang: string): Promise<Staff> {
  const staff = await assertStaffPage(lang);
  if (staff.role !== 'portal_admin') redirect(`/${/^[a-z]{2}$/.test(lang) ? lang : 'ru'}/admin/portal`);
  return staff;
}
