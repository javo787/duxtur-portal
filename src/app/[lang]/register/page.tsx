'use client';

import { useState, use, useRef } from 'react';
import { registerDoctor } from '@/app/actions/register';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';
import Link from 'next/link';

const Spinner = ({ dark = false }: { dark?: boolean }) => (
  <svg className={`animate-spin h-5 w-5 ${dark ? 'text-slate-900' : 'text-white'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default function RegisterPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [diplomaUrl, setDiplomaUrl] = useState('');
  const [diplomaPreview, setDiplomaPreview] = useState('');
  const [step, setStep] = useState(1); // 1 = форма, 2 = успех

  const handleDiplomaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Показываем превью сразу
    const reader = new FileReader();
    reader.onload = (ev) => setDiplomaPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Загружаем в Cloudinary
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const result = await uploadImageToCloudinary(formData);
    setIsUploading(false);

    if (result.success) {
      setDiplomaUrl(result.url || '');
    } else {
      alert('Ошибка загрузки: ' + result.error);
      setDiplomaPreview('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!diplomaUrl) {
      alert('Пожалуйста, загрузите фото диплома');
      return;
    }
    setIsLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set('documentImageUrl', diplomaUrl);
    const result = await registerDoctor(formData);
    setIsLoading(false);
    if (result.success) setIsSuccess(true);
    else alert(result.error);
  };

  // УСПЕХ
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Заявка принята!</h1>
          <p className="text-gray-500 leading-relaxed mb-8">
            Спасибо за регистрацию. Мы проверим ваш диплом в течение <strong className="text-gray-900">24 часов</strong> и уведомим вас.
          </p>
          <div className="bg-blue-50 rounded-2xl p-4 mb-8 text-left space-y-2">
            <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3">Что дальше?</p>
            <div className="flex items-center gap-3 text-sm text-blue-800">
              <span className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold shrink-0">1</span>
              Администрация проверит ваш диплом
            </div>
            <div className="flex items-center gap-3 text-sm text-blue-800">
              <span className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold shrink-0">2</span>
              Вы получите уведомление об одобрении
            </div>
            <div className="flex items-center gap-3 text-sm text-blue-800">
              <span className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold shrink-0">3</span>
              Войдите и начните писать статьи
            </div>
          </div>
          <Link href={`/${lang}`}
            className="block w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition text-center">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-xl">

        {/* Логотип */}
        <div className="text-center mb-8">
          <Link href={`/${lang}`} className="text-3xl font-extrabold text-white">
            duxtur<span className="text-blue-400">.com</span>
          </Link>
          <p className="text-blue-200 text-sm mt-2">Платформа для врачей-авторов</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Шапка формы */}
          <div className="bg-gradient-to-r from-slate-800 to-blue-900 px-8 py-6">
            <h2 className="text-2xl font-extrabold text-white">Стать автором</h2>
            <p className="text-blue-200 text-sm mt-1">Делитесь знаниями с пациентами Центральной Азии</p>
            <div className="flex gap-4 mt-4">
              {['Бесплатно', 'AI-помощник', '5 языков'].map((item) => (
                <span key={item} className="flex items-center gap-1 text-xs text-green-300 font-bold">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">

            {/* ФИО */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                ФИО врача
              </label>
              <input name="name" type="text" required
                placeholder="Иванов Иван Иванович"
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition text-gray-800 placeholder-gray-300" />
            </div>

            {/* Специальность + Телефон */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Специальность
                </label>
                <input name="specialty" type="text" required
                  placeholder="Кардиолог"
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition text-gray-800 placeholder-gray-300" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Телефон
                </label>
                <input name="phone" type="tel" required
                  placeholder="+992 XXX XXX"
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition text-gray-800 placeholder-gray-300" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Email (логин)
              </label>
              <input name="email" type="email" required
                placeholder="doctor@example.com"
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition text-gray-800 placeholder-gray-300" />
            </div>

            {/* Пароль */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Пароль
              </label>
              <input name="password" type="password" required
                placeholder="Минимум 8 символов"
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition text-gray-800 placeholder-gray-300" />
            </div>

            {/* ДИПЛОМ */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Фото диплома / удостоверения
              </label>

              {/* Превью или зона загрузки */}
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`relative w-full rounded-2xl overflow-hidden border-2 transition cursor-pointer ${
                  diplomaPreview
                    ? 'border-green-300 bg-green-50'
                    : 'border-dashed border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-400'
                }`}
              >
                {diplomaPreview ? (
                  /* Превью загруженного фото */
                  <div className="relative">
                    <img src={diplomaPreview} alt="Диплом" className="w-full h-52 object-cover" />
                    {/* Оверлей при загрузке */}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-3">
                        <Spinner dark />
                        <p className="font-bold text-gray-700 text-sm">Загрузка в облако...</p>
                      </div>
                    )}
                    {/* Успех */}
                    {!isUploading && diplomaUrl && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1 shadow-lg">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Загружено ✓
                      </div>
                    )}
                    {/* Кнопка замены */}
                    {!isUploading && (
                      <div className="absolute bottom-3 left-3">
                        <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full font-bold">
                          Нажмите для замены
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Зона до загрузки */
                  <div className="p-8 text-center">
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Spinner dark />
                        <p className="font-bold text-gray-600">Загрузка...</p>
                      </div>
                    ) : (
                      <>
                        <div className="text-4xl mb-3">📄</div>
                        <p className="font-extrabold text-blue-700 mb-1">Загрузить фото диплома</p>
                        <p className="text-xs text-blue-400">JPG, PNG, HEIC — до 10MB</p>
                        <p className="text-xs text-blue-300 mt-1">Обязательно для верификации</p>
                      </>
                    )}
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleDiplomaChange}
              />
            </div>

            {/* Кнопка */}
            <button
              type="submit"
              disabled={isLoading || isUploading || !diplomaUrl}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-extrabold text-lg hover:bg-black transition shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3"
            >
              {isLoading
                ? <><Spinner /> Отправка заявки...</>
                : isUploading
                ? <><Spinner /> Загрузка фото...</>
                : !diplomaUrl
                ? '📄 Сначала загрузите диплом'
                : 'Подать заявку →'
              }
            </button>

            <p className="text-center text-sm text-gray-400">
              Уже есть аккаунт?{' '}
              <Link href={`/${lang}/login`} className="text-blue-600 font-bold hover:underline">
                Войти
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
