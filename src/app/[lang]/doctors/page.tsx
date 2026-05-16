import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Link from 'next/link';
import type { Metadata } from 'next';
import { buildAlternates, buildBreadcrumbJsonLd } from '@/lib/seo';
import { CATEGORY_LABELS } from '@/lib/doctor-constants';
import ContactDoctorButton from '@/components/ContactDoctorButton';
import { DoctorsSortSelect } from './_components/DoctorsSortSelect';
import { AcceptsToggle } from './_components/AcceptsToggle';
import MobileFiltersDrawer from './_components/MobileFiltersDrawer';
import SpecialtyAutocomplete from '@/components/SpecialtyAutocomplete';
import NearMeButton from '@/components/NearMeButton';
import UI from '@/dictionaries/doctor-translations';

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    city?: string;
    specialty?: string;
    type?: string;
    priceMin?: string;
    priceMax?: string;
    exp?: string;
    lang_spoken?: string | string[];
    accepts?: string;
    open?: string;
    sort?: string;
    page?: string;
    lat?: string;
    lng?: string;
    radius?: string;
  }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang } = await params;
  const { city, specialty } = await searchParams;

  let title = UI.title[lang] || UI.title.ru;
  if (specialty && CATEGORY_LABELS[specialty]) {
    const specLabel = CATEGORY_LABELS[specialty][lang] || CATEGORY_LABELS[specialty].ru;
    title = `${specLabel}`;
  }
  if (city) {
    title += ` ${lang === 'ru' ? 'в' : ''} ${city}`;
  }
  title += ` — Duxtur.org`;

  return {
    title,
    description: UI.subtitle[lang] || UI.subtitle.ru,
    alternates: buildAlternates('doctors', lang),
  };
}

