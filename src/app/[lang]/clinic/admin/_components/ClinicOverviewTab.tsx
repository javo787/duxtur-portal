'use client';

import { useT } from '@/i18n';

export default function ClinicOverviewTab({ lang, stats }: { lang: string, stats: any }) {
  const { t } = useT(lang);

  const cards = [
    { label: t('clinic.stats'), value: stats.views, icon: '👁️', color: 'bg-blue-50 text-blue-600' },
    { label: t('clinic.doctors'), value: stats.doctors, icon: '👨‍⚕️', color: 'bg-green-50 text-green-600' },
    { label: t('booking.title'), value: stats.appointments, icon: '📅', color: 'bg-purple-50 text-purple-600' },
    { label: t('clinic.reviews'), value: stats.reviews, icon: '⭐', color: 'bg-amber-50 text-amber-600' },
    { label: t('clinic.invitations'), value: stats.pendingInvitations, icon: '📩', color: 'bg-pink-50 text-pink-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((card, i) => (
          <div key={i} className={`${card.color} p-5 rounded-3xl border border-white shadow-sm flex flex-col gap-2`}>
            <span className="text-2xl">{card.icon}</span>
            <div>
              <p className="text-2xl font-black">{card.value}</p>
              <p className="text-[10px] font-bold uppercase opacity-60 tracking-wider">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">{t('clinic.recentActivity')}</h3>
        <div className="text-center py-10">
          <p className="text-slate-400 text-sm italic">No recent activity yet</p>
        </div>
      </div>
    </div>
  );
}
