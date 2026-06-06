export const BASE_URL = "https://duxtur.org";

const LANGS = ["ru", "uz", "tg", "kk", "ky"] as const;

/** Собирает URL без трейлинг-слэша, даже если путь пустой */
function buildUrl(lang: string, path: string) {
  // Убираем лишние слэши в начале и конце пути
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const pathPart = cleanPath ? `/${cleanPath}` : '';
  return `${BASE_URL}/${lang}${pathPart}`;
}

export function buildAlternates(path: string, currentLang = "ru") {
  // Контролируем, что canonical всегда указывает на текущую языковую версию
  const canonical = buildUrl(currentLang, path);

  // Собираем список альтернативных версий (hreflang)
  const languages: Record<string, string> = {};

  // Добавляем все поддерживаемые языки
  for (const lang of LANGS) {
    languages[lang] = buildUrl(lang, path);
  }

  // Добавляем x-default, указывающий на русскую версию как на основную
  languages['x-default'] = buildUrl('ru', path);

  return {
    canonical,
    languages,
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url.startsWith('/') ? '' : '/'}${item.url}`,
    })),
  };
}
