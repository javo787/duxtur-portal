import { revalidatePath } from 'next/cache';
import { i18n } from '@/i18n-config';

/**
 * Doctor profile pages are ISR (see app/[lang]/doctor/[id]/page.tsx): rebuilt at most once an hour, and straight
 * away after anything that changes what a profile shows. The route-pattern form drops every doctor in every
 * language in one call; pages are rebuilt lazily on the next visit, so it is cheap.
 */
export function revalidateDoctorPages(): void {
  revalidatePath('/[lang]/doctor/[id]', 'page');
}

/** Every language version of one clinic's public page. */
export function revalidateClinicPage(slug: string): void {
  for (const lang of i18n.locales) revalidatePath(`/${lang}/clinics/${slug}`);
}
