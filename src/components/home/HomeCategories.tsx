'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import FadeIn from '@/components/FadeIn';

const CATEGORIES = [
  { icon: '❤️', color: 'from-red-500 to-rose-400',     bg: 'bg-red-50',    border: 'border-red-100',    text: 'text-red-600',    slug: 'cardiology' },
  { icon: '🧠', color: 'from-purple-500 to-violet-400', bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600', slug: 'neurology' },
  { icon: '🦷', color: 'from-blue-500 to-cyan-400',     bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-600',   slug: 'dentistry' },
  { icon: '👶', color: 'from-yellow-400 to-amber-400',  bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-600', slug: 'pediatrics' },
  { icon: '🩺', color: 'from-teal-500 to-emerald-400',  bg: 'bg-teal-50',   border: 'border-teal-100',   text: 'text-teal-600',   slug: 'dermatology' },
  { icon: '👁️', color: 'from-indigo-500 to-blue-400',   bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600', slug: 'ophthalmology' },
  { icon: '⚕️', color: 'from-orange-500 to-amber-400',  bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', slug: 'surgery' },
  { icon: '🌸', color: 'from-pink-500 to-rose-400',     bg: 'bg-pink-50',   border: 'border-pink-100',   text: 'text-pink-600',   slug: 'gynecology' },
];

export default function HomeCategories({ lang, dict }: { lang: string; dict: any }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const labels: Record<string, string> = {
    cardiology:   dict.cat_cardio,
    neurology:    dict.cat_neuro,
    dentistry:    dict.cat_dentist,
    pediatrics:   dict.cat_pediatr,
    dermatology:  'Дерматология',
    ophthalmology:'Офтальмология',
    surgery:      'Хирургия',
    gynecology:   'Гинекология',
  };

  // Авто-скролл туда-обратно на мобиле
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let direction = 1;
    let pos = 0;
    const speed = 0.5;

    const animate = () => {
      pos += speed * direction;
      if (pos >= el.scrollWidth - el.clientWidth) direction = -1;
      if (pos <= 0) direction = 1;
      el.scrollLeft = pos;
    };

    const interval = setInterval(animate, 16);

    // Стоп при касании
    const stop = () => clearInterval(interval);
    el.addEventListener('touchstart', stop, { passive: true });
    el.addEventListener('mousedown', stop);

    return () => {
      clearInterval(interval);
      el.removeEventListener('touchstart', stop);
      el.removeEventListener('mousedown', stop);
    };
  }, []);

  return (
    <section className="py-8 bg-white border-y border-gray-100">
      
      <div className="max-w-7xl mx-auto px-4">
      <FadeIn direction="up">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">
          {dict.cat_title}
        </p>

        {/* Скроллящийся ряд */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/${lang}/blog?category=${cat.slug}`}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border ${cat.bg} ${cat.border} ${cat.text} shrink-0 font-bold text-sm hover:shadow-md hover:-translate-y-0.5 transition duration-200 active:scale-95`}
            >
              <span className="text-xl">{cat.icon}</span>
              <span className="whitespace-nowrap">{labels[cat.slug]}</span>
            </Link>
          ))}
        </div>
       </FadeIn>
      </div>
    </section>
  );
}
