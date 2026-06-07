'use client';

import Image from 'next/image';
import { useT } from '@/i18n';
import { getOptimizedCloudinaryUrl } from '@/lib/utils';

interface MultilingualString {
  ru: string;
  uz: string;
  kk: string;
  ky: string;
  tg: string;
}

interface ClinicData {
  name: MultilingualString;
  slug: string;
  type: string;
  status: string;
  logo: string;
  coverImage: string;
  city: string;
  phone?: string;
  whatsapp?: string;
  rating: { avg: number; count: number };
}

export default function ClinicHero({ clinic, lang }: { clinic: ClinicData; lang: string }) {
  const { t } = useT(lang);
  const name = clinic.name[lang as keyof MultilingualString] || clinic.name.ru;

  const scrollToBooking = () => {
    const el = document.getElementById('clinic-tabs-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });

      const onScrollEnd = () => {
        const tabBtn = document.querySelector('[data-tab-id="booking"]') as HTMLButtonElement;
        if (tabBtn) tabBtn.click();
      };

      if ('onscrollend' in window) {
        window.addEventListener('scrollend', onScrollEnd, { once: true });
      } else {
        setTimeout(onScrollEnd, 500);
      }
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
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600';
          }}
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
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png';
                      }}
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
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png';
                }}
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

          <div className="flex items-center justify-between gap-2">
             <div className="flex items-center gap-2">
                <div className="flex text-amber-400 text-sm">
                  {Array.from({ length: 5 }).map((_, i) => <span key={i}>{i < Math.round(clinic.rating.avg) ? '★' : '☆'}</span>)}
                </div>
                <span className="text-slate-900 font-bold text-sm">{clinic.rating.avg}</span>
                <span className="text-slate-400 text-xs">({clinic.rating.count})</span>
             </div>

             <div className="flex gap-2">
                {clinic.phone && (
                  <a href={`tel:${clinic.phone}`} className="p-3 bg-blue-50 text-blue-600 rounded-xl" title={clinic.phone}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  </a>
                )}
                {clinic.whatsapp && (
                  <a href={`https://wa.me/${clinic.whatsapp}`} target="_blank" className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.7 17.8 69.7 27.2 106.2 27.2h.1c122.3 0 222-99.6 222-222 0-59.3-23-115.1-65.1-157.1zM223.9 445.9c-33.1 0-65.7-8.9-94.1-25.7l-6.7-4-69.8 18.3L72 365.9l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-82.7 184.6-184.5 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18s-8.8-2.8-12.4 2.8-14.1 18-17.3 21.6-6.4 4.1-12 1.4c-5.5-2.8-23.4-8.6-44.5-27.4-16.4-14.6-27.5-32.7-30.7-38.2-3.2-5.5-.3-8.5 2.5-11.2 2.5-2.5 5.5-6.4 8.3-9.6 2.8-3.2 3.7-5.5 5.5-9.2 1.8-3.7.9-6.9-.5-9.6-1.4-2.8-12.4-29.9-17-41.1-4.5-10.9-9.1-9.4-12.4-9.6-3.2-.1-6.9-.1-10.6-.1-3.7 0-9.6 1.4-14.6 6.9-5 5.5-19.2 18.8-19.2 45.8s19.7 53 22.5 56.7c2.8 3.7 38.8 59.3 94.1 83.1 13.2 5.7 23.4 9.1 31.4 11.7 13.2 4.2 25.2 3.6 34.8 2.2 10.6-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
                  </a>
                )}
             </div>
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
