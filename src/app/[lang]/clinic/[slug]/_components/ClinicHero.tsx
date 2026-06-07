'use client';

import Image from 'next/image';
import { useT } from '@/i18n';
import { getOptimizedCloudinaryUrl } from '@/lib/utils';

export default function ClinicHero({ clinic, lang }: { clinic: any; lang: string }) {
  const { t } = useT(lang);
  const name = (clinic.name as any)[lang] || (clinic.name as any).ru;

  const scrollToBooking = () => {
    const el = document.getElementById('clinic-tabs-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      // Give it a bit of time for smooth scroll to finish before switching tab
      setTimeout(() => {
        const tabBtn = document.querySelector('[data-tab-id="booking"]') as HTMLButtonElement;
        if (tabBtn) tabBtn.click();
      }, 500);
    }
  };

  return (
    <section className="relative w-full overflow-hidden bg-white">
      {/* Cover Image container */}
      <div className="relative h-[260px] lg:h-[520px] w-full">
        <Image
          src={
            getOptimizedCloudinaryUrl(clinic.coverImage, { width: 1600, height: 800, crop: 'fill' }) ||
            'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600'
          }
          alt=""
          fill
          className="object-cover"
          priority
        />

        {/* Desktop Hero Content (lg+) */}
        <div className="hidden lg:block absolute inset-0">
          <div className="max-w-7xl mx-auto h-full relative px-8">
            {/* Glassmorphism Card */}
            <div className="absolute bottom-8 left-8 bg-white/80 backdrop-blur-lg border border-white/60 rounded-[24px] p-8 shadow-2xl max-w-2xl">
              {/* Row 1: Logo + Name + Verified */}
              <div className="flex items-center gap-6 mb-6">
                {/* Logo iOS-style card */}
                <div className="relative w-20 h-20 bg-white rounded-[20px] shadow-sm border border-slate-100 p-0.5 shrink-0 overflow-hidden">
                  <div className="relative w-full h-full rounded-[18px] overflow-hidden">
                    <Image
                      src={getOptimizedCloudinaryUrl(clinic.logo, { width: 200, height: 200, crop: 'fill' }) || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                      alt={name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <h1
                      className="font-black tracking-tight text-slate-900 leading-tight"
                      style={{
                        fontSize: 'clamp(28px, 5vw, 52px)',
                        fontWeight: 900,
                        letterSpacing: '-0.03em'
                      }}
                    >
                      {name}
                    </h1>
                    {clinic.status === 'approved' && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-full shadow-sm" title={t('clinic.verified')}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('common.verified')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-4 py-1.5 bg-white/30 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold text-slate-700">
                   📍 {clinic.city}
                </span>
                <span className="px-4 py-1.5 bg-white/30 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold text-slate-700">
                   {t('clinic.type_' + clinic.type)}
                </span>
              </div>

              {/* Row 3: Rating */}
              <div className="flex items-center gap-3">
                <div className="flex text-amber-400 text-xl">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>{i < Math.round(clinic.rating.avg) ? '★' : '☆'}</span>
                  ))}
                </div>
                <span className="text-slate-900 font-black text-lg">{clinic.rating.avg}</span>
                <span className="text-slate-500 font-medium">({clinic.rating.count} {t('blog.ratings')})</span>
              </div>
            </div>

            {/* Desktop Action Buttons (Floating) */}
            <div className="absolute bottom-8 right-8 flex items-center gap-4">
              {clinic.phone && (
                <a
                  href={`tel:${clinic.phone}`}
                  className="w-14 h-14 bg-white hover:bg-slate-50 text-slate-700 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95 border border-slate-100"
                  title={clinic.phone}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                </a>
              )}
              <button
                onClick={scrollToBooking}
                className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[14px] font-extrabold text-sm uppercase tracking-[0.12em] transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-blue-600/30 min-w-[220px]"
              >
                {t('clinic.book')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout (hidden on lg+) */}
      <div className="lg:hidden bg-white px-4 pb-8">
        {/* Logo overlapping cover */}
        <div className="relative -mt-[30px] z-10">
          <div className="w-[60px] h-[60px] bg-white rounded-[20px] shadow-lg border border-slate-100 p-0.5 overflow-hidden">
            <div className="relative w-full h-full rounded-[18px] overflow-hidden">
              <Image
                src={getOptimizedCloudinaryUrl(clinic.logo, { width: 120, height: 120, crop: 'fill' }) || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                alt={name}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <h1
              className="font-black tracking-tight text-slate-900 leading-tight"
              style={{
                fontSize: 'clamp(28px, 5vw, 52px)',
                fontWeight: 900,
                letterSpacing: '-0.03em'
              }}
            >
              {name}
            </h1>
            {clinic.status === 'approved' && (
              <div className="bg-blue-600 text-white p-1 rounded-full shadow-sm" title={t('clinic.verified')}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
             <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-wider">📍 {clinic.city}</span>
             <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-wider">{t('clinic.type_' + clinic.type)}</span>
          </div>

          <div className="flex items-center gap-2">
             <div className="flex text-amber-400 text-sm">
               {Array.from({ length: 5 }).map((_, i) => <span key={i}>{i < Math.round(clinic.rating.avg) ? '★' : '☆'}</span>)}
             </div>
             <span className="text-slate-900 font-bold text-sm">{clinic.rating.avg}</span>
             <span className="text-slate-400 text-xs">({clinic.rating.count})</span>
          </div>

          <button
             onClick={scrollToBooking}
             className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[14px] font-extrabold text-base uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
          >
             {t('clinic.book')}
          </button>
        </div>
      </div>
    </section>
  );
}
