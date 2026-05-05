'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';
import { saveArticle } from '@/app/actions/save-article';
import { SectionEditor } from './SectionEditor';
import { TagsInput } from './TagsInput';
import { ReadabilityMeter } from './ReadabilityMeter';

const AUTOSAVE_KEY = 'duxtur_manual_draft';
const AUTOSAVE_INTERVAL = 30_000; // 30s

const CATEGORIES = [
  'Кардиология', 'Неврология', 'Педиатрия', 'Гастроэнтерология',
  'Эндокринология', 'Пульмонология', 'Ортопедия', 'Дерматология',
  'Урология', 'Гинекология', 'Офтальмология', 'Психиатрия',
  'Инфекционные болезни', 'Онкология', 'Общая практика',
];

const LANGUAGES = [
  { value: 'ru', label: '🇷🇺 Русский' },
  { value: 'uz', label: "🇺🇿 O'zbek" },
  { value: 'tg', label: '🇹🇯 Тоҷикӣ' },
  { value: 'ky', label: '🇰🇬 Кыргызча' },
  { value: 'kk', label: '🇰🇿 Қазақша' },
];

interface Section {
  title: string;
  content: string;
  image: string;
  imageCaption: string;
}

interface ArticleDraft {
  title: string;
  overview: string;
  image: string;
  category: string;
  language: string;
  sections: Section[];
  symptoms: string[];
  causes: string[];
  treatment: string[];
  sources: string[];
}

const EMPTY_DRAFT: ArticleDraft = {
  title: '',
  overview: '',
  image: '',
  category: '',
  language: 'ru',
  sections: [{ title: '', content: '', image: '', imageCaption: '' }],
  symptoms: [],
  causes: [],
  treatment: [],
  sources: [],
};

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

interface ManualEditorProps {
  lang: string;
  onPublished: (slug: string) => void;
  onBack: () => void;
}

