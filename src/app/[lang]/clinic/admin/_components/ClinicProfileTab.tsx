'use client';

import { useState, useMemo } from 'react';
import { useT } from '@/i18n';
import { Field, SectionHeader, Spinner } from '@/app/[lang]/admin/_components/_profile-sections/_shared';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';
import { translateFieldAction } from '@/app/actions/clinic';
import { getOptimizedCloudinaryUrl } from '@/lib/utils';
import { CATEGORIES } from '@/lib/doctor-constants';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const LocationPickerModal = dynamic(
  () => import('@/app/[lang]/admin/_components/_profile-sections/LocationPickerModal'),
  { ssr: false }
);

const Schedule = dynamic(
  () => import('@/app/[lang]/admin/_components/_profile-sections/Schedule'),
  { ssr: false }
);

const LANGUAGES = [
  { id: 'ru', label: '🇷🇺 RU' },
  { id: 'uz', label: '🇺🇿 UZ' },
  { id: 'tg', label: '🇹🇯 TJ' },
  { id: 'kk', label: '🇰🇿 KK' },
  { id: 'ky', label: '🇰🇬 KY' },
];

export default function ClinicProfileTab({ lang, clinic }: { lang: string, clinic: any }) {
  const { t } = useT(lang);
  const [profile, setProfile] = useState(clinic);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState('ru');
  const [translating, setTranslating] = useState(false);
  const [translationWarning, setTranslationWarning] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/clinic/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        alert('Saved successfully');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAutoTranslate = async () => {
    if (!profile.description?.ru) return;
    setTranslating(true);
    setTranslationWarning(null);
    const res = await translateFieldAction(profile.description.ru);
    if (res.success && res.translations) {
      setProfile({
        ...profile,
        description: res.translations
      });
      if (res.translations.didFallback) {
        setTranslationWarning(res.warning || 'Translation service unavailable');
      }
    }
    setTranslating(false);
  };

  const completionScore = useMemo(() => {
    let score = 0;
    if (profile.logo) score += 15;
    if (profile.coverImage) score += 10;
    if (profile.name?.ru) score += 15;
    if (profile.description?.ru) score += 15;
    if (profile.phone) score += 10;
    if (profile.address) score += 10;
    if (profile.city) score += 10;
    if (profile.specialties?.length > 0) score += 15;
    return score;
  }, [profile]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(field);
    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadImageToCloudinary(fd);
    setUploading(null);
    if (res.success) {
      setProfile({ ...profile, [field]: res.url });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      {/* Completion Banner */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm overflow-hidden relative">
         <div className="flex items-center justify-between mb-4">
           <h3 className="font-black text-slate-900">{t('common.completion')}: {completionScore}%</h3>
           <Link
             href={`/${lang}/clinic/${profile.slug}`}
             target="_blank"
             className="text-xs font-bold text-blue-600 hover:underline"
           >
             {t('clinic.viewPublicProfile')} ↗
           </Link>
         </div>
         <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-1000"
              style={{ width: `${completionScore}%` }}
            />
         </div>
      </div>

      {/* Images Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
           <SectionHeader title={t('clinic.uploadLogo')} />
           <div className="relative h-40 bg-slate-100 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center group">
             {profile.logo ? <img src={getOptimizedCloudinaryUrl(profile.logo, { width: 400, height: 400, crop: 'fill' })} alt="Logo" className="w-full h-full object-cover" /> : uploading === 'logo' ? <Spinner /> : <span className="text-3xl">📸</span>}
             <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleUpload(e, 'logo')} />
           </div>
        </div>
        <div className="space-y-2">
           <SectionHeader title={t('clinic.uploadCover')} />
           <div className="relative h-40 bg-slate-100 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center group">
             {profile.coverImage ? <img src={getOptimizedCloudinaryUrl(profile.coverImage, { width: 800, height: 400, crop: 'fill' })} alt="Cover" className="w-full h-full object-cover" /> : uploading === 'coverImage' ? <Spinner /> : <span className="text-3xl">🖼️</span>}
             <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleUpload(e, 'coverImage')} />
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <SectionHeader title={t('clinic.overview')} />
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
             {LANGUAGES.map(l => (
               <button
                 key={l.id}
                 onClick={() => setActiveLangTab(l.id)}
                 className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                   activeLangTab === l.id ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                 }`}
               >
                 {l.label}
               </button>
             ))}
          </div>
        </div>

        <Field
          label={`${t('clinic.clinicName')} (${activeLangTab.toUpperCase()})`}
          value={profile.name[activeLangTab] || ''}
          onChange={v => setProfile({ ...profile, name: { ...profile.name, [activeLangTab]: v } })}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
               {t('doctor.bio')} ({activeLangTab.toUpperCase()})
            </label>
            {activeLangTab === 'ru' && (
              <button
                onClick={handleAutoTranslate}
                disabled={translating || !profile.description?.ru}
                className="text-[10px] font-black text-blue-600 uppercase tracking-wider hover:underline disabled:opacity-50"
              >
                {translating ? t('common.translating') : t('common.translateToAll')}
              </button>
            )}
          </div>
          <textarea
            value={profile.description[activeLangTab] || ''}
            onChange={e => setProfile({ ...profile, description: { ...profile.description, [activeLangTab]: e.target.value } })}
            rows={5}
            className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:border-blue-500 transition text-sm leading-relaxed"
          />
          {translationWarning && activeLangTab !== 'ru' && (
            <p className="text-[10px] text-amber-600 font-bold px-1">
              ⚠️ {translationWarning}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Field label={t('auth.registerPhone')} value={profile.phone} onChange={v => setProfile({ ...profile, phone: v })} />
           <Field label="Email" value={profile.email} onChange={v => setProfile({ ...profile, email: v })} />
        </div>
      </div>

      {/* Specialties */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
        <SectionHeader title={t('clinic.specialties')} />
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORIES).map(([key, cfg]) => {
            const isSelected = profile.specialties?.includes(key);
            return (
              <button
                key={key}
                onClick={() => {
                  const current = profile.specialties || [];
                  const next = isSelected ? current.filter((k: string) => k !== key) : [...current, key];
                  setProfile({ ...profile, specialties: next });
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                }`}
              >
                {cfg.icon} {(cfg.labels as any)[lang] || cfg.labels.ru}
              </button>
            );
          })}
        </div>
      </div>

      <Schedule
        profile={{ schedule: profile.workingHours }}
        setProfile={(p) => setProfile({ ...profile, workingHours: p.schedule })}
      />

      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
        <SectionHeader title={t('clinic.address')} />
        <div className="grid grid-cols-2 gap-4">
           <Field label={t('doctors.allCities')} value={profile.city} onChange={v => setProfile({ ...profile, city: v })} />
           <Field label={t('clinic.address')} value={profile.address} onChange={v => setProfile({ ...profile, address: v })} />
        </div>
        <button onClick={() => setShowMapPicker(true)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition text-slate-800">
          📍 {t('doctors.onMap')}
        </button>
      </div>

      {/* Gallery Section */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
        <SectionHeader title={t('clinic.gallery')} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {profile.photos?.map((photo: string, index: number) => (
            <div key={index} className="relative aspect-square bg-slate-100 rounded-3xl overflow-hidden group">
              <img src={getOptimizedCloudinaryUrl(photo, { width: 400, height: 400, crop: 'fill' })} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
              <button
                onClick={() => {
                  const next = [...profile.photos];
                  next.splice(index, 1);
                  setProfile({ ...profile, photos: next });
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="relative aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-slate-100 transition-colors cursor-pointer group">
            {uploading === 'gallery' ? (
              <Spinner />
            ) : (
              <>
                <span className="text-3xl group-hover:scale-110 transition-transform">📸</span>
                <span className="text-[10px] font-black uppercase text-slate-400">{t('common.upload')}</span>
              </>
            )}
            <input
              type="file"
              multiple
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={async (e) => {
                const files = e.target.files;
                if (!files) return;
                setUploading('gallery');
                try {
                  const uploadPromises = Array.from(files).map(async (file) => {
                    const fd = new FormData();
                    fd.append('file', file);
                    const res = await uploadImageToCloudinary(fd);
                    return res.success ? res.url : null;
                  });
                  const results = await Promise.all(uploadPromises);
                  const successfulUploads = results.filter((url): url is string => !!url);
                  setProfile({
                    ...profile,
                    photos: [...(profile.photos || []), ...successfulUploads]
                  });
                } finally {
                  setUploading(null);
                }
              }}
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition flex items-center justify-center gap-3"
      >
        {saving ? <Spinner /> : t('common.save')}
      </button>

      {showMapPicker && (
        <LocationPickerModal
          initialLat={profile.coordinates?.lat || 41.2995}
          initialLng={profile.coordinates?.lng || 69.2401}
          onConfirm={(lat, lng) => {
            setProfile({ ...profile, coordinates: { lat, lng, type: 'Point', coordinates: [lng, lat] } });
            setShowMapPicker(false);
          }}
          onCancel={() => setShowMapPicker(false)}
        />
      )}
    </div>
  );
}
