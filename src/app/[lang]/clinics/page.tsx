import ClinicCard from './_components/ClinicCard';
import ClinicFilters from './_components/ClinicFilters';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { getT, Locale } from '@/i18n';
import HomeFooter from '@/components/home/HomeFooter';
import type { Metadata } from 'next';
import { buildAlternates, buildBreadcrumbJsonLd, buildFilterQuery, ogAlternateLocales, ogLocale, safeJsonLd } from '@/lib/seo';
import { ALLOWED_CITIES, CLINIC_TYPES, ClinicDocument } from '@/lib/clinic-constants';
import { sanitizeSearchParams } from '@/lib/validation';
import { getClinicsPage, getIndexableFacets } from '@/lib/clinic-service';
import {
  buildClinicListJsonLd,
  buildListingHeading,
  buildListingMetadataText,
  listingIndexable,
  type ListingFilters,
} from '@/lib/clinic-seo';
import { clinicSerif } from '@/lib/fonts';
import { btnPrimary, btnQuiet } from './[slug]/_components/shared';

export const revalidate = 3600; // 1 hour

const PAGE_SIZE = 20;
const MAX_BROWSE_LINKS = 24;

type SearchParams = { city?: string; type?: string; specialty?: string; q?: string; page?: string; sort?: string };

/** The one place that turns the query string into data, shared by generateMetadata and the page. */
async function loadListing(lang: string, rawParams: SearchParams) {
  const filters = sanitizeSearchParams(rawParams);
  const { clinics, total } = await getClinicsPage(
    filters.city ?? '',
    filters.type ?? '',
    filters.specialty ?? '',
    filters.q ?? '',
    filters.sort ?? '',
    filters.page,
    PAGE_SIZE,
  );
  const totalPages = Math.ceil(total / PAGE_SIZE);
  // ?page=99 on a three-page listing is empty: not worth indexing, whatever the total says.
  const pageInRange = filters.page === 1 || filters.page <= totalPages;
  const indexable = listingIndexable(filters, total) && pageInRange;
  return { lang, filters: filters as ListingFilters, clinics: clinics as ClinicDocument[], total, totalPages, indexable };
}

