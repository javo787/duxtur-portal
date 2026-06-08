import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import ClinicCard from './_components/ClinicCard';
import ClinicFilters from './_components/ClinicFilters';
import Link from 'next/link';
import { getT, T, Locale } from '@/i18n';
import HomeFooter from '@/components/home/HomeFooter';
import type { Metadata } from 'next';
import { buildAlternates, buildBreadcrumbJsonLd, BASE_URL } from '@/lib/seo';
import { ALLOWED_CITIES, ALLOWED_CLINIC_TYPES, CLINIC_TYPES, ClinicType, ClinicDocument } from '@/lib/clinic-constants';

export const revalidate = 3600; // 1 hour

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = (await params) as { lang: Locale };
  const t = getT(lang);
  return {
    title: `${T('clinic.title', lang)} — Duxtur.org`,
    description: t('home.heroSubtitle'),
    alternates: buildAlternates('clinics', lang),
  };
}

export default async function ClinicsDirectoryPage({ params, searchParams }: {
  params: Promise<{ lang: string }>,
  searchParams: Promise<{ city?: string, type?: string, specialty?: string, q?: string, page?: string, sort?: string }>
}) {
  const { lang } = (await params) as { lang: Locale };
  const filters = await searchParams;
  const t = getT(lang);

  const page = Math.max(1, parseInt(filters.page || '1', 10));
  const limit = 20;

  // Validation
  let validatedCity = filters.city;
  if (validatedCity && !ALLOWED_CITIES.includes(validatedCity)) {
    validatedCity = undefined;
  }

  let validatedType = filters.type;
  if (validatedType && !ALLOWED_CLINIC_TYPES.includes(validatedType as ClinicType)) {
    validatedType = undefined;
  }

  let validatedSpecialty = filters.specialty;
  if (validatedSpecialty && validatedSpecialty.length > 100) validatedSpecialty = undefined;

  // Sanitization of q
  let sanitizedQ = '';
  if (filters.q) {
    sanitizedQ = filters.q.slice(0, 100).replace(/[^\p{L}\p{N}\s]/gu, '');
  }

  await dbConnect();

  const query: any = { status: { $in: ['approved', 'pre_imported'] } };
  if (validatedCity) query.city = validatedCity;
  if (validatedType) query.type = validatedType;
  if (validatedSpecialty) query.specialties = validatedSpecialty;
  if (sanitizedQ) {
     query.$text = { $search: sanitizedQ };
  }

  // Sorting logic
  let sortStage: any = { 'rating.avg': -1 };
  if (filters.sort === 'reviews') sortStage = { 'rating.count': -1 };
  if (filters.sort === 'doctors') sortStage = { 'doctorCount': -1 };

  const [clinics, total] = await Promise.all([
    Clinic.aggregate([
      { $match: query },
      {
        $addFields: {
          doctorCount: { $size: { $ifNull: ["$doctorIds", []] } }
        }
      },
      { $sort: sortStage },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          userId: 0,
          licenseNumber: 0,
          licenseDocument: 0,
          updatedAt: 0,
          __v: 0
        }
      }
    ]),
    Clinic.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  // Structured Data
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('clinic.title'),
    itemListElement: clinics.map((clinic: any, index: number) => ({
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
    if (filters.page) params.set('page', filters.page);

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined) params.delete(key);
      else params.set(key, value.toString());
    });

    return `/${lang}/clinics?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-500">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* Hero */}
      <section className="bg-white dark:bg-slate-950 pt-32 pb-24 px-4 relative overflow-hidden transition-colors duration-500">
         {/* Warm background gradient */}
         <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-amber-50/40 via-white to-white dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-950" />

         {/* Decorative blobs */}
         <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] -z-10 animate-float-slow opacity-30 dark:opacity-20 bg-amber-200/40 dark:bg-blue-900/20" />
         <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-[120px] -z-10 animate-float-delayed opacity-30 dark:opacity-20 bg-blue-200/40 dark:bg-indigo-900/20" />

         <div className="max-w-7xl mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-7xl font-bold mb-6 tracking-tight font-display text-slate-900 dark:text-white">
              {t('clinic.findClinic')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-8 font-light">
              {t('home.heroSubtitle')}
            </p>

            <div className="flex justify-center mb-12">
              <Link
                href={`/${lang}/clinic/register`}
                className="px-6 py-2 bg-slate-900/5 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-full text-blue-600 dark:text-blue-400 font-bold hover:bg-slate-900/10 dark:hover:bg-white/10 transition-colors group inline-flex items-center gap-2"
              >
                {t('clinic.registerClinic')}
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Search Form */}
            <form method="GET" className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-2 rounded-[2.5rem] border border-slate-200 dark:border-white/10 flex flex-col md:flex-row gap-2 shadow-2xl shadow-blue-500/20 dark:shadow-none">
               <div className="flex-1 flex items-center px-6 gap-3 group">
                 <span className="text-xl group-focus-within:scale-110 transition-transform">🔍</span>
                 <input
                    name="q"
                    defaultValue={filters.q}
                    className="w-full bg-transparent py-4 text-slate-900 dark:text-white outline-none placeholder:text-slate-400 font-medium"
                    placeholder={t('search.placeholder')}
                 />
                 {filters.q && (
                    <Link
                      href={buildSearchUrl({ q: undefined, page: 1 })}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-400 transition-colors"
                    >
                      ✕
                    </Link>
                 )}
               </div>
               <button type="submit" className="px-10 py-4 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all">
                 {t('common.search')}
               </button>
            </form>

            {(filters.city || filters.type || filters.specialty || filters.q) && (
              <div className="mb-8 flex justify-center gap-4 flex-wrap">
                <Link
                  href={`/${lang}/clinics`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  ✕ {t('doctors.resetFilters')}
                </Link>
              </div>
            )}

            {/* Quick Filters */}
            <div className="max-w-4xl mx-auto">
               <ClinicFilters
                  cities={ALLOWED_CITIES}
                  types={CLINIC_TYPES}
                  currentCity={filters.city}
                  currentType={filters.type}
                  currentSpecialty={filters.specialty}
                  currentQ={filters.q}
                  currentSort={filters.sort}
                  lang={lang}
               />
            </div>
         </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 -mt-10 relative z-10">
         <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center gap-2">
               <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
               <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                  {t('clinic.found').replace('{count}', total.toString())}
               </span>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center gap-4">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">{t('doctors.sortBy')}</span>
               <div className="flex gap-6 items-center">
                  <Link
                    href={buildSearchUrl({ sort: undefined, page: 1 })}
                    className={`text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${!filters.sort ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                  >
                    {t('doctors.rating')}
                  </Link>
                  <Link
                    href={buildSearchUrl({ sort: 'reviews', page: 1 })}
                    className={`text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filters.sort === 'reviews' ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                  >
                    {t('blog.ratings')}
                  </Link>
                  <Link
                    href={buildSearchUrl({ sort: 'doctors', page: 1 })}
                    className={`text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filters.sort === 'doctors' ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                  >
                    {t('common.doctors')}
                  </Link>
               </div>
            </div>
         </div>

         {clinics.length === 0 ? (
           <div className="bg-white dark:bg-slate-900 p-20 rounded-[3rem] text-center text-slate-400 dark:text-slate-400 border border-slate-100 dark:border-white/5 shadow-2xl transition-colors duration-500">
              <p className="text-6xl mb-4">🔍</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{t('common.noResults')}</p>
           </div>
         ) : (
           <>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {clinics.map((clinic: ClinicDocument) => (
                  <ClinicCard key={clinic._id.toString()} clinic={JSON.parse(JSON.stringify(clinic))} lang={lang} />
                ))}
             </div>

             {/* Pagination */}
             {totalPages > 1 && (
               <div className="mt-12 flex justify-center gap-2 pb-12">
                 {page > 1 && (
                   <Link
                     href={buildSearchUrl({ page: page - 1 })}
                     className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl font-bold text-slate-600 dark:text-slate-400 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                   >
                     {t('common.prev')}
                   </Link>
                 )}
                 <div className="flex items-center px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl font-black text-slate-900 dark:text-white">
                   {page} / {totalPages}
                 </div>
                 {page < totalPages && (
                   <Link
                     href={buildSearchUrl({ page: page + 1 })}
                     className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl font-bold text-slate-600 dark:text-slate-400 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                   >
                     {t('common.next')}
                   </Link>
                 )}
               </div>
             )}
           </>
         )}
      </section>
      <HomeFooter lang={lang} />
    </div>
  );
}
