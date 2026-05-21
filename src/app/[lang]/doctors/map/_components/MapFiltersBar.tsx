import React from 'react';
import { CATEGORY_LABELS } from '@/lib/doctor-constants';
import { useT } from '@/i18n';

interface MapFiltersBarProps {
  lang: string;
  activeSpecialty: string;
  onChange: (specialty: string) => void;
}

export function MapFiltersBar({ lang, activeSpecialty, onChange }: MapFiltersBarProps) {
  const { t } = useT(lang);
  return (
    <div className="flex overflow-x-auto gap-2 px-4 py-3 bg-white/80 backdrop-blur-md border-b z-10 no-scrollbar scroll-smooth snap-x snap-mandatory">
      <button
        onClick={() => onChange('')}
        className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all snap-start ${
          !activeSpecialty
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        {t('common.all')}
      </button>
      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
        <button
          key={k}
          onClick={() => onChange(v.ru)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all snap-start ${
            activeSpecialty === v.ru
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {v[lang] || v.ru}
        </button>
      ))}
    </div>
  );
}
