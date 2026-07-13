'use client';

import { useEffect, useRef, useId } from 'react';
import Link from 'next/link';
import { useT } from '@/i18n';

// ─── Живая иллюстрация (крест + ECG + орбиты) ──────────────────────────────
function HeroIllustration() {
  const uid = useId().replace(/:/g, '');
  const gradId = `cg-${uid}`;
  const glowId = `gl-${uid}`;

  const orbitDots = [
    { cls: 'bg-blue-500 ring-blue-100', anim: 'orbit1 8s linear infinite' },
    { cls: 'bg-violet-500 ring-violet-100', anim: 'orbit2 8s linear infinite' },
    { cls: 'bg-amber-400 ring-amber-100', anim: 'orbit3 8s linear infinite' },
  ];

  const crossRects = [
    [40, 8, 40, 44],
    [40, 68, 40, 44],
    [8, 40, 44, 40],
    [68, 40, 44, 40],
    [40, 40, 40, 40],
  ] as const;

  return (
    <div
      className="aspect-square w-full max-w-sm rounded-[2.8rem] flex items-center justify-center relative overflow-hidden shadow-2xl shadow-blue-900/10 hover:rotate-1 transition-transform duration-700"
      style={{
        background: 'var(--card)',
        opacity: 0.9,
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Фоновые пятна глубины */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-200 rounded-full blur-2xl" />
      </div>

      {/* Дышащие круги */}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          width: '280px',
          height: '280px',
          background: 'var(--secondary)',
          opacity: 0.2,
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          border: '2px solid var(--border)',
          animation: 'breatheRing 3s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          width: '320px',
          height: '320px',
          background: 'var(--secondary)',
          opacity: 0.1,
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          border: '2px solid var(--border)',
          animation: 'breatheRing 3s ease-in-out infinite 0.5s',
        }}
      />

      {/* Орбитальные точки */}
      {orbitDots.map((dot, i) => (
        <div key={i} className="absolute w-0 h-0" style={{ top: '50%', left: '50%' }}>
          <div
            className={`absolute w-3 h-3 rounded-full ring-2 -ml-[6px] -mt-[6px] ${dot.cls}`}
            style={{ animation: dot.anim, willChange: 'transform' }}
          />
        </div>
      ))}

      {/* Пульсирующий сигнал */}
      <div
        className="absolute w-11 h-11 rounded-full bg-blue-400/20"
        style={{
          top: '50%',
          left: '50%',
          margin: '-22px',
          animation: 'ping 2.4s ease-out infinite',
        }}
      />

      {/* Крест */}
      <svg
        viewBox="0 0 120 120"
        width="180"
        height="180"
        fill="none"
        className="drop-shadow-lg"
        style={{ animation: 'breathe 3s ease-in-out infinite', willChange: 'transform, opacity' }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#378ADD" />
            <stop offset="100%" stopColor="#6D4AE8" />
          </linearGradient>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {crossRects.map(([x, y, w, h], i) => (
          <rect
            key={i}
            x={x}
            y={y}
            width={w}
            height={h}
            rx="12"
            fill={`url(#${gradId})`}
            opacity="0.92"
          />
        ))}

        <polyline
          points="22,60 34,60 40,44 48,76 54,52 60,68 66,60 98,60"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glowId})`}
          pathLength="600"
          style={{
            strokeDasharray: '600',
            strokeDashoffset: '600',
            animation: 'ecgDraw 2.8s ease-in-out infinite',
          }}
        />
      </svg>
    </div>
  );
}

// ─── Основной компонент HomeHero ────────────────────────────────────────────
export default function HomeHero({ lang, dict }: { lang: string; dict: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useT(lang);

  // Анимация появления текста
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.querySelectorAll('[data-animate]').forEach((child, i) => {
      const c = child as HTMLElement;
      c.style.opacity = '0';
      c.style.transform = 'translateY(28px)';
      setTimeout(() => {
        c.style.transition =
          'opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1)';
        c.style.opacity = '1';
        c.style.transform = 'translateY(0)';
      }, 80 + i * 110);
    });
  }, []);

  const stats = [
    { num: '5', label: t('home.heroStatLanguages') },
    { num: '100%', label: t('home.heroStatVerification') },
    { num: '24ч', label: t('home.heroStatTime') },
  ];

  return (
    <section className="relative overflow-hidden hero-gradient" style={{ minHeight: '540px' }}>
      {/* Animated mesh gradient blobs */}
      <div
        className="mesh-blob-1 w-[400px] h-[400px] bg-blue-300/30 dark:bg-blue-600/15"
        style={{ top: '-100px', right: '5%' }}
      />
      <div
        className="mesh-blob-2 w-[350px] h-[350px] bg-amber-300/20 dark:bg-amber-600/10"
        style={{ bottom: '-80px', left: '-50px' }}
      />
      <div
        className="mesh-blob-3 w-[300px] h-[300px] bg-emerald-300/15 dark:bg-emerald-600/8"
        style={{ top: '40%', left: '30%' }}
      />

      <div ref={ref} className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-14 items-center">
          {/* Левая колонка */}
          <div className="text-center lg:text-left">
            {/* Pill badge */}
            <div
              data-animate
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-slate-200/80 bg-white/90 backdrop-blur-sm shadow-sm text-[12px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-shimmer" />
              {t('home.heroBadge')}
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-shimmer" />
            </div>

            <h1
              data-animate
              className="font-display font-bold leading-[1.05] tracking-[-0.03em] mb-6 dark:text-white"
              style={{ fontSize: 'clamp(2.6rem, 6vw, 4.2rem)', color: 'var(--foreground)', textShadow: '0 2px 30px rgba(0,0,0,0.05)' }}
            >
              {dict.hero_title}
            </h1>

            <p
              data-animate
              className="text-[17px] leading-[1.7] text-slate-500 mb-10 max-w-[560px] mx-auto lg:mx-0 font-light"
            >
              {dict.hero_subtitle}
            </p>

            <div data-animate className="flex flex-col sm:flex-row items-center lg:items-start gap-4">
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <Link
                  href={`/${lang}/blog`}
                  className="inline-flex items-center gap-2.5 px-7 py-4 bg-slate-900 dark:bg-blue-600 text-white font-semibold rounded-2xl hover:bg-slate-800 dark:hover:bg-blue-700 transition-all btn-spring shadow-lg shadow-slate-200 dark:shadow-none hover:shadow-xl hover:shadow-slate-900/20 dark:hover:shadow-blue-600/30 hover:-translate-y-0.5"
                >
                  {dict.hero_cta_read}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href={`/${lang}/register`}
                  className="inline-flex items-center gap-2.5 px-7 py-4 border-2 border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl hover:border-slate-300 dark:hover:border-white/25 hover:bg-slate-50 dark:hover:bg-white/5 transition-all btn-spring"
                >
                  {dict.hero_cta_write}
                </Link>
              </div>

              <Link
                href={`/${lang}/doctors`}
                className="inline-flex items-center gap-2 px-7 py-4 text-blue-600 font-bold hover:text-blue-700 transition-colors group"
              >
                {t('home.heroCtaFindDoctor')}
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Правая иллюстрация */}
          <div className="hidden lg:flex justify-end">
            <HeroIllustration />
          </div>
        </div>

        {/* Statistics bar */}
        <div
          data-animate
          className="stats-glass flex items-center justify-center gap-6 sm:gap-10 flex-wrap mt-14 px-8 py-4 max-w-lg mx-auto lg:mx-0"
        >
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className="font-display font-bold text-[22px] tracking-[-0.04em] gradient-text">
                {stat.num}
              </span>
              <span className="text-[13px] text-slate-400 font-normal leading-tight max-w-[90px] text-left">
                {stat.label}
              </span>
              {i < stats.length - 1 && (
                <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300 ml-4" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
