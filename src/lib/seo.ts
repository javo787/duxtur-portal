export const BASE_URL = "https://duxtur.org";

const LANGS = ["ru", "uz", "tg", "kk", "ky"] as const;

/** Собирает URL без трейлинг-слэша, даже если путь пустой */
function buildUrl(lang: string, path: string) {
  const cleanPath = path ? `/${path}` : '';
  // Убеждаемся, что нет двойных слэшей и BASE_URL правильный
  return `${BASE_URL}/${lang}${cleanPath}`;
}

export function buildAlternates(path: string, currentLang = "ru") {
  const canonical = buildUrl(currentLang, path);
  const languages = Object.fromEntries(
    LANGS.map((l) => [l, buildUrl(l, path)])
  ) as Record<(typeof LANGS)[number], string> & { 'x-default': string };

  // Unit-test-style console.assert in development mode to catch any missing language keys
  if (process.env.NODE_ENV === 'development') {
    LANGS.forEach(lang => {
      if (!languages[lang]) {
        console.error(`SEO Warning: Missing hreflang for ${lang}`);
      }
    });
  }

  return {
    canonical,
    languages: {
      ...languages,
      'x-default': buildUrl('ru', path),   // всегда русский как дефолт
    },
  };
}
