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
        <Link key={doc._id} href={`/${lang}/doctor/${doc.slug || doc._id}`} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
           <div className="flex items-center gap-4 text-slate-800">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                 <Image src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'} alt={doc.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                 <h3 className="font-black group-hover:text-blue-600 transition truncate">{doc.name}</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-wider truncate">{(doc.specialty as any)?.[lang] || (doc.specialty as any)?.ru}</p>
              </div>
           </div>
           <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-slate-800">
              <div className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">
                 {doc.experience} {t('common.yearsExp')}
              </div>
              <div className="text-xs font-bold text-slate-400">
                 ⭐ {doc.reviewAvg} ({doc.reviewCount})
              </div>
           </div>
        </Link>
      ))}
    </div>
  );
}
