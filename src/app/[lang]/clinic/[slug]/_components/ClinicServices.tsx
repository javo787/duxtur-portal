import { getT } from '@/i18n';

export default function ClinicServices({ services, lang }: { services: any[], lang: string }) {
  const t = getT(lang);

  if (!services || services.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 shadow-sm">
        <p className="text-4xl mb-4">📋</p>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('common.noResults')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile View: Cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {services.map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-sm font-black text-slate-800 leading-tight">{s.name[lang] || s.name.ru}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{t('clinic.services')}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-black text-blue-600">{s.price} {s.currency}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="px-10 py-6">{t('clinic.services')}</th>
              <th className="px-10 py-6 text-right">{t('clinic.price')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-800">
            {services.map((s, i) => (
              <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-10 py-6">
                  <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{s.name[lang] || s.name.ru}</span>
                </td>
                <td className="px-10 py-6 text-right">
                  <span className="inline-block px-4 py-1.5 bg-slate-50 group-hover:bg-blue-600 group-hover:text-white rounded-xl font-black text-blue-600 transition-all text-sm">
                    {s.price} {s.currency}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
