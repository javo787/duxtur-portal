import Image from 'next/image';
import Link from 'next/link';
import ContactDoctorButton from '@/components/ContactDoctorButton';
import { CATEGORY_LABELS } from '@/lib/doctor-constants';
import { SPECIALTY_ICONS, SPECIALTY_COLORS } from '@/lib/doctor-constants'; // вынести

interface DoctorCardProps {
  doctor: any;
  lang: string;
  L: (key: string) => string;
}

const fallbackImage = '/images/doctor-placeholder.png'; // локально

export default function DoctorCard({ doctor, lang, L }: DoctorCardProps) {
  const specialtyRu = doctor.specialty?.ru || '';
  const catKey = Object.entries(CATEGORY_LABELS).find(([, v]) => v.ru === specialtyRu)?.[0] || 'general';
  const color = SPECIALTY_COLORS[catKey] || SPECIALTY_COLORS.general;
  const icon = SPECIALTY_ICONS[catKey] || '🏥';
  const profileUrl = `/${lang}/doctor/${doctor.slug || doctor._id}`;

  const t = (field: any) => field?.[lang] || field?.ru || '';

  return (
    <article className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
      {/* Акцентная полоса */}
      <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

      <div className="p-5 pb-3 flex items-start gap-4">
        {/* Фото */}
        <div className="relative flex-shrink-0 w-16 h-16">
          <Image
            src={doctor.image || fallbackImage}
            alt={`Фото врача ${doctor.name}`}
            fill
            sizes="64px"
            className="rounded-2xl object-cover border-2 border-slate-100 group-hover:border-blue-100 transition"
          />
          {doctor.status === 'approved' && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center" title="Верифицирован">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Бейдж специальности */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border mb-2 ${color.bg} ${color.text} ${color.border}`}>
            <span aria-hidden="true">{icon}</span>
            {t(doctor.specialty)}
          </span>

          <Link href={profileUrl} className="block group/link">
            <h2 className="font-bold text-slate-900 text-[15px] leading-tight group-hover/link:text-blue-600 transition truncate">
              {doctor.name}
            </h2>
          </Link>

          {/* Рейтинг */}
          {doctor.reviewCount > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5" aria-label={`Рейтинг ${doctor.reviewAvg} из 5 на основе ${doctor.reviewCount} отзывов`}>
              <div className="flex" aria-hidden="true">
                {[1,2,3,4,5].map(s => (
                  <svg key={s} className={`w-3 h-3 ${s <= Math.round(doctor.reviewAvg) ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs font-bold text-slate-700">{doctor.reviewAvg}</span>
              <span className="text-xs text-slate-400">({doctor.reviewCount})</span>
            </div>
          )}
        </div>
      </div>

      {/* Детали */}
      <div className="px-5 pb-4 space-y-2 text-[13px] text-slate-500">
        {doctor.city && (
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{doctor.city}{doctor.clinicName ? ` · ${doctor.clinicName}` : ''}</span>
          </div>
        )}
        {doctor.experience > 0 && (
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{doctor.experience} {L('years_exp')}</span>
          </div>
        )}
        {doctor.priceRange?.min > 0 && (
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{L('from')} {doctor.priceRange.min} {doctor.priceRange.currency || 'TJS'}</span>
          </div>
        )}
        {doctor.consultationTypes?.length > 0 && (
          <div className="flex gap-1.5 pt-1">
            {doctor.consultationTypes.map((type: string) => (
              <span key={type} className="flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-500">
                {type === 'in_person' ? '🏥 Очно' : type === 'online' ? '💻 Онлайн' : '🏠 На дому'}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Кнопки */}
      <div className="mt-auto px-4 pb-4 grid grid-cols-2 gap-2">
        <Link
          href={profileUrl}
          className="flex items-center justify-center py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
        >
          {L('view_profile')}
        </Link>
        <ContactDoctorButton
          doctor={doctor}
          lang={lang}
          className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center justify-center gap-1.5"
        />
      </div>
    </article>
  );
}
