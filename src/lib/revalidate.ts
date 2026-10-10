import { revalidatePath } from 'next/cache';
import { i18n } from '@/i18n-config';

/**
 * The pages below are ISR (see generateStaticParams in each page.tsx): rebuilt at most once an hour, and straight
 * away after anything that changes what they show. The route-pattern form drops every language and every id in one
 * call; pages are rebuilt lazily on the next visit, so it is cheap.
 */

/**
 * Everything that shows doctors or their articles: the profiles, the authors list and the home page (newest articles
 * and authors). Call it after a doctor's profile or status changes, or an article is published or removed.
 */
export function revalidateDoctorPages(): void {
  revalidatePath('/[lang]/doctor/[id]', 'page');
  revalidatePath('/[lang]/authors', 'page');
  revalidatePath('/[lang]', 'page');
}

/** Every clinic page in every language, for changes that are not tied to one slug (moderation, doctors, photos). */
export function revalidateClinicPages(): void {
  revalidatePath('/[lang]/clinics/[slug]', 'page');
}

/** Every language version of one clinic's public page. */
export function revalidateClinicPage(slug: string): void {
  for (const lang of i18n.locales) revalidatePath(`/${lang}/clinics/${slug}`);
}
