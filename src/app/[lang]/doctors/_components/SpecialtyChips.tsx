import Link from 'next/link';
import { CATEGORIES } from '@/lib/doctor-constants';

interface SpecialtyChipsProps {
  lang: string;
  activeSpecialty: string;
}

export default function SpecialtyChips({ lang, activeSpecialty }: SpecialtyChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-4 pb-1" role="list" aria-label="Специальности">
      <Link
        href={`/${lang}/doctors`}
        className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition border ${
          !activeSpecialty
            ? 'bg-white text-slate-900 border-white shadow-md'
            : 'bg-white/8 border-white/15 text-white/70 hover:bg-white/12 hover:text-white'
        }`}
        role="listitem"
      >
        Все
      </Link>
      {Object.entries(CATEGORIES).map(([key, cfg]) => {
        const isActive = activeSpecialty === key;
        return (
          <Link
            key={key}
            href={`/${lang}/doctors?specialty=${key}`}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition border ${
              isActive
                ? 'bg-white text-slate-900 border-white shadow-md'
                : 'bg-white/8 border-white/15 text-white/70 hover:bg-white/12 hover:text-white'
            }`}
            role="listitem"
          >
            <span aria-hidden="true">{cfg.icon}</span>
            {cfg.labels[lang] || cfg.labels.ru}
          </Link>
        );
      })}
    </div>
  );
}
