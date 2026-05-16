'use client';

import { useState, useEffect } from 'react';

export function AnalyticsTab() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/doctor/analytics')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <div className="py-10 text-center">Загрузка аналитики...</div>;

  const thirtyDays = [...Array(30)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    d.setHours(0, 0, 0, 0);
    const log = data.profileViews.history?.find((h: any) => new Date(h.date).getTime() === d.getTime());
    return { date: d, count: log?.count || 0 };
  });

  const maxCount = Math.max(...thirtyDays.map(d => d.count), 1);

  const exportCSV = () => {
    let csv = '\uFEFF--- ARTICLES ---\nTitle,Views\n';
    data.articleViews.byArticle.forEach((a: any) => {
      csv += `"${a.title?.ru || a.slug}",${a.views || 0}\n`;
    });

    csv += '\n--- APPOINTMENTS ---\nPatient,Date,Time,Type,Status\n';
    data.appointments.list?.forEach((apt: any) => {
      csv += `"${apt.patientName}","${new Date(apt.date).toLocaleDateString()}","${apt.timeSlot}","${apt.type}","${apt.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics-articles-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
       <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Посещаемость профиля (30 дней)</h3>
          <div className="h-24 w-full flex items-end gap-1">
             {thirtyDays.map((d, i) => (
               <div
                 key={i}
                 className="flex-1 bg-blue-100 rounded-t-sm hover:bg-blue-500 transition-colors"
                 style={{ height: `${(d.count / maxCount) * 100}%` }}
                 title={`${d.date.toLocaleDateString()}: ${d.count}`}
               />
             ))}
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Просмотры профиля" value={data.profileViews.total} />
          <StatCard title="Просмотры статей" value={data.articleViews.total} />
          <StatCard title="Всего записей" value={data.appointments.total} />
          <StatCard title="Клики контактов" value={data.contactClicks.total} />
       </div>

       <div className="bg-white rounded-2xl border p-6">
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-black text-slate-900">Популярные статьи</h3>
             <button
               onClick={exportCSV}
               className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
             >
               💾 Скачать CSV
             </button>
          </div>
          <div className="space-y-3">
             {data.articleViews.byArticle.slice(0, 5).map((a: any) => (
               <div key={a.slug} className="flex items-center justify-between py-2 border-b last:border-0">
                  <p className="text-sm font-bold text-slate-700 truncate flex-1 pr-4">{a.title?.ru || a.slug}</p>
                  <p className="text-sm font-black text-blue-600">{a.views || 0}</p>
               </div>
             ))}
          </div>
       </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string, value: any }) {
  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black mt-1">{value.toLocaleString('ru')}</p>
    </div>
  );
}
