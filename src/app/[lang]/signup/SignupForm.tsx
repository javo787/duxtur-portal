'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';

export default function SignupForm({ lang }: { lang: string }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState('');

  const handleGoogle = async () => {
    setLoading('google');
    await signIn('google', { callbackUrl: `/${lang}` });
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('email');
    await signIn('resend', { email, callbackUrl: `/${lang}`, redirect: false });
    setSent(true);
    setLoading('');
  };

  const handleTelegram = () => {
    // Telegram Login Widget — открываем бота
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'duxturcom_bot';
    window.open(`https://t.me/${botUsername}?start=login`, '_blank');
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Проверьте почту</h2>
          <p className="text-gray-500 mb-2">Мы отправили ссылку для входа на</p>
          <p className="font-bold text-blue-600 mb-6">{email}</p>
          <p className="text-xs text-gray-400">Ссылка действительна 10 минут</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href={`/${lang}`} className="text-3xl font-extrabold text-white">
            duxtur<span className="text-blue-400">.org</span>
          </Link>
          <p className="text-blue-200 text-sm mt-2">Войдите чтобы связаться с врачами</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-blue-900 px-8 py-6 text-center">
            <h1 className="text-xl font-extrabold text-white">Вход / Регистрация</h1>
            <p className="text-blue-300 text-sm mt-1">Для пациентов — быстро и бесплатно</p>
          </div>

          <div className="p-8 space-y-4">
            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={!!loading}
              className="w-full flex items-center gap-4 p-4 border-2 border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition font-bold text-gray-700 disabled:opacity-60"
            >
              <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loading === 'google' ? 'Подключение...' : 'Войти через Google'}
            </button>

            {/* Telegram */}
            <button
              onClick={handleTelegram}
              disabled={!!loading}
              className="w-full flex items-center gap-4 p-4 bg-[#229ED9] hover:bg-[#1a8bbf] rounded-2xl transition font-bold text-white disabled:opacity-60"
            >
              <svg className="w-6 h-6 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.667l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.892z"/>
              </svg>
              Войти через Telegram
            </button>

            {/* Разделитель */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-medium">или по email</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Email */}
            <form onSubmit={handleEmail} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition text-gray-800 placeholder-gray-300"
              />
              <button
                type="submit"
                disabled={!!loading || !email}
                className="w-full py-4 bg-slate-900 hover:bg-black text-white font-extrabold rounded-2xl transition disabled:opacity-50"
              >
                {loading === 'email' ? 'Отправка...' : '✉️ Получить ссылку на вход'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 pt-2">
              Вы врач?{' '}
              <Link href={`/${lang}/register`} className="text-blue-600 font-bold hover:underline">
                Подать заявку как автор
              </Link>
            </p>
          </div>
        </div>

        {/* Для Telegram Login Widget (альтернатива) */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Безопасно · Без пароля · Бесплатно
        </p>
      </div>
    </div>
  );
}
