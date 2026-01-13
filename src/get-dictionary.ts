import 'server-only';
import type { Locale } from './i18n-config';

const dictionaries = {
  ru: () => import('./dictionaries/ru.json').then((module) => module.default),
  uz: () => import('./dictionaries/uz.json').then((module) => module.default),
  tg: () => import('./dictionaries/tg.json').then((module) => module.default),
  kk: () => import('./dictionaries/kk.json').then((module) => module.default),
  ky: () => import('./dictionaries/ky.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => {
  // Если локаль пришла странная или undefined, берем русскую по умолчанию
  const fn = dictionaries[locale] || dictionaries['ru'];
  return fn();
};
