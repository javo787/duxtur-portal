'use client';

import { useMemo } from 'react';
import DoctorsHero from './DoctorsHero';
import FiltersSidebar from './FiltersSidebar';
import DoctorsGrid from './DoctorsGrid';
import Pagination from './Pagination';
import CtaBanner from './CtaBanner';
import MobileFiltersDrawer from './MobileFiltersDrawer';
import { CATEGORY_LABELS } from '@/lib/doctor-constants';
import UI from '@/dictionaries/doctor-translations';

interface DoctorsPageContentProps {
  lang: string;
  searchParams: Record<string, string | string[] | undefined>;
  doctors: any[];
  total: number;
  totalPages: number;
  currentPage: number;
  cities: string[];
  breadcrumbJsonLd: object;
}

export default function DoctorsPageContent({
  lang,
  searchParams,
  doctors,
  total,
  totalPages,
  currentPage,
  cities,
  breadcrumbJsonLd,
}: DoctorsPageContentProps) {
  const sp = searchParams;
  const L = (key: string) => UI[key]?.[lang] || UI[key]?.ru || '';
  const activeSpecialty = (sp.specialty as string) || '';

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Header (можно вынести в layout, но оставим здесь для автономности) */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href={`/${lang}`} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-xl font-extrabold text-slate-900">duxtur<span className="text-blue-600">.org</span></span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-500">
            <a href={`/${lang}/blog`} className="hover:text-slate-900 transition font-medium">Статьи</a>
            <a href={`/${lang}/authors`} className="hover:text-slate-900 transition font-medium">Врачи</a>
          </nav>
          <a href={`/${lang}/register`} className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition">
            Стать автором
          </a>
        </div>
      </header>

      {/* Hero + поиск */}
      <DoctorsHero lang={lang} searchParams={sp} cities={cities} activeSpecialty={activeSpecialty} L={L} />

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="lg:grid lg:grid-cols-4 gap-8">
          {/* Сайдбар (десктоп) */}
          <aside className="hidden lg:block lg:col-span-1">
            <FiltersSidebar lang={lang} searchParams={sp} cities={cities} L={L} />
          </aside>

          {/* Правая часть: статистика, сетка, пагинация, CTA */}
          <div className="lg:col-span-3 space-y-5">
            {/* Статистика и сортировка */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3.5">
              <div className="flex items-center gap-4 flex-wrap">
                <p className="text-sm text-slate-500 font-medium">
                  Найдено <span className="text-slate-900 font-bold text-base">{total}</span> {L('doctors')}
                </p>
                {/* Чипсы активных фильтров */}
                {(sp.city || sp.specialty || sp.type) && (
                  <ActiveFilters lang={lang} searchParams={sp} L={L} />
                )}
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`/${lang}/doctors/map`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold transition border border-slate-200"
                >
                  📍 На карте
                </a>
                <SortSelect defaultValue={sp.sort as string} labels={{
                  relevance: L('relevance'),
                  rating: L('rating'),
                  price_asc: L('price_asc'),
                  price_desc: L('price_desc'),
                  experience: L('experience'),
                }} />
              </div>
            </div>

            {/* Сетка врачей */}
            <DoctorsGrid doctors={doctors} lang={lang} L={L} />

            {/* Пагинация */}
            {totalPages > 1 && (
              <Pagination
                lang={lang}
                currentPage={currentPage}
                totalPages={totalPages}
                searchParams={sp}
              />
            )}

            {/* CTA-баннер для врачей */}
            <CtaBanner lang={lang} />
          </div>
        </div>
      </div>

      {/* Мобильные фильтры (Drawer) */}
      <MobileFiltersDrawer lang={lang} cities={cities} sp={sp} />
    </div>
  );
}

// Вспомогательный компонент для активных фильтров (можно вынести)
function ActiveFilters({ lang, searchParams, L }: { lang: string; searchParams: any; L: (key: string) => string }) {
  const sp = searchParams;
  const buildUrl = (keyToRemove: string) => {
    const params = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => {
      if (k !== keyToRemove && v !== undefined) {
        if (Array.isArray(v)) v.forEach(val => params.append(k, val));
        else params.append(k, v as string);
      }
    });
    const qs = params.toString();
    return `/${lang}/doctors${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {sp.city && (
        <a href={buildUrl('city')} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
          📍 {sp.city} <span className="ml-1 hover:text-blue-900">×</span>
        </a>
      )}
      {sp.specialty && (
        <a href={buildUrl('specialty')} className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-100">
          {CATEGORY_LABELS[sp.specialty]?.[lang] || sp.specialty}
          <span className="ml-1 hover:text-amber-900">×</span>
        </a>
      )}
    </div>
  );
}
