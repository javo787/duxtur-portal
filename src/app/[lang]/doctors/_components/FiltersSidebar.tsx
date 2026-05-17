'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AcceptsToggle from './AcceptsToggle';
import NearMeButton from '@/components/NearMeButton';

interface FiltersSidebarProps {
  lang: string;
  searchParams: Record<string, string | string[] | undefined>;
  cities: string[];
  L: (key: string) => string;
}

export default function FiltersSidebar({ lang, searchParams, L }: FiltersSidebarProps) {
  const router = useRouter();
  const sp = searchParams;

  const handleApply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    formData.forEach((value, key) => {
      if (value) params.append(key, value as string);
    });
    router.push(`/${lang}/doctors?${params.toString()}`);
  };

  // Сброс всех фильтров
  const resetUrl = `/${lang}/doctors`;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-24">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          {L('filters')}
        </h3>
        <Link href={resetUrl} className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition">
          Сбросить
        </Link>
      </div>

      <form onSubmit={handleApply} className="p-5 space-y-6">
        {/* Цена */}
        <fieldset>
          <legend className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] block mb-3">{L('price_range')}</legend>
          <div className="flex items-center gap-2">
            <input
              name="priceMin"
              type="number"
              defaultValue={sp.priceMin}
              placeholder="0"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:bg-white transition"
            />
            <span className="text-slate-300 font-bold text-sm" aria-hidden="true">—</span>
            <input
              name="priceMax"
              type="number"
              defaultValue={sp.priceMax}
              placeholder="1000"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:bg-white transition"
            />
          </div>
        </fieldset>

        {/* Опыт */}
        <fieldset>
          <legend className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] block mb-3">{L('experience')}</legend>
          <div className="space-y-1.5">
            {[
              { val: '', label: L('any_exp') },
              { val: '5', label: L('exp_5') },
              { val: '10', label: L('exp_10') },
            ].map(e => {
              const isActive = (sp.exp || '') === e.val;
              return (
                <label key={e.val} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition ${
                  isActive ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}>
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                  }`}>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  {e.label}
                  <input
                    type="radio"
                    name="exp"
                    value={e.val}
                    defaultChecked={isActive}
                    className="sr-only"
                  />
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Языки */}
        <fieldset>
          <legend className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] block mb-3">{L('languages')}</legend>
          <div className="space-y-2">
            {['Русский', 'Тоҷикӣ', "O'zbek", 'English'].map(lng => {
              const isChecked = Array.isArray(sp.lang_spoken)
                ? sp.lang_spoken.includes(lng)
                : sp.lang_spoken === lng;
              return (
                <label key={lng} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    name="lang_spoken"
                    value={lng}
                    type="checkbox"
                    defaultChecked={isChecked}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition">{lng}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Принимает новых */}
        <div className="pt-4 border-t border-slate-100">
          <AcceptsToggle defaultChecked={sp.accepts === 'true'} label={L('accepts_new')} />
        </div>

        {/* Рядом со мной */}
        <div>
          <NearMeButton />
        </div>

        <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition shadow-md shadow-blue-100">
          Применить фильтры
        </button>
      </form>
    </div>
  );
}
