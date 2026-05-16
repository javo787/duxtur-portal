'use client';

import { useState, useEffect, useRef } from 'react';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';
import { updateDoctorProfile } from '@/app/actions/update-profile';

interface OnboardingWizardProps {
  doctor: any;
  lang: string;
  onComplete: () => void;
}

export default function OnboardingWizard({ doctor, lang, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const [data, setData] = useState({
    image: doctor.image,
    specialty: doctor.specialty?.ru || '',
    experience: doctor.experience || 0,
    languages: doctor.languages || [],
    city: doctor.city || '',
    consultationTypes: doctor.consultationTypes || ['in_person'],
    priceMin: doctor.priceRange?.min || 0,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const done = localStorage.getItem('duxtur_onboarding_done');
    if (!done && doctor.profileViews === 0 && (!doctor.bio?.ru || doctor.bio === '')) {
      setIsVisible(true);
    }
  }, [doctor]);

  const handleComplete = async () => {
    setIsSaving(true);
    await updateDoctorProfile({
      ...data,
      priceRange: { min: data.priceMin, max: data.priceMin, currency: 'TJS' }
    } as any);
    setIsSaving(false);
    localStorage.setItem('duxtur_onboarding_done', 'true');
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('duxtur_onboarding_done', 'true');
    setIsVisible(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const res = await uploadImageToCloudinary(formData);
    if (res.success) setData({ ...data, image: res.url });
    setIsUploading(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-8 text-white">
          <h2 className="text-2xl font-black mb-2">Добро пожаловать!</h2>
          <p className="text-blue-100 text-sm">Заполните профиль за 3 простых шага, чтобы начать принимать пациентов.</p>
          <div className="flex gap-2 mt-6">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-white' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6 text-center">
              <h3 className="text-lg font-bold text-slate-900">Шаг 1: Фото профиля</h3>
              <div className="relative w-32 h-32 mx-auto">
                <img
                  src={data.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                  className="w-32 h-32 rounded-3xl object-cover border-4 border-slate-50"
                  alt="Avatar"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 rounded-3xl flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl shadow-lg hover:bg-blue-700 transition"
                >
                  📸
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
              </div>
              <p className="text-sm text-slate-500">Хорошее фото повышает доверие пациентов на 40%</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Шаг 2: Специализация и опыт</h3>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Специализация (ru)</label>
                <input
                  className="w-full p-3 bg-slate-50 border rounded-xl"
                  placeholder="Например: Кардиолог"
                  value={data.specialty}
                  onChange={e => setData({...data, specialty: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Стаж (лет)</label>
                  <input
                    type="number"
                    className="w-full p-3 bg-slate-50 border rounded-xl"
                    value={data.experience}
                    onChange={e => setData({...data, experience: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Языки</label>
                  <input
                    className="w-full p-3 bg-slate-50 border rounded-xl"
                    placeholder="RU, TJ, UZ"
                    value={data.languages.join(', ')}
                    onChange={e => setData({...data, languages: e.target.value.split(',').map(s => s.trim())})}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Шаг 3: Город и условия</h3>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Город</label>
                <input
                  className="w-full p-3 bg-slate-50 border rounded-xl"
                  placeholder="Например: Душанбе"
                  value={data.city}
                  onChange={e => setData({...data, city: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Цена консультации (от TJS)</label>
                <input
                  type="number"
                  className="w-full p-3 bg-slate-50 border rounded-xl"
                  value={data.priceMin}
                  onChange={e => setData({...data, priceMin: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
          )}

          <div className="mt-10 flex items-center justify-between gap-4">
            <button
              onClick={handleSkip}
              className="text-sm font-bold text-slate-400 hover:text-slate-600 transition"
            >
              Пропустить
            </button>
            <div className="flex gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  Назад
                </button>
              )}
              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
                >
                  Далее
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={isSaving}
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isSaving ? 'Сохранение...' : 'Завершить'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
