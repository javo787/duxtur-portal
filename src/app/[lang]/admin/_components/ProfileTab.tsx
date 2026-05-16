'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';
import { updateDoctorProfile } from '@/app/actions/update-profile';
import Script from 'next/script';
import ProfileCompletionBanner from './ProfileCompletionBanner';

// Helper to safely extract a string from a multilingual field
function strField(field: any, lang = 'ru'): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field.ru || '';
}

function Field({
  label, value, onChange, placeholder, type = 'text', hint, icon,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string; icon?: string;
}) {
  return (
    <div className="group">
      <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">
        {icon && <span className="text-xs">{icon}</span>}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl
          focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8
          outline-none transition-all duration-200 text-slate-800 text-sm
          placeholder:text-slate-300 group-hover:border-slate-300"
      />
      {hint && <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}

function Textarea({
  label, value, onChange, placeholder, hint, icon, rows = 4,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; icon?: string; rows?: number;
}) {
  return (
    <div className="group">
      <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">
        {icon && <span className="text-xs">{icon}</span>}
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl
          focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8
          outline-none transition-all duration-200 resize-none text-slate-800 text-sm
          placeholder:text-slate-300 group-hover:border-slate-300"
      />
      {hint && <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}

function SectionHeader({ title, subtitle, accent = false }: { title: string; subtitle?: string; accent?: boolean }) {
  return (
    <div className={`pb-4 mb-5 border-b ${accent ? 'border-blue-100' : 'border-slate-100'}`}>
      <h3 className={`text-xs font-black uppercase tracking-[0.18em] ${accent ? 'text-blue-500' : 'text-slate-400'}`}>
        {title}
      </h3>
      {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}

const Spinner = ({ size = 'sm' }: { size?: 'sm' | 'md' }) => (
  <svg
    className={`animate-spin ${size === 'sm' ? 'h-4 w-4' : 'h-6 w-6'} text-current`}
    fill="none" viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export function ProfileTab({ lang }: { lang: string }) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleGeocode = async () => {
    if (!profile.city && !profile.address) return;
    setIsGeocoding(true);
    try {
      const address = `${profile.address}, ${profile.city}`;
      const res = await fetch(`https://geocode-maps.yandex.ru/1.x/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY}&format=json&geocode=${encodeURIComponent(address)}`);
      const data = await res.json();
      const pos = data.response.GeoObjectCollection.featureMember[0]?.GeoObject?.Point?.pos;
      if (pos) {
        const [lng, lat] = pos.split(' ').map(Number);
        setProfile((p: any) => ({
          ...p,
          coordinates: {
            ...p.coordinates,
            lat,
            lng,
            type: 'Point',
            coordinates: [lng, lat]
          }
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveState('idle');
 
    const result = await updateDoctorProfile({
      ...profile,
      bio:       typeof profile.bio       === 'string' ? profile.bio       : strField(profile.bio),
      workplace: typeof profile.workplace === 'string' ? profile.workplace : strField(profile.workplace),
      education: typeof profile.education === 'string' ? profile.education : strField(profile.education),
      specialty: typeof profile.specialty === 'string' ? profile.specialty : strField(profile.specialty),
    });
 
    setIsSaving(false);
 
    if (result.success) {
      setSaveState('saved');
      // Reload fresh data from server so translated fields are visible
      try {
        const fresh = await fetch('/api/doctor/me').then(r => r.json());
        if (fresh) setProfile(fresh);
      } catch {}
      setTimeout(() => setSaveState('idle'), 3500);
    } else {
      setSaveState('error');
      setErrorMsg(result.error || 'Неизвестная ошибка');
      setTimeout(() => setSaveState('idle'), 5000);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-28 gap-4 text-slate-400">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
        <Spinner size="md" />
      </div>
      <p className="text-sm font-medium">Загрузка профиля...</p>
    </div>
  );

  if (!profile) return (
    <div className="flex flex-col items-center justify-center py-28 gap-3 text-slate-400">
      <div className="text-4xl">🩺</div>
      <p className="font-bold text-slate-600">Профиль не найден</p>
      <p className="text-sm">Обратитесь к администратору</p>
    </div>
  );

  // Extract display values safely
  const bioValue = strField(profile.bio);
  const workplaceValue = strField(profile.workplace);
  const educationValue = strField(profile.education);
  const specialtyValue = strField(profile.specialty);

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-20">
      <ProfileCompletionBanner doctor={profile} lang={lang} />

      {/* ── AVATAR + NAME HERO ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-400" />
        <div className="p-7">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <img
                src={profile.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                alt="Аватар"
                className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-sm"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-white/85 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Spinner size="md" />
                </div>
              )}
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-7 h-7 bg-blue-600 hover:bg-blue-700
                  text-white rounded-lg flex items-center justify-center text-sm shadow-md
                  transition-colors duration-150"
                title="Изменить фото"
              >
                ✎
              </button>
              <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
            </div>

            {/* Name / meta */}
            <div className="min-w-0">
              <p className="font-black text-slate-900 text-lg leading-tight truncate">
                {profile.name || 'Имя не указано'}
              </p>
              <p className="text-sm text-slate-500 mt-0.5 truncate">
                {specialtyValue || 'Специализация не указана'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold
                  ${profile.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    profile.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    'bg-red-50 text-red-500 border border-red-100'}`}>
                  {profile.status === 'approved' ? '✓ Верифицирован' :
                    profile.status === 'pending' ? '⏳ На проверке' : '✗ Отклонён'}
                </span>
                {profile.slug && (
                  <Link
                    href={`/${lang}/doctor/${profile.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold
                      bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
                  >
                    ↗ Публичная страница
                  </Link>
                )}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-4">
            JPG или PNG до 5MB. Отображается на вашей публичной странице врача.
          </p>
        </div>
      </div>

      {/* ── ЛИЧНЫЕ ДАННЫЕ ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
        <SectionHeader title="Личные данные" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            icon="👤" label="Полное имя"
            value={profile.name || ''}
            onChange={(v) => setProfile((p: any) => ({ ...p, name: v }))}
            placeholder="Иванов Иван Иванович"
          />
          <Field
            icon="📞" label="Телефон"
            value={profile.phone || ''}
            onChange={(v) => setProfile((p: any) => ({ ...p, phone: v }))}
            placeholder="+992 XXX XXX XXX"
            hint="Не отображается на сайте — только для администрации"
          />
        </div>
      </div>

      {/* ── СПЕЦИАЛИЗАЦИЯ ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
        <SectionHeader
          title="Специализация"
          subtitle="Введите специализацию — остальные языки переведутся автоматически при сохранении"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            icon="🩺" label="Специализация (на русском)"
            value={specialtyValue}
            onChange={(v) => setProfile((p: any) => ({ ...p, specialty: v }))}
            placeholder="Кардиолог"
            hint="Будет автоматически переведена на uz, kk, ky, tg"
          />
          <Field
            icon="⏱" label="Стаж (лет)"
            value={profile.experience?.toString() || '0'}
            onChange={(v) => setProfile((p: any) => ({ ...p, experience: parseInt(v) || 0 }))}
            placeholder="10"
            type="number"
          />
          <div className="md:col-span-2">
            <Field
              icon="🌐" label="Языки консультации (через запятую)"
              value={profile.languages?.join(', ') || ''}
              onChange={(v) => setProfile((p: any) => ({
                ...p, languages: v.split(',').map((l: string) => l.trim()).filter(Boolean),
              }))}
              placeholder="Русский, Тоҷикӣ, O'zbek, English"
            />
          </div>
        </div>
      </div>

      {/* ── ПУБЛИЧНЫЙ ПРОФИЛЬ (E-E-A-T) ── */}
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-7">
        <SectionHeader
          title="Публичный профиль"
          subtitle="Повышает доверие пациентов и рейтинг в поиске (Google E-E-A-T)"
          accent
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            icon="🏛️" label="Место работы"
            value={workplaceValue}
            onChange={(v) => setProfile((p: any) => ({ ...p, workplace: v }))}
            placeholder="Городская больница №1, Душанбе"
            hint="Будет переведено на все языки автоматически"
          />
          <Field
            icon="🎓" label="Образование"
            value={educationValue}
            onChange={(v) => setProfile((p: any) => ({ ...p, education: v }))}
            placeholder="ТГМУ, Лечебное дело, 2010"
            hint="Будет переведено на все языки автоматически"
          />
          <div className="md:col-span-2">
            <Field
              icon="🔗" label="Внешние профили — sameAs (через запятую)"
              value={profile.sameAs?.join(', ') || ''}
              onChange={(v) => setProfile((p: any) => ({
                ...p, sameAs: v.split(',').map((l: string) => l.trim()).filter(Boolean),
              }))}
              placeholder="https://linkedin.com/in/..., https://researchgate.net/profile/..."
              hint="LinkedIn, ResearchGate, медреестр — повышают доверие Google"
            />
          </div>
          <div className="md:col-span-2">
            <Textarea
              icon="📝" label="Биография"
              value={bioValue}
              onChange={(v) => setProfile((p: any) => ({ ...p, bio: v }))}
              placeholder="Кардиолог с 12-летним стажем. Специализируюсь на аритмиях и сердечной недостаточности. Работаю в Республиканском кардиологическом центре Душанбе."
              hint="2–3 предложения об опыте и специализации. Переведётся автоматически."
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* ── ЛОКАЦИЯ И КЛИНИКА ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
        <SectionHeader title="Локация и клиника" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            icon="🏙️" label="Город"
            value={profile.city || ''}
            onChange={(v) => setProfile((p: any) => ({ ...p, city: v }))}
            placeholder="Душанбе"
          />
          <Field
            icon="📍" label="Район"
            value={profile.district || ''}
            onChange={(v) => setProfile((p: any) => ({ ...p, district: v }))}
            placeholder="Исмоили Сомони"
          />
          <Field
            icon="🏠" label="Адрес"
            value={profile.address || ''}
            onChange={(v) => setProfile((p: any) => ({ ...p, address: v }))}
            placeholder="ул. Рудаки, 10"
          />
          <Field
            icon="🏥" label="Название клиники"
            value={profile.clinicName || ''}
            onChange={(v) => setProfile((p: any) => ({ ...p, clinicName: v }))}
            placeholder="Медицинский центр 'Сино'"
          />
          <div className="md:col-span-2">
            <button
              onClick={handleGeocode}
              disabled={isGeocoding}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 transition"
            >
              {isGeocoding ? <Spinner /> : '📍 Найти на карте'}
            </button>
            {profile.coordinates?.lat && (
              <div className="mt-4 rounded-xl overflow-hidden border border-slate-100 h-[200px] relative bg-slate-50">
                 <img
                    src={`https://static-maps.yandex.ru/1.x/?ll=${profile.coordinates.lng},${profile.coordinates.lat}&size=600,200&z=15&l=map&pt=${profile.coordinates.lng},${profile.coordinates.lat},pm2blm&apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY}`}
                    alt="Map Preview"
                    className="w-full h-full object-cover"
                 />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ПРИЕМ И ЦЕНЫ ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
        <SectionHeader title="Прием и цены" />
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">Принимает новых пациентов</p>
              <p className="text-xs text-slate-400">Отображается в поиске</p>
            </div>
            <button
              onClick={() => setProfile((p: any) => ({ ...p, acceptsNewPatients: !p.acceptsNewPatients }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${profile.acceptsNewPatients !== false ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${profile.acceptsNewPatients !== false ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
              Типы консультаций
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'in_person', label: '🏥 Очно', icon: '🏥' },
                { id: 'online', label: '💻 Онлайн', icon: '💻' },
                { id: 'home_visit', label: '🏠 На дому', icon: '🏠' },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    const current = profile.consultationTypes || ['in_person'];
                    const next = current.includes(type.id)
                      ? current.filter((t: string) => t !== type.id)
                      : [...current, type.id];
                    setProfile((p: any) => ({ ...p, consultationTypes: next }));
                  }}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all
                    ${(profile.consultationTypes || ['in_person']).includes(type.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              icon="💰" label="Цена от (TJS)"
              value={profile.priceRange?.min?.toString() || '0'}
              onChange={(v) => setProfile((p: any) => ({ ...p, priceRange: { ...p.priceRange, min: parseInt(v) || 0 } }))}
              type="number"
            />
            <Field
              icon="💰" label="Цена до (TJS)"
              value={profile.priceRange?.max?.toString() || '0'}
              onChange={(v) => setProfile((p: any) => ({ ...p, priceRange: { ...p.priceRange, max: parseInt(v) || 0 } }))}
              type="number"
            />
          </div>
        </div>
      </div>

      {/* ── ГРАФИК РАБОТЫ ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
        <SectionHeader title="График работы" />
        <div className="space-y-4">
          {[
            { id: 'mon', label: 'Понедельник' },
            { id: 'tue', label: 'Вторник' },
            { id: 'wed', label: 'Среда' },
            { id: 'thu', label: 'Четверг' },
            { id: 'fri', label: 'Пятница' },
            { id: 'sat', label: 'Суббота' },
            { id: 'sun', label: 'Воскресенье' },
          ].map((day) => (
            <div key={day.id} className="flex flex-col md:flex-row md:items-center gap-4 py-3 border-b border-slate-50 last:border-0">
              <div className="w-32">
                <p className="text-sm font-bold text-slate-700">{day.label}</p>
                <button
                  onClick={() => setProfile((p: any) => ({
                    ...p,
                    schedule: {
                      ...(p.schedule || {}),
                      [day.id]: { ...(p.schedule?.[day.id] || {}), isWorking: !p.schedule?.[day.id]?.isWorking }
                    }
                  }))}
                  className={`text-[10px] font-bold uppercase mt-1 ${profile.schedule?.[day.id]?.isWorking ? 'text-blue-600' : 'text-slate-400'}`}
                >
                  {profile.schedule?.[day.id]?.isWorking ? '● Работает' : '○ Выходной'}
                </button>
              </div>

              {profile.schedule?.[day.id]?.isWorking && (
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="time"
                    value={profile.schedule?.[day.id]?.open || '09:00'}
                    onChange={(e) => setProfile((p: any) => ({
                      ...p,
                      schedule: {
                        ...(p.schedule || {}),
                        [day.id]: { ...(p.schedule?.[day.id] || {}), open: e.target.value }
                      }
                    }))}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  />
                  <span className="text-slate-400">—</span>
                  <input
                    type="time"
                    value={profile.schedule?.[day.id]?.close || '18:00'}
                    onChange={(e) => setProfile((p: any) => ({
                      ...p,
                      schedule: {
                        ...(p.schedule || {}),
                        [day.id]: { ...(p.schedule?.[day.id] || {}), close: e.target.value }
                      }
                    }))}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  />
                  {day.id === 'mon' && (
                    <button
                      onClick={() => {
                        const mon = profile.schedule?.mon || { open: '09:00', close: '18:00', isWorking: true };
                        const nextSchedule = { ...profile.schedule };
                        ['tue', 'wed', 'thu', 'fri'].forEach(d => {
                          nextSchedule[d] = { ...mon };
                        });
                        setProfile((p: any) => ({ ...p, schedule: nextSchedule }));
                      }}
                      className="ml-auto text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition"
                    >
                      Копировать Пн–Пт
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── СОЦСЕТИ И ЧАСЫ ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
        <SectionHeader
          title="Соцсети и визитка"
          subtitle="Отображаются на визитке и помогают пациентам связаться с вами"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            icon="📸" label="Instagram"
            value={profile.instagram || ''}
            onChange={(v) => setProfile((p: any) => ({ ...p, instagram: v }))}
            placeholder="https://instagram.com/your.profile"
            hint="Полная ссылка на профиль"
          />
          <Field
            icon="✈️" label="Telegram"
            value={profile.telegram || ''}
            onChange={(v) => setProfile((p: any) => ({ ...p, telegram: v }))}
            placeholder="https://t.me/yourprofile"
            hint="t.me/username"
          />
          <Field
            icon="💬" label="WhatsApp"
            value={profile.whatsapp || ''}
            onChange={(v) => setProfile((p: any) => ({ ...p, whatsapp: v }))}
            placeholder="https://wa.me/992XXXXXXXXX"
            hint="wa.me/номер без пробелов"
          />
          <Field
            icon="🕐" label="Часы для визитки"
            value={profile.workingHours || ''}
            onChange={(v) => setProfile((p: any) => ({ ...p, workingHours: v }))}
            placeholder="Пн–Пт, 9:00–16:00"
            hint="Короткая строка для PDF-визитки"
          />
        </div>
      </div>

      {/* ── ДИЗАЙН ВИЗИТКИ ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
        <SectionHeader title="Дизайн визитки" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Color picker */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] block mb-3">
              🎨 Акцентный цвет
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={profile.accentColor || '#2563eb'}
                onChange={(e) => setProfile((p: any) => ({ ...p, accentColor: e.target.value }))}
                className="w-12 h-12 rounded-xl border-2 border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <div>
                <p className="text-sm font-mono text-slate-700">{profile.accentColor || '#2563eb'}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Цвет кнопок и полос визитки</p>
              </div>
            </div>
          </div>

          {/* Theme select */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] block mb-3">
              🌓 Тема визитки
            </label>
            <div className="flex gap-2">
              {(['dark', 'light'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => setProfile((p: any) => ({ ...p, cardTheme: theme }))}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all duration-150
                    ${profile.cardTheme === theme || (!profile.cardTheme && theme === 'dark')
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                  {theme === 'dark' ? '🌑 Тёмная' : '☀️ Светлая'}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {profile.cardTheme === 'light' ? 'Экономит чернила при печати' : 'Рекомендуется для экранов'}
            </p>
          </div>
        </div>
      </div>

      {/* ── SAVE BAR ── */}
      <div className="sticky bottom-4 z-10">
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 px-6 py-4 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2.5 px-7 py-3.5 bg-blue-600 hover:bg-blue-700
              disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl
              font-bold text-sm shadow-md shadow-blue-200 transition-all duration-150 shrink-0"
          >
            {isSaving ? (
  <><Spinner /> <span>Перевод на 5 языков<span className="animate-pulse">...</span></span></>
) : (
  <>💾 Сохранить профиль</>
)}
          </button>

          {saveState === 'saved' && (
            <span className="flex items-center gap-2 text-emerald-600 font-bold text-sm animate-fade-in">
              <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs">✓</span>
              Профиль обновлён
            </span>
          )}
          {saveState === 'error' && (
            <span className="flex items-center gap-2 text-red-500 font-semibold text-sm">
              <span className="text-xs">⚠️</span> {errorMsg}
            </span>
          )}

          <p className="text-[11px] text-slate-400 ml-auto hidden md:block">
            Текстовые поля переводятся автоматически на все языки
          </p>
        </div>
      </div>

    </div>
  );
}
