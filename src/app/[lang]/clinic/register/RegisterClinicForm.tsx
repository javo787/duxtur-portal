'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';
import { ALLOWED_CITIES, CLINIC_TYPES } from '@/lib/clinic-constants';

const LocationPickerModal = dynamic(
  () => import('@/app/[lang]/admin/_components/_profile-sections/LocationPickerModal'),
  { ssr: false }
);

// ─── Spinner ────────────────────────────────────────────────────────────────
const Spinner = ({ dark = false }: { dark?: boolean }) => (
  <svg
    className={`animate-spin h-5 w-5 ${dark ? 'text-slate-900' : 'text-white'}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// ─── Step definitions ────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, icon: '🏥', title: 'О клинике',        subtitle: 'Название, тип, контакты' },
  { num: 2, icon: '📍', title: 'Адрес',             subtitle: 'Где вас найдут пациенты' },
  { num: 3, icon: '🔐', title: 'Верификация',        subtitle: 'Лицензия и доступ' },
];

// ─── Animated check icon ─────────────────────────────────────────────────────
function AnimatedCheck() {
  return (
    <svg viewBox="0 0 52 52" className="w-full h-full" fill="none">
      <circle cx="26" cy="26" r="25" stroke="#22c55e" strokeWidth="2" className="opacity-20" />
      <path
        d="M14 26l9 9 16-16"
        stroke="#22c55e"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 50,
          strokeDashoffset: 0,
          animation: 'dashIn 0.6s ease forwards',
        }}
      />
    </svg>
  );
}

// ─── Live preview card ───────────────────────────────────────────────────────
function ClinicPreviewCard({
  name, type, city, logo,
}: { name: string; type: string; city: string; logo: string }) {
  const typeObj = CLINIC_TYPES.find((t) => t.id === type);
  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xl"
      style={{ animation: 'fadeUp 0.4s ease forwards' }}
    >
      {/* mini cover */}
      <div className="h-16 bg-gradient-to-r from-blue-600 to-blue-400" />

      {/* logo */}
      <div className="absolute top-8 left-4 w-14 h-14 rounded-xl border-2 border-white bg-white shadow-md overflow-hidden flex items-center justify-center text-2xl">
        {logo ? (
          <img src={logo} alt="" className="w-full h-full object-cover" />
        ) : (
          <span>{typeObj?.emoji || '🏥'}</span>
        )}
      </div>

      {/* verified badge */}
      <div className="absolute top-2 right-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full flex items-center gap-1">
        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Верифицировано
      </div>

      <div className="pt-6 pb-4 px-4">
        <p className="font-black text-slate-900 text-sm truncate">{name || 'Название клиники'}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
            {typeObj?.label || 'Клиника'}
          </span>
          {city && (
            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
              📍 {city}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center gap-1 text-amber-400 text-xs">
          {'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}
          <span className="text-slate-400 text-[10px] ml-1 font-bold">Новая клиника</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RegisterClinicForm({ lang }: { lang: string }) {
  const logoInputRef    = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep]                       = useState<1 | 2 | 3>(1);
  const [isSuccess, setIsSuccess]             = useState(false);
  const [isLoading, setIsLoading]             = useState(false);
  const [isUploading, setIsUploading]         = useState(false);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [showPassword, setShowPassword]       = useState(false);
  const [isMapOpen, setIsMapOpen]             = useState(false);

  // Animate step changes
  const [stepVisible, setStepVisible]         = useState(true);

  const [formData, setFormData] = useState({
    name:       '',
    type:       'clinic',
    phone:      '',
    email:      '',
    ownerName:  '',
    city:       'Душанбе',
    address:    '',
    coordinates: { lat: 0, lng: 0 },
    logo:        '',
    licenseDocument: '',
    password:   '',
  });

  const handleInputChange = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const goToStep = (n: 1 | 2 | 3) => {
    setStepVisible(false);
    setTimeout(() => { setStep(n); setStepVisible(true); }, 220);
  };

  // ─── Logo upload ───────────────────────────────────────────────────────────
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadImageToCloudinary(fd);
    setIsUploading(false);
    if (res.success) handleInputChange('logo', res.url);
    else alert('Ошибка загрузки логотипа');
  };

  // ─── License upload ────────────────────────────────────────────────────────
  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLicense(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadImageToCloudinary(fd);
    setIsUploadingLicense(false);
    if (res.success) handleInputChange('licenseDocument', res.url);
    else alert('Ошибка загрузки лицензии');
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.licenseDocument) {
      alert('Заполните обязательные поля и загрузите лицензию!');
      return;
    }
    setIsLoading(true);
    try {
      const res  = await fetch('/api/clinic/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) setIsSuccess(true);
      else alert(data.error || 'Ошибка при регистрации');
    } catch {
      alert('Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Success screen ────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <style>{`
          @keyframes scaleIn  { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }
          @keyframes dashIn   { from{stroke-dashoffset:50} to{stroke-dashoffset:0} }
          @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          @keyframes ringPing { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.8);opacity:0} }
          .step-anim { animation: fadeUp 0.35s ease forwards; }
          .step-anim-hidden { opacity:0; }
        `}</style>

        <div className="w-full max-w-md space-y-6" style={{ animation: 'fadeUp 0.5s ease forwards' }}>
          {/* Badge animation */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-green-100"
                   style={{ animation: 'ringPing 1.5s ease infinite' }} />
              <div className="relative w-20 h-20 rounded-full bg-green-50 border-4 border-green-200 flex items-center justify-center"
                   style={{ animation: 'scaleIn 0.5s cubic-bezier(.175,.885,.32,1.275) forwards' }}>
                <AnimatedCheck />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black text-slate-900">Заявка принята!</h1>
              <p className="text-slate-500 text-sm mt-1 font-medium">Добро пожаловать в сеть Duxtur.org</p>
            </div>
          </div>

          {/* Verification preview */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Ваш будущий профиль
            </p>
            <ClinicPreviewCard
              name={formData.name}
              type={formData.type}
              city={formData.city}
              logo={formData.logo}
            />
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Что дальше</p>
            {[
              { icon: '🔍', title: 'Проверка документов', desc: 'В течение 24 часов', delay: '0s', done: false },
              { icon: '📧', title: 'Email с результатом', desc: 'На указанный адрес',  delay: '.1s', done: false },
              { icon: '✅', title: 'Профиль активирован', desc: 'Синий бейдж верификации', delay: '.2s', done: false },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4"
                   style={{ animation: `fadeUp 0.4s ease ${item.delay} both` }}>
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-lg shrink-0">{item.icon}</div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{item.title}</p>
                  <p className="text-xs text-slate-400 font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href={`/${lang}`}
            className="block w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-center hover:bg-black active:scale-95 transition"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  // ─── Progress fraction ─────────────────────────────────────────────────────
  const pct = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start py-8 px-4">
      {/* Global keyframes */}
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dashIn  { from{stroke-dashoffset:50} to{stroke-dashoffset:0} }
        @keyframes scaleIn { from{transform:scale(0.8);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes slideIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .field-appear { animation: slideIn 0.3s ease forwards; }
      `}</style>

      <div className="w-full max-w-lg space-y-5">

        {/* ── Logo ── */}
        <div className="flex items-center justify-between">
          <Link href={`/${lang}`} className="text-2xl font-black text-slate-900">
            duxtur<span className="text-blue-600">.org</span>
          </Link>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Для клиник
          </span>
        </div>

        {/* ── Hero tagline (replaces fake stats) ── */}
        <div
          className="rounded-3xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1d4ed8 100%)',
            animation: 'scaleIn 0.5s cubic-bezier(.175,.885,.32,1.275) forwards',
          }}
        >
          {/* subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg,transparent,transparent 24px,rgba(255,255,255,1) 24px,rgba(255,255,255,1) 25px),' +
                'repeating-linear-gradient(90deg,transparent,transparent 24px,rgba(255,255,255,1) 24px,rgba(255,255,255,1) 25px)',
            }}
          />

          <div className="relative px-6 py-6">
            {/* verified badge pill */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ animation: 'ringPing 2s ease infinite' }} />
              <span className="text-white text-[10px] font-black uppercase tracking-widest">
                Верифицированная платформа
              </span>
            </div>

            <h1 className="text-white font-black text-xl leading-tight mb-1">
              Ваша клиника —<br />
              <span className="text-blue-300">на карте всей Центральной Азии</span>
            </h1>
            <p className="text-white/60 text-xs font-medium leading-relaxed mb-5">
              Портал, где пациенты ищут проверенных врачей и клиники. Синий бейдж верификации — знак доверия.
            </p>

            {/* 3 benefits */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: '🔵', label: 'Бейдж верификации' },
                { icon: '🌐', label: '5 языков региона' },
                { icon: '🔍', label: 'Индекс Google' },
              ].map((b, i) => (
                <div key={i}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl px-3 py-3 text-center border border-white/10"
                  style={{ animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}
                >
                  <div className="text-lg mb-1">{b.icon}</div>
                  <div className="text-white/80 text-[9px] font-black uppercase tracking-wide leading-tight">{b.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Stepper ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center gap-1 flex-1">
                <div className={`flex items-center gap-2 flex-1 ${i > 0 ? 'justify-center' : ''}`}>
                  {/* connector left */}
                  {i > 0 && (
                    <div className="flex-1 h-px mx-1" style={{
                      background: step > i ? 'linear-gradient(90deg,#2563eb,#2563eb)' : '#e2e8f0',
                      transition: 'background 0.4s ease',
                    }} />
                  )}
                  {/* circle */}
                  <div
                    className="w-9 h-9 rounded-2xl flex items-center justify-center text-base shrink-0 transition-all duration-400"
                    style={{
                      background: step > s.num
                        ? '#dcfce7'
                        : step === s.num
                        ? 'linear-gradient(135deg,#2563eb,#1d4ed8)'
                        : '#f1f5f9',
                      boxShadow: step === s.num ? '0 4px 14px rgba(37,99,235,0.35)' : 'none',
                      transform: step === s.num ? 'scale(1.08)' : 'scale(1)',
                    }}
                  >
                    {step > s.num ? (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className={step === s.num ? 'text-white' : 'text-slate-400'}>{s.icon}</span>
                    )}
                  </div>
                  {/* connector right (last item has none) */}
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px mx-1" style={{
                      background: step > s.num ? 'linear-gradient(90deg,#2563eb,#2563eb)' : '#e2e8f0',
                      transition: 'background 0.4s ease',
                    }} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* current step label */}
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Шаг {step} из {STEPS.length}
            </p>
            <p className="font-black text-slate-800 text-sm">{STEPS[step - 1].title}</p>
          </div>
        </div>

        {/* ── Form card ── */}
        <div
          className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
          style={{
            opacity: stepVisible ? 1 : 0,
            transform: stepVisible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.22s ease, transform 0.22s ease',
          }}
        >
          {/* accent bar */}
          <div className="h-[3px] brand-line" />

          <div className="p-6 space-y-5">

            {/* ══ STEP 1 ══ */}
            {step === 1 && (
              <>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Название клиники
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="МедЦентр Здоровье"
                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition text-slate-800 placeholder-slate-300 font-medium"
                  />
                </div>

                {/* Type selector — pill grid */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Тип учреждения
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CLINIC_TYPES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleInputChange('type', t.id)}
                        className="flex items-center gap-2.5 p-3 rounded-2xl border-2 text-left transition-all duration-200"
                        style={{
                          borderColor:   formData.type === t.id ? '#2563eb' : '#f1f5f9',
                          background:    formData.type === t.id ? '#eff6ff' : '#f8fafc',
                          transform:     formData.type === t.id ? 'scale(1.02)' : 'scale(1)',
                        }}
                      >
                        <span className="text-xl leading-none">{t.emoji}</span>
                        <span
                          className="text-xs font-black leading-tight"
                          style={{ color: formData.type === t.id ? '#1d4ed8' : '#64748b' }}
                        >
                          {t.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone + Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Телефон</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+992..."
                      className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition font-medium text-slate-800 placeholder-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="clinic@example.com"
                      className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition font-medium text-slate-800 placeholder-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ФИО руководителя</label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => handleInputChange('ownerName', e.target.value)}
                    placeholder="Иванов Иван Иванович"
                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition font-medium text-slate-800 placeholder-slate-300"
                  />
                </div>

                <button
                  onClick={() => goToStep(2)}
                  className="w-full py-4 rounded-2xl font-black text-white text-base active:scale-95 transition-all"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 8px 24px rgba(37,99,235,0.3)' }}
                >
                  Далее → Адрес
                </button>
              </>
            )}

            {/* ══ STEP 2 ══ */}
            {step === 2 && (
              <>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Город</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALLOWED_CITIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleInputChange('city', c)}
                        className="p-3 rounded-2xl border-2 text-left text-sm font-black transition-all duration-200"
                        style={{
                          borderColor: formData.city === c ? '#2563eb' : '#f1f5f9',
                          background:  formData.city === c ? '#eff6ff' : '#f8fafc',
                          color:       formData.city === c ? '#1d4ed8' : '#64748b',
                          transform:   formData.city === c ? 'scale(1.02)' : 'scale(1)',
                        }}
                      >
                        {formData.city === c && '✓ '}{c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Точный адрес</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="ул. Главная, 10"
                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition font-medium text-slate-800 placeholder-slate-300"
                  />
                </div>

                {/* Map picker */}
                <button
                  type="button"
                  onClick={() => setIsMapOpen(true)}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200"
                  style={{
                    borderColor: formData.coordinates.lat ? '#22c55e' : '#e2e8f0',
                    borderStyle: 'dashed',
                    background:  formData.coordinates.lat ? '#f0fdf4' : '#f8fafc',
                    color:       formData.coordinates.lat ? '#15803d' : '#94a3b8',
                  }}
                >
                  <span className="text-xl">{formData.coordinates.lat ? '✅' : '🗺️'}</span>
                  <span className="font-black text-sm">
                    {formData.coordinates.lat
                      ? `${formData.coordinates.lat.toFixed(4)}, ${formData.coordinates.lng.toFixed(4)}`
                      : 'Отметить на карте (необязательно)'}
                  </span>
                </button>

                {/* Live preview */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Так будет выглядеть ваша клиника в каталоге
                  </p>
                  <ClinicPreviewCard
                    name={formData.name}
                    type={formData.type}
                    city={formData.city}
                    logo={formData.logo}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => goToStep(1)}
                    className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 active:scale-95 transition"
                  >
                    ← Назад
                  </button>
                  <button
                    onClick={() => goToStep(3)}
                    className="py-4 rounded-2xl font-black text-white active:scale-95 transition"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 8px 24px rgba(37,99,235,0.3)' }}
                  >
                    Далее →
                  </button>
                </div>
              </>
            )}

            {/* ══ STEP 3 ══ */}
            {step === 3 && (
              <>
                {/* What they get */}
                <div
                  className="rounded-2xl p-4 border border-blue-100"
                  style={{ background: 'linear-gradient(135deg,#eff6ff,#f0f9ff)' }}
                >
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">
                    После верификации вы получите
                  </p>
                  {[
                    '🔵 Синий бейдж «Верифицировано»',
                    '🔍 Индексация в Google и поиск по 5 языкам',
                    '👨‍⚕️ Возможность привязать врачей клиники',
                    '📊 Статистика просмотров профиля',
                  ].map((item, i) => (
                    <p key={i} className="text-xs font-bold text-blue-700 mb-1.5">{item}</p>
                  ))}
                </div>

                {/* Logo + License upload */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Logo */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Логотип
                    </label>
                    <div
                      onClick={() => !isUploading && logoInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden"
                      style={{
                        borderColor: formData.logo ? '#22c55e' : '#cbd5e1',
                        background:  formData.logo ? '#f0fdf4' : '#f8fafc',
                      }}
                    >
                      {formData.logo ? (
                        <img src={formData.logo} alt="" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <>
                          <span className="text-2xl mb-1">📸</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase">Логотип</span>
                        </>
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <Spinner dark />
                        </div>
                      )}
                    </div>
                    <input ref={logoInputRef} type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                  </div>

                  {/* License */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Лицензия <span className="text-red-400">*</span>
                    </label>
                    <div
                      onClick={() => !isUploadingLicense && licenseInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden"
                      style={{
                        borderColor: formData.licenseDocument ? '#22c55e' : '#f97316',
                        background:  formData.licenseDocument ? '#f0fdf4' : '#fff7ed',
                      }}
                    >
                      {formData.licenseDocument ? (
                        <div className="text-center p-2">
                          <span className="text-2xl">✅</span>
                          <p className="text-[9px] font-black text-green-600 mt-1 uppercase">Загружено</p>
                        </div>
                      ) : (
                        <>
                          <span className="text-2xl mb-1">📄</span>
                          <span className="text-[9px] font-black text-orange-400 uppercase text-center leading-tight px-2">Ваш пропуск к верификации</span>
                        </>
                      )}
                      {isUploadingLicense && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <Spinner dark />
                        </div>
                      )}
                    </div>
                    <input ref={licenseInputRef} type="file" className="hidden" onChange={handleLicenseUpload} accept="image/*,application/pdf" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Пароль для входа
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Минимум 8 символов"
                      className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition font-medium text-slate-800 placeholder-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => goToStep(2)}
                    className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 active:scale-95 transition"
                  >
                    ← Назад
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || isUploading || isUploadingLicense || !formData.licenseDocument}
                    className="py-4 rounded-2xl font-black text-white active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{
                      background:  'linear-gradient(135deg,#2563eb,#1d4ed8)',
                      boxShadow:   (!isLoading && formData.licenseDocument) ? '0 8px 24px rgba(37,99,235,0.35)' : 'none',
                    }}
                  >
                    {isLoading ? <><Spinner /> Отправка…</> : 'Подать заявку →'}
                  </button>
                </div>

                <p className="text-center text-[10px] text-slate-400 font-medium">
                  Нажимая «Подать заявку», вы соглашаетесь с{' '}
                  <Link href={`/${lang}/editorial`} className="underline hover:text-blue-600 transition">
                    редакционной политикой
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">
          <Link href={`/${lang}/about`} className="hover:text-blue-600 transition">О портале</Link>
          <span>·</span>
          <a href="https://t.me/duxturcom" target="_blank" className="hover:text-blue-600 transition">Telegram</a>
          <span>·</span>
          <Link href={`/${lang}/editorial`} className="hover:text-blue-600 transition">Редполитика</Link>
        </div>
      </div>

      {/* ── Map modal ── */}
      {isMapOpen && (
        <LocationPickerModal
          onCancel={() => setIsMapOpen(false)}
          onConfirm={(lat: number, lng: number) => {
            handleInputChange('coordinates', { lat, lng });
            setIsMapOpen(false);
          }}
          initialLat={formData.coordinates.lat || 38.5358}
          initialLng={formData.coordinates.lng || 68.7791}
        />
      )}
    </div>
  );
}
