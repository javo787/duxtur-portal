import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { getT, Locale } from '@/i18n';

const linkCls =
  'inline-flex min-h-8 items-center text-[0.9375rem] text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

type FooterLink = { href: string; label: string; kind?: 'hard' | 'external' };

/** Shared by every public page. Theme tokens only, so it is correct in both themes. */
export default function HomeFooter({ lang }: { lang: Locale }) {
  const year = new Date().getFullYear();
  const t = getT(lang);

  const columns: { title: string; links: FooterLink[] }[] = [
    {
      title: t('home.footerForReaders'),
      links: [
        { href: `/${lang}/blog`, label: t('nav.allArticles') },
        { href: `/${lang}/doctors`, label: t('nav.findDoctor') },
        { href: `/${lang}/clinics`, label: t('clinic.title') },
        { href: `/${lang}/authors`, label: t('nav.authors') },
        { href: `/${lang}/search`, label: t('common.search') },
        // Duxtur Edu is a separate app at /edu: a plain <a> (a full page load), not next/link.
        { href: '/edu', label: t('nav.eduFull'), kind: 'hard' },
      ],
    },
    {
      title: t('home.footerForDoctors'),
      links: [
        { href: `/${lang}/register`, label: t('nav.becomeAuthor') },
        { href: `/${lang}/clinic/register`, label: t('clinic.registerClinic') },
        { href: `/${lang}/login`, label: t('nav.myOffice') },
      ],
    },
    {
      title: t('home.footerAbout'),
      links: [
        { href: `/${lang}/about`, label: t('nav.aboutUs') },
        { href: `/${lang}/editorial`, label: t('nav.editorialPolicy') },
        { href: 'https://t.me/duxturcom', label: 'Telegram', kind: 'external' },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-8 md:px-8 md:pt-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link href={`/${lang}`} className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
              <Image src="/logo.png" alt="" width={32} height={32} className="size-8 rounded-lg object-contain" />
              <span className="font-clinic text-lg font-semibold tracking-[-0.01em]">
                duxtur<span className="text-primary">.org</span>
              </span>
            </Link>
            <p className="mt-4 max-w-[26ch] text-[0.9375rem] leading-6 text-muted-foreground">{t('home.footerTagline')}</p>
          </div>

          {columns.map(col => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="mb-3 text-sm font-semibold [font-family:inherit]">{col.title}</h2>
              <ul className="space-y-1">
                {col.links.map(l => (
                  <li key={l.href}>
                    {l.kind === 'external' ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className={`${linkCls} gap-1.5`}>
                        {l.label}
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                      </a>
                    ) : l.kind === 'hard' ? (
                      <a href={l.href} className={linkCls}>
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className={linkCls}>
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* A medical site says this where everybody sees it */}
        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted-foreground md:flex-row md:items-start md:justify-between md:gap-10">
          <p className="max-w-[60ch] leading-6">{t('home.footerDisclaimer')}</p>
          <p className="shrink-0 tabular-nums">© {year} Duxtur.org</p>
        </div>
      </div>
    </footer>
  );
}
