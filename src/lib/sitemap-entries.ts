import type { MetadataRoute } from 'next';
import { articleLanguages, buildArticleAlternates, resolveListLanguage } from './article-lang';
import { BLOG_CATEGORY_PAGES } from './blog-seo';
import { clinicIndexability, indexableListingFacets, type ClinicSeoInput } from './clinic-seo';
import { specialtyIndexable, specialtyStats } from './doctor-seo';
import { BASE_URL, SEO_LANGS, buildAlternates, buildFilterQuery, type AlternateFilters } from './seo';

type DateLike = Date | string | undefined | null;

type Multilingual = Partial<Record<string, string>> | null | undefined;

/** The fields articleLanguages() reads: a language is listed only if the article page can really show it. */
export type SitemapArticle = {
  slug: string;
  /** Decides which /blog/c/<category> landing pages have something to list. */
  category?: string | null;
  updatedAt?: DateLike;
  title?: Multilingual;
  overview?: Multilingual;
  symptoms?: Multilingual;
  causes?: Multilingual;
  diagnosis_treatment?: Multilingual;
  prevention?: Multilingual;
  section1_content?: Multilingual;
  section2_content?: Multilingual;
  section3_content?: Multilingual;
  section4_content?: Multilingual;
  section5_content?: Multilingual;
};

export interface SitemapDoctor {
  slug?: string;
  _id: unknown;
  updatedAt?: DateLike;
  /** Only the Russian name is needed: the specialty pages filter doctors by it. */
  specialty?: { ru?: string } | null;
}

export type SitemapClinic = Pick<ClinicSeoInput, 'slug' | 'status' | 'description' | 'city' | 'type' | 'specialties'> & {
  updatedAt?: DateLike;
};

export interface SitemapData {
  articles: SitemapArticle[];
  doctors: SitemapDoctor[];
  /** Every clinic the directory shows (approved and pre_imported); indexability is decided here. */
  clinics: SitemapClinic[];
  /** Specialty page slug -> Russian name as stored on doctors. A page without an approved doctor stays out. */
  doctorSpecialties: Record<string, string>;
}

/**
 * Next writes `<loc>${url}</loc>` without escaping (checked against the installed version, and pinned by
 * a test), so a URL with two query parameters would make the whole sitemap invalid XML.
 */
