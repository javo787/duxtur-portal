'use client';

import Link from 'next/link';
import Image from 'next/image';
import { getT, Locale } from '@/i18n';
import { motion } from 'framer-motion';
import { ClinicDocument } from '@/lib/clinic-constants';

export default function ClinicCard({ clinic, lang }: { clinic: ClinicDocument, lang: Locale }) {
  const t = getT(lang);

  const name = clinic.name[lang as keyof typeof clinic.name] || clinic.name.ru;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Link href={`/${lang}/clinic/${clinic.slug}`} className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 dark:hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-500 group flex flex-col h-full">
        {/* Cover */}
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={clinic.coverImage || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800'}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

          {/* Logo Overlay */}
          <div className="absolute bottom-4 left-4 w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl p-0.5 shadow-xl group-hover:scale-110 transition-transform duration-500">
             <div className="relative w-full h-full rounded-[0.8rem] overflow-hidden">
               <Image src={clinic.logo || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'} alt="" fill className="object-cover" />
             </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 flex flex-col flex-1">
           <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[9px] font-black uppercase tracking-wider">
                 {t('clinic.type_' + clinic.type)}
              </span>
              <span className="text-[10px] font-bold text-slate-400">📍 {clinic.city}</span>
           </div>

           <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-2 font-display">
             {name}
           </h3>

           <div className="flex items-center gap-1 text-xs font-bold text-slate-400 mb-4">
              <span className="text-amber-400 text-sm">★</span>
              <span className="text-slate-900 dark:text-slate-200">{clinic.rating.avg}</span>
              <span className="opacity-70 dark:opacity-50">
                 {clinic.rating.count > 0 ? `(${clinic.rating.count})` : t('doctor.noReviews')}
              </span>
              <span className="mx-1 opacity-20 dark:opacity-10">•</span>
              <span className="opacity-70 dark:opacity-50">{clinic.doctorIds?.length || 0} {t('common.doctors')}</span>
           </div>

           <div className="flex flex-wrap gap-1.5 mt-auto">
              {clinic.specialties?.slice(0, 3).map((s: string) => (
                <span key={s} className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[9px] font-bold uppercase tracking-tight group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                   {s}
                </span>
              ))}
              {clinic.specialties?.length > 3 && (
                <span className="px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-lg text-[9px] font-bold">
                   +{clinic.specialties.length - 3}
                </span>
              )}
           </div>
        </div>
      </Link>
    </motion.div>
  );
}
