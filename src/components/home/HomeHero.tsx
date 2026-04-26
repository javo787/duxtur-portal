'use client';

import { useEffect, useRef } from 'react';

export default function HomeHero({ lang, dict }: { lang: string; dict: any }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const children = el.querySelectorAll('[data-animate]');
    children.forEach((child, i) => {
      (child as HTMLElement).style.opacity = '0';
      (child as HTMLElement).style.transform = 'translateY(24px)';
      setTimeout(() => {
        (child as HTMLElement).style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        (child as HTMLElement).style.opacity = '1';
        (child as HTMLElement).style.transform = 'translateY(0)';
      }, i * 120);
    });
  }, []);

  return (
    <section className="relative overflow-hidden bg-white pt-10 pb-14">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/3 opacity-70" />
        <div className="absolute bottom-0 left-0 w-52 h-52 bg-blue-50 rounded-full translate-y-1/2 -translate-x-1/3 opacity-50" />
      </div>

      <div ref={ref} className="relative max-w-4xl mx-auto px-4 text-center">
        <div data-animate
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold uppercase tracking-widest mb-7">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
          Статьи проверены врачами
        </div>

        <h1 data-animate
          className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-5 leading-[1.05] tracking-tight">
          {dict.hero_title}
        </h1>

        <p data-animate
          className="text-base md:text-xl text-gray-500 mb-8 max-w-xl mx-auto leading-relaxed">
          {dict.hero_subtitle}
        </p>

        <form data-animate action={`/${lang}/search`}
          className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-2xl px-4 py-3 max-w-xl mx-auto shadow-lg shadow-gray-100 focus-within:border-blue-400 transition">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" name="q" placeholder={dict.search_placeholder}
            className="flex-1 text-gray-700 placeholder-gray-400 bg-transparent outline-none text-sm md:text-base min-w-0" />
          <button type="submit"
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-4 py-2 text-sm transition active:scale-95 flex items-center gap-1.5">
            <span className="hidden sm:inline">{dict.search_btn}</span>
            <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </form>

        <div data-animate className="flex items-center justify-center gap-6 mt-7 flex-wrap">
          {[
            { num: '5', label: 'языков СНГ' },
            { num: '100%', label: 'верифицированы' },
            { num: '24ч', label: 'новые статьи' },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-1.5 text-sm text-gray-500">
              <span className="font-extrabold text-gray-900 text-base">{stat.num}</span>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
export default function HomeHero({ lang, dict }: { lang: string; dict: any }) {
  return (
    <section className="relative overflow-hidden bg-white pt-10 pb-14">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/3 opacity-70" />
        <div className="absolute bottom-0 left-0 w-52 h-52 bg-blue-50 rounded-full translate-y-1/2 -translate-x-1/3 opacity-50" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        {/* Бейдж */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold uppercase tracking-widest mb-7">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
          Статьи проверены врачами
        </div>

        {/* Заголовок */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-5 leading-[1.05] tracking-tight">
          {dict.hero_title}
        </h1>

        <p className="text-base md:text-xl text-gray-500 mb-8 max-w-xl mx-auto leading-relaxed">
          {dict.hero_subtitle}
        </p>

        {/* Поиск — на мобиле только иконка + поле, без отдельной кнопки */}
        <form action={`/${lang}/search`}
          className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-2xl px-4 py-3 max-w-xl mx-auto shadow-lg shadow-gray-100 focus-within:border-blue-400 transition">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            name="q"
            placeholder={dict.search_placeholder}
            className="flex-1 text-gray-700 placeholder-gray-400 bg-transparent outline-none text-sm md:text-base min-w-0"
          />
          {/* Десктоп — текст, мобиле — только иконка стрелки */}
          <button type="submit"
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-4 py-2 text-sm transition active:scale-95 flex items-center gap-1.5">
            <span className="hidden sm:inline">{dict.search_btn}</span>
            <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </form>

        {/* Статистика — горизонтально в одну строку */}
        <div className="flex items-center justify-center gap-6 mt-7 flex-wrap">
          {[
            { num: '5', label: 'языков СНГ' },
            { num: '100%', label: 'верифицированы' },
            { num: '24ч', label: 'новые статьи' },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-1.5 text-sm text-gray-500">
              <span className="font-extrabold text-gray-900 text-base">{stat.num}</span>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
