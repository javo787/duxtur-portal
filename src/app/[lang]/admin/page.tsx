'use client';

import { useState, use, useEffect } from 'react';
import Link from 'next/link';
import { WriteTab } from './_components/WriteTab';
import { ProfileTab } from './_components/ProfileTab';
import { MyArticlesTab } from './_components/MyArticlesTab';
import { ArticleEditModal } from './_components/ArticleEditModal';
import { AppointmentsTab } from './_components/AppointmentsTab';
import { AnalyticsTab } from './_components/AnalyticsTab';
import OnboardingWizard from './_components/OnboardingWizard';

type Tab = 'write' | 'articles' | 'profile' | 'appointments' | 'analytics';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'articles',     icon: '📋', label: 'Статьи' },
  { id: 'appointments', icon: '📅', label: 'Записи' },
  { id: 'profile',      icon: '👤', label: 'Профиль' },
  { id: 'analytics',    icon: '📊', label: 'Статистика' },
];

export default function DoctorCabinetPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const [tab, setTab] = useState<Tab>('write');
  const [doctor, setDoctor] = useState<any>(null);

  useEffect(() => {
    fetch('/api/doctor/me').then(r => r.json()).then(setDoctor);
  }, []);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [articlesKey, setArticlesKey] = useState(0); // force refetch after save

  const handleEdit = (slug: string) => {
    setEditingSlug(slug);
  };

  const handleEditClose = () => {
    setEditingSlug(null);
  };

  const handleEditSaved = () => {
    setArticlesKey((k) => k + 1); // refresh list
    setEditingSlug(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Minimal header */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href={`/${lang}`} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <span className="font-extrabold text-gray-900 text-sm">
              duxtur<span className="text-blue-500">.com</span>
            </span>
          </div>
          <span className="text-[11px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold border border-blue-100">
            Кабинет врача
          </span>
        </div>
      </header>

      {/* Content with bottom padding for tabbar and FAB */}
      <div className="max-w-5xl mx-auto p-4 pb-28">
        {doctor && (
          <OnboardingWizard
            doctor={doctor}
            lang={lang}
            onComplete={() => fetch('/api/doctor/me').then(r => r.json()).then(setDoctor)}
          />
        )}
        {tab === 'write'    && <WriteTab lang={lang} />}
        {tab === 'articles' && (
          <MyArticlesTab
            key={articlesKey}
            lang={lang}
            onEdit={handleEdit}
          />
        )}
        {tab === 'profile'  && <ProfileTab lang={lang} />}
        {tab === 'appointments' && <AppointmentsTab lang={lang} />}
        {tab === 'analytics' && <AnalyticsTab />}
      </div>

      {/* FAB — Write article */}
      {tab !== 'write' && (
        <button
          onClick={() => setTab('write')}
          className="fixed bottom-20 right-4 z-50 flex items-center gap-2 pl-4 pr-5 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm rounded-2xl shadow-xl shadow-blue-200 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Написать статью
        </button>
      )}

      {/* Bottom Tab Bar (4 tabs) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-1px_16px_rgba(0,0,0,0.06)]">
        <div className="flex items-stretch justify-around max-w-5xl mx-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-2.5 transition-colors relative ${
                tab === t.id ? 'text-blue-600' : 'text-gray-400 active:bg-gray-50'
              }`}
            >
              {tab === t.id && (
                <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-blue-600 rounded-b-full" />
              )}
              <span
                className={`text-[22px] leading-none transition-transform duration-150 ${
                  tab === t.id ? 'scale-110' : 'scale-100'
                }`}
              >
                {t.icon}
              </span>
              <span className={`text-[10px] font-bold ${tab === t.id ? 'text-blue-600' : 'text-gray-400'}`}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Article edit modal */}
      {editingSlug && (
        <ArticleEditModal
          slug={editingSlug}
          lang={lang}
          onClose={handleEditClose}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
}
