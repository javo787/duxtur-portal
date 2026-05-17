// src/app/[lang]/admin/_components/ProfileTab.tsx

'use client';
import { useState, useEffect } from 'react';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';
import { updateDoctorProfile } from '@/app/actions/update-profile';
import ProfileCompletionBanner from './ProfileCompletionBanner';

import AvatarHero from './_profile-sections/AvatarHero';
import PersonalData from './_profile-sections/PersonalData';
import Specialization from './_profile-sections/Specialization';
import PublicProfile from './_profile-sections/PublicProfile';
import LocationClinic from './_profile-sections/LocationClinic';
import AppointmentsPricing from './_profile-sections/AppointmentsPricing';
import Schedule from './_profile-sections/Schedule';
import SocialsVisitingCard from './_profile-sections/SocialsVisitingCard';
import CardDesign from './_profile-sections/CardDesign';
import SaveBar from './_profile-sections/SaveBar';
import { Spinner, strField } from './_profile-sections/_shared';

export function ProfileTab({ lang }: { lang: string }) {
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

  const handleAvatarChange = async (file: File) => {
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
    setErrorMsg('');
    try {
      const address = `${profile.address}${profile.city ? ', ' + profile.city : ''}`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'Duxtur.org/1.0' },
      });
      const data = await res.json();
      if (data && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setProfile((p: any) => ({
          ...p,
          coordinates: {
            ...p.coordinates,
            lat,
            lng,
            type: 'Point',
            coordinates: [lng, lat],
          },
        }));
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } else {
        setErrorMsg('Address not found, try a more specific address');
        setSaveState('error');
        setTimeout(() => setSaveState('idle'), 5000);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Geocoding service error');
      setSaveState('error');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveState('idle');
    const result = await updateDoctorProfile({
      ...profile,
      bio: typeof profile.bio === 'string' ? profile.bio : strField(profile.bio),
      workplace: typeof profile.workplace === 'string' ? profile.workplace : strField(profile.workplace),
      education: typeof profile.education === 'string' ? profile.education : strField(profile.education),
      specialty: typeof profile.specialty === 'string' ? profile.specialty : strField(profile.specialty),
    });
    setIsSaving(false);
    if (result.success) {
      setSaveState('saved');
      try {
        const fresh = await fetch('/api/doctor/me').then((r) => r.json());
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

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-20">
      <ProfileCompletionBanner doctor={profile} lang={lang} />

      <AvatarHero
        profile={profile}
        setProfile={setProfile}
        lang={lang}
        isUploading={isUploading}
        onAvatarChange={handleAvatarChange}
      />

      <PersonalData profile={profile} setProfile={setProfile} />
      <Specialization profile={profile} setProfile={setProfile} />
      <PublicProfile profile={profile} setProfile={setProfile} />

      <LocationClinic
        profile={profile}
        setProfile={setProfile}
        onGeocode={handleGeocode}
        isGeocoding={isGeocoding}
      />

      <AppointmentsPricing profile={profile} setProfile={setProfile} />
      <Schedule profile={profile} setProfile={setProfile} />
      <SocialsVisitingCard profile={profile} setProfile={setProfile} />
      <CardDesign profile={profile} setProfile={setProfile} />

      <SaveBar
        isSaving={isSaving}
        onSave={handleSave}
        saveState={saveState}
        errorMsg={errorMsg}
      />
    </div>
  );
}
