import 'server-only';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

/** Page-level guard (middleware already protects /admin/portal; this is defense in depth). */
export async function assertAdminPage(lang: string): Promise<void> {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== 'portal_admin') {
    redirect(`/${lang}/login`);
  }
}
