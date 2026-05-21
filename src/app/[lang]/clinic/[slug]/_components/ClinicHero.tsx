'use client';

import Image from 'next/image';
import { useT } from '@/i18n';

export default function ClinicHero({ clinic, lang }: { clinic: any, lang: string }) {
  const { t } = useT(lang);

  return (
    <section className="relative h-[400px] md:h-[500px] w-full overflow-hidden">
      {/* Cover Image */}
      <div className="absolute inset-0">
        <Image
          src={clinic.coverImage || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600'}
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
      </div>

      <div className="absolute inset-0 flex items-end">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
          {/* Logo */}
          <div className="relative w-32 h-32 md:w-44 md:h-44 bg-white rounded-3xl p-1 shadow-2xl shrink-0">
            <div className="relative w-full h-full rounded-[1.4rem] overflow-hidden text-slate-800">
               <Image src={clinic.logo || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'} alt={(clinic.name as any)[lang] || (clinic.name as any).ru} fill className="object-cover" />
            </div>
            {clinic.status === 'approved' && (
              <div className="absolute -top-3 -right-3 bg-blue-600 text-white p-2 rounded-2xl shadow-lg" title={t('clinic.verified')}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left text-white mb-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
               <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest">{t('clinic.type_' + clinic.type)}</span>
               <span className="px-3 py-1 bg-blue-500 rounded-full text-[10px] font-black uppercase tracking-widest">📍 {clinic.city}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">{(clinic.name as any)[lang] || (clinic.name as any).ru}</h1>
            <div className="flex items-center justify-center md:justify-start gap-4">
               <div className="flex text-amber-400">
                 {Array.from({ length: 5 }).map((_, i) => <span key={i}>{i < Math.round(clinic.rating.avg) ? '★' : '☆'}</span>)}
                 <span className="ml-2 text-white/80 font-bold text-sm">{clinic.rating.avg} ({clinic.rating.count})</span>
               </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mb-2">
             <a href={`tel:${clinic.phone}`} className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl transition shadow-xl"><span className="text-xl">📞</span></a>
             <a href={`https://wa.me/${clinic.whatsapp}`} target="_blank" className="p-4 bg-green-500 hover:bg-green-600 rounded-2xl transition shadow-xl"><span className="text-xl">💬</span></a>
             <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition shadow-2xl shadow-blue-500/20">{t('clinic.book')}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
