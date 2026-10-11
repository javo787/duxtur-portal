'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Locale } from './types';

/**
 * Translations for client components.
 *
 * `@/i18n` (index.ts) holds all five languages and is for server components only: importing it from a client
 * component puts every dictionary (~60 KB gzip) into the browser bundle of every page. Client components use
 * `useT()` from here instead. The dictionary of the page's own language (~14 KB gzip) is chosen on the server by
 * Provider.tsx and handed to <I18nProvider> below as a prop, so the browser gets one language, not five.
 *
 * (It is a prop, not five client modules picked on the server: the bundler puts every client module a layout can
 * render into the layout's chunk, so five per-language provider modules shipped all five dictionaries anyway.)
 */
export interface I18n {
  lang: Locale;
  t: (key: string) => string;
}

export const I18nContext = createContext<I18n | null>(null);

/**
 * `t` for one dictionary. A missing key gives the key itself, as the server `T` does when even Russian lacks it
 * (every language has all keys of ru.ts, which i18n/locales.test.ts checks, so there is no runtime fallback to Russian).
 */
export function createI18n(lang: Locale, messages: object): I18n {
  const t = (key: string): string => {
    let node: unknown = messages;
    for (const part of key.split('.')) {
      if (typeof node !== 'object' || node === null) return key;
      node = (node as Record<string, unknown>)[part];
    }
    return typeof node === 'string' ? node : key;
  };
  return { lang, t };
}

/** Client half of Provider.tsx: turns the dictionary it was given into the context value `useT()` reads. */
export function I18nProvider({ lang, messages, children }: { lang: Locale; messages: object; children: ReactNode }) {
  const value = useMemo(() => createI18n(lang, messages), [lang, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): I18n {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error('useT() needs an <I18nProvider> above it (it is rendered by app/[lang]/layout.tsx).');
  }
  return value;
}
