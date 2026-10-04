import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ShieldCheck, Star } from 'lucide-react';
import { getT, Locale } from '@/i18n';
import { ClinicDocument } from '@/lib/clinic-constants';
import { hasRealWorkingHours } from '@/lib/clinic-hours';
import { getOptimizedCloudinaryUrl } from '@/lib/utils';
import ClinicHours from '../[slug]/_components/ClinicHours';
import { initials, pick, specialtyLabels } from '../[slug]/_components/shared';

type ListedClinic = ClinicDocument & { status?: string };

/** Logo if there is one (that is what people recognise), then the cover photo, then initials. Never a stock picture. */
function Thumb({ clinic, name, priority }: { clinic: ListedClinic; name: string; priority: boolean }) {
  const box = 'relative size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-card sm:size-28';
  if (clinic.logo) {
    return (
      <div className={box}>
        <Image
          src={getOptimizedCloudinaryUrl(clinic.logo, { width: 240, height: 240, crop: 'limit' })}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 640px) 112px, 80px"
          className="object-contain p-2"
        />
      </div>
    );
  }
  if (clinic.coverImage) {
    return (
      <div className={box}>
        <Image
          src={getOptimizedCloudinaryUrl(clinic.coverImage, { width: 240, height: 240, crop: 'fill' })}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 640px) 112px, 80px"
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div className={`${box} flex items-center justify-center bg-muted font-clinic text-2xl font-semibold text-foreground/50`} aria-hidden="true">
      {initials(name)}
    </div>
  );
}

export default function ClinicCard({ clinic, lang, priority = false }: { clinic: ListedClinic; lang: Locale; priority?: boolean }) {
  const t = getT(lang);
  const name = pick(clinic.name, lang);
  const verified = clinic.status === 'approved';
  const reviews = clinic.rating?.count ?? 0;
  const doctors = clinic.doctorCount ?? clinic.doctorIds?.length ?? 0;
  const showHours = !!clinic.workingHours && hasRealWorkingHours(clinic);

  const hasMeta = verified || reviews > 0 || showHours || doctors > 0;

  const place = [clinic.city, clinic.district || clinic.address].filter(Boolean).join(', ');
  const specialties = specialtyLabels(clinic.specialties, t);
  const shown = specialties.slice(0, 3).map(s => s.label).join(' · ');
  const more = specialties.length - 3;

  return (
    <li>
      <Link
        href={`/${lang}/clinics/${clinic.slug}`}
        className="group flex gap-4 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:py-5"
      >
        <Thumb clinic={clinic} name={name.text} priority={priority} />

        <div className="min-w-0 flex-1">
          <h3 lang={name.lang} className="line-clamp-2 font-clinic text-lg leading-snug font-semibold group-hover:underline sm:text-xl">
            {name.text}
          </h3>
          <p className="mt-0.5 truncate text-sm text-foreground/70">
            {[t('clinic.type_' + clinic.type), place].filter(Boolean).join(' · ')}
          </p>

          {hasMeta && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {verified && (
                <span className="inline-flex items-center gap-1 font-medium text-ok">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  {t('clinic.verifiedShort')}
                </span>
            )}
            {reviews > 0 && (
              <span className="inline-flex items-center gap-1">
                <Star className="size-4 fill-amber-500 text-amber-500" aria-hidden="true" />
                <span className="font-semibold tabular-nums">{clinic.rating.avg.toFixed(1)}</span>
                <span className="text-foreground/65">({reviews})</span>
              </span>
            )}
            {showHours && <ClinicHours hours={clinic.workingHours as never} lang={lang} variant="status" fallback={null} />}
            {doctors > 0 && (
              <span className="text-foreground/65 first-letter:uppercase">
                {t('common.doctors')}: {doctors}
              </span>
            )}
          </div>
          )}

          {shown && (
            <p className="mt-1.5 line-clamp-1 text-sm text-foreground/65">
              {shown}
              {more > 0 && ` +${more}`}
            </p>
          )}
        </div>

        <ChevronRight className="hidden size-5 shrink-0 self-center text-foreground/30 group-hover:text-foreground sm:block" aria-hidden="true" />
      </Link>
    </li>
  );
}
