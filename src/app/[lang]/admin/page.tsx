'use client';

import { useState, useRef, use, useEffect } from 'react';
import { processMedicalDraft, processMedicalArticle, translateMedicalArticle } from '@/app/actions/ai-editor';
import { saveArticle } from '@/app/actions/save-article';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';
import { updateDoctorProfile } from '@/app/actions/update-profile';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default function DoctorCabinetPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const [tab, setTab] = useState<'write' | 'profile'>('write');

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* HEADER */}
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

        {/* ВКЛАДКИ */}
        <div className="max-w-5xl mx-auto px-6 flex gap-1 border-t border-gray-100">
          <button
            onClick={() => setTab('write')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition ${
              tab === 'write'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            ✍️ Написать статью
          </button>
          <button
            onClick={() => setTab('profile')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition ${
              tab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            👤 Мой профиль
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 md:p-10">
        {tab === 'write' && <WriteTab lang={lang} />}
        {tab === 'profile' && <ProfileTab lang={lang} />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ВКЛАДКА 1 — НАПИСАТЬ СТАТЬЮ
───────────────────────────────────────── */
// ─── ТИПЫ ───
type Mode = 'write' | 'process' | 'translate';

const MODES: { id: Mode; icon: string; title: string; desc: string; hint: string; limit: number; minLimit: number }[] = [
  {
    id: 'write',
    icon: '✍️',
    title: 'Написать',
    desc: 'Опишите тему своими словами — AI структурирует статью',
    hint: 'Напишите черновик: о чём статья, симптомы, что важно знать пациентам. Не нужно быть идеальным — AI всё оформит.',
    limit: 3000,
    minLimit: 100,
  },
  {
    id: 'process',
    icon: '📄',
    title: 'Обработать',
    desc: 'Вставьте научную статью — AI адаптирует для пациентов',
    hint: 'Вставьте текст из PubMed, ВОЗ, учебника или любого медицинского источника. AI упростит язык и структурирует для читателей.',
    limit: 12000,
    minLimit: 200,
  },
  {
    id: 'translate',
    icon: '🌐',
    title: 'Перевести',
    desc: 'Вставьте готовый текст — AI переведёт профессионально',
    hint: 'Вставьте медицинскую статью на любом языке. AI переведёт на выбранный язык с сохранением медицинской точности.',
    limit: 12000,
    minLimit: 100,
  },
];

// ─── ТУТОРИАЛ ───
function TutorialModal({ onClose, lang }: { onClose: () => void; lang: string }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: '👋',
      title: 'Добро пожаловать в кабинет врача!',
      text: 'Здесь вы можете публиковать медицинские статьи для пациентов Центральной Азии. AI-помощник поможет оформить ваши знания профессионально.',
    },
    {
      icon: '✍️',
      title: 'Режим "Написать"',
      text: 'Напишите черновик своими словами — хотя бы 100 символов о теме. AI сам структурирует статью: добавит разделы, источники и форматирование.',
    },
    {
      icon: '📄',
      title: 'Режим "Обработать"',
      text: 'Есть научная статья из PubMed или ВОЗ? Вставьте её — AI адаптирует сложный медицинский текст в понятный материал для пациентов.',
    },
    {
      icon: '🌐',
      title: 'Режим "Перевести"',
      text: 'Вставьте текст на любом языке — AI переведёт его профессионально на нужный язык (таджикский, узбекский, казахский, кыргызский, русский).',
    },
    {
      icon: '🚀',
      title: 'Готово! Начнём?',
      text: 'После обработки AI вы сможете редактировать каждый раздел, добавить обложку и опубликовать. Если нужна помощь — пишите нам в Telegram.',
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
        {/* Прогресс */}
        <div className="flex gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        <div className="text-center mb-6">
          <div className="text-5xl mb-4">{current.icon}</div>
          <h3 className="text-xl font-extrabold text-gray-900 mb-3">{current.title}</h3>
          <p className="text-gray-500 leading-relaxed text-sm">{current.text}</p>
        </div>

        {/* Последний шаг — кнопка поддержки */}
        {isLast && (
          <a
            href="https://t.me/duxturcom"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#229ED9] text-white rounded-xl font-bold text-sm mb-4 hover:bg-[#1a8bbf] transition"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.667l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.892z"/>
            </svg>
            Написать в поддержку Telegram
          </a>
        )}

        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition">
              ← Назад
            </button>
          )}
          <button
            onClick={isLast ? onClose : () => setStep(s => s + 1)}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition"
          >
            {isLast ? 'Начать работу 🚀' : 'Далее →'}
          </button>
        </div>

        <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── ВКЛАДКА НАПИСАНИЯ ───
function WriteTab({ lang }: { lang: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>('write');
  const [step, setStep] = useState<1 | 2>(1);
  const [draft, setDraft] = useState('');
  const [language, setLanguage] = useState(lang || 'ru');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [article, setArticle] = useState<any>(null);
  const [publishedSlug, setPublishedSlug] = useState('');
  const [showTutorial, setShowTutorial] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('duxtur_tutorial_done');
    }
    return false;
  });

  const currentMode = MODES.find(m => m.id === mode)!;
  const isOverLimit = draft.length > currentMode.limit;
  const isUnderMin = draft.trim().length < currentMode.minLimit;

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('duxtur_tutorial_done', '1');
    }
  };

  const handleProcess = async () => {
    if (isUnderMin || isOverLimit) return;
    setIsLoading(true);

    let result;
    if (mode === 'write') {
      result = await processMedicalDraft(draft, language);
    } else if (mode === 'process') {
      result = await processMedicalArticle(draft, language);
    } else {
      result = await translateMedicalArticle(draft, language);
    }

    setIsLoading(false);
    if (result.success) { setArticle(result.data); setStep(2); }
    else alert('Ошибка AI: ' + result.error);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const result = await uploadImageToCloudinary(formData);
    setIsUploading(false);
    if (result.success) setArticle({ ...article, image: result.url });
    else alert('Ошибка загрузки: ' + result.error);
  };

  const handlePublish = async () => {
    setIsSaving(true);
    const result = await saveArticle(article, language);
    setIsSaving(false);
    if (result.success) {
      setPublishedSlug(result.slug || '');
      setStep(1); setDraft(''); setArticle(null);
    } else alert('Ошибка: ' + result.error);
  };

  if (publishedSlug) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center border-t-4 border-green-400">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Статья опубликована!</h2>
          <p className="text-gray-500 mb-8">Ваша статья уже доступна на портале.</p>
          <div className="flex gap-3 justify-center">
            <Link href={`/${lang}/blog/${publishedSlug}`}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
              Посмотреть →
            </Link>
            <button onClick={() => setPublishedSlug('')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition">
              Написать ещё
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ТУТОРИАЛ */}
      {showTutorial && <TutorialModal onClose={handleCloseTutorial} lang={lang} />}

      {step === 1 && (
        <>
          {/* ВЫБОР РЕЖИМА */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-gray-900 text-lg">Выберите режим</h2>
              <button
                onClick={() => setShowTutorial(true)}
                className="flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:bg-blue-50 px-3 py-1.5 rounded-full transition border border-blue-100"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Инструкция
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setMode(m.id); setDraft(''); }}
                  className={`p-4 rounded-2xl border-2 text-left transition ${
                    mode === m.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-100 hover:border-blue-200 bg-gray-50'
                  }`}
                >
                  <span className="text-2xl block mb-2">{m.icon}</span>
                  <p className={`font-extrabold text-sm mb-1 ${mode === m.id ? 'text-blue-700' : 'text-gray-900'}`}>
                    {m.title}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">{m.desc}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    До {m.limit.toLocaleString()} символов
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* ФОРМА ВВОДА */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
              <div>
                <h3 className="font-extrabold text-gray-900">
                  {currentMode.icon} {currentMode.title}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">{currentMode.hint}</p>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="p-2.5 border-2 border-gray-100 rounded-xl bg-gray-50 font-medium text-sm focus:border-blue-500 outline-none shrink-0"
              >
                <option value="ru">🇷🇺 Русский</option>
                <option value="uz">🇺🇿 O'zbek</option>
                <option value="tg">🇹🇯 Тоҷикӣ</option>
                <option value="ky">🇰🇬 Кыргызча</option>
                <option value="kk">🇰🇿 Қазақша</option>
              </select>
            </div>

            {/* Подсказка режима */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-blue-800 text-sm flex gap-3 mb-4">
              <span className="text-xl shrink-0">💡</span>
              <p>{currentMode.hint}</p>
            </div>

            <textarea
              className={`w-full h-72 p-5 text-base border-2 rounded-2xl outline-none transition resize-none placeholder-gray-300 leading-relaxed ${
                isOverLimit
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-200 focus:border-blue-500'
              }`}
              placeholder={
                mode === 'write'
                  ? 'Например: Мигрень — это интенсивная головная боль, которая может длиться от 4 до 72 часов. Основные симптомы: пульсирующая боль в одной стороне головы, тошнота...'
                  : mode === 'process'
                  ? 'Вставьте текст научной статьи, клинических рекомендаций или медицинского руководства...'
                  : 'Вставьте медицинский текст на любом языке для перевода...'
              }
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />

            {/* Счётчик */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${
                  isOverLimit ? 'text-red-500' : isUnderMin ? 'text-gray-400' : 'text-green-600'
                }`}>
                  {draft.length.toLocaleString()} / {currentMode.limit.toLocaleString()} символов
                </span>
                {isOverLimit && (
                  <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg">
                    Превышен лимит
                  </span>
                )}
                {!isOverLimit && !isUnderMin && (
                  <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-lg">
                    ✓ Готово к обработке
                  </span>
                )}
              </div>
              <button
                onClick={handleProcess}
                disabled={isLoading || isUnderMin || isOverLimit}
                className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    AI обрабатывает...
                  </>
                ) : mode === 'write' ? '✨ Создать статью'
                  : mode === 'process' ? '📄 Адаптировать'
                  : '🌐 Перевести'
                }
              </button>
            </div>

            {/* Мин. лимит */}
            {isUnderMin && draft.length > 0 && (
              <p className="text-xs text-amber-600 mt-2 font-medium">
                Минимум {currentMode.minLimit} символов. Добавьте ещё {currentMode.minLimit - draft.trim().length}.
              </p>
            )}
          </div>

          {/* Поддержка */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-4 shadow-sm">
            <div>
              <p className="font-bold text-gray-900 text-sm">Нужна помощь?</p>
              <p className="text-xs text-gray-400 mt-0.5">Напишите нам — ответим в течение часа</p>
            </div>
            <a
              href="https://t.me/duxturcom"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#229ED9] hover:bg-[#1a8bbf] text-white rounded-xl font-bold text-sm transition shrink-0"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.667l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.892z"/>
              </svg>
              Telegram поддержка
            </a>
          </div>
        </>
      )}

      {/* ШАГ 2 — редактор */}
      {step === 2 && article && (
        <div className="space-y-6 pb-20">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
            <button onClick={() => setStep(1)}
              className="text-sm text-gray-500 hover:text-gray-900 font-medium px-4 py-2 hover:bg-gray-100 rounded-xl transition">
              ← Изменить текст
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 hidden md:block">Проверьте перед публикацией</span>
              <button onClick={handlePublish} disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-full font-bold text-sm hover:bg-green-700 transition shadow disabled:opacity-70">
                {isSaving ? 'Публикация...' : '🚀 Опубликовать'}
              </button>
            </div>
          </div>

          {/* Заголовок */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">Заголовок</label>
            <input
              value={article.title || ''}
              onChange={(e) => setArticle({ ...article, title: e.target.value })}
              className="w-full text-2xl md:text-3xl font-extrabold text-gray-900 border-none focus:ring-0 outline-none p-0 placeholder-gray-300"
              placeholder="Заголовок статьи"
            />
          </div>

          {/* Фото */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-full h-64 bg-gray-100 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-500 transition overflow-hidden cursor-pointer group"
          >
            {article.image ? (
              <>
                <img src={article.image} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <span className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm">Заменить фото</span>
                </div>
              </>
            ) : (
              <div className="text-center p-6">
                {isUploading
                  ? <p className="font-bold text-blue-600">Загрузка...</p>
                  : <>
                    <div className="text-3xl mb-2">🖼️</div>
                    <p className="font-bold text-gray-600 text-sm mb-1">Добавить обложку</p>
                    <p className="text-xs text-gray-400">Рекомендуется: «{article.imageQuery}»</p>
                  </>
                }
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          {/* Секции */}
          <div className="grid grid-cols-1 gap-6">
            <Section title="📋 Обзор" content={article.overview} onChange={(v) => setArticle({ ...article, overview: v })} />
            {[1,2,3,4,5].map((i) => {
              if (!article[`section${i}_title`] && !article[`section${i}_content`]) return null;
              return (
                <Section
                  key={i}
                  title={article[`section${i}_title`] || `Раздел ${i}`}
                  content={article[`section${i}_content`]}
                  onChange={(v) => setArticle({ ...article, [`section${i}_content`]: v })}
                />
              );
            })}
          </div>

          {/* Источники */}
          {article.references?.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">📚 Источники</label>
              <ul className="space-y-2">
                {article.references.map((ref: string, i: number) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-blue-400 font-bold shrink-0">{i+1}.</span>
                    <span>{ref}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={handlePublish} disabled={isSaving}
            className="w-full py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-green-200 transition flex justify-center items-center gap-3 disabled:opacity-70">
            {isSaving ? 'Публикация...' : '🚀 Опубликовать статью'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   ВКЛАДКА 2 — МОЙ ПРОФИЛЬ
───────────────────────────────────────── */
function ProfileTab({ lang }: { lang: string }) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/doctor/me')
      .then((r) => r.json())
      .then((data) => { setProfile(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const result = await uploadImageToCloudinary(formData);
    setIsUploading(false);
    if (result.success) setProfile({ ...profile, image: result.url });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateDoctorProfile(profile);
    setIsSaving(false);
    if (result.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else alert('Ошибка: ' + result.error);
  };

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="font-medium">Загрузка профиля...</p>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="text-center py-20 text-gray-400">
      <p className="text-lg font-bold">Профиль не найден</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-6">👤 Мой профиль</h2>

        {/* Аватар */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
          <div className="relative">
            <img
              src={profile.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
              alt="Аватар"
              className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-100 shadow-sm"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <button onClick={() => avatarInputRef.current?.click()}
              className="px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-sm transition border border-blue-200">
              📷 Изменить фото
            </button>
            <p className="text-xs text-gray-400 mt-2">JPG, PNG до 5MB</p>
            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </div>
        </div>

        {/* Поля */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Полное имя" value={profile.name || ''} onChange={(v) => setProfile({ ...profile, name: v })} placeholder="Dr. Иванов Иван" />
          <Field label="Телефон" value={profile.phone || ''} onChange={(v) => setProfile({ ...profile, phone: v })} placeholder="+992 XXX XXX XXX" />
          <Field label="Специализация (RU)" value={profile.specialty?.ru || ''} onChange={(v) => setProfile({ ...profile, specialty: { ...profile.specialty, ru: v } })} placeholder="Кардиолог" />
          <Field label="Специализация (UZ)" value={profile.specialty?.uz || ''} onChange={(v) => setProfile({ ...profile, specialty: { ...profile.specialty, uz: v } })} placeholder="Kardiolog" />
          <Field label="Стаж (лет)" value={profile.experience?.toString() || '0'} onChange={(v) => setProfile({ ...profile, experience: parseInt(v) || 0 })} placeholder="10" type="number" />
          <Field label="Языки (через запятую)" value={profile.languages?.join(', ') || ''} onChange={(v) => setProfile({ ...profile, languages: v.split(',').map((l: string) => l.trim()).filter(Boolean) })} placeholder="Русский, Тоҷикӣ, English" />
        </div>

        {/* Биография */}
        <div className="mt-6">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
            Биография (RU)
          </label>
          <textarea
            value={profile.bio?.ru || ''}
            onChange={(e) => setProfile({ ...profile, bio: { ...profile.bio, ru: e.target.value } })}
            rows={4}
            placeholder="Расскажите о вашем опыте, специализации, достижениях..."
            className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none transition resize-none text-gray-700 placeholder-gray-300"
          />
        </div>

        {/* Кнопка сохранить */}
        <div className="mt-6 flex items-center gap-4">
          <button onClick={handleSave} disabled={isSaving}
            className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 transition disabled:opacity-70">
            {isSaving ? <><Spinner /> Сохранение...</> : '💾 Сохранить профиль'}
          </button>
          {saved && (
            <span className="flex items-center gap-2 text-green-600 font-bold text-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Сохранено!
            </span>
          )}
        </div>
      </div>

      {/* Ссылка на публичный профиль */}
      {profile.slug && (
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-blue-900 text-sm">Ваш публичный профиль</p>
            <p className="text-blue-600 text-xs mt-0.5">duxtur.com/{lang}/doctor/{profile.slug}</p>
          </div>
          <Link href={`/${lang}/doctor/${profile.slug}`} target="_blank"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition shrink-0">
            Открыть →
          </Link>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   ПЕРЕИСПОЛЬЗУЕМЫЙ КОМПОНЕНТ ПОЛЯ
───────────────────────────────────────── */
function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none transition text-gray-700 placeholder-gray-300"
      />
    </div>
  );
}

/* ─────────────────────────────────────────
   СЕКЦИЯ СТАТЬИ
───────────────────────────────────────── */
function Section({ title, content, onChange }: { title: string; content: any; onChange: (v: string) => void }) {
  const [mode, setMode] = useState<'write' | 'preview'>('preview');
  const safeContent = Array.isArray(content)
    ? content.map((item: string) => `• ${item}`).join('\n\n')
    : (content || '');

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <label className="font-bold text-gray-700">{title}</label>
        <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
          <button onClick={() => setMode('write')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition ${mode === 'write' ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}>
            ✏️ Правка
          </button>
          <button onClick={() => setMode('preview')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition ${mode === 'preview' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-700'}`}>
            👁️ Просмотр
          </button>
        </div>
      </div>
      {mode === 'write' ? (
        <textarea value={safeContent} onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[180px] p-4 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-gray-800 font-mono text-sm leading-relaxed outline-none resize-none" />
      ) : (
        <div className="prose prose-blue prose-sm max-w-none text-gray-700 leading-relaxed min-h-[80px]">
          <ReactMarkdown>{safeContent || '*Пусто...*'}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

