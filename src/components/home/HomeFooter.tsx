
import Link from 'next/link';
import { getT } from '@/i18n';

export default function HomeFooter({ lang }: { lang: string }) {
  const year = new Date().getFullYear();
  const t = getT(lang);

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-5 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href={`/${lang}`} className="inline-flex items-center gap-3 mb-5 group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-600">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="font-display font-bold text-[18px] text-slate-900 tracking-[-0.03em]">
                duxtur<span className="text-blue-600">.org</span>
              </span>
            </Link>
            <p className="text-[13.5px] text-slate-500 leading-relaxed max-w-[220px]">
              {t('home.footerTagline')}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-5">
              {['RU', 'TJ', 'UZ', 'KZ', 'KG'].map((l) => (
                <span key={l} className="text-[11px] font-semibold px-2 py-0.5 rounded border border-slate-200 text-slate-400">
                  {l}
                </span>
              ))}
            </div>
          </div>

          {/* Читателям */}
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-900 mb-4">{t('home.footerForReaders')}</h4>
            <ul className="space-y-3">
              {[
                { href: `/${lang}/blog`, label: t('nav.allArticles') },
                { href: `/${lang}/doctors`, label: t('nav.findDoctor') },
                { href: `/${lang}/clinics`, label: 'Клиники' },
                { href: `/${lang}/authors`, label: t('nav.authors') },
                { href: `/${lang}/search`, label: t('common.search') },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13.5px] text-slate-500 hover:text-blue-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Врачам */}
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-900 mb-4">{t('home.footerForDoctors')}</h4>
            <ul className="space-y-3">
              {[
                { href: `/${lang}/register`, label: t('nav.becomeAuthor') },
                { href: `/${lang}/login`, label: t('nav.myOffice') },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13.5px] text-slate-500 hover:text-blue-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* О портале */}
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-900 mb-4">{t('home.footerAbout')}</h4>
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
                      className="text-[13.5px] text-slate-500 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                    >
                      {link.label}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <Link href={link.href} className="text-[13.5px] text-slate-500 hover:text-blue-600 transition-colors">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-7 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[12.5px] text-slate-400">© {year} Duxtur.org</p>
          <p className="text-[12px] text-slate-300 text-center max-w-md">
            {t('home.footerDisclaimer')}
          </p>
          <Link href={`/${lang}/editorial`} className="text-[12.5px] text-slate-400 hover:text-blue-600 transition-colors">
            {t('nav.editorialPolicy')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
