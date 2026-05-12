// src/app/[lang]/doctor/[id]/_components/TrustBadges.tsx
'use client';

import { useEffect, useRef } from 'react';

interface TrustBadgesProps {
  lastMedicalReviewDate: string | null;
  lastArticleDate: string | null;
}

export default function TrustBadges({ lastMedicalReviewDate, lastArticleDate }: TrustBadgesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden opacity-0 translate-y-4 transition-all duration-700 ease-out [&.animate-fade-in]:opacity-100 [&.animate-fade-in]:translate-y-0">
      <div className="px-5 py-4 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em]">Доверие и верификация</p>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Верифицированный автор</p>
            <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">Диплом и квалификация подтверждены</p>
          </div>
        </div>
        {lastMedicalReviewDate && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">Медицинская проверка</p>
              <p className="text-blue-600 text-xs font-semibold mt-0.5">{lastMedicalReviewDate}</p>
              <p className="text-gray-400 text-xs mt-0.5">Контент проверен практикующим врачом</p>
            </div>
          </div>
        )}
        {lastArticleDate && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">Активный автор</p>
              <p className="text-gray-400 text-xs mt-0.5">Последняя публикация: {new Date(lastArticleDate).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
