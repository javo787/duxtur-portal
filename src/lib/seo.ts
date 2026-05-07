const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://duxtur-portal.vercel.app";

const LANGS = ["ru", "uz", "tg", "kk", "ky"] as const;

/** Собирает URL без трейлинг-слэша, даже если путь пустой */
function buildUrl(lang: string, path: string) {
  const cleanPath = path ? `/${path}` : '';
  return `${BASE_URL}/${lang}${cleanPath}`;
}

export function buildAlternates(path: string, currentLang = "ru") {
  const canonical = buildUrl(currentLang, path);
  const languages = Object.fromEntries(
    LANGS.map((l) => [l, buildUrl(l, path)])
  ) as Record<(typeof LANGS)[number], string> & { 'x-default': string };

  return {
    canonical,
    languages: {
      ...languages,
      'x-default': buildUrl('ru', path),   // всегда русский как дефолт
    },
  };
}
