'use client';

import Image from 'next/image';
import { useT } from '@/i18n';
import { getOptimizedCloudinaryUrl } from '@/lib/utils';

export default function ClinicHero({ clinic, lang }: { clinic: any, lang: string }) {
  const { t } = useT(lang);

  return (
    <section className="relative h-[450px] md:h-[600px] w-full overflow-hidden">
      {/* Cover Image */}
      <div className="absolute inset-0">
        <Image
          src={getOptimizedCloudinaryUrl(clinic.coverImage, { width: 1600, height: 800, crop: 'fill' }) || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600'}
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>

      <div className="absolute inset-0 flex items-end">
        {/* Profile Badge */}
        <div className="absolute top-24 left-4 md:left-8 z-10">
           <div className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">{t('clinic.profile')}</span>
           </div>
        </div>

        <div className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-8 md:pb-12 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
          {/* Logo */}
          <div className="relative w-28 h-28 md:w-48 md:h-48 bg-white/90 backdrop-blur-xl rounded-3xl md:rounded-[2.5rem] p-1 shadow-2xl shrink-0 group border border-white/40">
            <div className="relative w-full h-full rounded-2xl md:rounded-[2.2rem] overflow-hidden text-slate-800">
               <Image src={getOptimizedCloudinaryUrl(clinic.logo, { width: 400, height: 400, crop: 'fill' }) || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'} alt={(clinic.name as any)[lang] || (clinic.name as any).ru} fill className="object-cover group-hover:scale-110 transition duration-700" />
            </div>
            {clinic.status === 'approved' && (
              <div className="absolute -top-2 -right-2 bg-blue-600 text-white p-2.5 rounded-2xl shadow-lg border-4 border-white" title={t('clinic.verified')}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left text-white mb-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
               <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">{t('clinic.type_' + clinic.type)}</span>
               <span className="px-3 py-1 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">📍 {clinic.city}</span>
            </div>
            <h1 className="text-2xl xs:text-3xl md:text-6xl font-black mb-3 tracking-tight font-display text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70 break-words">
              {(clinic.name as any)[lang] || (clinic.name as any).ru}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-4">
               <div className="flex text-amber-400 text-lg">
                 {Array.from({ length: 5 }).map((_, i) => <span key={i}>{i < Math.round(clinic.rating.avg) ? '★' : '☆'}</span>)}
                 <span className="ml-2 text-white font-bold text-sm">{clinic.rating.avg} <span className="text-white/60">({clinic.rating.count})</span></span>
               </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 xs:gap-3 mb-2 w-full md:w-auto">
             {clinic.phone && (
               <a href={`tel:${clinic.phone}`} className="flex-1 md:flex-none p-4 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl transition shadow-xl text-center" title={clinic.phone}><span className="text-xl">📞</span></a>
             )}
             {clinic.whatsapp && (
               <a href={`https://wa.me/${clinic.whatsapp}`} target="_blank" className="flex-1 md:flex-none p-4 bg-green-500/90 hover:bg-green-500 rounded-2xl transition shadow-xl text-center"><span className="text-xl">💬</span></a>
             )}
             <button
               onClick={() => {
                  const el = document.getElementById('clinic-tabs-container');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                    // Give it a bit of time for smooth scroll to finish before switching tab
                    setTimeout(() => {
                      const tabBtn = document.querySelector('[data-tab-id="booking"]') as HTMLButtonElement;
                      if (tabBtn) tabBtn.click();
                    }, 500);
                  }
               }}
               className="flex-[2] md:flex-none px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-blue-600/30"
             >
                {t('clinic.book')}
             </button>
          </div>
        </div>
      </div>
    </section>
  );
}
