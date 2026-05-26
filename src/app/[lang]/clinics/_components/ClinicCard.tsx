import Link from 'next/link';
import Image from 'next/image';
import { getT } from '@/i18n';

export default function ClinicCard({ clinic, lang }: { clinic: any, lang: string }) {
  const t = getT(lang as any);

  const name = (clinic.name as any)[lang] || (clinic.name as any).ru;

  return (
    <Link href={`/${lang}/clinic/${clinic.slug}`} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group flex flex-col h-full">
      {/* Cover */}
      <div className="relative aspect-video w-full">
        <Image
          src={clinic.coverImage || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800'}
          alt={name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Logo Overlay */}
        <div className="absolute bottom-4 left-4 w-12 h-12 bg-white rounded-2xl p-0.5 shadow-xl">
           <div className="relative w-full h-full rounded-[0.8rem] overflow-hidden">
             <Image src={clinic.logo || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'} alt="" fill className="object-cover" />
           </div>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
         <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-wider">
               {t('clinic.type_' + clinic.type)}
            </span>
            <span className="text-[10px] font-bold text-slate-400">📍 {clinic.city}</span>
         </div>

         <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition line-clamp-1 mb-2">
           {name}
         </h3>

         <div className="flex items-center gap-1 text-xs font-bold text-slate-400 mb-4">
            <span className="text-amber-400 text-sm">★</span>
            <span className="text-slate-900">{clinic.rating.avg}</span>
            <span>
               {clinic.rating.count > 0 ? `(${clinic.rating.count})` : t('doctor.noReviews')}
            </span>
            <span className="mx-1 opacity-20">•</span>
            <span>{clinic.doctorIds?.length || 0} {t('common.doctors')}</span>
         </div>

         <div className="flex flex-wrap gap-1.5 mt-auto">
            {clinic.specialties?.slice(0, 3).map((s: string) => (
              <span key={s} className="px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-bold uppercase tracking-tight">
                 {s}
              </span>
            ))}
            {clinic.specialties?.length > 3 && (
              <span className="px-2 py-1 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-bold">
                 +{clinic.specialties.length - 3}
              </span>
            )}
         </div>
      </div>
    </Link>
  );
}
