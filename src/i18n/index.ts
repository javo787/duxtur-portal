import { ru } from './locales/ru'
import { uz } from './locales/uz'
import { tg } from './locales/tg'
import { kk } from './locales/kk'
import { ky } from './locales/ky'
import type { Locale } from './types'

const locales = { ru, uz, tg, kk, ky }

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
