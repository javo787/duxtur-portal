'use client';

import { useState, useEffect, useRef } from 'react';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';
import { SectionEditor } from './SectionEditor';
import { TagsInput } from './TagsInput';
import { ReadabilityMeter } from './ReadabilityMeter';

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

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

interface ArticleEditModalProps {
  slug: string;
  lang: string;
  onClose: () => void;
  onSaved: () => void;
}

export function ArticleEditModal({ slug, lang, onClose, onSaved }: ArticleEditModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [language, setLanguage] = useState(lang);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [overview, setOverview] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState('');
  const [sections, setSections] = useState<Section[]>([
    { title: '', content: '', image: '', imageCaption: '' },
  ]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [causes, setCauses] = useState<string[]>([]);
  const [treatment, setTreatment] = useState<string[]>([]);
  const [references, setReferences] = useState<string[]>([]);
  const [sourceInput, setSourceInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  // Parse multilang field for current language
  const t = (field: any) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[language] || field.ru || field.uz || '';
  };

  const parseTags = (raw: any): string[] => {
    if (!raw) return [];
    const val = typeof raw === 'object' ? (raw[language] || raw.ru || '') : String(raw);
    return val.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
  };

  // Load article data
  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/doctor/articles/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data) return;
        setTitle(t(data.title));
        setOverview(t(data.overview));
        setCoverImage(data.image || '');
        setCategory(data.category || '');
        setSymptoms(parseTags(data.symptoms));
        setCauses(parseTags(data.causes));
        setTreatment(parseTags(data.diagnosis_treatment));
        setReferences(Array.isArray(data.references) ? data.references : []);

        // Build sections
        const parsed: Section[] = [];
        for (let i = 1; i <= 5; i++) {
          const titleVal = t(data[`section${i}_title`]);
          const contentVal = t(data[`section${i}_content`]);
          if (!titleVal && !contentVal) continue;
          parsed.push({
            title: titleVal,
            content: contentVal,
            image: data[`section${i}_image`] || '',
            imageCaption: data[`section${i}_imageCaption`] || '',
          });
        }
        setSections(parsed.length > 0 ? parsed : [{ title: '', content: '', image: '', imageCaption: '' }]);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [slug, language]);

  const updateSection = (i: number, patch: Partial<Section>) => {
    setSections((prev) => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  };

  const handleCoverUpload = async (file: File) => {
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
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);

    const articleData: any = {
      title,
      overview,
      image: coverImage,
      category,
      symptoms,
      causes,
      treatment,
      references,
    };
    sections.forEach((s, i) => {
      articleData[`section${i + 1}_title`] = s.title;
      articleData[`section${i + 1}_content`] = s.content;
      if (s.image) articleData[`section${i + 1}_image`] = s.image;
    });

    const res = await fetch(`/api/doctor/articles/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, articleData }),
    });

    setIsSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1200);
    } else {
      const err = await res.json();
      alert('Ошибка: ' + (err.error || 'Неизвестная ошибка'));
    }
  };

  const fullText = [overview, ...sections.map((s) => s.content)].join(' ');

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div>
              <p className="text-sm font-extrabold text-gray-900">Редактирование статьи</p>
              <p className="text-xs text-amber-600 font-medium">После сохранения — снова на модерацию</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language switcher */}
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 outline-none">
              {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>

            <ReadabilityMeter text={fullText} />

            <button onClick={handleSave} disabled={isSaving || saved}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl transition ${
                saved
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
              }`}>
              {saved ? '✅ Сохранено!' : isSaving ? <><Spinner /> Сохранение...</> : '💾 Сохранить'}
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Spinner />
            <p className="text-sm">Загрузка статьи...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-5 pb-24">

          {/* Language notice */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 flex items-center gap-2">
            <span>ℹ️</span>
            Редактируете язык: <strong>{LANGUAGES.find(l => l.value === language)?.label}</strong>.
            Смените язык в шапке чтобы редактировать другую версию.
          </div>

          {/* TITLE + META */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Заголовок <span className="text-red-400">*</span>
              </label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                className={`w-full text-xl font-extrabold text-gray-900 border-2 rounded-xl px-4 py-3 outline-none transition ${
                  errors.title ? 'border-red-400 bg-red-50' : 'border-gray-100 focus:border-blue-400'
                }`} />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Краткое описание <span className="text-red-400">*</span>
              </label>
              <textarea value={overview} onChange={(e) => setOverview(e.target.value)} rows={3}
                className={`w-full border-2 rounded-xl px-4 py-3 outline-none resize-none text-gray-700 text-sm leading-relaxed transition ${
                  errors.overview ? 'border-red-400 bg-red-50' : 'border-gray-100 focus:border-blue-400'
                }`} />
              {errors.overview && <p className="text-xs text-red-500 mt-1">{errors.overview}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Категория</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 outline-none text-sm text-gray-700 bg-white focus:border-blue-400 transition">
                <option value="">Выберите...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* COVER */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Обложка</label>
            <div onClick={() => coverInputRef.current?.click()}
              className="relative w-full h-44 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer transition">
              {coverImage ? (
                <>
                  <img src={coverImage} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center">
                    <span className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-sm">Заменить</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full gap-2 text-gray-400">
                  {isCoverUploading ? <><Spinner /><span className="text-sm">Загрузка...</span></>
                    : <><span className="text-2xl">🖼️</span><span className="text-sm font-medium">Добавить обложку</span></>}
                </div>
              )}
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }} />
          </div>

          {/* SECTIONS */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Разделы</label>
              <span className="text-xs text-gray-400">{sections.length} раздел(а)</span>
            </div>
            <div className="space-y-4">
              {sections.map((section, i) => (
                <SectionEditor key={i} index={i + 1}
                  title={section.title} content={section.content}
                  image={section.image} imageCaption={section.imageCaption}
                  onTitleChange={(v) => updateSection(i, { title: v })}
                  onContentChange={(v) => updateSection(i, { content: v })}
                  onImageChange={(v) => updateSection(i, { image: v })}
                  onImageCaptionChange={(v) => updateSection(i, { imageCaption: v })}
                  onRemove={() => setSections((prev) => prev.filter((_, idx) => idx !== i))}
                  canRemove={sections.length > 1}
                />
              ))}
            </div>
            <button onClick={() => setSections((prev) => [...prev, { title: '', content: '', image: '', imageCaption: '' }])}
              className="mt-4 w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-bold text-gray-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition">
              + Добавить раздел
            </button>
          </div>

          {/* TAGS */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
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
          </div>

          {/* SOURCES */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">📚 Источники</h3>
            <div className="space-y-2 mb-3">
              {references.map((src, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                  <span className="text-xs font-bold text-blue-400 shrink-0">{i + 1}.</span>
                  <span className="text-xs text-gray-600 flex-1 truncate">{src}</span>
                  <button onClick={() => setReferences((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-gray-300 hover:text-red-500 transition text-base leading-none shrink-0">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={sourceInput} onChange={(e) => setSourceInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && sourceInput.trim()) { setReferences((p) => [...p, sourceInput.trim()]); setSourceInput(''); } }}
                placeholder="https://pubmed.ncbi.nlm.nih.gov/..."
                className="flex-1 border-2 border-gray-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-400 transition placeholder-gray-300" />
              <button onClick={() => { if (sourceInput.trim()) { setReferences((p) => [...p, sourceInput.trim()]); setSourceInput(''); } }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition">
                + Добавить
              </button>
            </div>
          </div>

          {/* BOTTOM BAR */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-10 px-4 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <ReadabilityMeter text={fullText} />
              <div className="flex gap-3">
                <button onClick={onClose}
                  className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
                  Отмена
                </button>
                <button onClick={handleSave} disabled={isSaving || saved}
                  className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition ${
                    saved ? 'bg-green-100 text-green-700' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
                  }`}>
                  {saved ? '✅ Сохранено!' : isSaving ? <><Spinner /> Сохранение...</> : '💾 Сохранить изменения'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
