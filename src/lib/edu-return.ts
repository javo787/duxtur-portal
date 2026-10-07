/**
 * Where a sign-in on duxtur.org may send the person back to: Duxtur Edu, which lives at /edu on this very site.
 *
 * The Edu page "Sign in with e-mail" opens duxtur.org/<lang>/signup?next=/edu; after the sign-in the person returns to
 * Edu, where "Continue as <name>" finishes the job. `next` comes from a link anybody can craft, so only a plain
 * path under /edu passes: no other host, no protocol-relative "//", no query, no ".." — anything else is ignored and
 * the person lands where they would have landed anyway.
 */
export function eduReturnPath(value: unknown): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 200) return null;
  if (!/^\/edu(\/[A-Za-z0-9._~-]+)*\/?$/.test(raw)) return null;
  if (raw.split('/').some(segment => /^\.+$/.test(segment))) return null;
  return raw;
}
