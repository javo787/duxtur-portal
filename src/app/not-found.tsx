'use client';

import { useSyncExternalStore } from 'react';
import NotFoundView, { resolveNotFoundLang } from '@/components/NotFoundView';

const noopSubscribe = () => () => {};

/**
 * Root 404: URLs that match no route at all (e.g. /ru/no-such-section). Pages under /[lang] that call
 * notFound() use [lang]/not-found.tsx instead.
 *
 * This runs outside the [lang] layout, so it renders its own <html>. The language is read from the browser URL:
 * the server snapshot is Russian (what the static 404 is built with) and the client switches to the URL's
 * language right after hydration, with no hydration mismatch. Request headers are deliberately not used
 * (this file used to read `x-pathname`, which nothing ever set, and fell back to the Referer).
 */
export default function NotFound() {
  const pathname = useSyncExternalStore(
    noopSubscribe,
    () => window.location.pathname,
    () => '/ru',
  );
  const lang = resolveNotFoundLang(pathname.split('/')[1]);

  return (
    <html lang={lang}>
      <body>
        <NotFoundView lang={lang} />
      </body>
    </html>
  );
}
