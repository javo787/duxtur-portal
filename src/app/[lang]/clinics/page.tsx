import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import ClinicCard from './_components/ClinicCard';
import ClinicFilters from './_components/ClinicFilters';
import Link from 'next/link';
import { getT, T, Locale } from '@/i18n';
import HomeFooter from '@/components/home/HomeFooter';
import type { Metadata } from 'next';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { ALLOWED_CITIES, ALLOWED_CLINIC_TYPES, CLINIC_TYPES, ClinicType, ClinicDocument } from '@/lib/clinic-constants';

export const revalidate = 3600; // 1 hour

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: `${T('clinic.title', lang)} — Duxtur.org`,
    description: T('meta.description', lang),
  };
}

export default async function ClinicsDirectoryPage({ params, searchParams }: {
  params: Promise<{ lang: Locale }>,
  searchParams: Promise<{ city?: string, type?: string, specialty?: string, q?: string, page?: string }>
}) {
  const { lang } = await params;
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

  const query: any = { status: 'approved' };
  if (validatedCity) query.city = validatedCity;
  if (validatedType) query.type = validatedType;
  if (validatedSpecialty) query.specialties = validatedSpecialty;
  if (sanitizedQ) {
     query.$text = { $search: sanitizedQ };
  }

  const [clinics, total] = await Promise.all([
    Clinic.aggregate([
      { $match: query },
      { $sort: { 'rating.avg': -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $addFields: {
          doctorCount: { $size: { $ifNull: ["$doctorIds", []] } }
        }
      },
      {
        $project: {
          doctorIds: 0,
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

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: t('nav.home'), url: `/${lang}` },
    { name: t('clinic.title'), url: `/${lang}/clinics` },
  ]);

  // Helper to build pagination URL
  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams();
    if (filters.city) params.set('city', filters.city);
    if (filters.type) params.set('type', filters.type);
    if (filters.specialty) params.set('specialty', filters.specialty);
    if (filters.q) params.set('q', filters.q);
    params.set('page', p.toString());
    return `/${lang}/clinics?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-500">
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
                className="px-6 py-2 bg-slate-900/5 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-full text-blue-600 dark:text-blue-400 font-bold hover:bg-slate-900/10 dark:hover:bg-white/10 transition flex items-center gap-2 group"
              >
                {t('clinic.registerClinic')}
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Search Form */}
            <form method="GET" className="max-w-3xl mx-auto bg-white dark:bg-slate-900/50 backdrop-blur-2xl p-2 rounded-[2.5rem] border border-slate-200 dark:border-white/10 flex flex-col md:flex-row gap-2 shadow-2xl mb-12 shadow-slate-200/50 dark:shadow-none">
               <div className="flex-1 flex items-center px-6 gap-3">
                 <span className="text-xl">🔍</span>
                 <input
                    name="q"
                    defaultValue={filters.q}
                    className="w-full bg-transparent py-4 text-slate-900 dark:text-white outline-none placeholder:text-slate-400 font-medium"
                    placeholder={t('map.filterCity')}
                 />
               </div>
               <button type="submit" className="px-10 py-4 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition shadow-lg shadow-blue-600/20">
                 {t('common.search')}
               </button>
            </form>

            {/* Quick Filters */}
            <div className="max-w-4xl mx-auto">
               <ClinicFilters
                  cities={ALLOWED_CITIES}
                  types={CLINIC_TYPES}
                  currentCity={filters.city}
                  currentType={filters.type}
                  lang={lang}
               />
            </div>
         </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 -mt-10 relative z-10">
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
                     href={buildPageUrl(page - 1)}
                     className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl font-bold text-slate-600 dark:text-slate-400 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                   >
                     {t('common.prev')}
                   </Link>
                 )}
                 <div className="flex items-center px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl font-black text-slate-900 dark:text-white">
                   {page} / {totalPages}
                 </div>
                 {page < totalPages && (
                   <Link
                     href={buildPageUrl(page + 1)}
                     className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl font-bold text-slate-600 dark:text-slate-400 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
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
