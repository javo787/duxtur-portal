import { getT } from '@/i18n';

/**
 * UI labels of the two Edu entry links in the home header.
 *
 * A named helper on purpose: `[lang]/page.tsx` has its own local `t(field)` that picks a localized DATABASE field
 * (`field[lang] || field.ru || ''`). Calling it with a UI key such as 'nav.edu' returns '' (no error, no warning),
 * which rendered both links with empty text. UI strings come from getT().
 */
export function eduNavLabels(lang: string): { students: string; teachers: string } {
  const t = getT(lang);
  return { students: t('nav.edu'), teachers: t('nav.eduTeachers') };
}
