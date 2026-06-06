'use client';

import Link from 'next/link';
import { CATEGORY_LABELS } from '@/lib/doctor-constants';

interface ActiveFiltersProps {
  lang: string;
  searchParams: Record<string, string | string[] | undefined>;
}

export default function ActiveFilters({ lang, searchParams }: ActiveFiltersProps) {
  const buildUrl = (keyToRemove: string) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (k !== keyToRemove && v !== undefined && v !== '') {
        if (Array.isArray(v)) {
          v.forEach((val) => params.append(k, val));
        } else {
          params.append(k, v as string);
        }
      }
    });
    const qs = params.toString();
    return `/${lang}/doctors${qs ? `?${qs}` : ''}`;
  };

  // Нормализуем значения из query-строки
  const city = Array.isArray(searchParams.city) ? searchParams.city[0] : searchParams.city;
  const specialty = Array.isArray(searchParams.specialty) ? searchParams.specialty[0] : searchParams.specialty;

  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Активные фильтры">
      {city && (
        <Link
          href={buildUrl('city')}
          className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100 hover:bg-blue-100 transition"
        >
          📍 {city}
          <span className="ml-1" aria-hidden="true">×</span>
        </Link>
      )}
      {specialty && (
        <Link
          href={buildUrl('specialty')}
          className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-100 hover:bg-amber-100 transition"
        >
          {CATEGORY_LABELS[specialty]?.[lang] || specialty}
          <span className="ml-1" aria-hidden="true">×</span>
        </Link>
      )}
    </div>
  );
}
