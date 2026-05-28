import Link from 'next/link';
import Image from 'next/image';
import { getT } from '@/i18n';

export default function ClinicDoctors({ doctors, lang }: { doctors: any[], lang: string }) {
  const t = getT(lang as any);

  if (!doctors || doctors.length === 0) {
    return <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">No doctors associated with this clinic yet</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {doctors.map((doc: any) => (
        <Link key={doc._id} href={`/${lang}/doctor/${doc.slug || doc._id}`} className="bg-white p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 hover:-translate-y-2 transition-all duration-500 group">
           <div className="flex items-center gap-4 text-slate-800">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-500">
                 <Image src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'} alt={doc.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                 <h3 className="text-lg font-black group-hover:text-blue-600 transition truncate font-display">{doc.name}</h3>
                 <p className="text-xs text-slate-400 font-black uppercase tracking-widest truncate">{(doc.specialty as any)?.[lang] || (doc.specialty as any)?.ru}</p>
                 <div className="mt-2 flex items-center gap-1 text-xs font-bold text-slate-900">
                    <span className="text-amber-400">★</span>
                    <span>{doc.reviewAvg}</span>
                    <span className="text-slate-400 font-medium">({doc.reviewCount})</span>
                 </div>
              </div>
           </div>
           <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
              <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                 {doc.experience} {t('common.yearsExp')}
              </div>
              <div className="text-blue-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
           </div>
        </Link>
      ))}
    </div>
  );
}
