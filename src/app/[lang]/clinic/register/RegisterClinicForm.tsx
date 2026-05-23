'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';
import { ALLOWED_CITIES, CLINIC_TYPES } from '@/lib/clinic-constants';
import { getT } from '@/i18n';

const LocationPickerModal = dynamic(
  () => import('@/app/[lang]/admin/_components/_profile-sections/LocationPickerModal'),
  { ssr: false }
);

// ─── Spinner ────────────────────────────────────────────────────────────────
const Spinner = ({ dark = false }: { dark?: boolean }) => (
  <motion.svg
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    className={`h-5 w-5 ${dark ? 'text-slate-900' : 'text-white'}`}
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
  </motion.svg>
);

// ─── Live preview card ───────────────────────────────────────────────────────
function ClinicPreviewCard({
  name, type, city, logo, t
}: { name: string; type: string; city: string; logo: string; t: any }) {
  const typeObj = CLINIC_TYPES.find((t) => t.id === type);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-[32px] overflow-hidden border border-white/40 bg-white/60 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all group hover:shadow-[0_20px_50px_rgba(37,99,235,0.1)]"
    >
      {/* mini cover */}
      <div className="h-20 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600" />

      {/* logo */}
      <motion.div
        layoutId="clinic-logo"
        className="absolute top-10 left-6 w-20 h-20 rounded-[24px] border-4 border-white bg-white shadow-2xl overflow-hidden flex items-center justify-center text-4xl"
      >
        {logo ? (
          <img src={logo} alt="" className="w-full h-full object-cover" />
        ) : (
          <span>{typeObj?.emoji || '🏥'}</span>
        )}
      </motion.div>

      {/* verified badge */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute top-4 right-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-full flex items-center gap-1.5 shadow-xl shadow-blue-500/30"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        {t('common.verified')}
      </motion.div>

      <div className="pt-12 pb-8 px-8">
        <motion.p
          layout
          className="font-black text-slate-900 text-xl truncate leading-tight tracking-tight"
        >
          {name || t('clinic.clinicName')}
        </motion.p>
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <span className="text-[12px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl font-black uppercase tracking-wider">
            {typeObj ? t(`clinic.type_${typeObj.id}`) : t('clinic.type_clinic')}
          </span>
          {city && (
            <span className="text-[12px] text-slate-500 font-bold flex items-center gap-1.5">
              <span className="text-base">📍</span> {city}
            </span>
          )}
        </div>
        <div className="mt-5 flex items-center gap-1.5 text-amber-500">
          {'★★★★★'.split('').map((s, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1 * i, type: "spring" }}
              className="text-lg"
            >
              {s}
            </motion.span>
          ))}
          <span className="text-slate-400 text-[12px] ml-2 font-black uppercase tracking-widest">{t('clinic.newClinic')}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RegisterClinicForm({ lang }: { lang: string }) {
  const t = getT(lang);

  const STEPS = [
    { num: 1, icon: '🏥', title: t('clinic.registerStep1'), subtitle: t('clinic.aboutClinicSub') },
    { num: 2, icon: '📍', title: t('clinic.registerStep2'), subtitle: t('clinic.locationSub') },
    { num: 3, icon: '🔐', title: t('clinic.registerStep3'), subtitle: t('clinic.verificationSub') },
  ];

  const logoInputRef    = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep]                       = useState<1 | 2 | 3>(1);
  const [isSuccess, setIsSuccess]             = useState(false);
  const [isLoading, setIsLoading]             = useState(false);
  const [isUploading, setIsUploading]         = useState(false);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [showPassword, setShowPassword]       = useState(false);
  const [isMapOpen, setIsMapOpen]             = useState(false);
  const [submitError, setSubmitError]         = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name:       '',
    type:       'clinic',
    phone:      '',
    email:      '',
    ownerName:  '',
    city:       ALLOWED_CITIES[0],
    address:    '',
    coordinates: { lat: 0, lng: 0 },
    logo:        '',
    licenseDocument: '',
    password:   '',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (submitError) setSubmitError(null);
  };

  const goToStep = (n: 1 | 2 | 3) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── Logo upload ───────────────────────────────────────────────────────────
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setSubmitError(null);
    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadImageToCloudinary(fd);
    setIsUploading(false);
    if (res.success) handleInputChange('logo', res.url);
    else setSubmitError(t('common.error'));
  };

  // ─── License upload ────────────────────────────────────────────────────────
  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLicense(true);
    setSubmitError(null);
    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadImageToCloudinary(fd);
    setIsUploadingLicense(false);
    if (res.success) handleInputChange('licenseDocument', res.url);
    else setSubmitError(t('common.error'));
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.licenseDocument) {
      setSubmitError(t('auth.uploadFirst'));
      return;
    }
    setIsLoading(true);
    setSubmitError(null);
    try {
      const res  = await fetch('/api/clinic/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) setIsSuccess(true);
      else setSubmitError(data.error || t('common.error'));
    } catch {
      setSubmitError(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Success screen ────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfcf9] px-6 py-12">
        <div className="w-full max-w-lg space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="relative w-24 h-24">
              <motion.div
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-green-200"
              />
              <div className="relative w-24 h-24 rounded-full bg-green-50 border-4 border-green-200 flex items-center justify-center shadow-xl shadow-green-100">
                <motion.svg
                  viewBox="0 0 52 52"
                  className="w-12 h-12 text-green-500"
                  fill="none"
                >
                  <motion.path
                    d="M14 26l9 9 16-16"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </motion.svg>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('clinic.registerSuccess')}</h1>
              <p className="text-slate-500 text-base mt-2 font-medium">{t('clinic.welcome')}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative bg-white rounded-[48px] border border-slate-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] p-8 md:p-10 overflow-hidden"
          >
            {/* Certificate-like decorative elements */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-60" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em]">
                  {t('clinic.futureProfile')}
                </p>
                <div className="flex gap-1">
                  {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-100" />)}
                </div>
              </div>

              <ClinicPreviewCard
                name={formData.name}
                type={formData.type}
                city={formData.city}
                logo={formData.logo}
                t={t}
              />

              <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('clinic.stats')}</p>
                  <div className="flex items-center gap-1.5 text-amber-600 font-black text-xs uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    {t('clinic.pendingInvitation')}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ID</p>
                  <p className="text-xs font-mono font-bold text-slate-400">DXT-{Math.floor(Math.random()*9000)+1000}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="space-y-4">
            {[
              { icon: '🔍', title: t('clinic.docCheck'), desc: t('clinic.within24h') },
              { icon: '📧', title: t('clinic.emailResult'), desc: t('clinic.toEmail') },
              { icon: '✅', title: t('clinic.profileActivated'), desc: t('clinic.blueBadge') },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-5 bg-white/40 p-4 rounded-3xl border border-white/20"
              >
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl shrink-0">{item.icon}</div>
                <div>
                  <p className="font-black text-slate-800 text-sm">{item.title}</p>
                  <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <Link
              href={`/${lang}`}
              className="block w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-center hover:bg-black active:scale-95 transition-all shadow-xl shadow-slate-900/20"
            >
              {t('common.back')}
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfcf9] text-slate-900 font-sans overflow-x-hidden">
      {/* Decorative floating elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-5%] left-[-5%] w-[40%] aspect-square rounded-full bg-blue-100 blur-[100px]"
        />
        <motion.div
          animate={{
            y: [0, 30, 0],
            rotate: [0, -10, 0]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-5%] w-[50%] aspect-square rounded-full bg-amber-100 blur-[120px]"
        />
      </div>

      <div className="relative max-w-[1200px] mx-auto px-4 py-8 md:py-16 grid lg:grid-cols-[1fr_480px] gap-12 items-start">

        {/* Left Column: Hero & Info */}
        <div className="space-y-10 lg:sticky lg:top-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link href={`/${lang}`} className="text-3xl font-black tracking-tight flex items-center gap-1.5">
              duxtur<span className="text-blue-600">.org</span>
            </Link>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-blue-600/5 backdrop-blur-md border border-blue-600/10 rounded-full px-4 py-2"
            >
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-blue-600 text-[11px] font-black uppercase tracking-[0.1em]">
                {t('clinic.verifiedPlatform')}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl font-black leading-[1.1] tracking-tight"
            >
              {t('clinic.heroTitle')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-xl"
            >
              {t('clinic.heroSubtitle')}
            </motion.p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '🔵', label: t('clinic.benefitVerification'), color: 'bg-blue-50 text-blue-700' },
              { icon: '🌐', label: t('clinic.benefitLanguages'), color: 'bg-amber-50 text-amber-700' },
              { icon: '🔍', label: t('clinic.benefitGoogle'), color: 'bg-emerald-50 text-emerald-700' },
            ].map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className={`${b.color} rounded-[32px] p-6 border border-white shadow-xl shadow-black/5 flex flex-col items-center text-center`}
              >
                <div className="text-3xl mb-3">{b.icon}</div>
                <div className="text-[11px] font-black uppercase tracking-wider leading-tight">{b.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Large Live Preview (Desktop) */}
          <div className="hidden lg:block pt-8">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
              {t('clinic.previewTitle')}
            </p>
            <div className="max-w-[400px]">
              <ClinicPreviewCard
                name={formData.name}
                type={formData.type}
                city={formData.city}
                logo={formData.logo}
                t={t}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {/* Main Card */}
          <div className="bg-white rounded-[48px] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
            {/* Header / Stepper */}
            <div className="px-8 pt-10 pb-6 border-b border-slate-50 bg-slate-50/50">
              <div className="flex items-center justify-between mb-8 relative px-4">
                {/* Progress bar background */}
                <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-slate-200 -translate-y-1/2 pointer-events-none" />
                {/* Active progress bar */}
                <motion.div
                  className="absolute top-1/2 left-8 h-0.5 bg-blue-600 -translate-y-1/2 pointer-events-none origin-left"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
                />

                {STEPS.map((s, i) => (
                  <button
                    key={s.num}
                    onClick={() => s.num < step && goToStep(s.num as any)}
                    className="relative z-10"
                  >
                    <motion.div
                      animate={{
                        scale: step === s.num ? 1.2 : 1,
                        backgroundColor: step >= s.num ? '#2563eb' : '#fff',
                        borderColor: step >= s.num ? '#2563eb' : '#e2e8f0',
                      }}
                      className="w-10 h-10 rounded-2xl border-2 flex items-center justify-center text-lg shadow-xl"
                    >
                      {step > s.num ? (
                         <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className={step === s.num ? 'text-white' : 'text-slate-400'}>{s.icon}</span>
                      )}
                    </motion.div>
                  </button>
                ))}
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">
                  {t('common.step')} {step} / {STEPS.length}
                </p>
                <h2 className="text-xl font-black text-slate-900">{STEPS[step - 1].title}</h2>
              </div>
            </div>

            <div className="p-8 md:p-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  {/* ══ STEP 1 ══ */}
                  {step === 1 && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
                          {t('clinic.clinicName')}
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder={t('clinic.clinicNamePlaceholder')}
                          className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[24px] focus:border-blue-600 focus:bg-white outline-none transition-all text-slate-900 placeholder-slate-300 font-bold"
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
                          {t('clinic.institutionType')}
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          {CLINIC_TYPES.map((typeOption) => (
                            <motion.button
                              key={typeOption.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleInputChange('type', typeOption.id)}
                              className={`flex flex-col gap-4 p-6 rounded-[32px] border-2 text-left transition-all duration-300 min-h-[120px] ${
                                formData.type === typeOption.id
                                  ? 'border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-100/50'
                                  : 'border-slate-100 bg-slate-50/50 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
                              }`}
                            >
                              <span className="text-4xl">{typeOption.emoji}</span>
                              <span className={`text-[11px] font-black uppercase leading-tight tracking-wide ${
                                formData.type === typeOption.id ? 'text-blue-700' : 'text-slate-500'
                              }`}>
                                {t(`clinic.type_${typeOption.id}`)}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">{t('auth.registerPhone')}</label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="+992..."
                            className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[24px] focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-slate-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">{t('auth.registerEmail')}</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="mail@clinic.com"
                            className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[24px] focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">{t('clinic.ownerName')}</label>
                        <input
                          type="text"
                          value={formData.ownerName}
                          onChange={(e) => handleInputChange('ownerName', e.target.value)}
                          placeholder={t('clinic.ownerNamePlaceholder')}
                          className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[24px] focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-slate-900"
                        />
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => goToStep(2)}
                        className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-lg transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center gap-3"
                      >
                        {t('clinic.nextAddress')}
                      </motion.button>
                    </>
                  )}

                  {/* ══ STEP 2 ══ */}
                  {step === 2 && (
                    <>
                      <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">{t('doctors.allCities')}</label>
                        <div className="grid grid-cols-2 gap-3">
                          {ALLOWED_CITIES.map((c) => (
                            <button
                              key={c}
                              onClick={() => handleInputChange('city', c)}
                              className={`p-5 rounded-[24px] border-2 text-sm font-black transition-all duration-300 min-h-[64px] ${
                                formData.city === c
                                  ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md shadow-blue-200/50'
                                  : 'border-slate-50 bg-slate-50/50 text-slate-500'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">{t('clinic.exactAddress')}</label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder={t('clinic.addressPlaceholder')}
                          className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[24px] focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-slate-900"
                        />
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsMapOpen(true)}
                        className={`w-full p-8 rounded-[32px] border-2 border-dashed flex items-center justify-center gap-5 transition-all ${
                          formData.coordinates.lat
                            ? 'border-green-200 bg-green-50/50 text-green-700'
                            : 'border-slate-200 bg-slate-50/50 text-slate-400'
                        }`}
                      >
                        <span className="text-4xl">{formData.coordinates.lat ? '📍' : '🗺️'}</span>
                        <div className="text-left">
                          <p className="font-black text-base uppercase tracking-wider leading-tight">
                            {formData.coordinates.lat ? t('doctor.routeBuilt') : t('clinic.markOnMap')}
                          </p>
                          {formData.coordinates.lat && (
                            <p className="text-xs font-bold opacity-70 mt-1">
                              {formData.coordinates.lat.toFixed(4)}, {formData.coordinates.lng.toFixed(4)}
                            </p>
                          )}
                        </div>
                      </motion.button>

                      {/* Mobile Preview (Visible only on mobile/tablet) */}
                      <div className="lg:hidden space-y-4">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
                          {t('clinic.previewTitle')}
                        </p>
                        <ClinicPreviewCard
                          name={formData.name}
                          type={formData.type}
                          city={formData.city}
                          logo={formData.logo}
                          t={t}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <button
                          onClick={() => goToStep(1)}
                          className="py-5 bg-slate-100 text-slate-500 rounded-[24px] font-black hover:bg-slate-200 transition-all"
                        >
                          {t('common.prev')}
                        </button>
                        <button
                          onClick={() => goToStep(3)}
                          className="py-5 bg-blue-600 text-white rounded-[24px] font-black transition-all shadow-xl shadow-blue-600/20"
                        >
                          {t('common.next')}
                        </button>
                      </div>
                    </>
                  )}

                  {/* ══ STEP 3 ══ */}
                  {step === 3 && (
                    <>
                      <div className="p-6 rounded-[32px] bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-2xl shadow-blue-900/20">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-4">
                          {t('clinic.afterVerificationTitle')}
                        </p>
                        <div className="space-y-3">
                          {[
                            t('clinic.afterVerification1'),
                            t('clinic.afterVerification2'),
                            t('clinic.afterVerification3'),
                            t('clinic.afterVerification4'),
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                              <p className="text-xs font-black tracking-tight">{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Logo */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                            {t('clinic.logoLabel')}
                          </label>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => !isUploading && logoInputRef.current?.click()}
                            className="aspect-square rounded-[32px] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group"
                          >
                            {formData.logo ? (
                              <img src={formData.logo} alt="" className="w-full h-full object-cover transition group-hover:scale-110" />
                            ) : (
                              <>
                                <span className="text-4xl mb-2">📷</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase">{t('clinic.uploadLogo')}</span>
                              </>
                            )}
                            {isUploading && (
                              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                <Spinner dark />
                              </div>
                            )}
                          </motion.div>
                          <input ref={logoInputRef} type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                        </div>

                        {/* License */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                            {t('clinic.licenseRequired')} <span className="text-red-500">*</span>
                          </label>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => !isUploadingLicense && licenseInputRef.current?.click()}
                            className={`aspect-square rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer relative overflow-hidden transition-all ${
                              formData.licenseDocument ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'
                            }`}
                          >
                            {formData.licenseDocument ? (
                              <div className="text-center">
                                <span className="text-4xl">📄</span>
                                <p className="text-[10px] font-black text-green-700 mt-2 uppercase tracking-wider">{t('clinic.uploaded')}</p>
                              </div>
                            ) : (
                              <>
                                <span className="text-4xl mb-2">📝</span>
                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider text-center px-4 leading-tight">{t('clinic.licenseHint')}</span>
                              </>
                            )}
                            {isUploadingLicense && (
                              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                <Spinner dark />
                              </div>
                            )}
                          </motion.div>
                          <input ref={licenseInputRef} type="file" className="hidden" onChange={handleLicenseUpload} accept="image/*,application/pdf" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
                          {t('auth.registerPassword')}
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            placeholder={t('auth.passwordPlaceholder')}
                            className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[24px] focus:border-blue-600 focus:bg-white outline-none transition-all font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition"
                          >
                            {showPassword ? (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            ) : (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                            )}
                          </button>
                        </div>
                      </div>

                      {submitError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-5 bg-red-50 border border-red-100 text-red-600 text-xs font-black rounded-[24px]"
                        >
                          {submitError}
                        </motion.div>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <button
                          onClick={() => goToStep(2)}
                          className="py-5 bg-slate-100 text-slate-500 rounded-[24px] font-black hover:bg-slate-200 transition-all"
                        >
                          {t('common.prev')}
                        </button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSubmit}
                          disabled={isLoading || isUploading || isUploadingLicense || !formData.licenseDocument}
                          className="py-5 bg-blue-600 text-white rounded-[24px] font-black transition-all shadow-xl shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                          {isLoading ? <Spinner /> : t('clinic.submitApplication')}
                        </motion.button>
                      </div>

                      <p className="text-center text-[11px] text-slate-400 font-bold leading-relaxed px-4">
                        {t('clinic.agreement')}{' '}
                        <Link href={`/${lang}/editorial`} className="text-blue-600 underline">
                          {t('nav.editorialPolicy')}
                        </Link>
                      </p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Trust badges footer */}
          <div className="flex items-center justify-center gap-6 mt-10">
            <Link href={`/${lang}/about`} className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition">{t('nav.aboutUs')}</Link>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            <a href="https://t.me/duxturcom" target="_blank" className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition">Telegram</a>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            <Link href={`/${lang}/editorial`} className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition">{t('nav.editorialPolicy')}</Link>
          </div>
        </motion.div>

      </div>

      {/* ── Map modal ── */}
      <AnimatePresence>
        {isMapOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6"
          >
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMapOpen(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-4xl h-[80vh] md:h-[600px] bg-white rounded-t-[40px] md:rounded-[40px] shadow-2xl overflow-hidden"
            >
              <LocationPickerModal
                onCancel={() => setIsMapOpen(false)}
                onConfirm={(lat: number, lng: number) => {
                  handleInputChange('coordinates', { lat, lng });
                  setIsMapOpen(false);
                }}
                initialLat={formData.coordinates.lat || 38.5358}
                initialLng={formData.coordinates.lng || 68.7791}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