export function ManualEditor({ lang, onPublished, onBack }: ManualEditorProps) {
  const [draft, setDraft] = useState<ArticleDraft>(() => {
    // Try restore from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return { ...EMPTY_DRAFT, language: lang };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [dragOverCover, setDragOverCover] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sourceInput, setSourceInput] = useState('');
  const [showRestoreBar, setShowRestoreBar] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Check for existing draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.title || parsed.overview) setShowRestoreBar(true);
      } catch {}
    }
  }, []);

  // Autosave every 30s
  const autosave = useCallback(() => {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft));
    setLastSaved(new Date());
  }, [draft]);

  useEffect(() => {
    const timer = setInterval(autosave, AUTOSAVE_INTERVAL);
    return () => clearInterval(timer);
  }, [autosave]);

  const updateDraft = (patch: Partial<ArticleDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const updateSection = (i: number, patch: Partial<Section>) => {
    const sections = [...draft.sections];
    sections[i] = { ...sections[i], ...patch };
    updateDraft({ sections });
  };

  const addSection = () => updateDraft({
    sections: [...draft.sections, { title: '', content: '', image: '', imageCaption: '' }],
  });

  const removeSection = (i: number) => {
    const sections = draft.sections.filter((_, idx) => idx !== i);
    updateDraft({ sections: sections.length ? sections : [{ title: '', content: '', image: '', imageCaption: '' }] });
  };

  const handleCoverUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsCoverUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const result = await uploadImageToCloudinary(formData);
    setIsCoverUploading(false);
    if (result.success && result.url) updateDraft({ image: result.url });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!draft.title.trim()) newErrors.title = 'Введите заголовок статьи';
    if (!draft.overview.trim()) newErrors.overview = 'Введите краткое описание';
    if (!draft.image) newErrors.image = 'Добавьте обложку статьи';
    if (!draft.category) newErrors.category = 'Выберите категорию';
    const hasContent = draft.sections.some((s) => s.content.trim().length > 50);
    if (!hasContent) newErrors.sections = 'Добавьте содержание хотя бы в один раздел';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePublish = async () => {
    if (!validate()) {
      // Scroll to first error
      const firstErrorKey = Object.keys(errors)[0];
      document.getElementById(`field-${firstErrorKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setIsSaving(true);

    // Build article object matching existing saveArticle format
    const articleData: any = {
      title: draft.title,
      overview: draft.overview,
      image: draft.image,
      category: draft.category,
      symptoms: draft.symptoms,
      causes: draft.causes,
      treatment: draft.treatment,
      references: draft.sources,
    };
    draft.sections.forEach((s, i) => {
      articleData[`section${i + 1}_title`] = s.title;
      articleData[`section${i + 1}_content`] = s.content;
      if (s.image) articleData[`section${i + 1}_image`] = s.image;
      if (s.imageCaption) articleData[`section${i + 1}_imageCaption`] = s.imageCaption;
    });

    const result = await saveArticle(articleData, draft.language);
    setIsSaving(false);
    if (result.success) {
      localStorage.removeItem(AUTOSAVE_KEY);
      onPublished(result.slug || '');
    } else {
      alert('Ошибка: ' + result.error);
    }
  };

  const handleSaveDraft = () => {
    autosave();
    alert('Черновик сохранён!');
  };

  // Full text for readability
  const fullText = [draft.overview, ...draft.sections.map((s) => s.content)].join(' ');

  return (
    <div className="space-y-5 pb-24">

      {/* Restore bar */}
      {showRestoreBar && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800 font-medium">📄 Найден несохранённый черновик — восстановить?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRestoreBar(false)}
              className="px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 rounded-lg transition"
            >
              Начать заново
            </button>
            <button
              onClick={() => setShowRestoreBar(false)}
              className="px-3 py-1.5 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
            >
              Восстановить ✓
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1.5 hover:bg-gray-100 px-3 py-1.5 rounded-xl transition"
        >
          ← Назад
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <ReadabilityMeter text={fullText} />
          {lastSaved && (
            <span className="text-xs text-gray-400">
              💾 Автосохранено {lastSaved.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
          >
            Сохранить черновик
          </button>
          <button
            onClick={handlePublish}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-green-200 transition disabled:opacity-70"
          >
            {isSaving ? <><Spinner /> Публикация...</> : '🚀 Отправить на модерацию'}
          </button>
        </div>
      </div>

      {/* META: Title + Category + Language */}
      <div id="field-title" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
              Заголовок статьи <span className="text-red-400">*</span>
            </label>
            <input
              value={draft.title}
              onChange={(e) => updateDraft({ title: e.target.value })}
              placeholder="Например: Мигрень: причины, симптомы и лечение"
              className={`w-full text-2xl font-extrabold text-gray-900 border-2 rounded-xl px-4 py-3 outline-none transition placeholder-gray-200 ${
                errors.title ? 'border-red-400 bg-red-50' : 'border-gray-100 focus:border-blue-400'
              }`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>
        </div>

        <div id="field-overview">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
            Краткое описание (обзор) <span className="text-red-400">*</span>
            <span className="ml-2 text-gray-300 font-normal normal-case">— показывается в карточке на главной</span>
          </label>
          <textarea
            value={draft.overview}
            onChange={(e) => updateDraft({ overview: e.target.value })}
            rows={3}
            placeholder="2–3 предложения: о чём статья, для кого, что узнает читатель..."
            className={`w-full border-2 rounded-xl px-4 py-3 outline-none resize-none text-gray-700 text-sm leading-relaxed transition placeholder-gray-300 ${
              errors.overview ? 'border-red-400 bg-red-50' : 'border-gray-100 focus:border-blue-400'
            }`}
          />
          {errors.overview && <p className="text-xs text-red-500 mt-1">{errors.overview}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div id="field-category">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
              Категория <span className="text-red-400">*</span>
            </label>
            <select
              value={draft.category}
              onChange={(e) => updateDraft({ category: e.target.value })}
              className={`w-full border-2 rounded-xl px-4 py-3 outline-none text-sm text-gray-700 bg-white transition ${
                errors.category ? 'border-red-400' : 'border-gray-100 focus:border-blue-400'
              }`}
            >
              <option value="">Выберите категорию...</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
              Язык оригинала
            </label>
            <select
              value={draft.language}
              onChange={(e) => updateDraft({ language: e.target.value })}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 outline-none text-sm text-gray-700 bg-white focus:border-blue-400 transition"
            >
              {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* COVER IMAGE */}
      <div id="field-image">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
          Обложка статьи <span className="text-red-400">*</span>
          <span className="ml-2 text-gray-300 font-normal normal-case">Рекомендуется 1200×630px</span>
        </label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOverCover(true); }}
          onDragLeave={() => setDragOverCover(false)}
          onDrop={(e) => { e.preventDefault(); setDragOverCover(false); const f = e.dataTransfer.files[0]; if (f) handleCoverUpload(f); }}
          onClick={() => coverInputRef.current?.click()}
          className={`relative w-full h-56 rounded-2xl overflow-hidden border-2 cursor-pointer transition ${
            errors.image ? 'border-red-400' : dragOverCover ? 'border-blue-400 bg-blue-50' : 'border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
          }`}
        >
          {draft.image ? (
            <>
              <img src={draft.image} alt="Обложка" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center">
                <span className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-sm">Заменить обложку</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              {isCoverUploading ? (
                <div className="flex items-center gap-2 text-blue-600">
                  <Spinner />
                  <span className="text-sm font-bold">Загрузка...</span>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-600">Нажмите или перетащите фото</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — до 10MB</p>
                  </div>
                </>
              )}
            </div>
          )}
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }} />
        </div>
        {errors.image && <p className="text-xs text-red-500 mt-1 px-1">{errors.image}</p>}
      </div>

      {/* SECTIONS */}
      <div id="field-sections">
        <div className="flex items-center justify-between mb-3 px-1">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Разделы статьи <span className="text-red-400">*</span>
          </label>
          <span className="text-xs text-gray-400">{draft.sections.length} раздел(а)</span>
        </div>
        {errors.sections && (
          <p className="text-xs text-red-500 mb-2 px-1">{errors.sections}</p>
        )}
        <div className="space-y-4">
          {draft.sections.map((section, i) => (
            <SectionEditor
              key={i}
              index={i + 1}
              title={section.title}
              content={section.content}
              image={section.image}
              imageCaption={section.imageCaption}
              onTitleChange={(v) => updateSection(i, { title: v })}
              onContentChange={(v) => updateSection(i, { content: v })}
              onImageChange={(v) => updateSection(i, { image: v })}
              onImageCaptionChange={(v) => updateSection(i, { imageCaption: v })}
              onRemove={() => removeSection(i)}
              canRemove={draft.sections.length > 1}
            />
          ))}
        </div>
        <button
          onClick={addSection}
          className="mt-4 w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-bold text-gray-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition"
        >
          + Добавить раздел
        </button>
      </div>

      {/* TAGS */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Теги</h3>
         <TagsInput label="Симптомы" icon="🔴" tags={symptoms} onChange={setSymptoms}
  placeholder="головная боль..." color="orange"
  description="На что жалуется пациент? Эти теги помогают читателям найти статью по своим симптомам."
  example="головная боль, тошнота, головокружение" />
<TagsInput label="Причины" icon="⚡" tags={causes} onChange={setCauses}
  placeholder="стресс..." color="blue"
  description="Почему возникает это заболевание? Google использует эти данные для поисковых подсказок."
  example="стресс, генетика, вирусная инфекция" />
<TagsInput label="Лечение" icon="💊" tags={treatment} onChange={setTreatment}
  placeholder="ибупрофен..." color="green"
  description="Основные методы лечения — препараты, процедуры, образ жизни. Кратко, без дозировок."
  example="ибупрофен, постельный режим, физиотерапия" />
          
        />
      </div>

      {/* SOURCES */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            📚 Источники
          </h3>
          <span
            title="Ссылки на PubMed, ВОЗ, Минздрав повышают доверие читателей и рейтинг в Google"
            className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 text-xs flex items-center justify-center cursor-help font-bold"
          >
            i
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-4">Ссылки на PubMed, ВОЗ, Минздрав — повышают доверие и рейтинг в Google</p>
        <div className="space-y-2 mb-3">
          {draft.sources.map((src, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <span className="text-xs font-bold text-blue-400 shrink-0">{i + 1}.</span>
              <span className="text-xs text-gray-600 flex-1 truncate">{src}</span>
              <button
                onClick={() => updateDraft({ sources: draft.sources.filter((_, idx) => idx !== i) })}
                className="text-gray-300 hover:text-red-500 transition shrink-0"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={sourceInput}
            onChange={(e) => setSourceInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && sourceInput.trim()) {
                updateDraft({ sources: [...draft.sources, sourceInput.trim()] });
                setSourceInput('');
              }
            }}
            placeholder="https://pubmed.ncbi.nlm.nih.gov/..."
            className="flex-1 border-2 border-gray-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-400 transition text-gray-700 placeholder-gray-300"
          />
          <button
            onClick={() => {
              if (sourceInput.trim()) {
                updateDraft({ sources: [...draft.sources, sourceInput.trim()] });
                setSourceInput('');
              }
            }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
          >
            + Добавить
          </button>
        </div>
      </div>

      {/* BOTTOM PUBLISH BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <ReadabilityMeter text={fullText} />
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              💾 Сохранить черновик
            </button>
            <button
              onClick={handlePublish}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-green-200 transition disabled:opacity-70"
            >
              {isSaving ? <><Spinner /> Публикация...</> : '🚀 Отправить на модерацию'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
