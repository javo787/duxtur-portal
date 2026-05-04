'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { processMedicalDraft, processMedicalArticle, translateMedicalArticle } from '@/app/actions/ai-editor';
import { TutorialModal } from './TutorialModal';
import { ManualEditor } from './ManualEditor';
import { AIResultEditor } from './AIResultEditor';

type Mode = 'write' | 'process' | 'translate' | 'manual';

const MODES: {
  id: Mode; icon: string; title: string; desc: string;
  hint: string; limit: number; minLimit: number; isManual?: boolean;
}[] = [
  {
    id: 'write', icon: '✍️', title: 'Написать',
    desc: 'Опишите тему своими словами — AI структурирует статью',
    hint: 'Напишите черновик: о чём статья, симптомы, что важно знать пациентам. Не нужно быть идеальным — AI всё оформит.',
    limit: 3000, minLimit: 100,
  },
  {
    id: 'process', icon: '📄', title: 'Обработать',
    desc: 'Вставьте научную статью — AI адаптирует для пациентов',
    hint: 'Вставьте текст из PubMed, ВОЗ, учебника. AI упростит язык и структурирует для читателей.',
    limit: 12000, minLimit: 200,
  },
  {
    id: 'translate', icon: '🌐', title: 'Перевести',
    desc: 'Вставьте готовый текст — AI переведёт профессионально',
    hint: 'Вставьте медицинскую статью на любом языке. AI переведёт с сохранением медицинской точности.',
    limit: 12000, minLimit: 100,
  },
  {
    id: 'manual', icon: '📝', title: 'Вручную',
    desc: 'Полноценный редактор — без AI, полный контроль',
    hint: 'Редактор как Word: разделы, фото, теги, источники.',
    limit: 0, minLimit: 0, isManual: true,
  },
];

const LANGUAGES = [
  { value: 'ru', label: '🇷🇺 Русский' },
  { value: 'uz', label: "🇺🇿 O'zbek" },
  { value: 'tg', label: '🇹🇯 Тоҷикӣ' },
  { value: 'ky', label: '🇰🇬 Кыргызча' },
  { value: 'kk', label: '🇰🇿 Қазақша' },
];

