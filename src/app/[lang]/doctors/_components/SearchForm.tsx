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
      className="bg-white/80 backdrop-blur-xl md:rounded-[2rem] rounded-2xl ring-1 ring-slate-200/60 shadow-xl shadow-slate-200/40 overflow-visible relative z-10 transition-shadow hover:shadow-2xl hover:shadow-slate-200/50"
    >
      {/* Desktop: single row pill shape. Mobile: stacked layout */}
      <div className="flex flex-col md:flex-row items-center p-2 md:p-3">

        {/* City Select */}
        <div className="flex items-center gap-3 px-4 py-3 md:py-2 md:w-56 w-full flex-shrink-0 border-b border-slate-100 md:border-b-0 md:border-r">
          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Город</span>
            <select
              name="city"
              defaultValue={searchParams.city}
              className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer hover:text-blue-600 transition-colors"
              aria-label={L('all_cities')}
            >
              <option value="">{L('all_cities')}</option>
              {cities.filter(Boolean).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Specialty Autocomplete */}
        <div className="flex items-center gap-3 px-4 py-3 md:py-2 flex-1 w-full border-b border-slate-100 md:border-b-0 md:border-r min-w-0">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex flex-col flex-1 w-full">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Специальность</span>
            <SpecialtyAutocomplete
              defaultValue={specialtyValue}
              lang={lang}
              placeholder={L('all_specialties')}
              inputClassName="w-full bg-transparent text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium outline-none"
            />
            <input type="hidden" name="specialty" defaultValue={specialtyValue} />
          </div>
        </div>

        {/* Consultation Type */}
        <div className="flex items-center gap-3 px-4 py-3 md:py-2 md:w-56 w-full flex-shrink-0 border-b border-slate-100 md:border-b-0 md:border-r md:pr-4">
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex flex-col flex-1">
             <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Тип приема</span>
            <select
              name="type"
              defaultValue={searchParams.type}
              className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer hover:text-blue-600 transition-colors"
              aria-label={L('consultation_type')}
            >
              <option value="">{L('consultation_type')}</option>
              <option value="in_person">{L('in_person')}</option>
              <option value="online">{L('online')}</option>
              <option value="home_visit">{L('home_visit')}</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="w-full md:w-auto mt-2 md:mt-0 md:pl-2">
          <button
            type="submit"
            className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold text-sm md:rounded-full rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 flex-shrink-0 btn-spring"
          >
            <span className="hidden md:inline">{L('search')}</span>
            <span className="md:hidden">Найти врача</span>
            <svg className="w-4 h-4 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Footer bar - NearMe */}
      <div className="px-5 py-2.5 bg-slate-50/80 md:rounded-b-[2rem] rounded-b-2xl border-t border-slate-100 flex items-center justify-center md:justify-start gap-3">
        <NearMeButton lang={lang} />
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">{t('doctors.nearMePrompt')}</span>
      </div>
    </form>
  );
}
