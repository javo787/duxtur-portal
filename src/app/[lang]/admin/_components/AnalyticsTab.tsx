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

  if (isLoading) return <div className="py-10 text-center text-slate-400">Загрузка аналитики...</div>;

  const thirtyDays = [...Array(30)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    d.setHours(0, 0, 0, 0);
    const log = data.profileViews.history?.find((h: any) => new Date(h.date).getTime() === d.getTime());
    return { date: d, count: log?.count || 0 };
  });

  const maxCount = Math.max(...thirtyDays.map(d => d.count), 1);
  const hasProfileData = data.profileViews.total > 0;

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
    <div className="space-y-4">
      {/* Profile views graph or placeholder */}
      {hasProfileData ? (
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
            Посещаемость профиля · 30 дней
          </h3>
          <div className="h-20 w-full flex items-end gap-0.5">
            {thirtyDays.map((d, i) => (
              <div
                key={i}
                className="flex-1 bg-blue-100 hover:bg-blue-500 rounded-t transition-colors"
                style={{ height: `${Math.max((d.count / maxCount) * 100, d.count > 0 ? 8 : 2)}%` }}
                title={`${d.date.toLocaleDateString('ru', { day: 'numeric', month: 'short' })}: ${d.count}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Посещаемость профиля · 30 дней
          </h3>
          <div className="flex items-center gap-3 py-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-base">📈</div>
            <p className="text-sm text-slate-400">Статистика появится после первых посещений профиля</p>
          </div>
        </div>
      )}

      {/* Compact stats – 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { title: 'Просмотры профиля', value: data.profileViews.total, icon: '👁', color: 'text-blue-600' },
          { title: 'Просмотры статей', value: data.articleViews.total, icon: '📄', color: 'text-purple-600' },
          { title: 'Всего записей', value: data.appointments.total, icon: '📅', color: 'text-green-600' },
          { title: 'Клики контактов', value: data.contactClicks.total, icon: '📞', color: 'text-orange-600' },
        ].map((s) => (
          <div key={s.title} className="bg-white p-4 rounded-2xl border shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{s.icon}</span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-tight">{s.title}</p>
            </div>
            <p className={`text-2xl font-black ${s.color}`}>{s.value.toLocaleString('ru')}</p>
          </div>
        ))}
      </div>

      {/* Popular articles – only if there are views */}
      {data.articleViews.byArticle.length > 0 && (
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-900 text-sm">Популярные статьи</h3>
            <button
              onClick={exportCSV}
              className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
            >
              💾 CSV
            </button>
          </div>
          <div className="space-y-2">
            {data.articleViews.byArticle.slice(0, 5).map((a: any) => (
              <div key={a.slug} className="flex items-center justify-between py-2 border-b last:border-0 gap-3">
                <p className="text-sm text-slate-700 truncate flex-1">{a.title?.ru || a.slug}</p>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-blue-400">👁</span>
                  <span className="text-sm font-black text-blue-600">{a.views || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
