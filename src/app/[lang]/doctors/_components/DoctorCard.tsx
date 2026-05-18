import Image from 'next/image';
import Link from 'next/link';
import ContactDoctorButton from '@/components/ContactDoctorButton';
import { CATEGORY_LABELS, SPECIALTY_ICONS } from '@/lib/doctor-constants';

interface DoctorCardProps {
  doctor: any;
  lang: string;
  L: (key: string) => string;
}

const fallbackImage = '/images/doctor-placeholder.png';

export default function DoctorCard({ doctor, lang, L }: DoctorCardProps) {
  const specialtyRu = doctor.specialty?.ru || '';
  const catKey =
    Object.entries(CATEGORY_LABELS).find(([, v]) => v.ru === specialtyRu)?.[0] || 'general';
  const icon = SPECIALTY_ICONS[catKey] || '🏥';
  const profileUrl = `/${lang}/doctor/${doctor.slug || doctor._id}`;
  const t = (field: any) => field?.[lang] || field?.ru || '';

  const hasRating = doctor.reviewCount > 0;
  const consultTypes = doctor.consultationTypes || [];
  const languages = doctor.languages || [];

  return (
    <article className="group relative bg-white rounded-2xl border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col">

      {/* Семантическая ссылка на весь профиль — для a11y и "Открыть в новой вкладке" */}
      <Link
        href={profileUrl}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        aria-label={`Профиль врача ${doctor.name}`}
        tabIndex={0}
      />

      {/* Акцентная полоса при hover */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 to-amber-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

      {/* Верхняя часть */}
      <div className="p-5 pb-3 flex gap-4 items-start">

        {/* Фото */}
        <div className="relative flex-shrink-0 w-[60px] h-[60px]">
          <Image
            src={doctor.image || fallbackImage}
            alt={`Фото врача ${doctor.name}`}
            fill
            sizes="60px"
            className="rounded-xl object-cover border border-slate-100"
          />
          {doctor.status === 'approved' && (
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center"
              title="Верифицирован"
              aria-label="Верифицированный специалист"
            >
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Имя, специальность, рейтинг */}
        <div className="flex-1 min-w-0">
          {/* Бейдж специальности — text-xs вместо text-[10px] */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-1.5">
            <span aria-hidden="true">{icon}</span>
            {t(doctor.specialty)}
          </span>

          <h2 className="font-bold text-slate-900 text-base leading-tight truncate">
            {doctor.name}
          </h2>

          {hasRating ? (
            <div className="flex items-center gap-1.5 mt-1" aria-label={`Рейтинг ${doctor.reviewAvg} из 5, ${doctor.reviewCount} отзывов`}>
              <div className="flex gap-0.5" aria-hidden="true">
                {[1,2,3,4,5].map(s => (
                  <svg
                    key={s}
                    className={`w-3 h-3 ${s <= Math.round(doctor.reviewAvg) ? 'text-amber-400' : 'text-slate-200'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs font-bold text-amber-600">{doctor.reviewAvg}</span>
              <span className="text-xs text-slate-400">({doctor.reviewCount})</span>
            </div>
          ) : (
            <p className="text-xs italic text-slate-300 mt-1" aria-label="Отзывов пока нет">Нет отзывов</p>
          )}
        </div>
      </div>

      {/* Детали */}
      <div className="px-5 pb-3 space-y-1.5">
        {doctor.city && (
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm text-slate-600 truncate flex-1">
              {doctor.city}{doctor.clinicName ? ` · ${doctor.clinicName}` : ''}
            </span>
            {languages.length > 0 && (
              <span className="flex-shrink-0 text-xs text-slate-400 font-medium">
                {languages.slice(0, 2).join(' · ')}
                {languages.length > 2 && (
                  <span className="text-slate-300"> +{languages.length - 2}</span>
                )}
              </span>
            )}
          </div>
        )}

        {doctor.experience > 0 && (
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-slate-600">{doctor.experience} {L('years_exp')}</span>
          </div>
        )}

        {doctor.priceRange?.min > 0 && (
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-slate-800">
              {L('from')} {doctor.priceRange.min} {doctor.priceRange.currency || 'TJS'}
            </span>
          </div>
        )}
      </div>

      {/* Теги консультаций — text-xs, без border */}
      {consultTypes.length > 0 && (
        <div className="px-5 pb-3 flex flex-wrap gap-1.5">
          {consultTypes.map((type: string) => (
            <span
              key={type}
              title={
                type === 'in_person' ? 'Приём в клинике'
                : type === 'online' ? 'Онлайн-консультация'
                : 'Выезд на дом'
              }
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                type === 'online'
                  ? 'bg-emerald-50 text-emerald-600'
                  : type === 'home_visit'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-blue-50 text-blue-600'
              }`}
            >
              {type === 'in_person' ? '🏥 Очно' : type === 'online' ? '💻 Онлайн' : '🏠 На дому'}
            </span>
          ))}
        </div>
      )}

      {/* Разделитель */}
      <div className="mx-4 border-t border-slate-100" />

      {/* Кнопки — z-20 чтобы перекрыть абсолютную ссылку */}
      <div className="relative z-20 px-4 py-3 grid grid-cols-2 gap-2 mt-auto">
        <Link
          href={profileUrl}
          className="flex items-center justify-center py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
          tabIndex={0}
        >
          {L('view_profile')}
        </Link>
        <div className="relative z-20">
          <ContactDoctorButton
            doctor={doctor}
            lang={lang}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition flex items-center justify-center gap-1.5 shadow-sm shadow-blue-100"
          />
        </div>
      </div>
    </article>
  );
}