export async function generateMetadata({ params, searchParams }: {
  params: Promise<{ lang: string }>,
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const { lang } = (await params) as { lang: Locale };
  const { filters, total, indexable } = await loadListing(lang, await searchParams);
  const t = getT(lang);
  const { title, description } = buildListingMetadataText({ filters, total, lang, t });

  // Search results are never a page of their own: no canonical either, since pointing it at the plain
  // listing while saying noindex would send two different signals.
  if (filters.q) return { title, robots: { index: false, follow: true } };

  const alternates = buildAlternates('clinics', lang, filters);
  const fullTitle = `${title} | Duxtur.org`;

  return {
    title,
    description,
    // Thin facets (fewer than 3 clinics), empty pages and out-of-range pages: crawl the links, keep them out of the index.
    ...(indexable ? {} : { robots: { index: false, follow: true } }),
    // hreflang only makes sense between indexable pages.
    alternates: indexable ? alternates : { canonical: alternates.canonical },
    openGraph: {
      type: 'website',
      siteName: 'Duxtur.org',
      title: fullTitle,
      description,
      url: alternates.canonical,
      locale: ogLocale(lang),
      alternateLocale: ogAlternateLocales(lang),
      images: [{ url: 'https://duxtur.org/og-default.png', width: 1424, height: 752, alt: title }],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: ['https://duxtur.org/og-default.png'] },
  };
}

export default async function ClinicsDirectoryPage({ params, searchParams }: {
  params: Promise<{ lang: string }>,
  searchParams: Promise<SearchParams>
}) {
  const { lang } = (await params) as { lang: Locale };
  const [{ filters, clinics, total, totalPages }, allFacets] = await Promise.all([
    loadListing(lang, await searchParams),
    getIndexableFacets(),
  ]);
  const t = getT(lang);

  const page = filters.page;
  const isFiltered = !!(filters.city || filters.type || filters.specialty);
  // The H1 follows the filter ("Стоматология — Душанбе"); the unfiltered page keeps its plain title.
  const heading = isFiltered ? buildListingHeading(filters, lang, t) : t('clinic.title');

  // Structured Data: list items carry only url + name, the details live on the clinic's own page.
  const itemListJsonLd = buildClinicListJsonLd({
    clinics,
    lang,
    name: heading,
    filters,
    offset: (page - 1) * PAGE_SIZE,
  });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: t('nav.home'), url: `/${lang}` },
    { name: t('clinic.title'), url: `/${lang}/clinics` },
    ...(isFiltered ? [{ name: heading, url: `/${lang}/clinics${buildFilterQuery({ ...filters, page: 1 })}` }] : []),
  ]);

  // City / type / specialty are native <select>s in a GET form, which crawlers never submit. These plain links are
  // how the listings that rank for "стоматология Душанбе" are reachable from the directory itself.
  const currentQuery = buildFilterQuery({ ...filters, page: 1 });
  const browseLinks = filters.q
    ? []
    : allFacets
        .map(f => ({ href: `/${lang}/clinics${buildFilterQuery(f)}`, label: buildListingHeading({ ...f, page: 1 }, lang, t), query: buildFilterQuery(f) }))
        .filter(l => l.query !== currentQuery)
        .slice(0, MAX_BROWSE_LINKS);

  // Helper to build search URL with current filters
  const buildSearchUrl = (newParams: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    if (filters.city) params.set('city', filters.city);
    if (filters.type) params.set('type', filters.type);
    if (filters.specialty) params.set('specialty', filters.specialty);
    if (filters.q) params.set('q', filters.q);
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.page) params.set('page', filters.page.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined) params.delete(key);
      else params.set(key, String(value));
    });

    // The first page is the listing itself: ?page=1 would be a second URL for the same page, and an empty query
    // would leave a dangling "?".
    if (params.get('page') === '1') params.delete('page');
    const qs = params.toString();
    return `/${lang}/clinics${qs ? `?${qs}` : ''}`;
  };

  // Active filters, each removable on its own
  const typeLabel = filters.type ? t('clinic.type_' + filters.type) : '';
  const specialtyKey = filters.specialty ? 'clinic.specialty_' + filters.specialty : '';
  const specialtyLabel = specialtyKey ? (t(specialtyKey) === specialtyKey ? filters.specialty : t(specialtyKey)) : '';
  const chips = [
    filters.city && { key: 'city', label: filters.city },
    filters.type && { key: 'type', label: typeLabel },
    filters.specialty && { key: 'specialty', label: specialtyLabel },
    filters.q && { key: 'q', label: `«${filters.q}»` },
  ].filter(Boolean) as { key: string; label: string }[];
  const activeCount = [filters.city, filters.type, filters.specialty].filter(Boolean).length;

  const sorts = [
    { value: undefined, label: t('doctors.rating') },
    { value: 'reviews', label: t('clinic.sortReviews') },
    { value: 'doctors', label: t('clinic.sortDoctors') },
  ];

  return (
    <div className={`${clinicSerif.variable} min-h-screen bg-background text-foreground`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />

      <nav className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 text-sm md:px-8">
        <Link href={`/${lang}`} className="font-clinic text-base font-semibold">
          duxtur<span className="text-primary">.org</span>
        </Link>
        <Link href={`/${lang}/clinic/register`} className="font-medium text-primary underline-offset-4 hover:underline">
          {t('clinic.registerClinic')}
        </Link>
      </nav>

      <main className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
        <h1 className="pt-4 pb-5 font-clinic text-[2rem] leading-[1.1] font-semibold tracking-[-0.01em] md:pt-8 md:pb-6 md:text-5xl">
          {heading}
        </h1>

        <form id="clinic-search" method="get" action={`/${lang}/clinics`} role="search" className="flex gap-2">
          {filters.sort && <input type="hidden" name="sort" value={filters.sort} />}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-foreground/50" aria-hidden="true" />
            <input
              type="search"
              name="q"
              defaultValue={filters.q}
              placeholder={t('clinic.searchPlaceholder')}
              aria-label={t('clinic.searchPlaceholder')}
              className="min-h-12 w-full rounded-lg border border-border bg-background pr-3 pl-11 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
          </div>
          <button type="submit" className={btnPrimary}>
            {t('common.search')}
          </button>
        </form>

        <div className="mt-5 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-x-12">
          <aside className="lg:sticky lg:top-6">
            <ClinicFilters
              cities={ALLOWED_CITIES}
              types={CLINIC_TYPES}
              currentCity={filters.city}
              currentType={filters.type}
              currentSpecialty={filters.specialty}
              activeCount={activeCount}
              lang={lang}
            />
          </aside>

          <section aria-label={t('clinic.title')} className="mt-6 min-w-0 lg:mt-0">
            {chips.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {chips.map(c => (
                  <Link
                    key={c.key}
                    href={buildSearchUrl({ [c.key]: undefined, page: undefined })}
                    aria-label={`${t('common.reset')}: ${c.label}`}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-muted px-3 text-sm hover:bg-border"
                  >
                    {c.label}
                    <X className="size-3.5" aria-hidden="true" />
                  </Link>
                ))}
                <Link href={`/${lang}/clinics`} className="px-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
                  {t('doctors.resetFilters')}
                </Link>
              </div>
            )}

            {clinics.length > 0 && (
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 text-sm">
                <p className="font-semibold">{t('clinic.found').replace('{count}', total.toString())}</p>
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-foreground/60">{t('doctors.sortBy')}</span>
                  {sorts.map(o => {
                    const active = (filters.sort ?? undefined) === o.value;
                    return (
                      <Link
                        key={o.label}
                        href={buildSearchUrl({ sort: o.value, page: undefined })}
                        aria-current={active ? 'true' : undefined}
                        className={active ? 'font-semibold underline underline-offset-4' : 'text-foreground/70 hover:text-foreground'}
                      >
                        {o.label}
                      </Link>
                    );
                  })}
                </p>
              </div>
            )}

            {clinics.length === 0 ? (
              <div className="border-t border-border py-16 text-center">
                <p className="font-clinic text-2xl font-semibold">{t('common.noResults')}</p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-border border-t border-border">
                  {clinics.map((clinic: ClinicDocument, index: number) => (
                    <ClinicCard key={clinic._id.toString()} clinic={clinic} lang={lang} priority={index < 3} />
                  ))}
                </ul>

                {totalPages > 1 && (
                  <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3">
                    {page > 1 && (
                      <Link href={buildSearchUrl({ page: page - 1 })} rel="prev" className={btnQuiet}>
                        {t('common.prev')}
                      </Link>
                    )}
                    <span className="px-2 text-sm tabular-nums text-foreground/70">
                      {page} / {totalPages}
                    </span>
                    {page < totalPages && (
                      <Link href={buildSearchUrl({ page: page + 1 })} rel="next" className={btnQuiet}>
                        {t('common.next')}
                      </Link>
                    )}
                  </nav>
                )}
              </>
            )}
          </section>
        </div>

        {browseLinks.length > 0 && (
          <nav aria-labelledby="clinic-browse-title" className="mt-14 border-t border-border pt-8">
            <h2 id="clinic-browse-title" className="mb-4 font-clinic text-xl font-semibold">
              {t('clinic.browse')}
            </h2>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem]">
              {browseLinks.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="font-medium text-primary underline-offset-4 hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </main>
      <HomeFooter lang={lang} />
    </div>
  );
}
