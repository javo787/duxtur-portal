'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function HomeHero({ lang, dict }: { lang: string; dict: any }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.querySelectorAll('[data-animate]').forEach((child, i) => {
      const c = child as HTMLElement;
      c.style.opacity = '0';
      c.style.transform = 'translateY(28px)';
      setTimeout(() => {
        c.style.transition = 'opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1)';
        c.style.opacity = '1';
        c.style.transform = 'translateY(0)';
      }, 80 + i * 110);
    });
  }, []);

  return (
    <section className="relative overflow-hidden bg-white" style={{ minHeight: '540px' }}>
      {/* Тёплый фоновый градиент */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-amber-50/40 via-white to-white" />

      {/* Декоративные круги */}
      <div className="absolute top-16 right-[8%] w-72 h-72 rounded-full pointer-events-none opacity-30" style={{ background: 'radial-gradient(circle, oklch(0.70 0.16 75 / 0.4), transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-0 left-[5%] w-48 h-48 rounded-full pointer-events-none opacity-20" style={{ background: 'radial-gradient(circle, oklch(0.45 0.08 255 / 0.4), transparent 70%)', filter: 'blur(36px)' }} />

      <div ref={ref} className="relative max-w-6xl mx-auto px-5 pt-16 pb-20">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-14 items-center">
          {/* Левая колонка */}
          <div className="text-center lg:text-left">
            {/* Pill badge */}
            <div
              data-animate
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm text-[12px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-10"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Статьи от практикующих врачей
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            </div>

            <h1
              data-animate
              className="font-display font-bold leading-[1.07] tracking-[-0.035em] mb-6"
              style={{ fontSize: 'clamp(2.6rem, 7vw, 4.8rem)', color: 'oklch(0.16 0.015 260)' }}
            >
              {dict.hero_title}
            </h1>

            <p
              data-animate
              className="text-[17px] leading-relaxed text-slate-500 mb-10 max-w-[520px] mx-auto lg:mx-0 font-light"
            >
              {dict.hero_subtitle}
            </p>

            <div
              data-animate
              className="flex flex-wrap justify-center lg:justify-start gap-4"
            >
              <Link
                href={`/${lang}/blog`}
                className="inline-flex items-center gap-2.5 px-7 py-4 bg-slate-900 text-white font-semibold rounded-2xl hover:bg-slate-800 transition-colors active:scale-95"
              >
                Читать статьи
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href={`/${lang}/register`}
                className="inline-flex items-center gap-2.5 px-7 py-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-colors active:scale-95"
              >
                Стать автором
              </Link>
            </div>
          </div>

          {/* Правая иллюстрация */}
          <div className="hidden lg:flex justify-end">
            <div className="aspect-square w-full max-w-sm bg-gradient-to-br from-blue-100/60 via-amber-50/40 to-amber-100/50 rounded-[2.5rem] flex items-center justify-center shadow-lg shadow-slate-200/20">
              <svg className="w-24 h-24 text-amber-400/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div data-animate className="flex items-center justify-center gap-8 flex-wrap mt-14 pt-10 border-t border-slate-100 max-w-lg mx-auto lg:mx-0 lg:ml-0">
          {[
            { num: '5', label: 'языков Центральной Азии' },
            { num: '100%', label: 'верификация авторов' },
            { num: '24ч', label: 'до публикации' },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className="font-display font-bold text-[22px] tracking-[-0.04em] text-blue-600">
                {stat.num}
              </span>
              <span className="text-[13px] text-slate-400 font-normal leading-tight max-w-[90px] text-left">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
