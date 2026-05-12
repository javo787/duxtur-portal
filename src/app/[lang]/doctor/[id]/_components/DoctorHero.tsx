// src/app/[lang]/doctor/[id]/_components/DoctorHero.tsx
import * as React from 'react';

interface DoctorHeroProps {
  doctor: any;
  specialtyLabel: string;
  mission: string;
  totalViews: number;
  articlesCount: number;
}

export default function DoctorHero({ doctor, specialtyLabel, mission, totalViews, articlesCount }: DoctorHeroProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f2a52] to-[#0a1628]">
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 py-12 md:py-20">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-10">
          {/* Аватар */}
          <div className="relative shrink-0 mx-auto md:mx-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden ring-2 ring-white/10 shadow-2xl">
              <img
                src={doctor.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                alt={doctor.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-wide">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Верифицирован
            </div>
          </div>

          {/* Инфо */}
          <div className="flex-1 min-w-0 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-3">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              {specialtyLabel}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-none mb-3">
              {doctor.name}
            </h1>
            <p className="text-blue-200/90 text-sm md:text-base leading-relaxed max-w-xl mb-6 italic">
              {mission}
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <HeroStat
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                value={articlesCount.toString()}
                label={articlesCount === 1 ? 'статья' : articlesCount < 5 ? 'статьи' : 'статей'}
              />
              {doctor.experience > 0 && (
                <HeroStat
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  value={`${doctor.experience}`}
                  label="лет опыта"
                />
              )}
              {totalViews > 0 && (
                <HeroStat
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                  value={totalViews > 999 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews.toString()}
                  label="прочтений"
                />
              )}
              {doctor.languages?.length > 0 && (
                <HeroStat
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>}
                  value={doctor.languages.length.toString()}
                  label={doctor.languages.length === 1 ? 'язык' : 'языка'}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-white/8 border border-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl">
      <span className="text-blue-300/80">{icon}</span>
      <div>
        <p className="font-black text-white text-sm leading-none">{value}</p>
        <p className="text-blue-200/60 text-[11px] mt-0.5">{label}</p>
      </div>
    </div>
  );
}
