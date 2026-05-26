import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import ClinicCard from './_components/ClinicCard';
import Link from 'next/link';
import { getT, T } from '@/i18n';
import type { Metadata } from 'next';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { ALLOWED_CITIES, ALLOWED_CLINIC_TYPES, CLINIC_TYPES, ClinicType } from '@/lib/clinic-constants';

export const revalidate = 3600; // 1 hour

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: `${T('clinic.title', lang)} — Duxtur.org`,
    description: T('meta.description', lang),
  };
}

export default async function ClinicsDirectoryPage({ params, searchParams }: {
  params: Promise<{ lang: string }>,
  searchParams: Promise<{ city?: string, type?: string, specialty?: string, q?: string, page?: string }>
}) {
  const { lang } = await params;
  const filters = await searchParams;
  const t = getT(lang as any);

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
    <div className="min-h-screen bg-slate-50 font-sans pb-20 text-slate-800">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* Hero */}
      <section className="bg-slate-900 pt-32 pb-24 px-4 relative overflow-hidden">
         {/* Decorative blobs */}
         <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] -z-10 animate-float-slow" />
         <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] -z-10 animate-float-delayed" />

         <div className="max-w-7xl mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tight font-display text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">
              {t('clinic.findClinic')}
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-8 font-medium">
              {t('home.heroSubtitle')}
            </p>

            <div className="flex justify-center mb-12">
              <Link
                href={`/${lang}/clinic/register`}
                className="px-6 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-blue-400 font-bold hover:bg-white/10 hover:text-blue-300 transition flex items-center gap-2 group"
              >
                {t('clinic.registerClinic')}
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Search Form */}
            <form method="GET" className="max-w-3xl mx-auto bg-white/5 backdrop-blur-2xl p-2 rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row gap-2 shadow-2xl mb-12">
               <div className="flex-1 flex items-center px-6 gap-3">
                 <span className="text-xl">🔍</span>
                 <input
                    name="q"
                    defaultValue={filters.q}
                    className="w-full bg-transparent py-4 text-white outline-none placeholder:text-slate-500 font-bold"
                    placeholder={t('map.filterCity')}
                 />
               </div>
               <button type="submit" className="px-10 py-4 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition shadow-lg shadow-blue-600/20">
                 {t('common.search')}
               </button>
            </form>

            {/* Quick Filters */}
            <div className="max-w-4xl mx-auto">
               <div className="flex flex-col gap-4">
                  {/* Cities */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-2">
                    {ALLOWED_CITIES.map(city => (
                      <Link
                        key={city}
                        href={`/${lang}/clinics?city=${city}`}
                        className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                          filters.city === city
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {city}
                      </Link>
                    ))}
                  </div>
                  {/* Types */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-2">
                    {CLINIC_TYPES.map(type => (
                      <Link
                        key={type.id}
                        href={`/${lang}/clinics?type=${type.id}`}
                        className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                          filters.type === type.id
                          ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="mr-2">{type.emoji}</span>
                        {t('clinic.type_' + type.id)}
                      </Link>
                    ))}
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 -mt-10 relative z-10">
         {clinics.length === 0 ? (
           <div className="bg-white p-20 rounded-[3rem] text-center text-slate-400 border border-slate-100 shadow-2xl">
              <p className="text-6xl mb-4">🔍</p>
              <p className="text-xl font-black text-slate-900">{t('common.noResults')}</p>
           </div>
         ) : (
           <>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {clinics.map((clinic: any) => (
                  <ClinicCard key={clinic._id.toString()} clinic={JSON.parse(JSON.stringify(clinic))} lang={lang} />
                ))}
             </div>

             {/* Pagination */}
             {totalPages > 1 && (
               <div className="mt-12 flex justify-center gap-2">
                 {page > 1 && (
                   <Link
                     href={buildPageUrl(page - 1)}
                     className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:border-blue-500 hover:text-blue-600 transition"
                   >
                     {t('common.prev')}
                   </Link>
                 )}
                 <div className="flex items-center px-6 py-3 bg-white border border-slate-200 rounded-2xl font-black text-slate-900">
                   {page} / {totalPages}
                 </div>
                 {page < totalPages && (
                   <Link
                     href={buildPageUrl(page + 1)}
                     className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:border-blue-500 hover:text-blue-600 transition"
                   >
                     {t('common.next')}
                   </Link>
                 )}
               </div>
             )}
           </>
         )}
      </section>
    </div>
  );
}
