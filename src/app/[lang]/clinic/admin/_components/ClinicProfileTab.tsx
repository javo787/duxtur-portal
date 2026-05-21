'use client';

import { useState } from 'react';
import { useT } from '@/i18n';
import { Field, Textarea, SectionHeader, Spinner } from '@/app/[lang]/admin/_components/_profile-sections/_shared';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';
import dynamic from 'next/dynamic';

const LocationPickerModal = dynamic(
  () => import('@/app/[lang]/admin/_components/_profile-sections/LocationPickerModal'),
  { ssr: false }
);

export default function ClinicProfileTab({ lang, clinic }: { lang: string, clinic: any }) {
  const { t } = useT(lang);
  const [profile, setProfile] = useState(clinic);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

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
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Images Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
           <SectionHeader title={t('clinic.uploadLogo')} />
           <div className="relative h-40 bg-slate-100 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center group">
             {profile.logo ? <img src={profile.logo} className="w-full h-full object-cover" /> : uploading === 'logo' ? <Spinner /> : <span className="text-3xl">📸</span>}
             <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleUpload(e, 'logo')} />
           </div>
        </div>
        <div className="space-y-2">
           <SectionHeader title={t('clinic.uploadCover')} />
           <div className="relative h-40 bg-slate-100 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center group">
             {profile.coverImage ? <img src={profile.coverImage} className="w-full h-full object-cover" /> : uploading === 'coverImage' ? <Spinner /> : <span className="text-3xl">🖼️</span>}
             <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleUpload(e, 'coverImage')} />
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
        <SectionHeader title={t('clinic.overview')} />
        <Field label="Название (RU)" value={profile.name.ru} onChange={v => setProfile({ ...profile, name: { ...profile.name, ru: v } })} />
        <Textarea label="Описание (RU)" value={profile.description.ru} onChange={v => setProfile({ ...profile, description: { ...profile.description, ru: v } })} />

        <div className="grid grid-cols-2 gap-4">
           <Field label={t('auth.registerPhone')} value={profile.phone} onChange={v => setProfile({ ...profile, phone: v })} />
           <Field label="Email" value={profile.email} onChange={v => setProfile({ ...profile, email: v })} />
        </div>
      </div>

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
