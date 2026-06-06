import * as React from 'react';
import Avatar3D from './Avatar3D';
import { CATEGORY_GRADIENTS } from '@/lib/doctor-constants';
import { getT } from '@/i18n';

interface DoctorHeroProps {
  doctor: any;
  specialtyLabel: string;
  mission: string;
  totalViews: number;
  articlesCount: number;
  categoryKey: string;
  lang: string;
}

export default function DoctorHero({
  doctor,
  specialtyLabel,
  mission,
  totalViews,
  articlesCount,
  categoryKey,
  lang,
}: DoctorHeroProps) {
  const t = getT(lang);
  const gradient = CATEGORY_GRADIENTS[categoryKey] || CATEGORY_GRADIENTS.general;

  return (
    <div
      className="relative overflow-hidden animate-gradient-xy"
      style={{
        background: `linear-gradient(135deg, ${gradient.from}, #0f2a52, ${gradient.to})`,
        backgroundSize: '200% 200%',
      }}
    >
      {/* Сетка — только десктоп */}
      <div
        className="absolute inset-0 opacity-[0.04] hidden md:block"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Свечения */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ─── МОБИЛЬ: компактный горизонтальный layout ─── */}
      <div className="md:hidden relative px-4 pt-4 pb-5">
        
        {/* Строка 1: фото + имя/специальность */}
        <div className="flex items-center gap-3.5">
          {/* Аватар компактный */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-white/15 shadow-xl">
              <Avatar3D
                src={doctor.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                alt={doctor.name}
              />
            </div>
            {/* Верифицирован — точка */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0f2a52] flex items-center justify-center shadow-md">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Имя + специальность */}
          <div className="min-w-0 flex-1">
            {/* Специальность пилюля */}
            <div className="inline-flex items-center gap-1 bg-blue-500/20 border border-blue-400/25 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              {specialtyLabel}
            </div>
            <h1 className="text-xl font-black text-white tracking-tight leading-tight truncate">
              {doctor.name}
            </h1>
            {doctor.workplace && (
              <p className="text-blue-200/60 text-[11px] mt-0.5 truncate">{doctor.workplace}</p>
            )}
          </div>
        </div>

        {/* Строка 2: миссия — 2 строки максимум */}
        <p className="text-blue-200/80 text-[13px] leading-relaxed mt-3 line-clamp-2 italic">
          «{mission}»
        </p>

        {/* Строка 3: метрики горизонтально — скролл если не влезает */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none pb-0.5">
          <MobileStat value={articlesCount.toString()} label={t('common.articles')} icon="📄" />
          {doctor.experience > 0 && (
            <MobileStat value={`${doctor.experience}`} label={t('doctor.yearsExp')} icon="⏱" />
          )}
          {totalViews > 0 && (
            <MobileStat
              value={totalViews > 999 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews.toString()}
              label={t('doctor.reads')}
              icon="👁"
            />
          )}
          {doctor.languages?.length > 0 && (
            <MobileStat value={doctor.languages.join(' · ')} label={t('common.languages')} icon="🌐" />
          )}
        </div>
      </div>

      {/* ─── ДЕСКТОП: оригинальный layout ─── */}
      <div className="hidden md:block relative max-w-6xl mx-auto px-6 py-20">
        <div className="flex flex-row items-center gap-10">
          {/* Аватар */}
          <div className="relative shrink-0 group">
            <div className="w-40 h-40 rounded-2xl overflow-hidden ring-2 ring-white/10 shadow-2xl transition-all duration-500 group-hover:ring-4 group-hover:ring-white/20 group-hover:scale-105 group-hover:rotate-2">
              <Avatar3D
                src={doctor.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                alt={doctor.name}
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-wide">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {t('doctor.verified')}
            </div>
          </div>

          {/* Инфо */}
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-3">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              {specialtyLabel}
            </span>

            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-none mb-3">
              {doctor.name}
            </h1>

            <div className="relative max-w-xl mb-6">
              <svg className="absolute -top-2 -left-4 w-8 h-8 text-blue-400/20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-blue-200/90 text-base leading-relaxed italic pl-6">{mission}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <HeroStat icon={<PdfIcon />} value={articlesCount.toString()} label={t('common.articles')} />
              {doctor.experience > 0 && <HeroStat icon={<CalendarIcon />} value={`${doctor.experience}`} label={t('doctor.yearsExp')} />}
              {totalViews > 0 && (
                <HeroStat
                  icon={<EyeIcon />}
                  value={totalViews > 999 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews.toString()}
                  label={t('doctor.reads')}
                />
              )}
              {doctor.languages?.length > 0 && (
                <HeroStat icon={<GlobeIcon />} value={doctor.languages.length.toString()} label={t('common.languages')} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Мобильная метрика — компактная */
function MobileStat({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/8 border border-white/10 px-3 py-1.5 rounded-xl shrink-0">
      <span className="text-sm">{icon}</span>
      <div>
        <p className="font-black text-white text-xs leading-none">{value}</p>
        <p className="text-blue-200/50 text-[10px] mt-0.5 whitespace-nowrap">{label}</p>
      </div>
    </div>
  );
}

function HeroStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-white/8 border border-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl transition-all duration-300 hover:bg-white/15 hover:border-white/20 hover:scale-105">
      <span className="text-blue-300/80">{icon}</span>
      <div>
        <p className="font-black text-white text-sm leading-none">{value}</p>
        <p className="text-blue-200/60 text-[11px] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function PdfIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
}
function CalendarIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function EyeIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
}
function GlobeIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>;
}
