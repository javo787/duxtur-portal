'use client';

import { useState } from 'react';
import { processMedicalDraft } from '@/app/actions/ai-editor';
import ReactMarkdown from 'react-markdown';

// Иконка загрузки
const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function SmartEditor() {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState('');
  const [language, setLanguage] = useState('ru');
  const [isLoading, setIsLoading] = useState(false);
  const [article, setArticle] = useState<any>(null);

  const handleProcess = async () => {
    if (!draft) return;
    setIsLoading(true);
    const result = await processMedicalDraft(draft, language);
    setIsLoading(false);

    if (result.success) {
      setArticle(result.data);
      setStep(2);
    } else {
      alert("Ошибка AI: " + result.error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 min-h-screen bg-gray-50 font-sans">
      {/* ШАГ 1: ЧЕРНОВИК */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-500 bg-white p-8 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">AI Редактор 🧬</h1>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="p-2 border rounded-lg bg-gray-50 font-medium"
            >
              <option value="ru">Русский 🇷🇺</option>
              <option value="uz">O'zbek 🇺🇿</option>
              <option value="tg">Тоҷикӣ 🇹🇯</option>
            </select>
          </div>

          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-indigo-800 text-sm flex items-start">
            <span className="mr-2 text-xl">💡</span>
            <div>
              <b>Совет врача:</b> Не пишите литературно. Просто перечислите факты, симптомы и жалобы.
              <br/>AI сам структурирует текст, добавит жирный шрифт и расставит акценты.
            </div>
          </div>

          <textarea
            className="w-full h-80 p-6 text-lg border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-0 transition shadow-inner placeholder-gray-400"
            placeholder="Пример: Пациент 45 лет, жалуется на сильные головные боли с одной стороны..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />

          <button
            onClick={handleProcess}
            disabled={isLoading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <><Spinner /> Обработка данных...</> : '✨ Создать профессиональную статью'}
          </button>
        </div>
      )}

      {/* ШАГ 2: РЕДАКТОР */}
      {step === 2 && article && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
          <div className="bg-white p-4 rounded-2xl shadow-sm sticky top-4 z-20 flex justify-between items-center border border-gray-100">
            <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-900 font-bold text-sm px-4 py-2 hover:bg-gray-100 rounded-lg transition">
              ← Назад
            </button>
            <div className="flex gap-3">
               <span className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100 flex items-center">
                 ✅ Структура Mayo Clinic
               </span>
               <button className="px-6 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 shadow transition flex items-center gap-2">
                 Опубликовать 🚀
               </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <input
              value={article.title}
              onChange={(e) => setArticle({...article, title: e.target.value})}
              className="w-full text-4xl md:text-5xl font-extrabold text-gray-900 placeholder-gray-300 border-none focus:ring-0 p-0 leading-tight"
              placeholder="Заголовок статьи"
            />
          </div>

          <div className="relative w-full h-72 bg-gray-100 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 group hover:border-blue-500 transition cursor-pointer overflow-hidden">
             <div className="text-center p-6">
               <p className="text-blue-600 font-bold mb-2">AI запрос для фото:</p>
               <p className="text-gray-500 italic text-sm max-w-md mx-auto mb-4">"{article.imageQuery}"</p>
               <button className="px-5 py-2 bg-white border rounded-full text-sm font-bold text-gray-700 shadow-sm hover:shadow-md transition">
                 📸 Найти фото (Unsplash)
               </button>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Section title="Обзор (Overview)" content={article.overview} onChange={(v: string) => setArticle({...article, overview: v})} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Section title="Симптомы" content={article.symptoms} onChange={(v: string) => setArticle({...article, symptoms: v})} />
              <Section title="Причины" content={article.causes} onChange={(v: string) => setArticle({...article, causes: v})} />
            </div>

            <Section title="Диагностика и Лечение" content={article.diagnosis_treatment} onChange={(v: string) => setArticle({...article, diagnosis_treatment: v})} />
            <Section title="Профилактика" content={article.prevention} onChange={(v: string) => setArticle({...article, prevention: v})} />
          </div>
        </div>
      )}
    </div>
  );
}

// Умная секция (ИСПРАВЛЕННАЯ ВЕРСИЯ)
function Section({ title, content, onChange }: any) {
  const [mode, setMode] = useState<'write' | 'preview'>('preview');

  // ФИКС ОШИБКИ: Если content пришел как массив, превращаем его в строку с точками
  const safeContent = Array.isArray(content) 
    ? content.map((item: string) => `• ${item}`).join('\n\n') 
    : (content || "");

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 transition hover:shadow-md">
      <div className="flex justify-between items-center mb-4">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</label>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setMode('write')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition ${mode === 'write' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            ✏️ Правка
          </button>
          <button 
            onClick={() => setMode('preview')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition ${mode === 'preview' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            👁️ Просмотр
          </button>
        </div>
      </div>

      {mode === 'write' ? (
        <textarea
          value={safeContent}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[200px] p-4 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-gray-800 font-mono text-sm leading-relaxed"
        />
      ) : (
        <div className="prose prose-blue prose-sm max-w-none text-gray-700 leading-relaxed min-h-[100px]">
          <ReactMarkdown>{safeContent || "*Пусто...*"}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
