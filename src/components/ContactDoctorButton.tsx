'use client';

import { useState } from 'react';

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
  btn:     { ru: 'Связаться с врачом', uz: 'Shifokor bilan bog\'lanish', tg: 'Бо духтур тамос гирифтан', kk: 'Дәрігермен байланысу', ky: 'Дарыгер менен байланышуу' },
  phone:   { ru: 'Телефон', uz: 'Telefon', tg: 'Телефон', kk: 'Телефон', ky: 'Телефон' },
  hours:   { ru: 'Часы приёма', uz: 'Qabul vaqti', tg: 'Соатҳои қабул', kk: 'Қабылдау уақыты', ky: 'Кабыл алуу убактысы' },
  write:   { ru: 'Написать', uz: 'Yozish', tg: 'Навиштан', kk: 'Жазу', ky: 'Жазуу' },
  close:   { ru: 'Закрыть', uz: 'Yopish', tg: 'Бастан', kk: 'Жабу', ky: 'Жабуу' },
  noContact: { ru: 'Контакты не указаны', uz: 'Aloqa ma\'lumotlari yo\'q', tg: 'Маълумоти тамос нест', kk: 'Байланыс жоқ', ky: 'Байланыш жок' },
};
const L = (k: string, lang: string) => labels[k]?.[lang] || labels[k]?.ru || '';

export default function ContactDoctorButton({ doctor, lang }: Props) {
  const [open, setOpen] = useState(false);

  const hasContacts = doctor.phone || doctor.telegram || doctor.whatsapp || doctor.instagram;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-blue-200 active:scale-95 text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" />
        </svg>
        {L('btn', lang)}
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />

            {/* Фото + имя */}
            <div className="text-center mb-6">
              <p className="font-extrabold text-gray-900 text-lg">{doctor.name}</p>
              {doctor.workingHours && (
                <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {L('hours', lang)}: {doctor.workingHours}
                </p>
              )}
            </div>

            {!hasContacts ? (
              <p className="text-center text-gray-400 text-sm py-4">{L('noContact', lang)}</p>
            ) : (
              <div className="space-y-2.5">
                {/* Телефон */}
                {doctor.phone && (
                  
                    href={`tel:${doctor.phone}`}
                    className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 font-medium">{L('phone', lang)}</p>
                      <p className="font-bold text-gray-900 truncate">{doctor.phone}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                )}

                {/* WhatsApp */}
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

                {/* Telegram */}
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

                {/* Instagram */}
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

            <button
              onClick={() => setOpen(false)}
              className="mt-4 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl text-sm transition"
            >
              {L('close', lang)}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
