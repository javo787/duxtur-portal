/**
 * The ONE host every canonical, hreflang, sitemap, robots and JSON-LD URL is built on.
 * It must be the host that answers 200 without a redirect: www.duxtur.org in production (the Telegram webhook
 * is registered there for the same reason). The bare duxtur.org must redirect here permanently (Vercel > Domains).
 * canonical-host.test.ts keeps a second host from sneaking back into the metadata.
 */
export const BASE_URL = "https://www.duxtur.org";

export const SEO_LANGS = ["ru", "uz", "tg", "kk", "ky"] as const;
export type SeoLang = (typeof SEO_LANGS)[number];

const LANGS = SEO_LANGS;

/** og:locale per site language (the root layout used to hard-code ru_RU for every language). */
const OG_LOCALES: Record<SeoLang, string> = {
  ru: "ru_RU",
  uz: "uz_UZ",
  tg: "tg_TJ",
  kk: "kk_KZ",
  ky: "ky_KG",
};

export function ogLocale(lang: string): string {
  return OG_LOCALES[lang as SeoLang] ?? OG_LOCALES.ru;
}

/** The other languages of the site, for og:locale:alternate. */
export function ogAlternateLocales(lang: string): string[] {
  return LANGS.filter((l) => l !== lang).map((l) => OG_LOCALES[l]);
}

/**
 * Serialize JSON-LD for an inline <script type="application/ld+json">.
 * Plain JSON.stringify is NOT safe there: a clinic or doctor name containing "</script>" would
 * close the tag and let the rest run as HTML. "<" is escaped, which is still valid JSON.
 */
export function safeJsonLd(data: unknown): string {
  return (JSON.stringify(data) ?? "null")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** Собирает URL без трейлинг-слэша, даже если путь пустой */
function buildUrl(lang: string, path: string) {
  // Убираем лишние слэши в начале и конце пути
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const pathPart = cleanPath ? `/${cleanPath}` : '';
  return `${BASE_URL}/${lang}${pathPart}`;
}

export type AlternateFilters = {
  city?: string;
  type?: string;
  specialty?: string;
  page?: number | string;
  /** Accepted so a whole filter object can be passed in, but never part of a canonical URL. */
  q?: string;
  sort?: string;
};

/**
 * Query string for the filters that define a distinct, indexable listing.
 * Order is fixed (city, type, specialty, page) so a URL always has exactly one spelling.
 * `q` and `sort` are deliberately left out: they never get their own canonical URL.
 */
export function buildFilterQuery(filters?: AlternateFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.city) params.set("city", String(filters.city));
  if (filters.type) params.set("type", String(filters.type));
  if (filters.specialty) params.set("specialty", String(filters.specialty));
  const page = Math.floor(Number(filters.page));
  // Page 1 is the listing itself; later pages are real pages with their own content and self-canonical.
  if (Number.isFinite(page) && page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Absolute URL of a localized page, with the canonical filter query when given. */
export function buildPageUrl(lang: string, path: string, filters?: AlternateFilters): string {
  return buildUrl(lang, path) + buildFilterQuery(filters);
}

export function buildAlternates(path: string, currentLang = "ru", filters?: AlternateFilters) {
  const queryString = buildFilterQuery(filters);

  // Canonical always points at the current language version
  const canonical = buildUrl(currentLang, path) + queryString;

  // All supported language versions (hreflang), self-reference included
  const languages: Record<string, string> = {};
  for (const lang of LANGS) {
    languages[lang] = buildUrl(lang, path) + queryString;
  }

  // x-default points at the Russian version as the main one
  languages["x-default"] = buildUrl("ru", path) + queryString;

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
