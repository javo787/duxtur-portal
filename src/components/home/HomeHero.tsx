import type { CSSProperties } from 'react';
import Link from 'next/link';
import { Search, ShieldCheck } from 'lucide-react';
import { getT } from '@/i18n';
import { btnPrimary } from '@/app/[lang]/clinics/[slug]/_components/shared';

const rise = (i: number) => ({ className: 'hero-rise', style: { '--i': i } as CSSProperties });

export default function HomeHero({ lang, dict }: { lang: string; dict: Record<string, string> }) {
  const t = getT(lang);
  const badge = dict.hero_badge ?? t('home.heroBadge');
  const subtitle = dict.hero_subtitle ?? '';
  const readMore = dict.hero_cta_read ?? t('home.heroCtaRead');

  return (
    <section className="relative isolate border-b border-border">
      <div
        aria-hidden="true"
        className="hero-glow pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_50%_0%,color-mix(in_oklab,var(--primary)_11%,transparent),transparent_72%)]"
      />

      <div className="mx-auto max-w-6xl px-4 pt-14 text-center md:px-8 md:pt-24">
        <p {...rise(0)} className="hero-rise text-sm font-medium text-primary">{badge}</p>

        <h1 {...rise(0)} className="hero-rise mx-auto mt-4 max-w-3xl font-clinic text-[2.5rem] leading-[1.06] font-semibold tracking-[-0.02em] text-balance md:text-[4rem]">
          {dict.hero_title}
        </h1>

        <p {...rise(1)} className="hero-rise mx-auto mt-5 max-w-[36rem] text-[1.0625rem] leading-7 text-muted-foreground md:text-lg md:leading-8">
          {subtitle}
        </p>

        <form action={`/${lang}/search`} method="get" role="search" {...rise(2)} className="hero-rise mx-auto mt-9 flex max-w-xl gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              name="q"
              placeholder={t('home.searchPlaceholder')}
              aria-label={t('home.searchPlaceholder')}
              className="h-12 w-full rounded-lg border border-field bg-card pr-3 pl-12 text-base text-card-foreground transition-[border-color,box-shadow] duration-200 ease-premium placeholder:text-muted-foreground focus-visible:border-primary focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_16%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
          </div>
          <button type="submit" className={btnPrimary}>
            {t('common.search')}
          </button>
        </form>

        <p {...rise(3)} className="hero-rise mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[0.9375rem]">
          {[
            { href: `/${lang}/blog`, label: readMore },
            { href: `/${lang}/doctors`, label: t('nav.findDoctor') },
            { href: `/${lang}/clinics`, label: t('clinic.title') },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="group inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
              {l.label} <span aria-hidden="true" className="inline-block transition-transform duration-200 ease-premium group-hover:translate-x-0.5">→</span>
            </Link>
          ))}
        </p>

        <ul {...rise(4)} className="hero-rise mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-x-8 gap-y-5 border-t border-border py-7 text-left sm:grid-cols-3 sm:text-center">
          <li className="flex items-baseline gap-3 sm:flex-col sm:items-center sm:gap-1">
            <span className="font-clinic text-3xl leading-none font-semibold tabular-nums">5</span>
            <span className="text-sm text-muted-foreground">{t('home.heroStatLanguages')}</span>
          </li>
          <li className="flex items-baseline gap-3 sm:flex-col sm:items-center sm:gap-1">
            <span className="font-clinic text-3xl leading-none font-semibold tabular-nums">100%</span>
            <span className="text-sm text-muted-foreground">{t('home.heroStatVerification')}</span>
          </li>
          <li className="flex items-center sm:justify-center">
            <Link href={`/${lang}/editorial`} className="inline-flex min-h-11 items-center gap-2 text-left text-sm font-medium text-primary underline-offset-4 hover:underline">
              <ShieldCheck className="size-5 shrink-0" aria-hidden="true" />
              {t('home.trustHow')}
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
