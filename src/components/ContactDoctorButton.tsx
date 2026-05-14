'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';

interface Props {
  doctor: {
    name: string;
    phone?: string;
    instagram?: string;
    telegram?: string;
    whatsapp?: string;
    workingHours?: string;
  };
  lang: string;
}

const labels: Record<string, Record<string, string>> = {
  btn:       { ru: 'Связаться с врачом', uz: "Shifokor bilan bog'lanish", tg: 'Бо духтур тамос гирифтан', kk: 'Дәрігермен байланысу', ky: 'Дарыгер менен байланышуу' },
  unlock:    { ru: 'Войдите чтобы увидеть контакты', uz: 'Kontaktlarni ko\'rish uchun kiring', tg: 'Барои дидани тамосҳо ворид шавед', kk: 'Байланыстарды көру үшін кіріңіз', ky: 'Байланыштарды көрүү үчүн кириңиз' },
  google:    { ru: 'Войти через Google', uz: 'Google orqali kirish', tg: 'Тавассути Google ворид шавед', kk: 'Google арқылы кіру', ky: 'Google аркылуу кирүү' },
  email_ph:  { ru: 'ваш@email.com', uz: 'email@manzil.com', tg: 'email@manzil.com', kk: 'email@manzil.com', ky: 'email@manzil.com' },
  email_btn: { ru: 'Получить ссылку', uz: 'Havola olish', tg: 'Истиноди гирифтан', kk: 'Сілтеме алу', ky: 'Шилтеме алуу' },
  sent:      { ru: 'Проверьте почту!', uz: 'Pochtani tekshiring!', tg: 'Поштаро тафтиш кунед!', kk: 'Поштаңызды тексеріңіз!', ky: 'Почтаңызды текшериңиз!' },
  hours:     { ru: 'Часы приёма', uz: 'Qabul vaqti', tg: 'Соатҳои қабул', kk: 'Қабылдау уақыты', ky: 'Кабыл алуу убактысы' },
  write:     { ru: 'Написать', uz: 'Yozish', tg: 'Навиштан', kk: 'Жазу', ky: 'Жазуу' },
  call:      { ru: 'Позвонить', uz: 'Qo\'ng\'iroq qilish', tg: 'Занг задан', kk: 'Қоңырау шалу', ky: 'Чалуу' },
  close:     { ru: 'Закрыть', uz: 'Yopish', tg: 'Бастан', kk: 'Жабу', ky: 'Жабуу' },
  noContact: { ru: 'Врач не добавил контакты', uz: 'Shifokor kontakt qo\'shmagan', tg: 'Духтур тамосҳо илова накардааст', kk: 'Дәрігер байланыс қоспаған', ky: 'Дарыгер байланыш кошкон эмес' },
  or:        { ru: 'или', uz: 'yoki', tg: 'ё', kk: 'немесе', ky: 'же' },
};
const L = (k: string, lang: string) => labels[k]?.[lang] || labels[k]?.ru || '';

// Размытый контакт — placeholder для blur эффекта
function BlurredContact({ icon, color }: { icon: React.ReactNode; color: string }) {
  return (
    <div className={`flex items-center gap-4 p-4 ${color} rounded-2xl`}>
      <div className="w-11 h-11 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="h-2.5 w-16 bg-white/70 rounded-full mb-2" />
        <div className="h-3 w-28 bg-white/50 rounded-full" />
      </div>
    </div>
  );
}

