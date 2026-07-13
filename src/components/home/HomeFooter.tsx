import Link from 'next/link';
import { getT, Locale } from '@/i18n';
import Image from 'next/image';

export default function HomeFooter({ lang }: { lang: Locale }) {
  const year = new Date().getFullYear();
  const t = getT(lang);

  return (
    <footer className="border-t border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-background/50 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href={`/${lang}`} className="inline-flex items-center gap-3 mb-5 group">
              <Image
                src="/logo.png"
                alt="Duxtur logo"
                width={32}
                height={32}
                className="rounded-lg object-contain group-hover:opacity-90 transition"
              />
              <span className="font-display font-bold text-[18px] text-slate-900 dark:text-white tracking-[-0.03em]">
                duxtur<span className="text-blue-600">.org</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[240px]">
              {t('home.footerTagline')}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-5">
              {['RU', 'TJ', 'UZ', 'KZ', 'KG'].map((l) => (
                <span key={l} className="text-[11px] font-semibold px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500 bg-white dark:bg-transparent">
                  {l}
                </span>
              ))}
            </div>
          </div>

          {/* Читателям */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-4">{t('home.footerForReaders')}</h4>
            <ul className="space-y-3">
              {[
                { href: `/${lang}/blog`, label: t('nav.allArticles') },
                { href: `/${lang}/doctors`, label: t('nav.findDoctor') },
                { href: `/${lang}/clinics`, label: t('clinic.title') },
                { href: `/${lang}/authors`, label: t('nav.authors') },
                { href: `/${lang}/search`, label: t('common.search') },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="footer-link inline-block text-sm text-slate-500">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Врачам */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-4">{t('home.footerForDoctors')}</h4>
            <ul className="space-y-3">
              {[
                { href: `/${lang}/register`, label: t('nav.becomeAuthor') },
                { href: `/${lang}/clinic/register`, label: t('clinic.registerClinic') },
                { href: `/${lang}/login`, label: t('nav.myOffice') },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="footer-link inline-block text-sm text-slate-500">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* О портале */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-4">{t('home.footerAbout')}</h4>
            <ul className="space-y-3">
              {[
                { href: `/${lang}/about`, label: t('nav.aboutUs'), external: false },
                { href: `/${lang}/editorial`, label: t('nav.editorialPolicy'), external: false },
                { href: 'https://t.me/duxturcom', label: 'Telegram', external: true },
              ].map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer-link inline-flex items-center gap-1 text-sm text-slate-500"
                    >
                      {link.label}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <Link href={link.href} className="footer-link inline-block text-sm text-slate-500">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200/80 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400 dark:text-slate-500">© {year} Duxtur.org</p>
          <p className="text-xs text-slate-400 dark:text-slate-600 text-center max-w-lg">
            {t('home.footerDisclaimer')}
          </p>
          <Link href={`/${lang}/editorial`} className="text-sm text-slate-400 dark:text-slate-500 hover:text-blue-600 transition-colors">
            {t('nav.editorialPolicy')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
