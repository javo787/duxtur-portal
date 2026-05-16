'use client';

import { useState, useEffect } from 'react';

export function AppointmentsTab({ lang }: { lang: string }) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/doctor/appointments')
      .then(r => r.json())
      .then(data => {
        setAppointments(data);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <div className="py-10 text-center text-slate-400">Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Всего записей</p>
          <p className="text-3xl font-black mt-1">{appointments.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Предстоит</p>
          <p className="text-3xl font-black mt-1">
             {appointments.filter((a: any) => a.status === 'confirmed' || a.status === 'pending').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Пациент</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Дата и время</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Тип</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Статус</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {appointments.map((apt: any) => (
              <tr key={apt._id.toString()} className="hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <p className="font-bold text-sm text-slate-900">{apt.patientName}</p>
                  <p className="text-xs text-slate-400">{apt.patientPhone}</p>
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  {new Date(apt.date).toLocaleDateString('ru')} в {apt.timeSlot}
                </td>
                <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                  {apt.type}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                    apt.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                    apt.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {apt.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                   {apt.status === 'pending' && (
                     <button className="text-xs font-bold text-blue-600">Подтвердить</button>
                   )}
                   <button className="text-xs font-bold text-slate-400">...</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
