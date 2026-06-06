'use client';

import { useState, useRef } from 'react';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';
import { saveArticle } from '@/app/actions/save-article';
import { SectionEditor } from './SectionEditor';
import { TagsInput } from './TagsInput';
import { ReadabilityMeter } from './ReadabilityMeter';

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

interface AISection {
  title: string;
  content: string;
  image: string;
  imageCaption: string;
}

interface AIResultEditorProps {
  lang: string;
  language: string;
  initialArticle: any; // raw AI output
  onBack: () => void;
  onPublished: (slug: string) => void;
}

// Convert raw AI article object → structured sections array
function parseAISections(article: any): AISection[] {
  const sections: AISection[] = [];
  // overview as first implicit section — handled separately
  for (let i = 1; i <= 5; i++) {
    const title = article[`section${i}_title`] || '';
    const content = article[`section${i}_content`] || '';
    if (!title && !content) continue;
    sections.push({ title, content, image: '', imageCaption: '' });
  }
  if (sections.length === 0) {
    sections.push({ title: '', content: '', image: '', imageCaption: '' });
  }
  return sections;
}

// Parse AI tags — can be string "a, b, c" or array
function parseTags(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  return String(raw).split(/[,;]/).map((s) => s.trim()).filter(Boolean);
}

export function AIResultEditor({ lang, language, initialArticle, onBack, onPublished }: AIResultEditorProps) {
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialArticle.title || '');
  const [overview, setOverview] = useState(
    typeof initialArticle.overview === 'string'
      ? initialArticle.overview
      : initialArticle.overview?.[language] || ''
  );
  const [coverImage, setCoverImage] = useState(initialArticle.image || '');
  const [sections, setSections] = useState<AISection[]>(parseAISections(initialArticle));
  const [symptoms, setSymptoms] = useState<string[]>(parseTags(initialArticle.symptoms));
  const [causes, setCauses] = useState<string[]>(parseTags(initialArticle.causes));
  const [treatment, setTreatment] = useState<string[]>(parseTags(initialArticle.treatment || initialArticle.diagnosis_treatment));
  const [references, setReferences] = useState<string[]>(parseTags(initialArticle.references));
  const [sourceInput, setSourceInput] = useState('');
  const [category, setCategory] = useState(initialArticle.category || '');

  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [dragOverCover, setDragOverCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const CATEGORIES = [
    'Кардиология', 'Неврология', 'Педиатрия', 'Гастроэнтерология',
    'Эндокринология', 'Пульмонология', 'Ортопедия', 'Дерматология',
    'Урология', 'Гинекология', 'Офтальмология', 'Психиатрия',
    'Инфекционные болезни', 'Онкология', 'Общая практика',
  ];

  const updateSection = (i: number, patch: Partial<AISection>) => {
    setSections((prev) => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  };

  const addSection = () => setSections((prev) => [...prev, { title: '', content: '', image: '', imageCaption: '' }]);
  const removeSection = (i: number) => setSections((prev) => prev.filter((_, idx) => idx !== i));

  const handleCoverUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsCoverUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const result = await uploadImageToCloudinary(formData);
    setIsCoverUploading(false);
    if (result.success && result.url) setCoverImage(result.url);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Введите заголовок';
    if (!overview.trim()) e.overview = 'Введите краткое описание';
    const hasContent = sections.some((s) => s.content.trim().length > 20);
    if (!hasContent) e.sections = 'Добавьте содержание хотя бы в один раздел';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildArticleData = () => {
    const data: any = {
      title,
      overview,
      image: coverImage,
      category,
      symptoms,
      causes,
      treatment,
      references,
      aiGenerated: true,
    };
    sections.forEach((s, i) => {
      data[`section${i + 1}_title`] = s.title;
      data[`section${i + 1}_content`] = s.content;
      if (s.image) data[`section${i + 1}_image`] = s.image;
      if (s.imageCaption) data[`section${i + 1}_imageCaption`] = s.imageCaption;
    });
    return data;
  };

  const handlePublish = async () => {
    if (!validate()) return;
    setIsSaving(true);
    const result = await saveArticle(buildArticleData(), language);
    setIsSaving(false);
    if (result.success) {
      onPublished(result.slug || '');
    } else {
      alert('Ошибка: ' + result.error);
    }
  };

  const fullText = [overview, ...sections.map((s) => s.content)].join(' ');

  return (
    <div className="space-y-5 pb-28">

      {/* ── TOP BAR ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-800 font-medium flex items-center gap-1.5 hover:bg-gray-100 px-3 py-1.5 rounded-xl transition"
        >
          ← Изменить черновик
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full border border-purple-200">
            ✨ AI-редактор
          </span>
          <ReadabilityMeter text={fullText} />
        </div>
        <button
          onClick={handlePublish}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-green-200 transition disabled:opacity-70"
        >
          {isSaving ? <><Spinner /> Публикация...</> : '🚀 Опубликовать'}
        </button>
      </div>

      {/* ── AI HINT ─────────────────────────────────────────────────── */}
      <div className="bg-purple-50 border border-purple-100 rounded-2xl px-5 py-3 flex items-start gap-3">
        <span className="text-lg shrink-0">✨</span>
        <p className="text-sm text-purple-800">
          AI сгенерировал черновик — проверьте и отредактируйте каждый раздел.
          Добавьте фото, уточните симптомы и источники перед публикацией.
        </p>
      </div>

      {/* ── TITLE + META ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">

        <div id="field-title">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
            Заголовок <span className="text-red-400">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Заголовок статьи"
            className={`w-full text-2xl font-extrabold text-gray-900 border-2 rounded-xl px-4 py-3 outline-none transition placeholder-gray-200 ${
              errors.title ? 'border-red-400 bg-red-50' : 'border-gray-100 focus:border-blue-400'
            }`}
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        <div id="field-overview">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
            Краткое описание <span className="text-red-400">*</span>
            <span className="ml-2 text-gray-300 font-normal normal-case">— показывается в карточке на главной</span>
          </label>
          <textarea
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            rows={3}
            className={`w-full border-2 rounded-xl px-4 py-3 outline-none resize-none text-gray-700 text-sm leading-relaxed transition placeholder-gray-300 ${
              errors.overview ? 'border-red-400 bg-red-50' : 'border-gray-100 focus:border-blue-400'
            }`}
          />
          {errors.overview && <p className="text-xs text-red-500 mt-1">{errors.overview}</p>}
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Категория</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 outline-none text-sm text-gray-700 bg-white focus:border-blue-400 transition"
          >
            <option value="">Выберите категорию...</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* ── COVER IMAGE ──────────────────────────────────────────────── */}
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
          Обложка статьи
          {initialArticle.imageQuery && (
            <span className="ml-2 text-gray-300 font-normal normal-case">
              AI рекомендует: «{initialArticle.imageQuery}»
            </span>
          )}
        </label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOverCover(true); }}
          onDragLeave={() => setDragOverCover(false)}
          onDrop={(e) => { e.preventDefault(); setDragOverCover(false); const f = e.dataTransfer.files[0]; if (f) handleCoverUpload(f); }}
          onClick={() => coverInputRef.current?.click()}
          className={`relative w-full h-56 rounded-2xl overflow-hidden border-2 cursor-pointer transition ${
            dragOverCover ? 'border-blue-400 bg-blue-50' : 'border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
          }`}
        >
          {coverImage ? (
            <>
              <img src={coverImage} alt="Обложка" className="w-full h-full object-cover" />
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-600">Нажмите или перетащите фото</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG — до 10MB · Рекомендуется 1200×630px</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }} />
      </div>

      {/* ── SECTIONS ─────────────────────────────────────────────────── */}
      <div id="field-sections">
        <div className="flex items-center justify-between mb-3 px-1">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Разделы статьи <span className="text-red-400">*</span>
          </label>
          <span className="text-xs text-gray-400">{sections.length} раздел(а)</span>
        </div>
        {errors.sections && <p className="text-xs text-red-500 mb-2 px-1">{errors.sections}</p>}
        <div className="space-y-4">
          {sections.map((section, i) => (
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
              canRemove={sections.length > 1}
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

      {/* ── TAGS ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Теги</h3>
          <span className="text-xs text-gray-400">— заполнены AI, проверьте и дополните</span>
        </div>
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
      </div>

      {/* ── SOURCES ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">📚 Источники</h3>
          <span
            title="Ссылки на PubMed, ВОЗ, Минздрав повышают доверие и рейтинг в Google"
            className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 text-xs flex items-center justify-center cursor-help font-bold"
          >i</span>
        </div>
        <p className="text-xs text-gray-400 mb-4">AI добавил источники автоматически — проверьте ссылки</p>
        <div className="space-y-2 mb-3">
          {references.map((src, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <span className="text-xs font-bold text-blue-400 shrink-0">{i + 1}.</span>
              <span className="text-xs text-gray-600 flex-1 truncate">{src}</span>
              <button
                onClick={() => setReferences((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-gray-300 hover:text-red-500 transition shrink-0 text-base leading-none"
              >×</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={sourceInput}
            onChange={(e) => setSourceInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && sourceInput.trim()) {
                setReferences((prev) => [...prev, sourceInput.trim()]);
                setSourceInput('');
              }
            }}
            placeholder="https://pubmed.ncbi.nlm.nih.gov/..."
            className="flex-1 border-2 border-gray-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-400 transition text-gray-700 placeholder-gray-300"
          />
          <button
            onClick={() => {
              if (sourceInput.trim()) {
                setReferences((prev) => [...prev, sourceInput.trim()]);
                setSourceInput('');
              }
            }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
          >+ Добавить</button>
        </div>
      </div>

      {/* ── BOTTOM PUBLISH BAR ───────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-30 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <ReadabilityMeter text={fullText} />
          <button
            onClick={handlePublish}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition disabled:opacity-70"
          >
            {isSaving ? <><Spinner /> Публикация...</> : '🚀 Опубликовать статью'}
          </button>
        </div>
      </div>
    </div>
  );
}
