'use client';

import { useRef, useState } from 'react';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';
import { completeAuthorProfile, type ProfileInput } from '@/app/actions/author';
import type { AuthorField } from '@/lib/author-profile';

/**
 * The one screen that stands between a saved draft and the team: it asks only for what the profile still lacks
 * (name, specialty, phone, diploma), once. Everything else about the doctor can be filled in later, in the profile.
 */

interface Props {
  missing: AuthorField[];
  /** The name on the account, offered as the starting point of the name field. */
  accountName: string;
  /** Shown above the form: what just happened to the article. */
  title?: string;
  onDone: () => void;
  /** Leave the form and keep the draft. */
  onLater?: () => void;
}

const inputClass =
  'w-full p-3.5 text-base bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition placeholder-gray-300';

export function AuthorCompletion({ missing, accountName, title = 'Статья сохранена в черновиках', onDone, onLater }: Props) {
  const need = (field: AuthorField) => missing.includes(field);
  const [name, setName] = useState(accountName);
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [diplomaUrl, setDiplomaUrl] = useState('');
  const [diplomaLabel, setDiplomaLabel] = useState('');
  const [diplomaPreview, setDiplomaPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{ text: string; field?: keyof ProfileInput } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickDiploma = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setDiplomaLabel(file.name);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setDiplomaPreview(String(e.target?.result ?? ''));
      reader.readAsDataURL(file);
    } else {
      setDiplomaPreview('');
    }
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    const result = await uploadImageToCloudinary(form, 'diplomas');
    setUploading(false);
    if (result.success && result.url) {
      setDiplomaUrl(result.url);
    } else {
      setDiplomaUrl('');
      setDiplomaPreview('');
      setDiplomaLabel('');
      setError({ text: result.error || 'Не удалось загрузить файл. Попробуйте ещё раз.', field: 'documentImageUrl' });
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (uploading) return;
    setError(null);
    setSaving(true);
    const input: Partial<ProfileInput> = {};
    if (need('name')) input.name = name;
    if (need('specialty')) input.specialty = specialty;
    if (need('phone')) input.phone = phone;
    if (need('documentImage')) input.documentImageUrl = diplomaUrl;
    const result = await completeAuthorProfile(input);
    setSaving(false);
    if (result.success) onDone();
    else setError({ text: result.error, field: result.field });
  };

  const fieldError = (field: keyof ProfileInput) =>
    error?.field === field ? (
      <p role="alert" className="mt-1.5 text-sm font-medium text-red-600">{error.text}</p>
    ) : null;

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" noValidate>
      <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500" />
      <div className="p-5 sm:p-6 space-y-5">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
          </span>
          <div>
            <h2 className="font-extrabold text-gray-900 text-lg leading-tight">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Чтобы отправить её, один раз укажите данные врача — только то, чего ещё нет. Остальное можно заполнить позже.
            </p>
          </div>
        </div>

        {need('name') && (
          <div>
            <label htmlFor="author-name" className="block text-sm font-bold text-gray-700 mb-1.5">Фамилия и имя</label>
            <input
              id="author-name" value={name} onChange={e => setName(e.target.value)}
              autoComplete="name" placeholder="Каримов Алишер" className={inputClass}
              aria-invalid={error?.field === 'name'}
            />
            {fieldError('name')}
          </div>
        )}

        {need('specialty') && (
          <div>
            <label htmlFor="author-specialty" className="block text-sm font-bold text-gray-700 mb-1.5">Специальность</label>
            <input
              id="author-specialty" value={specialty} onChange={e => setSpecialty(e.target.value)}
              autoComplete="off" placeholder="Например: кардиолог" className={inputClass}
              aria-invalid={error?.field === 'specialty'}
            />
            {fieldError('specialty')}
          </div>
        )}

        {need('phone') && (
          <div>
            <label htmlFor="author-phone" className="block text-sm font-bold text-gray-700 mb-1.5">Телефон</label>
            <input
              id="author-phone" value={phone} onChange={e => setPhone(e.target.value)}
              type="tel" inputMode="tel" autoComplete="tel" placeholder="+992 900 00 00 00" className={inputClass}
              aria-invalid={error?.field === 'phone'}
            />
            <p className="mt-1.5 text-xs text-gray-400">Нужен команде для связи. На сайте не показывается.</p>
            {fieldError('phone')}
          </div>
        )}

        {need('documentImage') && (
          <div>
            <span className="block text-sm font-bold text-gray-700 mb-1.5">Диплом</span>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={pickDiploma} className="sr-only" id="author-diploma" />
            <button
              type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className={`w-full min-h-[84px] rounded-xl border-2 border-dashed px-4 py-3 flex items-center gap-3 text-left transition ${
                diplomaUrl ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40'
              }`}
            >
              {diplomaPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={diplomaPreview} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0 border border-gray-200" />
              ) : (
                <span aria-hidden="true" className="w-14 h-14 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-2xl shrink-0">📄</span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-gray-800 text-sm">
                  {uploading ? 'Загружаем…' : diplomaUrl ? 'Диплом загружен' : 'Загрузить фото диплома'}
                </span>
                <span className="block text-xs text-gray-500 truncate">
                  {diplomaLabel || 'Снимите на телефон или выберите файл (JPG, PNG, PDF)'}
                </span>
              </span>
              {diplomaUrl && <span className="text-xs font-bold text-blue-600 shrink-0">Заменить</span>}
            </button>
            <p className="mt-1.5 text-xs text-gray-400">Нужен один раз, чтобы подтвердить, что вы врач. На сайте не показывается.</p>
            {fieldError('documentImageUrl')}
          </div>
        )}

        {error && !error.field && (
          <p role="alert" className="bg-red-50 text-red-700 p-3 rounded-xl text-sm font-medium border border-red-100">{error.text}</p>
        )}

        <div className="space-y-2">
          <button
            type="submit" disabled={saving || uploading}
            className="w-full min-h-[48px] rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm transition disabled:opacity-60"
          >
            {saving ? 'Отправляем…' : 'Отправить статью на проверку'}
          </button>
          {onLater && (
            <button type="button" onClick={onLater} className="w-full min-h-[44px] rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition">
              Позже — оставить в черновиках
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
