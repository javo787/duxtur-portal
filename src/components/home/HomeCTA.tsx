import Link from 'next/link';
import { Check } from 'lucide-react';
import { getT } from '@/i18n';
import { btnPrimary } from '@/app/[lang]/clinics/[slug]/_components/shared';

/** The invitation to doctors: one panel, one action. The three points are not repeated anywhere else. */
export default function HomeCTA({ lang, dict }: { lang: string; dict: Record<string, string> }) {
  const t = getT(lang);

  return (
    <section className="py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div data-reveal="" className="grid items-center gap-8 rounded-[10px] border border-border bg-card p-6 md:grid-cols-[1fr_auto] md:gap-14 md:p-12">
          <div>
            <p className="text-sm font-medium text-primary">{t('home.ctaForDoctors')}</p>
            <h2 className="mt-3 font-clinic text-[1.75rem] leading-tight font-semibold tracking-[-0.01em] text-balance md:text-[2.25rem]">{dict.for_doctors}</h2>
            <ul className="mt-6 space-y-3">
              {[t('home.ctaFeature1'), t('home.ctaFeature2'), t('home.ctaFeature3')].map(item => (
                <li key={item} className="flex items-start gap-3 text-[0.9375rem] leading-6">
                  <Check className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="md:w-72 md:text-center">
            <p className="font-clinic text-xl font-semibold">{t('home.ctaVerification')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('home.ctaVerificationDesc')}</p>
            <Link href={`/${lang}/register`} className={`${btnPrimary} mt-5 w-full`}>
              {dict.btn_join}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
