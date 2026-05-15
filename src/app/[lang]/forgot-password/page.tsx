'use client';
import { useState, use } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setSent(true);
      } else {
        setError(data.error || 'Ошибка');
      }
    } catch (err) {
      setLoading(false);
      setError('Произошла ошибка. Попробуйте позже.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Декоративные круги */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-50/50 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Логотип */}
        <div className="text-center mb-8">
          <Link href={`/${lang}`} className="text-3xl font-extrabold text-slate-900">
            duxtur<span className="text-blue-600">.org</span>
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-white">
          {/* Accent line */}
          <div className="h-[3px] brand-line" />

          <div className="p-8 text-center">
            {sent ? (
              <div className="py-4">
                <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Проверьте почту</h1>
                <p className="text-slate-500 text-sm mb-8">
                  Мы отправили ссылку для восстановления пароля на <strong>{email}</strong>. Ссылка действительна 1 час.
                </p>
                <Link href={`/${lang}/login`} className="block w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition shadow-lg">
                  Вернуться ко входу
                </Link>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Восстановление пароля</h1>
                <p className="text-slate-500 text-sm mb-8">Введите email, указанный при регистрации, и мы отправим вам ссылку для сброса пароля.</p>

                <form onSubmit={handleSubmit} className="space-y-5 text-left">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="doctor@example.com"
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
                    ) : 'Отправить ссылку →'}
                  </button>

                  <p className="text-center text-sm text-slate-500 pt-2 font-medium">
                    Вспомнили пароль?{' '}
                    <Link href={`/${lang}/login`} className="text-blue-600 font-bold hover:underline">
                      Войти
                    </Link>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
