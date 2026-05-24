'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/i18n';

export default function ClinicOverviewTab({ lang, stats }: { lang: string, stats: any }) {
  const { t } = useT(lang);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clinic/analytics')
      .then(r => r.json())
      .then(d => {
        setAnalytics(d);
        setLoading(false);
      });
  }, []);

  const cards = [
    { label: t('clinic.stats'), value: stats.views, icon: '👁️', color: 'bg-blue-50 text-blue-600' },
    { label: t('clinic.doctors'), value: stats.doctors, icon: '👨‍⚕️', color: 'bg-green-50 text-green-600' },
    { label: t('booking.title'), value: stats.appointments, icon: '📅', color: 'bg-purple-50 text-purple-600' },
    { label: t('clinic.reviews'), value: stats.reviews, icon: '⭐', color: 'bg-amber-50 text-amber-600' },
    { label: t('clinic.invitations'), value: stats.pendingInvitations, icon: '📩', color: 'bg-pink-50 text-pink-600' },
  ];

  const thirtyDays = analytics ? [...Array(30)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    d.setHours(0, 0, 0, 0);
    const log = analytics.profileViews.history?.find((h: any) => new Date(h.date).getTime() === d.getTime());
    return { date: d, count: log?.count || 0 };
  }) : [];

  const maxCount = analytics ? Math.max(...thirtyDays.map(d => d.count), 1) : 1;

  return (
    <div className="space-y-8">
      {analytics && (
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2">
             {t('clinic.stats')} · 30 {t('common.days')}
          </h3>
          <div className="h-24 w-full flex items-end gap-1 px-2">
            {thirtyDays.map((d, i) => (
              <div
                key={i}
                className="flex-1 bg-blue-100 hover:bg-blue-600 rounded-t-lg transition-all"
                style={{ height: `${Math.max((d.count / maxCount) * 100, d.count > 0 ? 10 : 4)}%` }}
                title={`${d.date.toLocaleDateString()}: ${d.count}`}
              />
            ))}
          </div>
        </div>
      )}

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
