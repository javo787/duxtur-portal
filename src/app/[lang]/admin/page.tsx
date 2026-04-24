'use client';

import { useState, useRef, use } from 'react';
import { processMedicalDraft } from '@/app/actions/ai-editor';
import { saveArticle } from '@/app/actions/save-article';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default function DoctorWritePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [draft, setDraft] = useState('');
  const [language, setLanguage] = useState(lang || 'ru');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [article, setArticle] = useState<any>(null);
  const [publishedSlug, setPublishedSlug] = useState('');

  const handleProcess = async () => {
    if (!draft.trim()) return;
    setIsLoading(true);
    const result = await processMedicalDraft(draft, language);
    setIsLoading(false);
    if (result.success) {
      setArticle(result.data);
      setStep(2);
    } else {
      alert('Ошибка AI: ' + result.error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const result = await uploadImageToCloudinary(formData);
    setIsUploading(false);
    if (result.success) {
      setArticle({ ...article, image: result.url });
    } else {
      alert('Ошибка загрузки фото: ' + result.error);
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);
    const result = await saveArticle(article, language);
    setIsSaving(false);
    if (result.success) {
      setPublishedSlug(result.slug || '');
      setStep(1);
      setDraft('');
      setArticle(null);
    } else {
      alert('Ошибка: ' + result.error);
    }
  };

  // Успех — показываем результат
  if (publishedSlug) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center border-t-4 border-green-400">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Статья опубликована!</h2>
          <p className="text-gray-500 mb-8">Ваша статья уже доступна на портале.</p>
          <div className="flex gap-3 justify-center">
            <Link href={`/${lang}/blog/${publishedSlug}`}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
              Посмотреть статью →
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
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* HEADER кабинета врача */}
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
          {step === 2 && (
            <button onClick={handlePublish} disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-full font-bold text-sm hover:bg-green-700 transition shadow disabled:opacity-70">
              {isSaving ? <><Spinner /> Публикация...</> : '🚀 Опубликовать'}
            </button>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 md:p-10">

        {/* ШАГ 1 — Черновик */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900">✍️ Написать статью</h1>
                  <p className="text-gray-500 mt-1">AI отформатирует и структурирует ваш материал</p>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="p-2 border border-gray-200 rounded-xl bg-gray-50 font-medium text-sm focus:border-blue-500 outline-none"
                >
                  <option value="ru">🇷🇺 Русский</option>
                  <option value="uz">🇺🇿 O'zbek</option>
                  <option value="tg">🇹🇯 Тоҷикӣ</option>
                  <option value="ky">🇰🇬 Кыргызча</option>
                  <option value="kk">🇰🇿 Қазақша</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-blue-800 text-sm flex gap-3 mb-6">
                <span className="text-xl shrink-0">💡</span>
                <p>
                  Пишите на любом языке — просто опишите медицинскую тему своими словами.
                  AI структурирует текст профессионально: симптомы, причины, лечение, источники.
                </p>
              </div>

              <textarea
                className="w-full h-72 p-5 text-base border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none transition resize-none placeholder-gray-400 leading-relaxed"
                placeholder="Например: Мигрень — это интенсивная головная боль, которая может длиться от 4 до 72 часов. Основные симптомы: пульсирующая боль в одной стороне головы, тошнота, чувствительность к свету и звуку..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-400">{draft.length} символов</span>
                <button
                  onClick={handleProcess}
                  disabled={isLoading || draft.trim().length < 50}
                  className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <><Spinner /> AI обрабатывает...</> : '✨ Создать статью'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ШАГ 2 — Редактирование и превью */}
        {step === 2 && article && (
          <div className="space-y-6 pb-20">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
              <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-900 font-medium px-4 py-2 hover:bg-gray-100 rounded-xl transition">
                ← Изменить черновик
              </button>
              <p className="text-sm text-gray-500">Проверьте и отредактируйте перед публикацией</p>
            </div>

            {/* Заголовок */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">Заголовок статьи</label>
              <input
                value={article.title || ''}
                onChange={(e) => setArticle({ ...article, title: e.target.value })}
                className="w-full text-3xl md:text-4xl font-extrabold text-gray-900 border-none focus:ring-0 outline-none p-0 placeholder-gray-300"
                placeholder="Заголовок"
              />
            </div>

            {/* Фото */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full h-72 bg-gray-100 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-500 transition overflow-hidden cursor-pointer group"
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
                  {isUploading ? (
                    <div className="flex flex-col items-center text-blue-600">
                      <Spinner />
                      <p className="mt-3 font-bold">Загрузка...</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-4xl mb-3">🖼️</div>
                      <p className="font-bold text-gray-700 mb-1">Добавить обложку статьи</p>
                      <p className="text-sm text-gray-400">AI предлагает: «{article.imageQuery}»</p>
                      <p className="text-xs text-blue-500 mt-2 font-medium">Нажмите для загрузки</p>
                    </>
                  )}
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            {/* Секции контента */}
            <div className="grid grid-cols-1 gap-6">
              <Section title="📋 Обзор" content={article.overview} onChange={(v: string) => setArticle({ ...article, overview: v })} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Section title="🔍 Симптомы" content={article.symptoms} onChange={(v: string) => setArticle({ ...article, symptoms: v })} />
                <Section title="🧬 Причины" content={article.causes} onChange={(v: string) => setArticle({ ...article, causes: v })} />
              </div>
              <Section title="💊 Диагностика и лечение" content={article.diagnosis_treatment} onChange={(v: string) => setArticle({ ...article, diagnosis_treatment: v })} />
              <Section title="🛡️ Профилактика" content={article.prevention} onChange={(v: string) => setArticle({ ...article, prevention: v })} />
            </div>

            {/* Источники */}
            {article.references && article.references.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">📚 Источники</label>
                <ul className="space-y-2">
                  {article.references.map((ref: string, i: number) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-2">
                      <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>
                      <span>{ref}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Кнопка публикации внизу */}
            <button onClick={handlePublish} disabled={isSaving}
              className="w-full py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-green-200 transition flex justify-center items-center gap-3 disabled:opacity-70">
              {isSaving ? <><Spinner /> Публикация...</> : '🚀 Опубликовать статью'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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
        <textarea
          value={safeContent}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[180px] p-4 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-gray-800 font-mono text-sm leading-relaxed outline-none resize-none"
        />
      ) : (
        <div className="prose prose-blue prose-sm max-w-none text-gray-700 leading-relaxed min-h-[80px]">
          <ReactMarkdown>{safeContent || '*Пусто...*'}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
