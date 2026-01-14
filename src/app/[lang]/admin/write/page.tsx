'use client';

import { useState, useRef } from 'react';
import { processMedicalDraft } from '@/app/actions/ai-editor';
import { saveArticle } from '@/app/actions/save-article';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function SmartEditor() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState('');
  const [language, setLanguage] = useState('ru');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
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
      alert("Ошибка загрузки фото: " + result.error);
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);
    const result = await saveArticle(article, language);
    setIsSaving(false);

    if (result.success) {
      alert("🎉 Статья опубликована!");
      setStep(1);
      setDraft('');
    } else {
      alert("Ошибка сохранения: " + result.error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 min-h-screen bg-gray-50 font-sans">
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-500 bg-white p-8 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">AI Редактор 🧬</h1>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="p-2 border rounded-lg bg-gray-50 font-medium text-lg"
            >
              <option value="ru">Русский 🇷🇺</option>
              <option value="uz">O'zbek 🇺🇿</option>
              <option value="tg">Тоҷикӣ 🇹🇯</option>
              <option value="ky">Кыргызча 🇰🇬</option>
              <option value="kk">Қазақша 🇰🇿</option>
            </select>
          </div>

          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-indigo-800 text-sm flex items-start">
            <span className="mr-2 text-xl">💡</span>
            <div>
              <b>Совет:</b> Пишите на любом языке. AI переведет и оформит на выбранном языке (например, на Казахском).
            </div>
          </div>

          <textarea
            className="w-full h-80 p-6 text-lg border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-0 transition shadow-inner placeholder-gray-400"
            placeholder="Пример: Пациент жалуется на боли в животе..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />

          <button
            onClick={handleProcess}
            disabled={isLoading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {isLoading ? <><Spinner /> AI думает (переводит)...</> : '✨ Создать статью'}
          </button>
        </div>
      )}

      {step === 2 && article && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
          <div className="bg-white p-4 rounded-2xl shadow-sm sticky top-4 z-20 flex justify-between items-center border border-gray-100">
            <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-900 font-bold text-sm px-4 py-2 hover:bg-gray-100 rounded-lg transition">
              ← Назад
            </button>
            <button 
              onClick={handlePublish}
              disabled={isSaving}
              className="px-6 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 shadow transition flex items-center gap-2 disabled:opacity-70"
            >
              {isSaving ? <Spinner /> : 'Опубликовать 🚀'}
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <input
              value={article.title}
              onChange={(e) => setArticle({...article, title: e.target.value})}
              className="w-full text-4xl md:text-5xl font-extrabold text-gray-900 placeholder-gray-300 border-none focus:ring-0 p-0 leading-tight"
              placeholder="Заголовок"
            />
          </div>

          <div className="relative w-full h-80 bg-gray-100 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 group hover:border-blue-500 transition overflow-hidden">
             {article.image ? (
               <>
                 <img src={article.image} alt="Preview" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button onClick={() => fileInputRef.current?.click()} className="bg-white text-black px-4 py-2 rounded-full font-bold">Заменить фото</button>
                 </div>
               </>
             ) : (
               <div className="text-center p-6">
                 {isUploading ? (
                   <div className="flex flex-col items-center text-blue-600"><Spinner /><p className="mt-2 font-bold">Загрузка...</p></div>
                 ) : (
                   <>
                     <p className="text-blue-600 font-bold mb-2">AI запрос: "{article.imageQuery}"</p>
                     <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg">☁️ Загрузить фото</button>
                   </>
                 )}
               </div>
             )}
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Section title="Обзор" content={article.overview} onChange={(v: string) => setArticle({...article, overview: v})} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Section title="Симптомы" content={article.symptoms} onChange={(v: string) => setArticle({...article, symptoms: v})} />
              <Section title="Причины" content={article.causes} onChange={(v: string) => setArticle({...article, causes: v})} />
            </div>
            <Section title="Лечение" content={article.diagnosis_treatment} onChange={(v: string) => setArticle({...article, diagnosis_treatment: v})} />
            <Section title="Профилактика" content={article.prevention} onChange={(v: string) => setArticle({...article, prevention: v})} />
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, content, onChange }: any) {
  const [mode, setMode] = useState<'write' | 'preview'>('preview');
  const safeContent = Array.isArray(content) ? content.map((item: string) => `• ${item}`).join('\n\n') : (content || "");

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 transition hover:shadow-md">
      <div className="flex justify-between items-center mb-4">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</label>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setMode('write')} className={`px-3 py-1 text-xs font-bold rounded-md transition ${mode === 'write' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>✏️ Правка</button>
          <button onClick={() => setMode('preview')} className={`px-3 py-1 text-xs font-bold rounded-md transition ${mode === 'preview' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>👁️ Просмотр</button>
        </div>
      </div>
      {mode === 'write' ? (
        <textarea value={safeContent} onChange={(e) => onChange(e.target.value)} className="w-full min-h-[200px] p-4 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-gray-800 font-mono text-sm leading-relaxed" />
      ) : (
        <div className="prose prose-blue prose-sm max-w-none text-gray-700 leading-relaxed min-h-[100px]">
          <ReactMarkdown>{safeContent || "*Пусто...*"}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
