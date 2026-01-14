'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { authenticate } from '@/app/actions/login';
import { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg disabled:opacity-70 flex justify-center items-center gap-2"
    >
      {pending ? 'Вход...' : 'Войти в кабинет'}
    </button>
  );
}

export default function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const [errorMessage, dispatch] = useFormState(authenticate, undefined);
  const router = useRouter();

  // Если успех, редиректим вручную (чтобы избежать ошибок гидратации)
  if (errorMessage === 'success') {
    router.push(`/${lang}/admin/write`);
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
           <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
           <p className="text-gray-500 font-bold">Вход выполнен! Перенаправление...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden p-8 md:p-12">
        
        <div className="text-center mb-10">
          <div className="inline-block p-3 rounded-full bg-blue-50 text-blue-600 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Вход для Врачей</h1>
          <p className="text-slate-500 text-sm mt-2">MedPoint Professional Portal</p>
        </div>

        <form action={dispatch} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
            <input name="email" type="email" required placeholder="doctor@medpoint.com" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition" />
          </div>

          <div>
             <div className="flex justify-between mb-1">
                <label className="block text-xs font-bold text-gray-500 uppercase">Пароль</label>
             </div>
             <input name="password" type="password" required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition" />
          </div>
          
          {/* Чекбокс "Запомнить меня" - визуал, т.к. NextAuth и так запоминает */}
          <div className="flex items-center">
             <input type="checkbox" id="remember" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" defaultChecked />
             <label htmlFor="remember" className="ml-2 text-sm text-gray-600">Запомнить меня</label>
          </div>

          {errorMessage && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 flex items-start">
               <span className="mr-2">⚠️</span> {errorMessage}
            </div>
          )}

          <LoginButton />
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
           <p className="text-sm text-gray-500">
             Нет аккаунта? <Link href={`/${lang}/register`} className="text-blue-600 font-bold hover:underline">Подать заявку</Link>
           </p>
        </div>

      </div>
    </div>
  );
}
