import Image from 'next/image';
import { ShieldCheck, Star } from 'lucide-react';
import { getT } from '@/i18n';
import { getOptimizedCloudinaryUrl } from '@/lib/utils';
import { isUnverifiedImport } from '@/lib/clinic-display';
import { pick, type ClinicView } from './shared';

/** Real photo only. Without a cover the page opens on type instead of a grey placeholder. */
export function ClinicCover({ clinic, lang = 'ru' }: { clinic: ClinicView; lang?: string }) {
  if (!clinic.coverImage) return null;
  // It is the clinic's own photo and the page's largest image, so it gets a real description for image search
  // and screen readers instead of alt="".
  const alt = [pick(clinic.name, lang).text, clinic.city].filter(Boolean).join(', ');
  return (
    <div className="relative aspect-[16/9] w-full bg-muted md:aspect-[21/7] md:max-h-[400px]">
      <Image
        src={getOptimizedCloudinaryUrl(clinic.coverImage, { width: 1600, height: 700, crop: 'fill' })}
        alt={alt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
    </div>
  );
}

export default function ClinicHero({ clinic, lang }: { clinic: ClinicView; lang: string }) {
  const t = getT(lang);
  const name = pick(clinic.name, lang);
  const rating = clinic.rating;
  const typeLine = [t('clinic.type_' + clinic.type), clinic.city].filter(Boolean).join(', ');

  return (
    <header className="pt-6 lg:col-start-1 lg:row-start-1 lg:pt-10">
      <div className="flex items-center gap-3">
        {clinic.logo && (
          <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border bg-white">
            <Image
              src={getOptimizedCloudinaryUrl(clinic.logo, { width: 200, height: 200, crop: 'limit' })}
              alt=""
              fill
              sizes="56px"
              className="object-contain p-1.5"
            />
          </div>
        )}
        <p className="text-sm text-foreground/70">{typeLine}</p>
      </div>

      <h1
        lang={name.lang}
        className="mt-5 font-clinic text-[2rem] leading-[1.1] font-semibold tracking-[-0.01em] text-balance md:text-5xl"
      >
        {name.text}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {clinic.status === 'approved' && (
          <span className="inline-flex items-center gap-1.5 font-medium text-ok">
            <ShieldCheck className="size-4" aria-hidden="true" />
            {t('clinic.verified')}
          </span>
        )}
        {isUnverifiedImport(clinic) && (
          <a href="#claim" className="text-foreground/65 underline decoration-dotted underline-offset-4">
            {t('clinic.unverified')}
          </a>
        )}
        {rating && rating.count > 0 && (
          <a href="#reviews" className="inline-flex items-center gap-1.5">
            <Star className="size-4 fill-amber-500 text-amber-500" aria-hidden="true" />
            <span className="font-semibold tabular-nums">{rating.avg.toFixed(1)}</span>
            <span className="text-foreground/65">({rating.count})</span>
          </a>
        )}
      </div>
    </header>
  );
}
