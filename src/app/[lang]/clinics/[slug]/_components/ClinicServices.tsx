import { getT } from '@/i18n';
import { pick, type ClinicView } from './shared';

/** A price list: name, dotted leader, price. */
export default function ClinicServices({ services, lang }: { services: NonNullable<ClinicView['services']>; lang: string }) {
  const t = getT(lang);
  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat(lang).format(n);
    } catch {
      return String(n);
    }
  };

  return (
    <ul className="max-w-2xl">
      {services.map((s, i) => {
        const name = pick(s.name, lang);
        return (
          <li key={i} className="flex items-end gap-2 py-2.5">
            <span lang={name.lang} className="max-w-[75%]">
              {name.text}
            </span>
            <span className="mb-1.5 min-w-4 flex-1 border-b border-dotted border-foreground/25" aria-hidden="true" />
            <span className="whitespace-nowrap font-semibold tabular-nums">
              {s.price > 0 ? `${fmt(s.price)} ${s.currency}` : t('clinic.priceOnRequest')}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
