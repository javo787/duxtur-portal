import Link from 'next/link';
import { Search, ShieldCheck } from 'lucide-react';
import { getT } from '@/i18n';
import { btnPrimary } from '@/app/[lang]/clinics/[slug]/_components/shared';

/**
 * One headline, one line of support, one action (search), then the way into the three
 * sections of the site and the reasons to trust it. Server component: no client JavaScript,
 * nothing hidden until hydration.
 */
export default function HomeHero({ lang, dict }: { lang: string; dict: Record<string, string> }) {
  const t = getT(lang);

  return (
    <section className="relative isolate border-b border-border">
      {/* One static, token-based glow instead of animated blobs: works in both themes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_50%_0%,color-mix(in_oklab,var(--primary)_11%,transparent),transparent_72%)]"
      />

      <div className="mx-auto max-w-6xl px-4 pt-14 text-center md:px-8 md:pt-24">
        <p className="text-sm font-medium text-primary">{dict.hero_badge}</p>

        <h1 className="mx-auto mt-4 max-w-3xl font-clinic text-[2.5rem] leading-[1.06] font-semibold tracking-[-0.02em] text-balance md:text-[4rem]">
          {dict.hero_title}
        </h1>

        <p className="mx-auto mt-5 max-w-[36rem] text-[1.0625rem] leading-7 text-muted-foreground md:text-lg md:leading-8">{dict.hero_subtitle}</p>

        <form action={`/${lang}/search`} method="get" role="search" className="mx-auto mt-9 flex max-w-xl gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              name="q"
              placeholder={t('home.searchPlaceholder')}
              aria-label={t('home.searchPlaceholder')}
              className="h-12 w-full rounded-lg border border-field bg-card pr-3 pl-12 text-base text-card-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
          </div>
          <button type="submit" className={btnPrimary}>
            {t('common.search')}
          </button>
        </form>

        <p className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[0.9375rem]">
          {[
            { href: `/${lang}/blog`, label: dict.hero_cta_read },
            { href: `/${lang}/doctors`, label: t('nav.findDoctor') },
            { href: `/${lang}/clinics`, label: t('clinic.title') },
          ].map(l => (
            <Link key={l.href} href={l.href} className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline">
              {l.label} <span aria-hidden="true" className="ml-1">→</span>
            </Link>
          ))}
        </p>

        {/* Why trust it: stated plainly, with the policy one click away */}
        <ul className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-x-8 gap-y-5 border-t border-border py-7 text-left sm:grid-cols-3 sm:text-center">
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
