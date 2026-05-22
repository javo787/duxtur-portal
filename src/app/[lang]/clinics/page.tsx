import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import ClinicCard from './_components/ClinicCard';
import { getT, T } from '@/i18n';
import type { Metadata } from 'next';
import { buildBreadcrumbJsonLd } from '@/lib/seo';

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
  searchParams: Promise<{ city?: string, type?: string, specialty?: string, q?: string }>
}) {
  const { lang } = await params;
  const filters = await searchParams;
  const t = getT(lang as any);

  await dbConnect();

  const query: any = { status: 'approved' };
  if (filters.city) query.city = filters.city;
  if (filters.type) query.type = filters.type;
  if (filters.specialty) query.specialties = filters.specialty;
  if (filters.q) {
     query.$text = { $search: filters.q };
  }

  const clinics = await Clinic.find(query).sort({ 'rating.avg': -1 }).lean();

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: t('nav.home'), url: `/${lang}` },
    { name: t('clinic.title'), url: `/${lang}/clinics` },
  ]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 text-slate-800">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* Hero */}
      <section className="bg-slate-900 pt-32 pb-20 px-4">
         <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">{t('clinic.findClinic')}</h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">{t('home.heroSubtitle')}</p>

            {/* Filters placeholder */}
            <form method="GET" className="max-w-3xl mx-auto bg-white/10 backdrop-blur-xl p-2 rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row gap-2">
               <input name="q" defaultValue={filters.q} className="flex-1 bg-transparent px-6 py-4 text-white outline-none placeholder:text-slate-500 font-bold" placeholder={t('map.filterCity')} />
               <button type="submit" className="px-10 py-4 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-700 transition">{t('common.search')}</button>
            </form>
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
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {clinics.map((clinic: any) => (
                <ClinicCard key={clinic._id.toString()} clinic={JSON.parse(JSON.stringify(clinic))} lang={lang} />
              ))}
           </div>
         )}
      </section>
    </div>
  );
}
