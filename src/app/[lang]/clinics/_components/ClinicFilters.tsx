import { ChevronDown } from 'lucide-react';
import { getT, Locale } from '@/i18n';
import { ClinicTypeOption, COMMON_SPECIALTIES } from '@/lib/clinic-constants';
import { btnPrimary } from '../[slug]/_components/shared';

const selectCls =
  'min-h-12 w-full rounded-lg border border-border bg-background px-3 text-[0.9375rem] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

/**
 * City, type and specialty as native selects. They belong to the search form (form="clinic-search"),
 * so everything submits together and no client JavaScript is needed. On a phone the panel is
 * collapsed behind one "Filters" row; from lg up it is a plain, always-open sidebar.
 */
export default function ClinicFilters({
  cities,
  types,
  currentCity,
  currentType,
  currentSpecialty,
  activeCount,
  lang,
}: {
  cities: readonly string[];
  types: readonly ClinicTypeOption[];
  currentCity?: string;
  currentType?: string;
  currentSpecialty?: string;
  activeCount: number;
  lang: Locale;
}) {
  const t = getT(lang);

  return (
    <details className="group rounded-[10px] border border-border lg:rounded-none lg:border-0 lg:[&::details-content]:[content-visibility:visible]">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 font-semibold lg:px-0 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          {t('doctors.filters')}
          {activeCount > 0 && (
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown className="size-4 transition-transform group-open:rotate-180 lg:hidden" aria-hidden="true" />
      </summary>

      <div className="space-y-4 border-t border-border p-4 lg:border-0 lg:px-0 lg:pt-2">
        <label className="block">
          <span className="mb-1.5 block text-sm text-foreground/70">{t('clinic.city')}</span>
          <select name="city" form="clinic-search" defaultValue={currentCity ?? ''} className={selectCls}>
            <option value="">{t('doctors.allCities')}</option>
            {cities.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-foreground/70">{t('clinic.specialty')}</span>
          <select name="specialty" form="clinic-search" defaultValue={currentSpecialty ?? ''} className={selectCls}>
            <option value="">{t('clinic.anySpecialty')}</option>
            {COMMON_SPECIALTIES.map(s => (
              <option key={s.id} value={s.id}>
                {t('clinic.specialty_' + s.id)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-foreground/70">{t('clinic.type')}</span>
          <select name="type" form="clinic-search" defaultValue={currentType ?? ''} className={selectCls}>
            <option value="">{t('clinic.anyType')}</option>
            {types.map(ty => (
              <option key={ty.id} value={ty.id}>
                {t('clinic.type_' + ty.id)}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" form="clinic-search" className={`${btnPrimary} w-full`}>
          {t('doctors.applyFilters')}
        </button>
      </div>
    </details>
  );
}
