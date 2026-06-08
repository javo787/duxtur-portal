import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Link from 'next/link';
import type { Metadata } from 'next';
import { buildAlternates, BASE_URL, buildBreadcrumbJsonLd } from '@/lib/seo';
import { CATEGORY_LABELS } from '@/lib/doctor-constants';
import ContactDoctorButton from '@/components/ContactDoctorButton';
import { DoctorsSortSelect } from '../_components/DoctorsSortSelect';
import UI from '@/dictionaries/doctor-translations';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ lang: string; specialty: string }>;
  searchParams: Promise<{
    city?: string;
    type?: string;
    sort?: string;
    page?: string;
  }>;
};

export async function generateStaticParams() {
  const languages = ['ru', 'uz', 'tg', 'kk', 'ky'];
  const specialties = Object.keys(CATEGORY_LABELS);
  return languages.flatMap(lang => specialties.map(specialty => ({ lang, specialty })));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang, specialty } = await params;
  const { city } = await searchParams;

  const specLabel = CATEGORY_LABELS[specialty]?.[lang] || CATEGORY_LABELS[specialty]?.ru;
  if (!specLabel) return notFound();

  let title = `${specLabel}`;
  if (city) {
    title += ` ${lang === 'ru' ? 'в' : ''} ${city}`;
  }
  title += ` — Duxtur.org`;

  const descriptions: Record<string, string> = {
    ru: `Лучшие специалисты в категории ${specLabel}. Запись на прием, отзывы, цены на Duxtur.org.`,
    uz: `${specLabel} toifasidagi eng yaxshi mutaxassislar. Duxtur.org saytida qabulga yozilish, sharhlar va narxlar.`,
    tg: `Беҳтарин мутахассисон дар категорияи ${specLabel}. Сабти ном барои қабул, фикру мулоҳизаҳо ва нархҳо дар Duxtur.org.`,
    kk: `${specLabel} санатындағы үздік мамандар. Duxtur.org сайтында қабылдауға жазылу, пікірлер және бағалар.`,
    ky: `${specLabel} категориясындагы мыкты адистер. Duxtur.org сайтында кабыл алууга жазылуу, сын-пикирлер жана баалар.`,
  };

  return {
    title,
    description: descriptions[lang] || descriptions.ru,
    alternates: buildAlternates(`doctors/${specialty}`, lang),
  };
}

export default async function SpecialtyDoctorsPage({ params, searchParams }: Props) {
  const { lang, specialty } = await params;
  const sp = await searchParams;
  const specLabelRu = CATEGORY_LABELS[specialty]?.ru;
  if (!specLabelRu) notFound();

  await dbConnect();

  // Query
  const query: Record<string, any> = { status: 'approved', 'specialty.ru': specLabelRu };
  if (sp.city) query.city = new RegExp(sp.city, 'i');
  if (sp.type) query.consultationTypes = sp.type;

  // Sorting
  let sort: any = { createdAt: -1 };
  if (sp.sort === 'rating') sort = { reviewAvg: -1, reviewCount: -1 };
  if (sp.sort === 'price_asc') sort = { 'priceRange.min': 1 };
  if (sp.sort === 'price_desc') sort = { 'priceRange.min': -1 };

  const page = parseInt(sp.page || '1');
  const limit = 12;
  const skip = (page - 1) * limit;

  const [doctors, total] = await Promise.all([
    Doctor.find(query).sort(sort).skip(skip).limit(limit).lean() as Promise<any[]>,
    Doctor.countDocuments(query),
  ]);

  const L = (key: string) => UI[key]?.[lang] || UI[key]?.ru || '';
  const t = (field: any) => field?.[lang] || field?.ru || '';

  const specLabel = CATEGORY_LABELS[specialty]?.[lang] || CATEGORY_LABELS[specialty]?.ru;

  // Structured Data
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: specLabel,
    itemListElement: doctors.map((doc: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Physician',
        name: doc.name,
        url: `${BASE_URL}/${lang}/doctor/${doc.slug || doc._id}`,
        image: doc.image || undefined,
        jobTitle: t(doc.specialty),
        address: {
          '@type': 'PostalAddress',
          addressLocality: doc.city,
        }
      }
    }))
  };

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Duxtur.org', url: `/${lang}` },
    { name: L('title'), url: `/${lang}/doctors` },
    { name: specLabel, url: `/${lang}/doctors/${specialty}` },
  ]);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="bg-white border-b border-slate-100 pt-8 md:pt-12 pb-10 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-5 text-center">
          <nav className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-4">
             <Link href={`/${lang}`} className="hover:text-blue-600 transition">{L('home') || 'Главная'}</Link>
             <span>/</span>
             <Link href={`/${lang}/doctors`} className="hover:text-blue-600 transition">{L('title')}</Link>
             <span>/</span>
             <span className="text-slate-900 font-bold">{specLabel}</span>
          </nav>
          <h1 className="text-2xl md:text-5xl font-black text-slate-900 mb-3 md:mb-4 tracking-tight">
            {specLabel}
          </h1>
          <p className="text-slate-500 text-sm md:text-lg mb-6 md:mb-10 max-w-2xl mx-auto">
            Найдено {total} специалистов
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-5 py-6 md:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <p className="text-sm text-slate-500 font-medium">
            Сортировка:
          </p>
          <DoctorsSortSelect
            defaultValue={sp.sort || ''}
            labels={{
              relevance: L('relevance'),
              rating: L('rating'),
              price_asc: L('price_asc'),
              price_desc: L('price_desc'),
              experience: L('experience'),
            }}
          />
        </div>

        {doctors.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 md:p-20 text-center border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-2">{L('no_doctors')}</h3>
            <Link href={`/${lang}/doctors`} className="text-blue-600 font-bold hover:underline">
              Все врачи →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
            {doctors.map((doc: any) => (
              <div key={doc._id} className="group bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden">
                <div className="p-4 md:p-6 pb-0 flex items-start justify-between">
                  <img
                    src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                    alt={doc.name}
                    className="w-14 h-14 md:w-16 md:h-16 rounded-2xl object-cover border border-slate-100"
                  />
                  {doc.reviewCount > 0 && (
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-[10px] md:text-xs font-black">
                      ⭐ {doc.reviewAvg}
                    </div>
                  )}
                </div>
                <div className="p-4 md:p-6 flex-1">
                  <Link href={`/${lang}/doctor/${doc.slug || doc._id}`} className="block">
                    <h3 className="font-black text-slate-900 truncate leading-tight text-sm md:text-base">
                      {doc.name}
                    </h3>
                  </Link>
                  <p className="text-[10px] md:text-xs font-bold text-blue-500 mt-1 uppercase tracking-wider">{t(doc.specialty)}</p>
                  <div className="mt-3 md:mt-4 space-y-1.5 text-xs text-slate-500">
                    <p>📍 {doc.city}</p>
                    <p>⏱️ {doc.experience} {L('years_exp')}</p>
                    <p className="font-bold text-slate-900">💰 {doc.priceRange?.min} {doc.priceRange?.currency || 'TJS'}</p>
                  </div>
                </div>
                <div className="p-3 md:p-4 bg-slate-50/50 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <Link href={`/${lang}/doctor/${doc.slug || doc._id}`} className="flex items-center justify-center py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600">
                    Профиль
                  </Link>
                  <ContactDoctorButton doctor={doc} lang={lang} className="py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
