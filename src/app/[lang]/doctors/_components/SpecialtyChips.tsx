import Link from 'next/link';
import { CATEGORIES } from '@/lib/doctor-constants';

export default function SpecialtyChips({
  lang,
  activeSpecialty,
}: {
  lang: string;
  activeSpecialty: string;
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto scrollbar-hide mt-5 pb-1"
      role="list"
      aria-label="Фильтр по специальности"
    >
      {/* «Все» — всегда чуть заметнее неактивных специальностей */}
      <Link
        href={`/${lang}/doctors`}
        className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs transition-all border ${
          !activeSpecialty
            ? 'bg-slate-900 text-white border-slate-900 shadow-sm font-semibold'
            : 'bg-white border-slate-200 text-slate-700 font-semibold hover:border-slate-300 hover:text-slate-900'
        }`}
        role="listitem"
        aria-current={!activeSpecialty ? 'true' : undefined}
      >
        Все
      </Link>

      {Object.entries(CATEGORIES).map(([key, cfg]) => {
        const isActive = activeSpecialty === key;
        const label = cfg.labels[lang as keyof typeof cfg.labels] || cfg.labels.ru;
        return (
          <Link
            key={key}
            href={`/${lang}/doctors?specialty=${key}`}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all border ${
              isActive
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm font-semibold'
                : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/60'
            }`}
            role="listitem"
            aria-current={isActive ? 'true' : undefined}
          >
            <span aria-hidden="true">{cfg.icon}</span>
            {label}
          </Link>
        );
      })}
    </div>
  );
}