export default async function DoctorsPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const sp = await searchParams;
  await dbConnect();

  const cities: string[] = await Doctor.distinct('city', { status: 'approved' });

  // Query
  const query: any = { status: 'approved' };

  if (sp.lat && sp.lng) {
    const lat = parseFloat(sp.lat as string);
    const lng = parseFloat(sp.lng as string);
    const radius = parseFloat((sp.radius as string) || '20');

    query['coordinates.coordinates'] = {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radius * 1000 // km to meters
      }
    };
  }

  if (sp.city) query.city = new RegExp(sp.city, 'i');
  if (sp.specialty) query['specialty.ru'] = CATEGORY_LABELS[sp.specialty]?.ru || sp.specialty;
  if (sp.type) query.consultationTypes = sp.type;
  if (sp.accepts === 'true') query.acceptsNewPatients = true;

  if (sp.priceMin || sp.priceMax) {
    query['priceRange.min'] = { $gte: parseInt(sp.priceMin || '0') };
    if (sp.priceMax) query['priceRange.max'] = { $lte: parseInt(sp.priceMax) };
  }

  if (sp.exp) {
    const minExp = parseInt(sp.exp);
    if (!isNaN(minExp)) query.experience = { $gte: minExp };
  }

  if (sp.lang_spoken) {
    const selectedLangs = Array.isArray(sp.lang_spoken) ? sp.lang_spoken : [sp.lang_spoken];
    query.languages = { $in: selectedLangs };
  }

  // Sorting
  let sort: any = { createdAt: -1 };
  if (sp.sort === 'rating') sort = { reviewAvg: -1, reviewCount: -1 };
  if (sp.sort === 'price_asc') sort = { 'priceRange.min': 1 };
  if (sp.sort === 'price_desc') sort = { 'priceRange.min': -1 };
  if (sp.sort === 'exp') sort = { experience: -1 };

  const page = parseInt(sp.page || '1');
  const limit = 12;
  const skip = (page - 1) * limit;

  const [doctors, total] = await Promise.all([
    Doctor.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Doctor.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  const L = (key: string) => UI[key]?.[lang] || UI[key]?.ru || '';
  const t = (field: any) => field?.[lang] || field?.ru || '';

  const breadcrumbItems = [
    { name: 'Duxtur.org', url: `/${lang}` },
    { name: L('title'), url: `/${lang}/doctors` },
  ];
  if (sp.specialty && CATEGORY_LABELS[sp.specialty]) {
    breadcrumbItems.push({
      name: CATEGORY_LABELS[sp.specialty][lang] || CATEGORY_LABELS[sp.specialty].ru,
      url: `/${lang}/doctors/${sp.specialty}`
    });
  }

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(breadcrumbItems);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Hero / Search */}
      <div className="bg-white border-b border-slate-100 pt-8 md:pt-12 pb-10 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-5 text-center">
          <h1 className="text-2xl md:text-5xl font-black text-slate-900 mb-3 md:mb-4 tracking-tight">
            {L('title')}
          </h1>
          <p className="text-slate-500 text-sm md:text-lg mb-6 md:mb-10 max-w-2xl mx-auto px-2">
            {L('subtitle')}
          </p>

          <form id="search-form" action={`/${lang}/doctors`} method="GET" className="max-w-4xl mx-auto">
            <div className="bg-white p-2 rounded-2xl md:rounded-full border border-slate-200 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row items-center gap-2">
              <select name="city" defaultValue={sp.city} className="w-full md:w-48 px-6 py-3.5 bg-transparent text-sm font-bold text-slate-700 outline-none border-b md:border-b-0 md:border-r border-slate-100">
                <option value="">{L('all_cities')}</option>
                {cities.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <SpecialtyAutocomplete
                defaultValue={sp.specialty || ''}
                lang={lang}
                placeholder={L('all_specialties')}
              />

              <select name="type" defaultValue={sp.type} className="w-full md:w-48 px-6 py-3.5 bg-transparent text-sm font-bold text-slate-700 outline-none border-b md:border-b-0 md:border-r border-slate-100">
                <option value="">{L('consultation_type')}</option>
                <option value="in_person">{L('in_person')}</option>
                <option value="online">{L('online')}</option>
                <option value="home_visit">{L('home_visit')}</option>
              </select>

              <button type="submit" className="w-full md:w-auto px-10 py-3.5 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition active:scale-95 shadow-lg shadow-blue-200">
                {L('search')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 md:px-5 py-6 md:py-10">
        <div className="lg:grid lg:grid-cols-4 gap-10">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-1 space-y-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">{L('filters')}</h3>
                <Link href={`/${lang}/doctors`} className="text-[11px] font-bold text-blue-600 hover:underline">Сбросить</Link>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">{L('price_range')}</label>
                <div className="flex items-center gap-3">
                  <input form="search-form" name="priceMin" type="number" defaultValue={sp.priceMin} placeholder="0" className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm" />
                  <span className="text-slate-300">—</span>
                  <input form="search-form" name="priceMax" type="number" defaultValue={sp.priceMax} placeholder="1000" className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm" />
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">{L('experience')}</label>
                <div className="space-y-2">
                  {[
                    { val: '', label: L('any_exp') },
                    { val: '5', label: L('exp_5') },
                    { val: '10', label: L('exp_10') },
                  ].map(e => {
                    const isActive = sp.exp === e.val || (!sp.exp && !e.val);
                    return (
                      <label key={e.val} className={`flex items-center justify-between px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                        <span>{e.label}</span>
                        <input form="search-form" type="radio" name="exp" value={e.val} defaultChecked={isActive} className="hidden" />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">{L('languages')}</label>
                <div className="space-y-2">
                  {['Русский', 'Тоҷикӣ', "O'zbek", 'English'].map(lng => {
                    const isChecked = Array.isArray(sp.lang_spoken) ? sp.lang_spoken.includes(lng) : sp.lang_spoken === lng;
                    return (
                      <label key={lng} className="flex items-center gap-3 cursor-pointer group">
                        <input form="search-form" name="lang_spoken" value={lng} type="checkbox" defaultChecked={isChecked} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition">{lng}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-4 border-t border-slate-50">
                <AcceptsToggle
                  defaultChecked={sp.accepts === 'true'}
                  label={L('accepts_new')}
                />
              </div>

              <div className="pt-4">
                <NearMeButton />
              </div>

              <div className="pt-4">
                <button form="search-form" type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-100">
                  Применить фильтры
                </button>
              </div>
            </div>
          </aside>

          {/* Main Grid */}
          <div className="lg:col-span-3 space-y-6">
            {/* Sorting & Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <p className="text-sm text-slate-500 font-medium">
                  Найдено <span className="text-slate-900 font-bold">{total}</span> {L('doctors')}
                </p>
                <Link
                  href={`/${lang}/doctors/map`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold hover:bg-blue-100 transition"
                >
                  📍 Показать на карте
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">{L('sort_by')}:</span>
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
            </div>

            {/* Grid */}
            {doctors.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 md:p-20 text-center border border-slate-100 shadow-sm">
                <div className="text-5xl md:text-6xl mb-6">🔍</div>
                <h3 className="text-xl font-black text-slate-900 mb-2">{L('no_doctors')}</h3>
                <p className="text-slate-500 mb-8">{L('be_first')}</p>
                <Link href={`/${lang}/register`} className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition">
                  {L('register_now')} →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {doctors.map((doc: any) => (
                  <div key={doc._id} className="group bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="p-4 md:p-6 pb-0 flex items-start justify-between">
                      <div className="relative">
                        <img
                          src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                          alt={doc.name}
                          className="w-14 h-14 md:w-16 md:h-16 rounded-2xl object-cover border border-slate-100 group-hover:scale-105 transition"
                        />
                        {doc.status === 'approved' && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center" title={L('verified')}>
                            <svg className="w-3 md:w-3.5 h-3 md:h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                          </div>
                        )}
                      </div>
                      {doc.reviewCount > 0 && (
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-[10px] md:text-xs font-black">
                          ⭐ {doc.reviewAvg}
                          <span className="text-amber-400 font-bold ml-0.5">({doc.reviewCount})</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 md:p-6 flex-1 flex flex-col">
                      <Link href={`/${lang}/doctor/${doc.slug || doc._id}`} className="block group/link">
                        <h3 className="font-black text-slate-900 group-hover/link:text-blue-600 transition truncate leading-tight text-sm md:text-base">
                          {doc.name}
                        </h3>
                        <p className="text-[10px] md:text-xs font-bold text-blue-500 mt-1 uppercase tracking-wider">{t(doc.specialty)}</p>
                      </Link>

                      <div className="mt-3 md:mt-4 space-y-1.5 md:space-y-2.5 flex-1">
                        <div className="flex items-center gap-2 text-xs md:text-[13px] text-slate-500 font-medium">
                          <span className="text-slate-300">📍</span>
                          <span className="truncate">{doc.city}{doc.clinicName ? ` · ${doc.clinicName}` : ''}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs md:text-[13px] text-slate-500 font-medium">
                          <span className="text-slate-300">⏱️</span>
                          <span>{doc.experience} {L('years_exp')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs md:text-[13px] text-slate-900 font-bold">
                          <span className="text-slate-300 font-normal">💰</span>
                          {doc.priceRange?.min ? (
                            <span>{L('from')} {doc.priceRange.min} {doc.priceRange.currency || 'TJS'}</span>
                          ) : '—'}
                        </div>
                      </div>

                      {/* Icons */}
                      <div className="flex gap-2 mt-3 md:mt-5">
                        {(doc.consultationTypes || ['in_person']).map((type: string) => (
                          <span key={type} className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-50 flex items-center justify-center text-xs md:text-sm border border-slate-100" title={L(type)}>
                            {type === 'in_person' ? '🏥' : type === 'online' ? '💻' : '🏠'}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-3 md:p-4 bg-slate-50/50 border-t border-slate-100 grid grid-cols-2 gap-2 md:gap-3">
                      <Link href={`/${lang}/doctor/${doc.slug || doc._id}`} className="flex items-center justify-center py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] md:text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
                        {L('view_profile')}
                      </Link>
                      <ContactDoctorButton doctor={doc} lang={lang}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-[10px] md:text-xs font-bold hover:bg-blue-700 transition"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-10">
                {page > 1 && (
                  <Link
                    href={`/${lang}/doctors?${(() => {
                      const cleanParams: Record<string, string> = {};
                      Object.entries({...sp, page: (page - 1).toString()}).forEach(([k, v]) => {
                        if (v !== undefined) cleanParams[k] = Array.isArray(v) ? v[0] : v;
                      });
                      return new URLSearchParams(cleanParams).toString();
                    })()}`}
                    className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    ←
                  </Link>
                )}
                <span className="px-5 py-2 text-sm font-bold text-slate-400">
                  {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/${lang}/doctors?${(() => {
                      const cleanParams: Record<string, string> = {};
                      Object.entries({...sp, page: (page + 1).toString()}).forEach(([k, v]) => {
                        if (v !== undefined) cleanParams[k] = Array.isArray(v) ? v[0] : v;
                      });
                      return new URLSearchParams(cleanParams).toString();
                    })()}`}
                    className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer (клиентский компонент) */}
      <MobileFiltersDrawer lang={lang} cities={cities} sp={sp} />
    </div>
  );
}
