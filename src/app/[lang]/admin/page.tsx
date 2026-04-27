'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { WriteTab } from './_components/WriteTab';
import { ProfileTab } from './_components/ProfileTab';

export default function DoctorCabinetPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const [tab, setTab] = useState<'write' | 'profile'>('write');

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/${lang}`} className="text-gray-400 hover:text-gray-700 transition text-sm font-medium">
              ← На сайт
            </Link>
            <span className="text-gray-200">|</span>
            <span className="font-extrabold text-gray-900">
              duxtur<span className="text-blue-500">.com</span>
            </span>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
              Кабинет врача
            </span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 flex gap-1 border-t border-gray-100">
          {([
            { id: 'write', label: '✍️ Написать статью' },
            { id: 'profile', label: '👤 Мой профиль' },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 md:p-10">
        {tab === 'write' && <WriteTab lang={lang} />}
        {tab === 'profile' && <ProfileTab lang={lang} />}
      </div>
    </div>
  );
}
