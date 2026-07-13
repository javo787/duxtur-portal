'use client';

import Link from 'next/link';
import Image from 'next/image';
import { getT, Locale } from '@/i18n';
import { motion } from 'framer-motion';
import { ClinicDocument, COMMON_SPECIALTIES } from '@/lib/clinic-constants';
import { isClinicOpen } from '@/lib/clinic-utils';
import { getOptimizedCloudinaryUrl, cn } from '@/lib/utils';

export default function ClinicCard({
  clinic,
  lang,
  priority = false
}: {
  clinic: ClinicDocument,
  lang: Locale,
  priority?: boolean
}) {
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
      <Link
        href={`/${lang}/clinics/${clinic.slug}`}
        aria-label={`${t('clinic.profile')}: ${name}`}
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-100/60 shadow-card hover:shadow-card-hover card-hover-lift group flex flex-col h-full"
      >
        {/* Cover */}
        <div className={cn(
          "relative aspect-video w-full overflow-hidden",
          !clinic.coverImage && "bg-slate-50 dark:bg-slate-800"
        )}>
          <Image
            src={getOptimizedCloudinaryUrl((clinic.coverImage || clinic.logo) as string, { width: 800, height: 450, crop: clinic.coverImage ? 'fill' : 'limit' }) || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800'}
            alt={name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={cn(
              "transition-transform duration-700",
              clinic.coverImage ? "object-cover group-hover:scale-105" : "object-contain p-12"
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

          {/* Logo Overlay */}
          <div className="absolute bottom-4 left-4 w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl p-1.5 shadow-lg shadow-black/10 group-hover:scale-110 transition-transform duration-500">
             <div className="relative w-full h-full rounded-[0.8rem] overflow-hidden">
               <Image
                src={getOptimizedCloudinaryUrl(clinic.logo as string, { width: 200, height: 200, crop: 'limit' }) || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                alt=""
                fill
                className="object-contain"
               />
             </div>
          </div>

          {/* Open/Closed Badge */}
          <div className="absolute top-4 right-4">
            {isClinicOpen(clinic.workingHours) ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                {t('clinic.openNow')}
              </span>
            ) : (
              <span className="px-3 py-1 bg-slate-800/70 backdrop-blur-md text-white/80 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                {t('clinic.closed')}
              </span>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6 flex flex-col flex-1 relative">
           {/* View Profile Hover CTA */}
           <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-blue-500 to-blue-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
           <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                 {t('clinic.type_' + clinic.type)}
              </span>
              <span className="text-[10px] font-bold text-slate-400 line-clamp-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {clinic.city}{clinic.district ? `, ${clinic.district}` : clinic.address ? `, ${clinic.address}` : ''}
              </span>
           </div>

           <div className="flex flex-col gap-0.5 mb-2">
             <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 font-display">
               {name}
             </h3>
             {(clinic as any).dataSource === 'scraped' && (
               <span className="text-[10px] font-medium text-slate-400">
                 {t('clinic.unverified')}
               </span>
             )}
           </div>

           <div className="flex items-center gap-1 text-xs font-bold text-slate-400 mb-4">
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-slate-900 dark:text-slate-200">{clinic.rating.avg}</span>
              <span className="opacity-70 dark:opacity-60">
                 {clinic.rating.count > 0 ? `(${clinic.rating.count})` : t('doctor.noReviews')}
              </span>
              <span className="mx-1 opacity-20 dark:opacity-20">•</span>
              <span className="opacity-70 dark:opacity-60">{clinic.doctorCount ?? clinic.doctorIds?.length ?? 0} {t('common.doctors')}</span>
           </div>

           <div className="flex flex-wrap gap-1.5 mt-auto">
              {clinic.specialties?.slice(0, 3).map((s: string) => {
                // Find ID of specialty for translation
                const specialtyId = COMMON_SPECIALTIES.find(cs => cs.label === s)?.id || s;
                const localizedSpecialty = t('clinic.specialty_' + specialtyId);

                return (
                  <span key={s} className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-wide group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                     {localizedSpecialty === 'clinic.specialty_' + specialtyId ? s : localizedSpecialty}
                  </span>
                );
              })}
              {clinic.specialties && clinic.specialties.length > 3 && (
                <span className="px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-lg text-[10px] font-bold">
                   +{clinic.specialties.length - 3}
                </span>
              )}
           </div>
        </div>
      </Link>
    </motion.div>
  );
}