export function escapeXmlUrl(url: string): string {
  return url.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function toDate(value: DateLike): Date | undefined {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** The newest real modification date, or undefined. A date we do not know is better left out than faked with "now". */
export function latest(...values: DateLike[]): Date | undefined {
  let best: Date | undefined;
  for (const v of values) {
    const d = toDate(v);
    if (d && (!best || d > best)) best = d;
  }
  return best;
}

type Freq = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

export function buildSitemapEntries(data: SitemapData): MetadataRoute.Sitemap {
  const languages = SEO_LANGS;

  const entry = (
    path: string,
    opts: {
      lastModified?: Date;
      changeFrequency: Freq;
      priority: number;
      /** Listing filters that make up the query string of the URL (clinic facets). */
      filters?: AlternateFilters;
      /** hreflang -> URL, written as <xhtml:link rel="alternate">. Left out when a page has no translations to point at. */
      hreflang?: Record<string, string>;
    },
  ) => ({
    url: escapeXmlUrl(`${BASE_URL}/${path}${buildFilterQuery(opts.filters)}`),
    // A key with value undefined would still end up as an empty <lastmod>; only add it when it is known.
    ...(opts.lastModified ? { lastModified: opts.lastModified } : {}),
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    // Next writes the href as it is, like <loc>, so it is escaped the same way.
    ...(opts.hreflang
      ? { alternates: { languages: Object.fromEntries(Object.entries(opts.hreflang).map(([code, href]) => [code, escapeXmlUrl(href)])) } }
      : {}),
  });

  // Every page listed per language gets the same hreflang set as its own <link rel="alternate"> tags:
  // buildAlternates is what each of those pages calls, so the sitemap cannot say something else than the HTML.
  const perLang = (path: string, opts: Omit<Parameters<typeof entry>[1], 'hreflang'>) =>
    languages.map((lang) => entry(path ? `${lang}/${path}` : lang, { ...opts, hreflang: buildAlternates(path, lang, opts.filters).languages }));

  const articleDate = latest(...data.articles.map((a) => a.updatedAt));
  const doctorDate = latest(...data.doctors.map((d) => d.updatedAt));
  const clinicDate = latest(...data.clinics.map((c) => c.updatedAt));

  const indexableClinics = data.clinics.filter((c) => clinicIndexability(c).index);
  const facets = indexableListingFacets(data.clinics);

  const articlePages = data.articles.flatMap((article) => {
    // Only the languages the article page itself treats as available (title, overview and a body). A language with
    // a translated title alone opens a noindex page that points at the real version, and must not be listed.
    const readable = new Set<string>(articleLanguages(article));
    const available = languages.filter((lang) => readable.has(lang));
    return available.map((lang) =>
      entry(`${lang}/blog/${article.slug}`, {
        lastModified: toDate(article.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.85,
        // hreflang only between the languages the article really exists in: the page itself says the same.
        hreflang: buildArticleAlternates(BASE_URL, article.slug, available, lang).languages,
      }),
    );
  });

  // Category landing pages (/blog/c/<slug>) that list at least one article. An empty one shows "coming soon": a thin
  // page that must stay out. "Lists" means what the page itself counts: a title in the language the article is shown in.
  const categoryPages = BLOG_CATEGORY_PAGES.flatMap((slug) => {
    const listed = data.articles.filter(
      (a) => a.category === slug && (a.title?.[resolveListLanguage(a, 'ru').contentLang] ?? '').trim().length > 0,
    );
    if (listed.length === 0) return [];
    return perLang(`blog/c/${slug}`, {
      lastModified: latest(...listed.map((a) => a.updatedAt)),
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  });

  return [
    ...perLang('', { lastModified: latest(articleDate, doctorDate, clinicDate), changeFrequency: 'daily', priority: 1.0 }),
    ...perLang('blog', { lastModified: articleDate, changeFrequency: 'daily', priority: 0.9 }),
    ...categoryPages,
    ...perLang('doctors', { lastModified: doctorDate, changeFrequency: 'daily', priority: 0.9 }),
    // /doctors/map is not listed: it is a client-only map with no text for a crawler to read, so it is noindex.
    ...perLang('authors', { lastModified: latest(articleDate, doctorDate), changeFrequency: 'weekly', priority: 0.8 }),
    ...perLang('clinics', { lastModified: clinicDate, changeFrequency: 'daily', priority: 0.9 }),
    // The recruitment page for clinics: robots.txt used to block it.
    ...perLang('clinic/register', { changeFrequency: 'monthly', priority: 0.6 }),
    // City / type / specialty listings with enough clinics to be more than a thin page.
    ...facets.flatMap((facet) =>
      perLang('clinics', { lastModified: facet.lastModified, changeFrequency: 'weekly', priority: 0.7, filters: facet }),
    ),
    // Only clinics that are indexable: the sitemap must never list a page that says noindex.
    ...indexableClinics.flatMap((clinic) =>
      perLang(`clinics/${clinic.slug}`, { lastModified: toDate(clinic.updatedAt), changeFrequency: 'weekly', priority: 0.8 }),
    ),
    ...perLang('about', { changeFrequency: 'monthly', priority: 0.6 }),
    ...perLang('editorial', { changeFrequency: 'monthly', priority: 0.6 }),
    ...articlePages,
    ...data.doctors.flatMap((doctor) =>
      perLang(`doctor/${doctor.slug || String(doctor._id)}`, { lastModified: toDate(doctor.updatedAt), changeFrequency: 'monthly', priority: 0.75 }),
    ),
    // Specialty pages that list at least one doctor, dated by the newest of those doctors (not by "any doctor").
    ...specialtyStats(data.doctors, data.doctorSpecialties)
      .filter((stat) => specialtyIndexable(stat.count))
      .flatMap((stat) =>
        perLang(`doctors/${stat.slug}`, { lastModified: stat.lastModified, changeFrequency: 'weekly', priority: 0.85 }),
      ),
    // /patient/appointments used to be listed here although it is private, disallowed and noindex.
  ];
}
