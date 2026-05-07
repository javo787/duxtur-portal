'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

const CATEGORIES = [
  { icon: '♥', slug: 'cardiology', hue: '15', label: 'Кардиология' },
  { icon: '◎', slug: 'neurology', hue: '280', label: 'Неврология' },
  { icon: '✦', slug: 'dentistry', hue: '200', label: 'Стоматология' },
  { icon: '◇', slug: 'pediatrics', hue: '45', label: 'Педиатрия' },
  { icon: '❋', slug: 'dermatology', hue: '170', label: 'Дерматология' },
  { icon: '◉', slug: 'ophthalmology', hue: '230', label: 'Офтальмология' },
  { icon: '⊕', slug: 'surgery', hue: '25', label: 'Хирургия' },
  { icon: '✿', slug: 'gynecology', hue: '330', label: 'Гинекология' },
];

export default function HomeCategories({ lang, dict }: { lang: string; dict: any }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const labels: Record<string, string> = {
    cardiology: dict.cat_cardio || 'Кардиология',
    neurology: dict.cat_neuro || 'Неврология',
    dentistry: dict.cat_dentist || 'Стоматология',
    pediatrics: dict.cat_pediatr || 'Педиатрия',
    dermatology: 'Дерматология',
    ophthalmology: 'Офтальмология',
    surgery: 'Хирургия',
    gynecology: 'Гинекология',
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let dir = 1,
      pos = 0,
      stopped = false;
    const tick = () => {
      if (stopped) return;
      pos += 0.4 * dir;
      if (pos >= el.scrollWidth - el.clientWidth) dir = -1;
      if (pos <= 0) dir = 1;
      el.scrollLeft = pos;
    };
    const id = setInterval(tick, 16);
    const stop = () => {
      stopped = true;
    };
    el.addEventListener('touchstart', stop, { passive: true });
    el.addEventListener('mousedown', stop);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, []);

  return (
    <section className="py-10 border-y border-slate-100 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-5">
          {dict.cat_title || 'Специализации'}
        </p>
        <div
          ref={scrollRef}
          className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide"
        >
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/${lang}/blog?category=${cat.slug}`}
              className="group flex items-center gap-2.5 px-5 py-2.5 rounded-full border bg-white shrink-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md active:scale-95"
              style={{ borderColor: 'oklch(0.9 0.01 260)' }}
            >
              <span
                className="text-[15px] font-light transition-transform duration-300 group-hover:scale-110"
                style={{ color: `oklch(0.45 0.15 ${cat.hue})` }}
              >
                {cat.icon}
              </span>
              <span className="whitespace-nowrap text-[13.5px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                {labels[cat.slug]}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
