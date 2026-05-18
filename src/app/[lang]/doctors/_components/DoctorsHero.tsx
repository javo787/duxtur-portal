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
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/50 to-amber-50/40 pt-8 pb-7 border-b border-slate-200/60">
      
      {/* Декоративные блики */}
      <div aria-hidden="true" className="absolute top-0 right-0 w-96 h-96 bg-blue-400/6 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
      <div aria-hidden="true" className="absolute bottom-0 left-0 w-72 h-72 bg-amber-400/8 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl pointer-events-none" />
      <div aria-hidden="true" className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #1e3a8a 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative max-w-7xl mx-auto px-4">

        {/* Хлебные крошки — усиленный контраст */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-5 font-medium" aria-label="Breadcrumb">
          <Link href={`/${lang}`} className="hover:text-blue-600 transition text-slate-600">Главная</Link>
          <span aria-hidden="true" className="text-slate-300">/</span>
          <span className="text-slate-800 font-semibold">{L('title')}</span>
        </nav>

        <div className="mb-7">
          {/* Верификационный бейдж */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold uppercase tracking-wider mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            Верифицированные специалисты
          </div>

          {/* Заголовок */}
          <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-3 leading-tight">
            {L('title')}
          </h1>

          {/* Акцентная черта под заголовком */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-[3px] bg-gradient-to-r from-blue-500 to-amber-400 rounded-full" />
            <div className="w-6 h-[3px] bg-slate-200 rounded-full" />
          </div>

          {/* Подзаголовок — усиленный цвет */}
          <p className="text-slate-600 text-base font-medium max-w-lg leading-relaxed">
            {L('subtitle')}
          </p>
        </div>

        {/* Поисковая форма */}
        <SearchForm lang={lang} searchParams={searchParams} cities={cities} L={L} />

        {/* Чипсы специальностей */}
        <SpecialtyChips lang={lang} activeSpecialty={activeSpecialty} />
      </div>
    </section>
  );
}
