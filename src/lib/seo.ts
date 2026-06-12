export const BASE_URL = "https://duxtur.org";

const LANGS = ["ru", "uz", "tg", "kk", "ky"] as const;

/** Собирает URL без трейлинг-слэша, даже если путь пустой */
function buildUrl(lang: string, path: string) {
  // Убираем лишние слэши в начале и конце пути
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const pathPart = cleanPath ? `/${cleanPath}` : '';
  return `${BASE_URL}/${lang}${pathPart}`;
}

export function buildAlternates(path: string, currentLang = "ru", filters?: Record<string, string | number | undefined>) {
  // Build query string if filters are provided
  let queryString = "";
  if (filters) {
    const params = new URLSearchParams();
    // Only include significant filters for SEO
    if (filters.city) params.set('city', filters.city);
    if (filters.type) params.set('type', filters.type);
    if (filters.specialty) params.set('specialty', filters.specialty);

    const qs = params.toString();
    if (qs) queryString = `?${qs}`;
  }

  // Контролируем, что canonical всегда указывает на текущую языковую версию
  const canonical = buildUrl(currentLang, path) + queryString;

  // Собираем список альтернативных версий (hreflang)
  const languages: Record<string, string> = {};

  // Добавляем все поддерживаемые языки
  for (const lang of LANGS) {
    languages[lang] = buildUrl(lang, path) + queryString;
  }

  // Добавляем x-default, указывающий на русскую версию как на основную
  languages['x-default'] = buildUrl('ru', path) + queryString;

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
