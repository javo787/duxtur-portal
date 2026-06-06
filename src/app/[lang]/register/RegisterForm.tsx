'use client';

import { useState, useRef } from 'react';
import { registerDoctor } from '@/app/actions/register';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { getT } from '@/i18n';

const Spinner = ({ dark = false }: { dark?: boolean }) => (
  <svg className={`animate-spin h-5 w-5 ${dark ? 'text-slate-900' : 'text-white'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

function PasswordStrength({ password }: { password: string }) {
  const strength =
    password.length === 0 ? 0 :
    password.length < 6 ? 1 :
    password.length < 10 ? 2 :
    /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;

  const labels = ['', 'Слабый', 'Средний', 'Хороший', 'Отличный'];
  const colors = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-green-500'];
  const textColors = ['', 'text-red-600', 'text-amber-600', 'text-blue-600', 'text-green-600'];

  return password.length > 0 ? (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? colors[strength] : 'bg-slate-100'}`} />
        ))}
      </div>
      <p className={`text-[10px] mt-1 font-bold uppercase tracking-wider ${textColors[strength]}`}>
        {labels[strength]}
      </p>
    </div>
  ) : null;
}

export default function RegisterForm({ lang }: { lang: string }) {
  const t = getT(lang);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [diplomaUrl, setDiplomaUrl] = useState('');
  const [diplomaPreview, setDiplomaPreview] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

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
            Спасибо за регистрацию. Мы проверим ваш диплом в течение <strong className="text-slate-900">24 часов</strong> и уведомим вас по email.
          </p>
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 mb-8 text-left space-y-3">
            <p className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Что дальше?</p>
            <div className="flex items-center gap-3 text-sm text-blue-800 font-medium">
              <span className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">1</span>
              Администрация проверит ваш диплом
            </div>
            <div className="flex items-center gap-3 text-sm text-blue-800 font-medium">
              <span className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">2</span>
              Вы получите email с результатом
            </div>
            <div className="flex items-center gap-3 text-sm text-blue-800 font-medium">
              <span className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">3</span>
              Войдите и начните писать статьи
            </div>
          </div>
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
      {/* Декоративные круги */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-50/50 rounded-full blur-3xl" />

      <div className="w-full max-w-xl relative z-10">
        {/* Логотип */}
        <div className="text-center mb-8">
          <Link href={`/${lang}`} className="text-3xl font-extrabold text-slate-900">
            duxtur<span className="text-blue-600">.org</span>
          </Link>
          <p className="text-slate-500 text-sm mt-2 font-medium">Платформа для врачей-авторов</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-white">
          {/* Accent line */}
          <div className="h-[3px] brand-line" />

          {/* Шапка формы */}
          <div className="px-8 py-8 border-b border-slate-50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-1">
              <h2 className="text-2xl font-extrabold text-slate-900">{t('auth.registerTitle')}</h2>
              <Link href={`/${lang}/clinic/register`} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition px-3 py-1.5 bg-blue-50 rounded-lg inline-block w-fit">
                {t('clinic.registerClinic')} →
              </Link>
            </div>
            <p className="text-slate-500 text-sm font-medium">{t('auth.registerSubtitle')}</p>
            <div className="flex flex-wrap gap-3 mt-4">
              {['Бесплатно', 'AI-помощник', '5 языков'].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-[10px] text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="p-8">
            {/* Google OAuth Section */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 mb-8">
              <p className="text-sm font-bold text-blue-900 mb-3">
                Зарегистрированы через Google?
              </p>
              <button
                type="button"
                onClick={() => signIn('google', { callbackUrl: `/${lang}/admin` })}
                className="w-full flex items-center justify-center gap-3 p-3.5 border-2 border-white rounded-2xl bg-white hover:shadow-md font-bold text-slate-700 transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Продолжить через Google
              </button>
              <p className="text-[11px] text-blue-600 mt-3 font-medium text-center">
                После входа загрузите диплом в профиле для верификации
              </p>
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">или регистрация с паролем</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Форма */}
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ФИО */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  ФИО врача
                </label>
                <input name="name" type="text" required
                  placeholder="Иванов Иван Иванович"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition text-slate-800 placeholder-slate-300" />
              </div>

              {/* Специальность + Телефон */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Специальность
                  </label>
                  <input name="specialty" type="text" required
                    placeholder="Кардиолог"
                    className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition text-slate-800 placeholder-slate-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Телефон
                  </label>
                  <input name="phone" type="tel" required
                    placeholder="+992 XXX XXX"
                    className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition text-slate-800 placeholder-slate-300" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Email (логин)
                </label>
                <input name="email" type="email" required
                  placeholder="doctor@example.com"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition text-slate-800 placeholder-slate-300" />
              </div>

              {/* Пароль */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Минимум 8 символов"
                    className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition text-slate-800 placeholder-slate-300"
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
                <PasswordStrength password={password} />
              </div>

              {/* ДИПЛОМ */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Фото диплома / удостоверения
                </label>

                {/* Превью или зона загрузки */}
                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`relative w-full rounded-2xl overflow-hidden border-2 transition cursor-pointer ${
                    diplomaPreview
                      ? 'border-green-300 bg-green-50'
                      : 'border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-blue-400'
                  }`}
                >
                  {diplomaPreview ? (
                    <div className="relative">
                      <img src={diplomaPreview} alt="Диплом" className="w-full h-52 object-cover" />
                      {isUploading && (
                        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-3">
                          <Spinner dark />
                          <p className="font-bold text-slate-700 text-sm">Загрузка в облако...</p>
                        </div>
                      )}
                      {!isUploading && diplomaUrl && (
                        <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-lg uppercase tracking-wider">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Загружено
                        </div>
                      )}
                      {!isUploading && (
                        <div className="absolute bottom-3 left-3">
                          <span className="bg-black/60 text-white text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                            Нажмите для замены
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-10 text-center">
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-3">
                          <Spinner dark />
                          <p className="font-bold text-slate-600">Загрузка...</p>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <p className="font-extrabold text-slate-700 mb-1">Загрузить фото диплома</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">JPG, PNG, HEIC — до 10MB</p>
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
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-extrabold text-lg hover:bg-blue-700 active:scale-95 transition shadow-xl shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3"
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

              <p className="text-center text-sm text-slate-500 font-medium">
                Уже есть аккаунт?{' '}
                <Link href={`/${lang}/login`} className="text-blue-600 font-bold hover:underline">
                  Войти
                </Link>
              </p>
            </form>
          </div>
        </div>

        {/* Ссылки помощи */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <Link href={`/${lang}/about`} className="hover:text-blue-600 transition">О портале</Link>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <Link href={`/${lang}/editorial`} className="hover:text-blue-600 transition">Редполитика</Link>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <a href="https://t.me/duxturcom" target="_blank" className="hover:text-blue-600 transition">Помощь</a>
          </div>
          <p className="text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            © {new Date().getFullYear()} Duxtur.org — Медицинский портал Центральной Азии
          </p>
        </div>
      </div>
    </div>
  );
}
