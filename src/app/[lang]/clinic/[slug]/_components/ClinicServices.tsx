import { getT } from '@/i18n';

export default function ClinicServices({ services, lang }: { services: any[], lang: string }) {
  const t = getT(lang);

  if (!services || services.length === 0) {
    return <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">{t('common.noResults')}</div>;
  }

  return (
    <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm">
      <table className="w-full text-left border-collapse">
         <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <tr>
               <th className="px-8 py-5">{t('clinic.services')}</th>
               <th className="px-8 py-5 text-right">{t('clinic.price')}</th>
            </tr>
         </thead>
         <tbody className="divide-y divide-slate-50 text-slate-800">
            {services.map((s, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition">
                 <td className="px-8 py-5 font-bold">{s.name[lang] || s.name.ru}</td>
                 <td className="px-8 py-5 text-right font-black text-blue-600">
                    {s.price} {s.currency}
                 </td>
              </tr>
            ))}
         </tbody>
      </table>
    </div>
  );
}
