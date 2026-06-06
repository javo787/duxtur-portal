'use client';

import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { EditorToolbar } from './EditorToolbar';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';

interface SectionEditorProps {
  index: number;
  title: string;
  content: string;
  image?: string;
  imageCaption?: string;
  onTitleChange: (v: string) => void;
  onContentChange: (v: string) => void;
  onImageChange: (url: string) => void;
  onImageCaptionChange: (v: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function SectionEditor({
  index, title, content, image, imageCaption,
  onTitleChange, onContentChange, onImageChange, onImageCaptionChange,
  onRemove, canRemove,
}: SectionEditorProps) {
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const result = await uploadImageToCloudinary(formData);
    setIsUploading(false);
    if (result.success && result.url) onImageChange(result.url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200">
        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-extrabold flex items-center justify-center shrink-0">
          {index}
        </span>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={`Заголовок раздела ${index}...`}
          className="flex-1 text-sm font-bold text-gray-800 bg-transparent border-none outline-none placeholder-gray-300"
        />
        <div className="flex items-center gap-1">
          {/* Mode toggle */}
          <div className="flex bg-white border border-gray-200 p-0.5 rounded-lg gap-0.5 mr-1">
            {(['write', 'preview'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                  mode === m ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {m === 'write' ? '✏️' : '👁️'}
              </button>
            ))}
          </div>
          {canRemove && (
            <button
              onClick={onRemove}
              title="Удалить раздел"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      {mode === 'write' && (
        <EditorToolbar
          textareaRef={textareaRef}
          value={content}
          onChange={onContentChange}
          onImageClick={() => fileInputRef.current?.click()}
        />
      )}

      {/* Content area */}
      <div className="p-4">
        {mode === 'write' ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Напишите содержание раздела... Поддерживается Markdown форматирование."
            className="w-full min-h-[160px] p-3 bg-gray-50 rounded-xl border border-gray-100 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition text-gray-800 text-sm leading-relaxed outline-none resize-none font-mono"
          />
        ) : (
          <div className="min-h-[100px] p-3">
            {content ? (
              <div className="prose prose-blue prose-sm max-w-none text-gray-700 leading-relaxed">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-gray-300 text-sm italic">Нет содержания...</p>
            )}
          </div>
        )}

        {/* Image area */}
        {image ? (
          <div className="mt-3">
            <div className="relative rounded-xl overflow-hidden group">
              <img src={image} alt={imageCaption || ''} className="w-full h-48 object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white text-gray-900 text-xs font-bold rounded-full"
                >
                  Заменить
                </button>
                <button
                  onClick={() => onImageChange('')}
                  className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-full"
                >
                  Удалить
                </button>
              </div>
            </div>
            <input
              value={imageCaption || ''}
              onChange={(e) => onImageCaptionChange(e.target.value)}
              placeholder="Подпись к фото (необязательно)..."
              className="mt-2 w-full text-xs text-gray-500 bg-transparent border-none outline-none text-center italic placeholder-gray-300"
            />
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-3 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
            }`}
          >
            {isUploading ? (
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-xs font-bold">Загрузка...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium">Добавить фото к разделу</span>
                <span className="text-xs text-gray-300">или перетащите сюда</span>
              </div>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
      />
    </div>
  );
}
