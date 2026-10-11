import type { ReactNode } from 'react';
import { getMessages, resolveLocale } from './index';
import { I18nProvider as ClientI18nProvider } from './client';

/**
 * Gives client components the dictionary of `lang` (unknown language: Russian). A server component: all five
 * dictionaries stay on the server and the browser receives only the one it needs.
 */
export default function I18nProvider({ lang, children }: { lang: string; children: ReactNode }) {
  const locale = resolveLocale(lang);
  return (
    <ClientI18nProvider lang={locale} messages={getMessages(locale)}>
      {children}
    </ClientI18nProvider>
  );
}
