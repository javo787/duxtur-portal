// Server components only. Client components use useT() from '@/i18n/client': importing this module from one
// ships all five dictionaries (~60 KB gzip) to the browser on every page.
import 'server-only'
import { ru } from './locales/ru'
import { uz } from './locales/uz'
import { tg } from './locales/tg'
import { kk } from './locales/kk'
import { ky } from './locales/ky'
import type { Locale } from './types'

const locales = { ru, uz, tg, kk, ky }

/** A supported language code, or Russian for anything else (an own-property check, so "constructor" is not a language). */
export function resolveLocale(lang: string): Locale {
  return Object.hasOwn(locales, lang) ? (lang as Locale) : 'ru'
}

/** The whole dictionary of one language, for the client provider (see Provider.tsx). */
export function getMessages(lang: Locale) {
  return locales[lang]
}

function get(obj: any, path: string): string {
  const result = path.split('.').reduce((acc: any, key: string) => acc?.[key], obj)
  if (typeof result === 'string') return result
  // fallback to Russian
  const ruResult = path.split('.').reduce((acc: any, key: string) => acc?.[key], ru)
  return typeof ruResult === 'string' ? ruResult : path
}

export function T(key: string, lang: string): string {
  const locale = (locales as any)[lang] ?? locales.ru
  return get(locale, key)
}

export function getT(lang: string) {
  return (key: string) => T(key, lang)
}

export function useT(lang: string) {
  const t = (key: string) => T(key, lang)
  return { t, lang: lang as Locale }
}

export type { TranslationKey, Locale } from './types'
