import Link from 'next/link';
import SearchForm from './SearchForm';
import SpecialtyChips from './SpecialtyChips';
import { getT } from '@/i18n';

interface DoctorsHeroProps {
  lang: string;
  searchParams: Record<string, string | string[] | undefined>;
  cities: string[];
  activeSpecialty: string;
  L: (key: string) => string;
}

export default function DoctorsHero({ lang, searchParams, cities, activeSpecialty, L }: DoctorsHeroProps) {
  const t = getT(lang);
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/50 pt-10 pb-8 md:pt-16 md:pb-12 border-b border-slate-200/60">
      
      {/* Decorative premium background elements */}
      <div aria-hidden="true" className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-[80px] pointer-events-none" />
      <div aria-hidden="true" className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full translate-y-1/3 -translate-x-1/3 blur-[60px] pointer-events-none" />
      <div aria-hidden="true" className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #0f172a 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs md:text-sm text-slate-500 mb-6 font-medium animate-fade-in" aria-label="Breadcrumb" style={{ animationDelay: '0.1s' }}>
          <Link href={`/${lang}`} className="hover:text-blue-600 transition-colors text-slate-600">{t('nav.home')}</Link>
          <span aria-hidden="true" className="text-slate-300">/</span>
          <span className="text-slate-900 font-semibold">{L('title')}</span>
        </nav>

        <div className="mb-10 max-w-3xl">
          {/* Verification Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] md:text-xs font-bold uppercase tracking-wider mb-5 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {t('home.authorsSubtitle')}
          </div>

          {/* Title */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-4 leading-[1.1] animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {L('title')}
          </h1>

          {/* Elegant Accent Line */}
          <div className="flex items-center gap-3 mb-5 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="w-12 h-[4px] bg-gradient-to-r from-blue-600 to-amber-500 rounded-full" />
            <div className="w-4 h-[4px] bg-slate-200 rounded-full" />
            <div className="w-2 h-[4px] bg-slate-200 rounded-full" />
          </div>

          {/* Subtitle */}
          <p className="text-slate-600 text-base md:text-lg font-medium leading-relaxed max-w-2xl animate-slide-up" style={{ animationDelay: '0.5s' }}>
            {L('subtitle')}
          </p>
        </div>

        {/* Search Form Wrapper */}
        <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <SearchForm lang={lang} searchParams={searchParams} cities={cities} L={L} />
        </div>

        {/* Specialty Chips */}
        <div className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <SpecialtyChips lang={lang} activeSpecialty={activeSpecialty} />
        </div>
      </div>
    </section>
  );
}
