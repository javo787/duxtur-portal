'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ClinicTypeOption } from '@/lib/clinic-constants';
import { useT, Locale } from '@/i18n';

import { COMMON_SPECIALTIES } from '@/lib/clinic-constants';

export default function ClinicFilters({
  cities,
  types,
  currentCity,
  currentType,
  currentSpecialty,
  currentQ,
  currentSort,
  lang
}: {
  cities: readonly string[] | string[],
  types: readonly ClinicTypeOption[] | ClinicTypeOption[],
  currentCity?: string,
  currentType?: string,
  currentSpecialty?: string,
  currentQ?: string,
  currentSort?: string,
  lang: Locale
}) {
  const { t } = useT(lang);

  const buildUrl = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (currentCity) params.set('city', currentCity);
    if (currentType) params.set('type', currentType);
    if (currentSpecialty) params.set('specialty', currentSpecialty);
    if (currentQ) params.set('q', currentQ);
    if (currentSort) params.set('sort', currentSort);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) params.delete(key);
      else params.set(key, value);
    });

    return `/${lang}/clinics?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Cities */}
      <div className="relative">
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-2"
        >
          {cities.map(city => (
            <Link
              key={city}
              href={buildUrl({ city: currentCity === city ? undefined : city, page: '1' })}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                currentCity === city
                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {city}
            </Link>
          ))}
        </motion.div>
        {/* Gradient Mask */}
        <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-white dark:from-slate-950 to-transparent pointer-events-none" />
      </div>

      {/* Types */}
      <div className="relative">
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-2"
        >
          {types.map(type => (
            <Link
              key={type.id}
              href={buildUrl({ type: currentType === type.id ? undefined : type.id, page: '1' })}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                currentType === type.id
                ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="mr-2">{type.emoji}</span>
              {t('clinic.type_' + type.id)}
            </Link>
          ))}
        </motion.div>
        {/* Gradient Mask */}
        <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-white dark:from-slate-950 to-transparent pointer-events-none" />
      </div>

      {/* Specialties */}
      <div className="relative">
        <motion.div
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-2"
        >
          {COMMON_SPECIALTIES.map(specialty => (
            <Link
              key={specialty.id}
              href={buildUrl({ specialty: currentSpecialty === specialty.label ? undefined : specialty.label, page: '1' })}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                currentSpecialty === specialty.label
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('clinic.specialty_' + specialty.id)}
            </Link>
          ))}
        </motion.div>
        {/* Gradient Mask */}
        <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-white dark:from-slate-950 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
