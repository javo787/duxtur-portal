/** Where a person lands after signing in on the doctors' login page, by the role of the account. */
export function homeAfterLogin(role: string | undefined, lang: string): string {
  if (role === 'portal_admin') return `/${lang}/admin/portal`;
  if (role === 'clinic') return `/${lang}/clinic/admin`;
  if (role === 'doctor') return `/${lang}/admin`;
  // A patient account (Telegram, Google, Edu) came to write: the studio opens, the doctor's data is asked at publishing.
  return `/${lang}/write`;
}
