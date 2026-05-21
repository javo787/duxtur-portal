'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import SpecialtyAutocomplete from '@/components/SpecialtyAutocomplete';
import NearMeButton from '@/components/NearMeButton';
import { useT } from '@/i18n';

interface SearchFormProps {
  lang: string;
  searchParams: Record<string, string | string[] | undefined>;
  cities: string[];
  L: (key: string) => string;
}

export default function SearchForm({ lang, searchParams, cities, L }: SearchFormProps) {
  const { t } = useT(lang);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const params = new URLSearchParams();
    formData.forEach((value, key) => {
      if (value) params.append(key, value as string);
    });
    router.push(`/${lang}/doctors?${params.toString()}`);
  };

  const specialtyValue = Array.isArray(searchParams.specialty)
    ? searchParams.specialty[0]
    : searchParams.specialty || '';

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm overflow-hidden"
    >
      {/* Мобильный вид: поля стекируются, кнопка — отдельная строка */}
      {/* Десктоп: горизонтальная строка с разделителями */}
      <div className="flex flex-col md:flex-row">

        {/* Город */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 md:w-48 flex-shrink-0 border-b border-slate-100 md:border-b-0 md:border-r">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <select
            name="city"
            defaultValue={searchParams.city}
            className="flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
            aria-label={L('all_cities')}
          >
            <option value="">{L('all_cities')}</option>
            {cities.filter(Boolean).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Специальность — передаём inputClassName напрямую */}
        <div className="flex-1 border-b border-slate-100 md:border-b-0 md:border-r min-w-0">
          <SpecialtyAutocomplete
            defaultValue={specialtyValue}
            lang={lang}
            placeholder={L('all_specialties')}
            inputClassName="w-full px-4 py-3.5 bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none"
          />
          <input type="hidden" name="specialty" defaultValue={specialtyValue} />
        </div>

        {/* Тип консультации */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 md:w-52 flex-shrink-0 border-b border-slate-100 md:border-b-0 md:border-r">
          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <select
            name="type"
            defaultValue={searchParams.type}
            className="flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
            aria-label={L('consultation_type')}
          >
            <option value="">{L('consultation_type')}</option>
            <option value="in_person">{L('in_person')}</option>
            <option value="online">{L('online')}</option>
            <option value="home_visit">{L('home_visit')}</option>
          </select>
        </div>

        {/* Кнопка поиска */}
        <button
          type="submit"
          className="w-full md:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition flex items-center justify-center gap-2 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {L('search')}
        </button>
      </div>

      {/* Нижняя строка — только NearMe, компактная */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60 flex items-center gap-2">
        <NearMeButton lang={lang} />
        <span className="text-xs text-slate-400 hidden sm:inline">{t('doctors.nearMePrompt')}</span>
      </div>
    </form>
  );
}
