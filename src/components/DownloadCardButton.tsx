// src/components/DownloadCardButton.tsx
'use client';

import { useState } from 'react';

interface DownloadCardButtonProps {
  doctorSlug: string;
  doctorName: string;
  lang: string;
}

export default function DownloadCardButton({
  doctorSlug,
  doctorName,
  lang,
}: DownloadCardButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleOpen = () => {
    setLoading(true);
    const url = `/api/doctor/${doctorSlug}/card?lang=${lang}`;
    const win = window.open(url, '_blank');
    // Сброс loading через 2 сек
    setTimeout(() => setLoading(false), 2000);
    if (!win) {
      // Popup заблокирован — fallback
      window.location.href = url;
      setLoading(false);
    }
  };

  const btnText = {
    ru: 'Скачать визитку',
    uz: 'Vizitka yuklab olish',
    tg: 'Зеркардани корт',
    kk: 'Визитка жүктеу',
    ky: 'Визитка жүктөө',
  }[lang] || 'Скачать визитку';

  const loadingText = lang === 'uz' ? 'Ochilmoqda...' : 'Открывается...';

  return (
    <button
      onClick={handleOpen}
      disabled={loading}
      className="no-print w-full bg-gradient-to-r from-[#0a1628] to-[#0f2a52] border border-blue-900/40 rounded-2xl p-4 flex items-center justify-center gap-2.5 text-sm font-bold text-white hover:from-[#0f2a52] hover:to-[#1a3a6e] transition-all duration-300 shadow-sm disabled:opacity-60 disabled:cursor-wait"
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
          </svg>
          {loadingText}
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M15 9a3 3 0 11-6 0 3 3 0 016 0zM3 17c0-3.2 6.4-4.8 9.6-4.8 3.2 0 9.6 1.6 9.6 4.8M4.5 21h15M12 15v6" />
          </svg>
          {btnText}
        </>
      )}
    </button>
  );
}
