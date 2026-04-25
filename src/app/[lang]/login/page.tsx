'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { authenticate } from '@/app/actions/login';
import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 text-white py-4 rounded-2xl font-extrabold text-base hover:bg-blue-700 active:scale-95 transition shadow-lg shadow-blue-200 disabled:opacity-60 flex justify-center items-center gap-2"
    >
      {pending ? (
        <>
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Вход...
        </>
      ) : 'Войти в кабинет →'}
    </button>
  );
}

export default function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const [errorMessage, dispatch] = useFormState(authenticate, undefined);
  const router = useRouter();

  if (errorMessage === 'success') {
    router.push(`/${lang}/admin`);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <div className="text-center text-white">
          <div className="animate-spin h-10 w-10 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="font-bold text-blue-200">Перенаправление...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">

        {/* Логотип */}
        <div className="text-center mb-8">
          <Link href={`/${lang}`} className="text-3xl font-extrabold text-white">
            duxtur<span className="text-blue-400">.com</span>
          </Link>
          <p className="text-blue-300 text-sm mt-2">Портал для врачей-авторов</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Шапка */}
          <div className="bg-gradient-to-r from-slate-800 to-blue-900 px-8 py-6 text-center">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold text-white">Вход в кабинет</h1>
            <p className="text-blue-300 text-sm mt-1">Только для верифицированных врачей</p>
          </div>

          {/* Форма */}
          <form action={dispatch} className="p-8 space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="doctor@example.com"
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition text-gray-800 placeholder-gray-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Пароль</label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition text-gray-800 placeholder-gray-300"
              />
            </div>

            {errorMessage && errorMessage !== 'success' && (
              <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-2">
                <span className="text-lg shrink-0">⚠️</span>
                {errorMessage}
              </div>
            )}

            <LoginButton />

            <p className="text-center text-sm text-gray-400 pt-2">
              Нет аккаунта?{' '}
              <Link href={`/${lang}/register`} className="text-blue-600 font-bold hover:underline">
                Подать заявку
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          © {new Date().getFullYear()} Duxtur.com — Медицинский портал Центральной Азии
        </p>
      </div>
    </div>
  );
}
