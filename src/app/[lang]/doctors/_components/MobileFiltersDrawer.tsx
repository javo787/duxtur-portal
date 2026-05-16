'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CATEGORY_LABELS } from '@/lib/doctor-constants';
import UI from '@/dictionaries/doctor-translations';

type Props = {
  lang: string;
  cities: string[];
  sp: any; // searchParams
  L: (key: string) => string;
};

export default function MobileFiltersDrawer({ lang, cities, sp }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Кнопка открытия */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 lg:hidden bg-blue-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </button>

      {/* Оверлей + Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl overflow-y-auto animate-slide-left">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">{L('filters')}</h3>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Содержимое как в десктопном сайдбаре */}
              <form id="mobile-search-form" action={`/${lang}/doctors`} method="GET" className="space-y-8">
                {/* Скрытые поля для передачи текущих параметров, кроме фильтруемых */}
                {sp.city && <input type="hidden" name="city" value={sp.city} />}
                {sp.specialty && <input type="hidden" name="specialty" value={sp.specialty} />}
                {sp.type && <input type="hidden" name="type" value={sp.type} />}

                {/* Price Range */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">{L('price_range')}</label>
                  <div className="flex items-center gap-3">
                    <input name="priceMin" type="number" defaultValue={sp.priceMin} placeholder="0" className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm" />
                    <span className="text-slate-300">—</span>
                    <input name="priceMax" type="number" defaultValue={sp.priceMax} placeholder="1000" className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm" />
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
                          <input type="radio" name="exp" value={e.val} defaultChecked={isActive} className="hidden" />
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
                          <input name="lang_spoken" value={lng} type="checkbox" defaultChecked={isChecked} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition">{lng}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Accepts toggle */}
                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between group">
                    <span className="text-sm font-bold text-slate-700">{L('accepts_new')}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="accepts" value="true" defaultChecked={sp.accepts === 'true'} className="sr-only peer" />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-100">
                  Применить фильтры
                </button>
              </form>

              <Link href={`/${lang}/doctors`} className="block text-center mt-4 text-sm font-bold text-blue-600 hover:underline" onClick={() => setOpen(false)}>
                Сбросить все фильтры
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
