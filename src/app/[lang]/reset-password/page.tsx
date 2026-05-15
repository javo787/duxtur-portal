'use client';
import { useState, use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm({ lang }: { lang: string }) {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (password.length < 8) {
      setError('Пароль должен быть не менее 8 символов');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Ошибка');
      }
    } catch {
      setLoading(false);
      setError('Произошла ошибка. Попробуйте позже.');
    }
  };

  if (!token) {
    return (
      <div className="text-center p-8">
        <h1 className="text-xl font-bold text-red-600 mb-4">Ошибка ссылки</h1>
        <p className="text-slate-500 mb-6">Токен сброса отсутствует или недействителен.</p>
        <Link href={`/${lang}/forgot-password`} className="text-blue-600 font-bold hover:underline">
          Запросить новую ссылку
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center p-8">
        <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Пароль изменен!</h1>
        <p className="text-slate-500 text-sm mb-8">Теперь вы можете войти в свой аккаунт с новым паролем.</p>
        <Link href={`/${lang}/login`} className="block w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition shadow-lg">
          Войти в кабинет
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Новый пароль</label>
        <div className="relative">
          <input
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
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Подтвердите пароль</label>
        <input
          type={showPassword ? 'text' : 'password'}
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition text-slate-800 placeholder-slate-300"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-2">
          <span className="text-lg shrink-0">⚠️</span>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-extrabold text-base hover:bg-blue-700 active:scale-95 transition shadow-lg shadow-blue-200 disabled:opacity-60 flex justify-center items-center gap-2"
      >
        {loading ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : 'Сбросить пароль →'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Декоративные круги */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-50/50 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href={`/${lang}`} className="text-3xl font-extrabold text-slate-900">
            duxtur<span className="text-blue-600">.org</span>
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-white">
          <div className="h-[3px] brand-line" />
          <div className="p-8">
            <h1 className="text-2xl font-extrabold text-slate-900 text-center mb-6">Сброс пароля</h1>
            <Suspense fallback={<div className="text-center p-4">Загрузка...</div>}>
              <ResetPasswordForm lang={lang} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
