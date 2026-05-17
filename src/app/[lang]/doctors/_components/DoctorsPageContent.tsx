// src/app/[lang]/doctors/_components/DoctorsPageContent.tsx
'use client';

import Link from 'next/link';
import DoctorsHero from './DoctorsHero';
import FiltersSidebar from './FiltersSidebar';
import DoctorsGrid from './DoctorsGrid';
import Pagination from './Pagination';
import CtaBanner from './CtaBanner';
import MobileFiltersDrawer from './MobileFiltersDrawer';
import ActiveFilters from './ActiveFilters';
import { DoctorsSortSelect } from './DoctorsSortSelect'; // Именованный экспорт — проверьте, при необходимости смените на default
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
      {/* JSON-LD структурированные данные */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Верхняя панель (можно вынести в layout позже) */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/${lang}`} className="flex items-center gap-2.5 group" aria-label="Duxtur.org - Главная">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-xl font-extrabold text-slate-900">duxtur<span className="text-blue-600">.org</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-500" aria-label="Основные разделы">
            <Link href={`/${lang}/blog`} className="hover:text-slate-900 transition font-medium">Статьи</Link>
            <Link href={`/${lang}/authors`} className="hover:text-slate-900 transition font-medium">Врачи</Link>
          </nav>

          <Link
            href={`/${lang}/register`}
            className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition"
          >
            Стать автором
          </Link>
        </div>
      </header>

      {/* Hero-секция с поиском */}
      <DoctorsHero lang={lang} searchParams={sp} cities={cities} activeSpecialty={activeSpecialty} L={L} />

      {/* Основной контент страницы */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="lg:grid lg:grid-cols-4 gap-8">
          {/* Десктопный сайдбар с фильтрами */}
          <aside className="hidden lg:block lg:col-span-1">
            <FiltersSidebar lang={lang} searchParams={sp} cities={cities} L={L} />
          </aside>

          {/* Результаты и сортировка */}
          <div className="lg:col-span-3 space-y-5">
            {/* Панель статистики и сортировки */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3.5">
              <div className="flex items-center gap-4 flex-wrap">
                <p className="text-sm text-slate-500 font-medium">
                  Найдено <span className="text-slate-900 font-bold text-base">{total}</span> {L('doctors')}
                </p>
                { (sp.city || sp.specialty || sp.type) && (
                  <ActiveFilters lang={lang} searchParams={sp} L={L} />
                )}
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/${lang}/doctors/map`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold transition border border-slate-200"
                >
                  📍 На карте
                </Link>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 font-medium hidden sm:inline">{L('sort_by')}:</span>
                  <DoctorsSortSelect
                    defaultValue={sp.sort as string || ''}
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
            </div>

            {/* Сетка карточек врачей */}
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

      {/* Мобильный drawer с фильтрами */}
      <MobileFiltersDrawer lang={lang} cities={cities} sp={sp} />
    </div>
  );
}
