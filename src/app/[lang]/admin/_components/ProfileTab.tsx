'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';
import { updateDoctorProfile } from '@/app/actions/update-profile';

function Field({ label, value, onChange, placeholder, type = 'text', hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none transition text-gray-700 placeholder-gray-300" />
      {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
    </div>
  );
}

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export function ProfileTab({ lang }: { lang: string }) {
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
    if (result.success) setProfile((p: any) => ({ ...p, image: result.url }));
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
        <Spinner />
        <p className="font-medium">Загрузка профиля...</p>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="text-center py-20 text-gray-400">
      <p className="text-lg font-bold">Профиль не найден</p>
    </div>
  );

  const bioValue = typeof profile.bio === 'string' ? profile.bio : (profile.bio?.ru || '');

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-6">👤 Мой профиль</h2>

        {/* АВАТАР */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
          <div className="relative">
            <img
              src={profile.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
              alt="Аватар"
              className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-100 shadow-sm"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <button onClick={() => avatarInputRef.current?.click()}
              className="px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-sm transition border border-blue-200">
              📷 Изменить фото
            </button>
            <p className="text-xs text-gray-400 mt-2">JPG, PNG до 5MB. Используется на публичной странице.</p>
            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </div>
        </div>

        {/* ОСНОВНЫЕ ПОЛЯ */}
        <div className="space-y-8">

          {/* Блок 1: Личные данные */}
          <section>
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-4 h-px bg-gray-200 block" /> Личные данные
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Полное имя" value={profile.name || ''} onChange={(v) => setProfile((p: any) => ({ ...p, name: v }))} placeholder="Dr. Иванов Иван Иванович" />
              <Field label="Телефон" value={profile.phone || ''} onChange={(v) => setProfile((p: any) => ({ ...p, phone: v }))} placeholder="+992 XXX XXX XXX" hint="Не отображается на сайте, только для администрации" />
            </div>
          </section>

          {/* Блок 2: Специализация */}
          <section>
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-4 h-px bg-gray-200 block" /> Специализация
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Специализация (RU)" value={profile.specialty?.ru || ''} onChange={(v) => setProfile((p: any) => ({ ...p, specialty: { ...p.specialty, ru: v } }))} placeholder="Кардиолог" />
              <Field label="Специализация (UZ)" value={profile.specialty?.uz || ''} onChange={(v) => setProfile((p: any) => ({ ...p, specialty: { ...p.specialty, uz: v } }))} placeholder="Kardiolog" />
              <Field label="Стаж (лет)" value={profile.experience?.toString() || '0'} onChange={(v) => setProfile((p: any) => ({ ...p, experience: parseInt(v) || 0 }))} placeholder="10" type="number" />
              <Field label="Языки (через запятую)" value={profile.languages?.join(', ') || ''} onChange={(v) => setProfile((p: any) => ({ ...p, languages: v.split(',').map((l: string) => l.trim()).filter(Boolean) }))} placeholder="Русский, Тоҷикӣ, English" />
            </div>
          </section>

          {/* Блок 3: E-E-A-T поля — новые */}
          <section>
            <h3 className="text-xs font-extrabold text-blue-500 uppercase tracking-widest mb-1 flex items-center gap-2">
              <span className="w-4 h-px bg-blue-200 block" /> Для публичного профиля
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Эти поля отображаются на вашей странице врача и повышают доверие пациентов.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field
                label="🏛️ Место работы"
                value={typeof profile.workplace === 'string' ? profile.workplace : (profile.workplace?.ru || '')}
                onChange={(v) => setProfile((p: any) => ({ ...p, workplace: v }))}
                placeholder="Городская больница №1, Душанбе"
                hint="Название клиники или больницы где вы работаете"
              />
              <Field
                label="🎓 Образование"
                value={typeof profile.education === 'string' ? profile.education : (profile.education?.ru || '')}
                onChange={(v) => setProfile((p: any) => ({ ...p, education: v }))}
                placeholder="ТГМУ, специальность «Лечебное дело», 2010"
                hint="ВУЗ, специальность и год окончания"
              />
              <div className="md:col-span-2">
                <Field
                  label="🔗 Внешние профили (sameAs)"
                  value={profile.sameAs?.join(', ') || ''}
                  onChange={(v) => setProfile((p: any) => ({ ...p, sameAs: v.split(',').map((l: string) => l.trim()).filter(Boolean) }))}
                  placeholder="https://linkedin.com/in/..., https://researchgate.net/profile/..."
                  hint="Ссылки через запятую — LinkedIn, ResearchGate, профиль в медреестре. Повышают доверие Google."
                />
              </div>
            </div>

            {/* Биография */}
            <div className="mt-5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                📝 Биография
              </label>
              <textarea
                value={bioValue}
                onChange={(e) => setProfile((p: any) => ({ ...p, bio: e.target.value }))}
                rows={4}
                placeholder="Например: Кардиолог с 12-летним стажем. Специализируюсь на лечении аритмий и сердечной недостаточности. Работаю в Республиканском кардиологическом центре Душанбе."
                className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none transition resize-none text-gray-700 placeholder-gray-300"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Отображается на вашей публичной странице. Рекомендуется 2–3 предложения о вашем опыте и специализации.
              </p>
            </div>
          </section>
        </div>

        {/* Блок 4: Социальные сети и график работы */}
<section>
  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
    <span className="w-4 h-px bg-gray-200 block" /> Соцсети и часы приёма
  </h3>
  <p className="text-xs text-gray-400 mb-4">
    Эти данные появятся на вашей визитке и помогут пациентам быстрее с вами связаться.
  </p>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
    <Field
      label="Instagram (ссылка)"
      value={profile.instagram || ''}
      onChange={(v) => setProfile((p: any) => ({ ...p, instagram: v }))}
      placeholder="https://www.instagram.com/your.profile"
      hint="Полная ссылка на ваш профиль"
    />
    <Field
      label="Telegram (ссылка)"
      value={profile.telegram || ''}
      onChange={(v) => setProfile((p: any) => ({ ...p, telegram: v }))}
      placeholder="https://t.me/yourprofile"
      hint="Полная ссылка (t.me/username)"
    />
    <Field
      label="WhatsApp (ссылка)"
      value={profile.whatsapp || ''}
      onChange={(v) => setProfile((p: any) => ({ ...p, whatsapp: v }))}
      placeholder="https://wa.me/1234567890"
      hint="Ссылка вида https://wa.me/номер"
    />
    <Field
      label="Часы приёма"
      value={profile.workingHours || ''}
      onChange={(v) => setProfile((p: any) => ({ ...p, workingHours: v }))}
      placeholder="Пн–Пт 9:00–16:00"
      hint="Коротко и понятно для пациентов"
    />
  </div>
</section>

    {/* Блок 5: Настройка визитки */}
<section>
  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
    <span className="w-4 h-px bg-gray-200 block" /> Дизайн визитки
  </h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
    <div>
      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
        🎨 Акцентный цвет
      </label>
      <input
        type="color"
        value={profile.accentColor || '#2563eb'}
        onChange={(e) => setProfile((p: any) => ({ ...p, accentColor: e.target.value }))}
        className="w-16 h-10 border-2 border-gray-200 rounded-lg cursor-pointer"
      />
      <p className="text-xs text-gray-400 mt-1.5">Цвет полос и кнопок визитки</p>
    </div>
    <div>
      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
        🌓 Тема визитки
      </label>
      <select
        value={profile.cardTheme || 'dark'}
        onChange={(e) => setProfile((p: any) => ({ ...p, cardTheme: e.target.value }))}
        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none transition text-gray-700"
      >
        <option value="dark">Тёмная (рекомендуется)</option>
        <option value="light">Светлая (экономит чернила)</option>
      </select>
    </div>
  </div>
</section>    

        {/* КНОПКА СОХРАНИТЬ */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-4">
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

      {/* ПУБЛИЧНЫЙ ПРОФИЛЬ */}
      {profile.slug && (
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-blue-900 text-sm">Ваш публичный профиль</p>
            <p className="text-blue-600 text-xs mt-0.5">Duxtur.org/{lang}/doctor/{profile.slug}</p>
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
