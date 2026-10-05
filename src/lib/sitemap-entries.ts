import type { MetadataRoute } from 'next';
import { clinicIndexability, indexableListingFacets, type ClinicSeoInput } from './clinic-seo';
import { BASE_URL, SEO_LANGS, buildFilterQuery } from './seo';

type DateLike = Date | string | undefined | null;

export interface SitemapArticle {
  slug: string;
  updatedAt?: DateLike;
  title?: Partial<Record<string, string>>;
}

export interface SitemapDoctor {
  slug?: string;
  _id: unknown;
  updatedAt?: DateLike;
}

export type SitemapClinic = Pick<ClinicSeoInput, 'slug' | 'status' | 'description' | 'city' | 'type' | 'specialties'> & {
  updatedAt?: DateLike;
};

export interface SitemapData {
  articles: SitemapArticle[];
  doctors: SitemapDoctor[];
  /** Every clinic the directory shows (approved and pre_imported); indexability is decided here. */
  clinics: SitemapClinic[];
  doctorSpecialtySlugs: string[];
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

  const entry = (path: string, opts: { lastModified?: Date; changeFrequency: Freq; priority: number; query?: string }) => ({
    url: escapeXmlUrl(`${BASE_URL}/${path}${opts.query ?? ''}`),
    // A key with value undefined would still end up as an empty <lastmod>; only add it when it is known.
    ...(opts.lastModified ? { lastModified: opts.lastModified } : {}),
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
  });

  const perLang = (path: string, opts: Parameters<typeof entry>[1]) =>
    languages.map((lang) => entry(path ? `${lang}/${path}` : lang, opts));

  const articleDate = latest(...data.articles.map((a) => a.updatedAt));
  const doctorDate = latest(...data.doctors.map((d) => d.updatedAt));
  const clinicDate = latest(...data.clinics.map((c) => c.updatedAt));

  const indexableClinics = data.clinics.filter((c) => clinicIndexability(c).index);
  const facets = indexableListingFacets(data.clinics);

  const articlePages = data.articles.flatMap((article) => {
    // Only the languages that actually have a translated title.
    const available = languages.filter((lang) => (article.title?.[lang]?.trim().length ?? 0) > 5);
    return available.map((lang) =>
      entry(`${lang}/blog/${article.slug}`, { lastModified: toDate(article.updatedAt), changeFrequency: 'weekly', priority: 0.85 }),
    );
  });

  return [
    ...perLang('', { lastModified: latest(articleDate, doctorDate, clinicDate), changeFrequency: 'daily', priority: 1.0 }),
    ...perLang('blog', { lastModified: articleDate, changeFrequency: 'daily', priority: 0.9 }),
    ...perLang('doctors', { lastModified: doctorDate, changeFrequency: 'daily', priority: 0.9 }),
    ...perLang('doctors/map', { lastModified: doctorDate, changeFrequency: 'daily', priority: 0.9 }),
    ...perLang('authors', { lastModified: latest(articleDate, doctorDate), changeFrequency: 'weekly', priority: 0.8 }),
    ...perLang('clinics', { lastModified: clinicDate, changeFrequency: 'daily', priority: 0.9 }),
    // The recruitment page for clinics: robots.txt used to block it.
    ...perLang('clinic/register', { changeFrequency: 'monthly', priority: 0.6 }),
    // City / type / specialty listings with enough clinics to be more than a thin page.
    ...facets.flatMap((facet) =>
      perLang('clinics', { lastModified: facet.lastModified, changeFrequency: 'weekly', priority: 0.7, query: buildFilterQuery(facet) }),
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
    ...data.doctorSpecialtySlugs.flatMap((specialty) =>
      perLang(`doctors/${specialty}`, { lastModified: doctorDate, changeFrequency: 'weekly', priority: 0.85 }),
    ),
    // /patient/appointments used to be listed here although it is private, disallowed and noindex.
  ];
}
