'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AcceptsToggle } from './AcceptsToggle';
import NearMeButton from '@/components/NearMeButton';
import { useT } from '@/i18n';

interface FiltersSidebarProps {
  lang: string;
  searchParams: Record<string, string | string[] | undefined>;
  cities: string[];
  L: (key: string) => string;
}

export default function FiltersSidebar({ lang, searchParams, L }: FiltersSidebarProps) {
  const { t } = useT(lang);
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

  const resetUrl = `/${lang}/doctors`;

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden sticky top-24">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          {L('filters')}
        </h3>
        <Link href={resetUrl} className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-wider">
          {t('common.reset')}
        </Link>
      </div>

      <form onSubmit={handleApply} className="p-6 space-y-7">
        {/* Цена */}
        <fieldset>
          <legend className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] block mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            {L('price_range')}
          </legend>
          <div className="flex items-center gap-3">
            <input
              name="priceMin"
              type="number"
              defaultValue={sp.priceMin}
              placeholder="0"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm"
            />
            <span className="text-slate-300 font-bold text-sm" aria-hidden="true">—</span>
            <input
              name="priceMax"
              type="number"
              defaultValue={sp.priceMax}
              placeholder="1000"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm"
            />
          </div>
        </fieldset>

        {/* Опыт */}
        <fieldset>
          <legend className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] block mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            {L('experience')}
          </legend>
          <div className="space-y-2.5">
            {[
              { val: '', label: L('any_exp') },
              { val: '5', label: L('exp_5') },
              { val: '10', label: L('exp_10') },
            ].map(e => {
              const isActive = (sp.exp || '') === e.val;
              return (
                <label key={e.val} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold cursor-pointer transition-all ${
                  isActive ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}>
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isActive ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                  }`}>
                    {isActive && <span className="w-2 h-2 rounded-full bg-white" />}
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
          <legend className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] block mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {L('languages')}
          </legend>
          <div className="space-y-3">
            {['Русский', 'Тоҷикӣ', 'Oʻzbek', 'English'].map(lng => {
              const isChecked = Array.isArray(sp.lang_spoken)
                ? sp.lang_spoken.includes(lng)
                : sp.lang_spoken === lng;
              return (
                <label key={lng} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white group-hover:border-blue-400'}`}>
                     {isChecked && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
                  </div>
                  <input
                    name="lang_spoken"
                    value={lng}
                    type="checkbox"
                    defaultChecked={isChecked}
                    className="sr-only"
                  />
                  <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition">{lng}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Принимает новых */}
        <div className="pt-6 border-t border-slate-100">
          <AcceptsToggle defaultChecked={sp.accepts === 'true'} label={L('accepts_new')} />
        </div>

        {/* Рядом со мной */}
        <div className="pt-2">
          <NearMeButton lang={lang} />
        </div>

        <button type="submit" className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all shadow-xl shadow-slate-900/20 btn-spring">
          {t('doctors.applyFilters')}
        </button>
      </form>
    </div>
  );
}
