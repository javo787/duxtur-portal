import Image from 'next/image';
import Link from 'next/link';
import ContactDoctorButton from '@/components/ContactDoctorButton';
import { CATEGORY_LABELS, SPECIALTY_ICONS } from '@/lib/doctor-constants';
import { Activity, Building2, Video, Home, Star } from 'lucide-react';

interface DoctorCardProps {
  doctor: any;
  lang: string;
  L: (key: string) => string;
}

const fallbackImage = '/images/doctor-placeholder.png';

const CONSULT_TYPE_CONFIG: Record<string, { icon: typeof Building2; label: string; bg: string; text: string }> = {
  in_person: { icon: Building2, label: 'Очно', bg: 'bg-blue-50/80', text: 'text-blue-700' },
  online: { icon: Video, label: 'Онлайн', bg: 'bg-emerald-50/80', text: 'text-emerald-700' },
  home_visit: { icon: Home, label: 'На дому', bg: 'bg-amber-50/80', text: 'text-amber-700' },
};

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
    <article className="group relative bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full">

      {/* Semantic link covering the card */}
      <Link
        href={profileUrl}
        className="absolute inset-0 z-10 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        aria-label={`Профиль врача ${doctor.name}`}
        tabIndex={0}
      />

      {/* Top accent gradient line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Card Header & Avatar */}
      <div className="p-5 flex gap-4 items-start relative">

        {/* Avatar Container */}
        <div className="relative flex-shrink-0 w-20 h-20 md:w-24 md:h-24">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl md:rounded-3xl" />
          <Image
            src={doctor.image || fallbackImage}
            alt={`Фото врача ${doctor.name}`}
            fill
            sizes="(max-width: 768px) 80px, 96px"
            className="rounded-2xl md:rounded-3xl object-cover ring-1 ring-slate-100 shadow-sm z-10 relative"
          />
          {doctor.status === 'approved' && (
            <div
              className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm z-20"
              title="Верифицирован"
              aria-label="Верифицированный специалист"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Info Container */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">

          <div className="flex items-center justify-between gap-2 mb-1.5">
            {/* Specialty Badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-50 text-slate-500 border border-slate-200/60 tracking-wide uppercase">
              {t(doctor.specialty)}
            </span>

            {/* Minimal Rating Badge */}
            {hasRating && (
              <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded text-amber-700 font-bold text-xs">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {doctor.reviewAvg}
              </div>
            )}
          </div>

          <h2 className="font-display font-bold text-slate-900 text-lg md:text-xl leading-tight truncate group-hover:text-blue-600 transition-colors">
            {doctor.name}
          </h2>

          {!hasRating && (
            <p className="text-xs text-slate-400 mt-1">Новый специалист</p>
          )}
        </div>
      </div>

      {/* Details Section */}
      <div className="px-5 pb-4 space-y-2.5">

        {/* Location & Languages */}
        {doctor.city && (
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-600 truncate flex-1">
              {doctor.city}{doctor.clinicName ? <span className="text-slate-400"> · {doctor.clinicName}</span> : ''}
            </span>
            {languages.length > 0 && (
              <span className="flex-shrink-0 text-[11px] uppercase tracking-wider text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded">
                {languages.slice(0, 2).join(' ')}
              </span>
            )}
          </div>
        )}

        {/* Experience */}
        {doctor.experience > 0 && (
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-600">
              Стаж <span className="font-bold text-slate-900">{doctor.experience} {L('years_exp')}</span>
            </span>
          </div>
        )}

        {/* Price */}
        {doctor.priceRange?.min > 0 && (
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-600">
              Прием от <span className="font-bold text-emerald-600 text-base">{doctor.priceRange.min}</span> <span className="text-xs text-slate-400 font-bold">{doctor.priceRange.currency || 'TJS'}</span>
            </span>
          </div>
        )}
      </div>

      {/* Consultation Tags */}
      {consultTypes.length > 0 && (
        <div className="px-5 pb-4 flex flex-wrap gap-2">
          {consultTypes.map((type: string) => {
            const config = CONSULT_TYPE_CONFIG[type];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <span
                key={type}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${config.bg} ${config.text}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {config.label}
              </span>
            );
          })}
        </div>
      )}

      {/* Footer Actions */}
      <div className="mt-auto p-4 bg-slate-50/50 border-t border-slate-100">
        <div className="relative z-20 grid grid-cols-2 gap-3">
          <Link
            href={profileUrl}
            className="flex items-center justify-center py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all btn-spring shadow-sm"
            tabIndex={0}
          >
            {L('view_profile')}
          </Link>
          <div className="relative z-20">
            <ContactDoctorButton
              doctor={doctor}
              lang={lang}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 active:bg-blue-800 transition-all flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 btn-spring"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
