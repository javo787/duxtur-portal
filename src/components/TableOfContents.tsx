'use client';

import { useEffect, useRef, useState } from 'react';

interface Section {
  id: string;
  title: string;
}

interface Props {
  sections: Section[];
  label: string; // переведённое «Содержание»
}

export default function TableOfContents({ sections, label }: Props) {
  const [activeId, setActiveId] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ── Следим за активной секцией ────────────────────────────────────────────
  useEffect(() => {
    if (sections.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Берём первый видимый элемент с наибольшим intersectionRatio
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [sections]);

  // ── Прогресс чтения ────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? Math.min(100, Math.round((scrolled / total) * 100)) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (sections.length === 0) return null;

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 90; // высота sticky header
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Полоска прогресса чтения */}
      <div className="h-1 bg-slate-100">
        <div
          className="h-full bg-blue-500 transition-all duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-5">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
            {label}
          </p>
          <span className="text-[11px] font-medium text-blue-500 tabular-nums">
            {progress}%
          </span>
        </div>

        {/* Список секций */}
        <nav aria-label={label}>
          <ul className="space-y-0.5">
            {sections.map((sec, i) => {
              const isActive = activeId === sec.id;
              return (
                <li key={sec.id}>
                  <button
                    onClick={() => handleClick(sec.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {/* Номер */}
                    <span
                      className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                      }`}
                    >
                      {i + 1}
                    </span>

                    {/* Текст */}
                    <span
                      className={`text-[13px] leading-snug transition-colors ${
                        isActive ? 'font-semibold text-blue-700' : 'font-medium'
                      }`}
                    >
                      {sec.title}
                    </span>

                    {/* Активный индикатор */}
                    {isActive && (
                      <span className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