const Spinner = () => (
  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export function WriteTab({ lang }: { lang: string }) {
  const [mode, setMode] = useState<Mode>('write');
  const [step, setStep] = useState<1 | 2>(1);
  const [draft, setDraft] = useState('');
  const [language, setLanguage] = useState(lang || 'ru');
  const [isLoading, setIsLoading] = useState(false);
  const [article, setArticle] = useState<any>(null);
  const [publishedSlug, setPublishedSlug] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('duxtur_tutorial_done')) setShowTutorial(true);
  }, []);

  const currentMode = MODES.find((m) => m.id === mode)!;
  const isOverLimit = currentMode.limit > 0 && draft.length > currentMode.limit;
  const isUnderMin = draft.trim().length < currentMode.minLimit;

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('duxtur_tutorial_done', '1');
  };

  const handleProcess = async () => {
    if (isUnderMin || isOverLimit) return;
    setIsLoading(true);
    const fn =
      mode === 'write' ? processMedicalDraft
      : mode === 'process' ? processMedicalArticle
      : translateMedicalArticle;
    const result = await fn(draft, language);
    setIsLoading(false);
    if (result.success) { setArticle(result.data); setStep(2); }
    else alert('Ошибка AI: ' + result.error);
  };

  // ── Published ──────────────────────────────────────────────────────────
  if (publishedSlug) return (
    <div className="flex items-center justify-center py-20">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center border-t-4 border-green-400">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Статья отправлена!</h2>
        <p className="text-gray-500 mb-2">Мы проверим её в течение 24 часов и опубликуем.</p>
        <p className="text-xs text-gray-400 mb-8">Статус можно отслеживать во вкладке «Мои статьи».</p>
        <div className="flex gap-3 justify-center">
          {publishedSlug !== 'pending' && (
            <Link href={`/${lang}/blog/${publishedSlug}`}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
              Посмотреть →
            </Link>
          )}
          <button onClick={() => { setPublishedSlug(''); setStep(1); setDraft(''); setArticle(null); }}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition">
            Написать ещё
          </button>
        </div>
      </div>
    </div>
  );

  // ── Manual editor ──────────────────────────────────────────────────────
  if (mode === 'manual') return (
    <>
      {showTutorial && <TutorialModal onClose={handleCloseTutorial} />}
      <ManualEditor
        lang={lang}
        onPublished={(slug) => setPublishedSlug(slug || 'pending')}
        onBack={() => setMode('write')}
      />
    </>
  );

  // ── AI result editor (Step 2) ──────────────────────────────────────────
  if (step === 2 && article) return (
    <>
      {showTutorial && <TutorialModal onClose={handleCloseTutorial} />}
      <AIResultEditor
        lang={lang}
        language={language}
        initialArticle={article}
        onBack={() => setStep(1)}
        onPublished={(slug) => setPublishedSlug(slug || 'pending')}
      />
    </>
  );

  // ── Step 1 ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {showTutorial && <TutorialModal onClose={handleCloseTutorial} />}

      {/* MODE CARDS */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-extrabold text-gray-900 text-lg">Выберите режим</h2>
          <button onClick={() => setShowTutorial(true)}
            className="flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:bg-blue-50 px-3 py-1.5 rounded-full transition border border-blue-100">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Инструкция
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => { setMode(m.id); setDraft(''); }}
              className={`p-4 rounded-2xl border-2 text-left transition relative ${
                mode === m.id
                  ? m.isManual ? 'border-gray-800 bg-gray-900' : 'border-blue-500 bg-blue-50'
                  : 'border-gray-100 hover:border-blue-200 bg-gray-50'
              }`}>
              {m.isManual && (
                <span className="absolute top-2 right-2 text-[10px] font-extrabold bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded-full">
                  NEW
                </span>
              )}
              <span className="text-2xl block mb-2">{m.icon}</span>
              <p className={`font-extrabold text-sm mb-1 ${
                mode === m.id ? (m.isManual ? 'text-white' : 'text-blue-700') : 'text-gray-900'
              }`}>{m.title}</p>
              <p className={`text-xs leading-relaxed ${
                mode === m.id && m.isManual ? 'text-gray-400' : 'text-gray-500'
              }`}>{m.desc}</p>
              {!m.isManual && (
                <p className="text-xs text-gray-400 mt-2">До {m.limit.toLocaleString()} символов</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* AI INPUT FORM */}
      {(mode as string) !== 'manual' && (
        <>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
              <div>
                <h3 className="font-extrabold text-gray-900">{currentMode.icon} {currentMode.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{currentMode.hint}</p>
              </div>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}
                className="p-2.5 border-2 border-gray-100 rounded-xl bg-gray-50 font-medium text-sm focus:border-blue-500 outline-none shrink-0">
                {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-blue-800 text-sm flex gap-3 mb-4">
              <span className="text-xl shrink-0">💡</span>
              <p>{currentMode.hint}</p>
            </div>

            <textarea
              className={`w-full h-72 p-5 text-base border-2 rounded-2xl outline-none transition resize-none placeholder-gray-300 leading-relaxed ${
                isOverLimit ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'
              }`}
              placeholder={
                mode === 'write' ? 'Например: Мигрень — это интенсивная головная боль...'
                : mode === 'process' ? 'Вставьте текст научной статьи...'
                : 'Вставьте медицинский текст для перевода...'
              }
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />

            <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${
                  isOverLimit ? 'text-red-500' : isUnderMin ? 'text-gray-400' : 'text-green-600'
                }`}>
                  {draft.length.toLocaleString()} / {currentMode.limit.toLocaleString()} символов
                </span>
                {isOverLimit && <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg">Превышен лимит</span>}
                {!isOverLimit && !isUnderMin && <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-lg">✓ Готово к обработке</span>}
              </div>
              <button onClick={handleProcess} disabled={isLoading || isUnderMin || isOverLimit}
                className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? <><Spinner /> AI обрабатывает...</>
                  : mode === 'write' ? '✨ Создать статью'
                  : mode === 'process' ? '📄 Адаптировать'
                  : '🌐 Перевести'}
              </button>
            </div>
            {isUnderMin && draft.length > 0 && (
              <p className="text-xs text-amber-600 mt-2 font-medium">
                Минимум {currentMode.minLimit} символов. Добавьте ещё {currentMode.minLimit - draft.trim().length}.
              </p>
            )}
          </div>

          {/* SUPPORT */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-4 shadow-sm">
            <div>
              <p className="font-bold text-gray-900 text-sm">Нужна помощь?</p>
              <p className="text-xs text-gray-400 mt-0.5">Напишите нам — ответим в течение часа</p>
            </div>
            <a href="https://t.me/duxturcom" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#229ED9] hover:bg-[#1a8bbf] text-white rounded-xl font-bold text-sm transition shrink-0">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.667l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.892z" />
              </svg>
              Telegram поддержка
            </a>
          </div>
        </>
      )}
    </div>
  );
}
