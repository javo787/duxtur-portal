'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';

const LocationPickerModal = dynamic(
  () => import('@/app/[lang]/admin/_components/_profile-sections/LocationPickerModal'),
  { ssr: false }
);

const Spinner = ({ dark = false }: { dark?: boolean }) => (
  <svg className={`animate-spin h-5 w-5 ${dark ? 'text-slate-900' : 'text-white'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const CLINIC_TYPES = [
  { id: 'clinic', label: 'Клиника' },
  { id: 'hospital', label: 'Больница' },
  { id: 'diagnostic_center', label: 'Диагностический центр' },
  { id: 'dental_clinic', label: 'Стоматология' },
  { id: 'eye_clinic', label: 'Офтальмология' },
  { id: 'maternity', label: 'Родильный дом' },
  { id: 'rehabilitation', label: 'Реабилитация' },
  { id: 'polyclinic', label: 'Поликлиника' },
];

const CITIES = ['Душанбе', 'Худжанд', 'Куляб', 'Бохтар', 'Ташкент', 'Самарканд', 'Алматы', 'Бишкек', 'Астана', 'Другой'];

export default function RegisterClinicForm({ lang }: { lang: string }) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'clinic',
    phone: '',
    email: '',
    ownerName: '',
    city: 'Душанбе',
    address: '',
    coordinates: { lat: 0, lng: 0 },
    logo: '',
    licenseDocument: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.licenseDocument) {
      alert('Заполните обязательные поля и загрузите лицензию!');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/clinic/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) setIsSuccess(true);
      else alert(data.error || 'Ошибка при регистрации');
    } catch (e) {
      alert('Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl" />
        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl shadow-slate-200/50 max-w-md w-full text-center border border-white relative z-10">
          <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <svg className="w-10 h-10 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-3">Заявка принята!</h1>
          <p className="text-slate-500 leading-relaxed mb-8">
            Спасибо за регистрацию клиники. Мы проверим документы в течение <strong className="text-slate-900">24 часов</strong> и пришлем уведомление на email.
          </p>
          <Link href={`/${lang}`}
            className="block w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black active:scale-95 transition text-center shadow-lg shadow-slate-200">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-50/50 rounded-full blur-3xl" />

      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-8">
          <Link href={`/${lang}`} className="text-3xl font-extrabold text-slate-900">
            duxtur<span className="text-blue-600">.org</span>
          </Link>
          <p className="text-slate-500 text-sm mt-2 font-medium">Регистрация клиники</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-white">
          <div className="h-[3px] brand-line" />

          {/* Progress Bar */}
          <div className="flex h-1.5 bg-slate-100">
            <div className={`transition-all duration-500 bg-blue-600 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`} />
          </div>

          <div className="p-8">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Основная информация</h2>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Название клиники (RU)</label>
                  <input type="text" value={formData.name} onChange={e => handleInputChange('name', e.target.value)}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition" placeholder="МедЦентр" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Тип клиники</label>
                  <select value={formData.type} onChange={e => handleInputChange('type', e.target.value)}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition appearance-none">
                    {CLINIC_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Телефон</label>
                    <input type="tel" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)}
                      className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition" placeholder="+992..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                    <input type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)}
                      className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition" placeholder="clinic@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ФИО владельца</label>
                  <input type="text" value={formData.ownerName} onChange={e => handleInputChange('ownerName', e.target.value)}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition" placeholder="Иванов Иван" />
                </div>
                <button onClick={() => setStep(2)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-extrabold text-lg hover:bg-black active:scale-95 transition mt-4">
                  Далее →
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Адрес и локация</h2>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Город</label>
                  <select value={formData.city} onChange={e => handleInputChange('city', e.target.value)}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition appearance-none">
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Точный адрес</label>
                  <input type="text" value={formData.address} onChange={e => handleInputChange('address', e.target.value)}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition" placeholder="ул. Главная, 10" />
                </div>
                <div>
                  <button onClick={() => setIsMapOpen(true)} className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-600 font-bold hover:border-blue-500 hover:text-blue-600 transition">
                    📍 {formData.coordinates.lat ? 'Координаты выбраны' : 'Выбрать на карте'}
                  </button>
                  {formData.coordinates.lat !== 0 && (
                    <p className="text-[10px] text-center mt-2 text-slate-400 font-bold uppercase">
                      {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <button onClick={() => setStep(1)} className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition">← Назад</button>
                  <button onClick={() => setStep(3)} className="py-4 bg-slate-900 text-white rounded-2xl font-extrabold hover:bg-black transition">Далее →</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Документы и пароль</h2>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Логотип</label>
                    <div onClick={() => !isUploading && logoInputRef.current?.click()}
                      className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition relative overflow-hidden">
                      {formData.logo ? (
                        <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">📸</span>
                      )}
                      {isUploading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><Spinner dark /></div>}
                    </div>
                    <input type="file" className="hidden" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Лицензия (обязательно)</label>
                    <div onClick={() => !isUploadingLicense && licenseInputRef.current?.click()}
                      className={`aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition relative overflow-hidden ${formData.licenseDocument ? 'bg-green-50 border-green-300' : 'bg-slate-50 border-slate-200 hover:border-blue-500'}`}>
                      {formData.licenseDocument ? (
                        <div className="text-center p-2">
                          <span className="text-2xl">📄</span>
                          <p className="text-[8px] font-bold text-green-600 mt-1 uppercase">Загружено</p>
                        </div>
                      ) : (
                        <span className="text-2xl">📁</span>
                      )}
                      {isUploadingLicense && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><Spinner dark /></div>}
                    </div>
                    <input type="file" className="hidden" ref={licenseInputRef} onChange={handleLicenseUpload} accept="image/*,application/pdf" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Пароль</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={e => handleInputChange('password', e.target.value)}
                      className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition" placeholder="Минимум 8 символов" />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
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

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <button onClick={() => setStep(2)} className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition">← Назад</button>
                  <button onClick={handleSubmit} disabled={isLoading || isUploading || isUploadingLicense || !formData.licenseDocument}
                    className="py-4 bg-blue-600 text-white rounded-2xl font-extrabold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                    {isLoading ? <Spinner /> : 'Подать заявку →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            © {new Date().getFullYear()} Duxtur.org — Медицинский портал Центральной Азии
          </p>
        </div>
      </div>

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
