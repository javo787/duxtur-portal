'use client';

import { useEffect, useRef, useId } from 'react';
import Link from 'next/link';

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
      className="aspect-square w-full max-w-sm rounded-[2.5rem] flex items-center justify-center relative overflow-hidden shadow-xl shadow-slate-200/30"
      style={{
        background: 'rgba(255,255,255,0.45)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.7)',
      }}
    >
      {/* Фоновые цветные пятна для глубины (едва заметные) */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-200 rounded-full blur-2xl" />
      </div>

      {/* Дышащие кольца — теперь хорошо заметны */}
      <div
        className="absolute w-[200px] h-[200px] rounded-full border-2 border-white/70"
        style={{ animation: 'breatheRing 3s ease-in-out infinite' }}
      />
      <div
        className="absolute w-[230px] h-[230px] rounded-full border-2 border-white/50"
        style={{ animation: 'breatheRing 3s ease-in-out infinite 0.5s' }}
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

      {/* SVG: крест + ECG */}
      <svg
        viewBox="0 0 120 120"
        width="120"
        height="120"
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
    { num: '5', label: dict.hero_stat_languages },
    { num: '100%', label: dict.hero_stat_verification },
    { num: '24ч', label: dict.hero_stat_time },
  ];

  return (
    <section className="relative overflow-hidden bg-white" style={{ minHeight: '540px' }}>
      {/* Тёплый фоновый градиент */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-amber-50/40 via-white to-white" />

      {/* Декоративные круги */}
      <div
        className="absolute top-16 right-[8%] w-72 h-72 rounded-full pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(circle, oklch(0.70 0.16 75 / 0.4), transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute bottom-0 left-[5%] w-48 h-48 rounded-full pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle, oklch(0.45 0.08 255 / 0.4), transparent 70%)',
          filter: 'blur(36px)',
        }}
      />

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
              {dict.hero_badge}
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

            <div data-animate className="flex flex-wrap justify-center lg:justify-start gap-4">
              <Link
                href={`/${lang}/blog`}
                className="inline-flex items-center gap-2.5 px-7 py-4 bg-slate-900 text-white font-semibold rounded-2xl hover:bg-slate-800 transition-colors active:scale-95"
              >
                {dict.hero_cta_read}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href={`/${lang}/register`}
                className="inline-flex items-center gap-2.5 px-7 py-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-colors active:scale-95"
              >
                {dict.hero_cta_write}
              </Link>
            </div>
          </div>

          {/* Правая иллюстрация */}
          <div className="hidden lg:flex justify-end">
            <HeroIllustration />
          </div>
        </div>

        {/* Статистика */}
        <div
          data-animate
          className="flex items-center justify-center gap-8 flex-wrap mt-14 pt-10 border-t border-slate-100 max-w-lg mx-auto lg:mx-0 lg:ml-0"
        >
          {stats.map((stat, i) => (
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
