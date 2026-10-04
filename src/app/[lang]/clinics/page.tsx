import ClinicCard from './_components/ClinicCard';
import ClinicFilters from './_components/ClinicFilters';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { getT, T, Locale } from '@/i18n';
import HomeFooter from '@/components/home/HomeFooter';
import type { Metadata } from 'next';
import { buildAlternates, buildBreadcrumbJsonLd, BASE_URL } from '@/lib/seo';
import { ALLOWED_CITIES, CLINIC_TYPES, ClinicDocument } from '@/lib/clinic-constants';
import { sanitizeSearchParams } from '@/lib/validation';
import { getClinics } from '@/lib/clinic-service';
import { clinicSerif } from '@/lib/fonts';
import { btnPrimary, btnQuiet } from './[slug]/_components/shared';

export const revalidate = 3600; // 1 hour

export async function generateMetadata({ params, searchParams }: {
  params: Promise<{ lang: string }>,
  searchParams: Promise<{ city?: string, type?: string, specialty?: string, q?: string, page?: string, sort?: string }>
}): Promise<Metadata> {
  const { lang } = (await params) as { lang: Locale };
  const rawParams = await searchParams;
  const filters = sanitizeSearchParams(rawParams);
  const t = getT(lang);
  const title = T('clinic.title', lang) || T('clinic.title', 'ru');

  return {
    title: `${title} — Duxtur.org`,
    description: t('clinic.metaDescription'),
    alternates: buildAlternates('clinics', lang, filters),
  };
}

export default async function ClinicsDirectoryPage({ params, searchParams }: {
  params: Promise<{ lang: string }>,
  searchParams: Promise<{ city?: string, type?: string, specialty?: string, q?: string, page?: string, sort?: string }>
}) {
  const { lang } = (await params) as { lang: Locale };
  const rawParams = await searchParams;
  const filters = sanitizeSearchParams(rawParams);
  const t = getT(lang);

  const page = filters.page;
  const limit = 20;

  const { clinics, total } = await getClinics({ ...filters, limit });

  const totalPages = Math.ceil(total / limit);

  // Structured Data
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('clinic.title'),
    itemListElement: clinics.map((clinic: ClinicDocument, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'MedicalClinic',
        name: clinic.name[lang] || clinic.name.ru,
        url: `${BASE_URL}/${lang}/clinics/${clinic.slug}`,
        image: clinic.logo || clinic.coverImage || undefined,
        address: {
          '@type': 'PostalAddress',
          addressLocality: clinic.city,
          streetAddress: clinic.address,
        },
        telephone: clinic.phone || undefined,
      }
    }))
  };

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: t('nav.home'), url: `/${lang}` },
    { name: t('clinic.title'), url: `/${lang}/clinics` },
  ]);

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

    return `/${lang}/clinics?${params.toString()}`;
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

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
          {t('clinic.title')}
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
      </main>
      <HomeFooter lang={lang} />
    </div>
  );
}
