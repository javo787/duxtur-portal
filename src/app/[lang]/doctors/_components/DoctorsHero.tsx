import Link from 'next/link';
import SearchForm from './SearchForm';
import SpecialtyChips from './SpecialtyChips';

interface DoctorsHeroProps {
  lang: string;
  searchParams: Record<string, string | string[] | undefined>;
  cities: string[];
  activeSpecialty: string;
  L: (key: string) => string;
}

export default function DoctorsHero({ lang, searchParams, cities, activeSpecialty, L }: DoctorsHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 pt-10 pb-8">
      {/* Декоративные блики (aria-hidden) */}
      <div aria-hidden="true" className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
      <div aria-hidden="true" className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/8 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl pointer-events-none" />
      <div aria-hidden="true" className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative max-w-7xl mx-auto px-4">
        {/* Хлебные крошки (улучшенный контраст) */}
        <nav className="flex items-center gap-1.5 text-xs text-blue-200/80 mb-5" aria-label="Breadcrumb">
          <Link href={`/${lang}`} className="hover:text-white transition">Главная</Link>
          <span aria-hidden="true">/</span>
          <span className="text-white font-medium">{L('title')}</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/25 text-blue-200 text-[11px] font-semibold uppercase tracking-wider mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              Верифицированные специалисты
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
              {L('title')}
            </h1>
            <p className="text-blue-200/90 text-[15px]">{L('subtitle')}</p>
          </div>
          {/* Кнопка "На карте" убрана отсюда (оставлена только в результатах) */}
        </div>

        {/* Поисковая форма */}
        <SearchForm lang={lang} searchParams={searchParams} cities={cities} L={L} />

        {/* Чипсы специальностей */}
        <SpecialtyChips lang={lang} activeSpecialty={activeSpecialty} />
      </div>
    </section>
  );
}
