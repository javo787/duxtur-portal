import type { NextRequest } from 'next/server';

/**
 * True when a state-changing request was sent by a page of this very site.
 *
 * A browser puts the page's origin in the Origin header of every POST and a web page cannot change it, so a form on
 * another site (the classic cross-site request) shows up with a foreign origin. The session cookie is SameSite=Lax,
 * which is the first wall; this is the second, and it matters most for the calls that decide whose account a Telegram
 * identity ends up in.
 *
 * The host is compared (not a fixed allow-list) so that duxtur.org, www.duxtur.org, a preview and localhost all work.
 */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
