'use client';

import { useState, useEffect, use } from 'react';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';

export default function PatientProfilePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/patient/profile')
      .then(r => r.json())
      .then(d => {
        setProfile(d);
        setIsLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    await fetch('/api/patient/profile', {
      method: 'PUT',
      body: JSON.stringify(profile)
    });
    setIsSaving(false);
  };

  if (isLoading) return <div className="py-20 text-center">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12">
      <div className="max-w-3xl mx-auto px-6 space-y-8">
        <h1 className="text-3xl font-black text-slate-900">Мой профиль здоровья</h1>

        <div className="bg-white rounded-3xl border p-8 shadow-sm space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Дата рождения</label>
                 <input
                   type="date"
                   value={profile.dateOfBirth?.split('T')[0] || ''}
                   onChange={e => setProfile({...profile, dateOfBirth: e.target.value})}
                   className="w-full p-3 bg-slate-50 border rounded-xl"
                 />
              </div>
              <div>
                 <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Группа крови</label>
                 <select
                   value={profile.bloodType || ''}
                   onChange={e => setProfile({...profile, bloodType: e.target.value})}
                   className="w-full p-3 bg-slate-50 border rounded-xl"
                 >
                    <option value="">Не выбрано</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b} value={b}>{b}</option>)}
                 </select>
              </div>
           </div>

           <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Аллергии (через запятую)</label>
              <textarea
                value={profile.allergies?.join(', ') || ''}
                onChange={e => setProfile({...profile, allergies: e.target.value.split(',').map((s: string) => s.trim())})}
                className="w-full p-3 bg-slate-50 border rounded-xl"
                placeholder="Пыльца, пенициллин..."
              />
           </div>

           <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Хронические заболевания</label>
              <textarea
                value={profile.chronicConditions?.join(', ') || ''}
                onChange={e => setProfile({...profile, chronicConditions: e.target.value.split(',').map((s: string) => s.trim())})}
                className="w-full p-3 bg-slate-50 border rounded-xl"
                placeholder="Диабет 2 типа, астма..."
              />
           </div>
        </div>

        <div className="sticky bottom-4">
           <button
             onClick={handleSave}
             disabled={isSaving}
             className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 transition"
           >
             {isSaving ? 'Сохранение...' : '💾 Сохранить изменения'}
           </button>
        </div>
      </div>
    </div>
  );
}
