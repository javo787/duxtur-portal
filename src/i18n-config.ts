export const i18n = {
  defaultLocale: 'ru',
  locales: ['ru', 'uz', 'tg', 'kk', 'ky'],
} as const;

export type Locale = (typeof i18n)['locales'][number];
