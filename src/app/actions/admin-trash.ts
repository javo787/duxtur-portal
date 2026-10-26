'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/authGuards';
import { purgeTrashItem, restoreTrashItem } from '@/lib/admin-trash';

type Result = void | { error: string };

function refresh() {
  for (const path of ['', '/doctors', '/clinics', '/trash', '/audit']) {
    revalidatePath(`/[lang]/admin/portal${path}`, 'page');
  }
  for (const path of ['/[lang]/doctors', '/[lang]/doctor/[slug]', '/[lang]/clinics', '/[lang]/clinics/[slug]', '/[lang]/blog', '/[lang]/blog/[slug]']) {
    revalidatePath(path, 'page');
  }
}

/** Puts a deleted record back from the trash with everything that was deleted together with it. */
export async function restoreFromTrash(trashId: string): Promise<Result> {
  const admin = await requireRole('portal_admin');
  const result = await restoreTrashItem(trashId, admin);
  if (!result.ok) return { error: result.error };
  refresh();
}

/** Deletes a record from the trash for good (the database would do it after 30 days anyway). */
export async function purgeFromTrash(trashId: string): Promise<Result> {
  const admin = await requireRole('portal_admin');
  const result = await purgeTrashItem(trashId, admin);
  if (!result.ok) return { error: result.error };
  refresh();
}