export default function ContactDoctorButton({ doctor, lang }: Props) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState('');

  const isLoggedIn = !!session?.user;
  const hasContacts = doctor.phone || doctor.telegram || doctor.whatsapp || doctor.instagram;

  const handleOpen = () => setOpen(true);

  const handleGoogle = async () => {
    setLoading('google');
    await signIn('google', { callbackUrl: window.location.href });
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading('email');
    await signIn('resend', { email, callbackUrl: window.location.href, redirect: false });
    setEmailSent(true);
    setLoading('');
  };

  const handleTelegram = () => {
    const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'duxturcom_bot';
    window.open(`https://t.me/${bot}?start=login`, '_blank');
  };

  return (
    <>
      {/* Кнопка */}
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-blue-200 active:scale-95 text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" />
        </svg>
        {L('btn', lang)}
      </button>

      {/* Модальное окно */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Шапка */}
            <div className="bg-gradient-to-r from-slate-800 to-blue-900 px-6 py-5">
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />
              <p className="font-extrabold text-white text-base">{doctor.name}</p>
              {doctor.workingHours && (
                <p className="text-blue-200 text-xs mt-1 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {L('hours', lang)}: {doctor.workingHours}
                </p>
              )}
            </div>

            <div className="p-5">

              {/* ══ НЕ АВТОРИЗОВАН — blur + форма входа ══ */}
              {!isLoggedIn && (
                <>
                  {/* Блюр контакты */}
                  {hasContacts && (
                    <div className="relative mb-5">
                      <div className="space-y-2.5 blur-sm pointer-events-none select-none" aria-hidden>
                        {doctor.phone && (
                          <BlurredContact
                            color="bg-blue-50"
                            icon={<svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" /></svg>}
                          />
                        )}
                        {doctor.whatsapp && (
                          <BlurredContact
                            color="bg-green-50"
                            icon={<svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>}
                          />
                        )}
                        {doctor.telegram && (
                          <BlurredContact
                            color="bg-sky-50"
                            icon={<svg className="w-5 h-5 text-sky-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.667l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.892z"/></svg>}
                          />
                        )}
                      </div>
                      {/* Замок поверх */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="bg-white rounded-2xl px-4 py-2.5 shadow-lg border border-gray-100 flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-sm font-bold text-gray-700">{L('unlock', lang)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Форма входа */}
                  {emailSent ? (
                    <div className="text-center py-4">
                      <div className="text-3xl mb-2">📧</div>
                      <p className="font-bold text-gray-900">{L('sent', lang)}</p>
                      <p className="text-xs text-gray-400 mt-1">{email}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Google */}
                      <button
                        onClick={handleGoogle}
                        disabled={!!loading}
                        className="w-full flex items-center gap-3 p-3.5 border-2 border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition font-bold text-gray-700 text-sm disabled:opacity-60"
                      >
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        {loading === 'google' ? 'Подключение...' : L('google', lang)}
                      </button>

                      {/* Telegram */}
                      <button
                        onClick={handleTelegram}
                        disabled={!!loading}
                        className="w-full flex items-center gap-3 p-3.5 bg-[#229ED9] hover:bg-[#1a8bbf] rounded-2xl transition font-bold text-white text-sm disabled:opacity-60"
                      >
                        <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.667l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.892z"/>
                        </svg>
                        Войти через Telegram
                      </button>

                      {/* Разделитель */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-xs text-gray-400">{L('or', lang)} email</span>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>

                      {/* Email */}
                      <form onSubmit={handleEmail} className="flex gap-2">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder={L('email_ph', lang)}
                          className="flex-1 px-3 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-400 focus:bg-white outline-none text-sm text-gray-800 placeholder-gray-300 transition"
                        />
                        <button
                          type="submit"
                          disabled={!!loading || !email}
                          className="px-4 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-sm transition disabled:opacity-50 shrink-0"
                        >
                          {loading === 'email' ? '...' : L('email_btn', lang)}
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}

              {/* ══ АВТОРИЗОВАН — показываем контакты ══ */}
              {isLoggedIn && (
                <>
                  {!hasContacts ? (
                    <p className="text-center text-gray-400 text-sm py-4">{L('noContact', lang)}</p>
                  ) : (
                    <div className="space-y-2.5">
                      {doctor.phone && (
                        
                         <a href={`tel:${doctor.phone}`}
                          className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-2xl transition group"
                        >
                          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 font-medium">{L('call', lang)}</p>
                            <p className="font-bold text-gray-900 truncate">{doctor.phone}</p>
                          </div>
                          <svg className="w-4 h-4 text-blue-300 group-hover:text-blue-500 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      )}

                      {doctor.whatsapp && (
                        
                          href={doctor.whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 rounded-2xl transition group"
                        >
                          <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 font-medium">WhatsApp</p>
                            <p className="font-bold text-gray-900">{L('write', lang)}</p>
                          </div>
                          <svg className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      )}

                      {doctor.telegram && (
                        
                          href={doctor.telegram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 bg-sky-50 hover:bg-sky-100 rounded-2xl transition group"
                        >
                          <div className="w-11 h-11 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-sky-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.667l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.892z"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 font-medium">Telegram</p>
                            <p className="font-bold text-gray-900">{L('write', lang)}</p>
                          </div>
                          <svg className="w-4 h-4 text-gray-300 group-hover:text-sky-400 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      )}

                      {doctor.instagram && (
                        
                          href={doctor.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 bg-pink-50 hover:bg-pink-100 rounded-2xl transition group"
                        >
                          <div className="w-11 h-11 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 font-medium">Instagram</p>
                            <p className="font-bold text-gray-900">{L('write', lang)}</p>
                          </div>
                          <svg className="w-4 h-4 text-gray-300 group-hover:text-pink-400 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}

              <button
                onClick={() => setOpen(false)}
                className="mt-4 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl text-sm transition"
              >
                {L('close', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
