import type { ru } from './locales/ru'

type RecursiveKeys<T, Prefix extends string = ''> =
  T extends string
    ? Prefix
    : {
        [K in keyof T]: K extends string
          ? RecursiveKeys<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>
          : never
      }[keyof T]

export type TranslationKey = RecursiveKeys<typeof ru>

type DeepString<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? DeepString<T[K]>
    : string
}

export type Translations = DeepString<typeof ru>
export type Locale = 'ru' | 'uz' | 'tg' | 'kk' | 'ky'
