'use client';

import { useState, useEffect } from 'react';

export function AppointmentsTab({ lang }: { lang: string }) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAppointments = () => {
    setIsLoading(true);
    fetch('/api/doctor/appointments')
      .then(r => r.json())
      .then(data => {
        setAppointments(data);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchAppointments();
      } else {
        const data = await res.json();
        alert(`Ошибка: ${data.error || 'Не удалось обновить статус'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Произошла ошибка при обновлении статуса');
    }
  };

  if (isLoading) return <div className="py-10 text-center text-slate-400">Загрузка...</div>;

  return (
    <div className="space-y-4">
      {/* Stats cards – 2 columns */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Всего записей</p>
          <p className="text-2xl font-black mt-1 text-slate-900">{appointments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Предстоит</p>
          <p className="text-2xl font-black mt-1 text-blue-600">
            {appointments.filter((a: any) => a.status === 'confirmed' || a.status === 'pending').length}
          </p>
        </div>
      </div>

      {appointments.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-2xl border shadow-sm p-10 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl">📅</div>
          <div>
            <p className="font-bold text-slate-800 text-base">Пока нет записей</p>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              Когда пациенты запишутся на приём,<br />они появятся здесь
            </p>
          </div>
        </div>
      ) : (
        /* Appointment cards instead of table */
        <div className="space-y-3">
          {appointments.map((apt: any) => (
            <div key={apt._id.toString()} className="bg-white rounded-2xl border shadow-sm p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{apt.patientName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{apt.patientPhone}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase shrink-0 ${
                  apt.status === 'confirmed' ? 'bg-green-50 text-green-600 border border-green-100' :
                  apt.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                  apt.status === 'completed' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                  'bg-slate-50 text-slate-400 border border-slate-100'
                }`}>
                  {apt.status === 'confirmed' ? 'Подтверждён' :
                   apt.status === 'pending' ? 'Ожидает' :
                   apt.status === 'completed' ? 'Завершён' :
                   apt.status === 'cancelled' ? 'Отменён' : apt.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                <span className="flex items-center gap-1">
                  📅 {new Date(apt.date).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                </span>
                <span>🕒 {apt.timeSlot}</span>
                <span className="uppercase font-bold">
                  {apt.type === 'in_person' ? '🏥 Очно' : apt.type === 'online' ? '💻 Онлайн' : '🏠 На дому'}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {apt.status === 'pending' && (
                  <button onClick={() => updateStatus(apt._id, 'confirmed')}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition">
                    ✅ Подтвердить
                  </button>
                )}
                {apt.status === 'confirmed' && (
                  <>
                    <button onClick={() => updateStatus(apt._id, 'completed')}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition">
                      ✔ Завершить
                    </button>
                    <button onClick={() => updateStatus(apt._id, 'no_show')}
                      className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 hover:bg-amber-100 transition">
                      Не пришёл
                    </button>
                  </>
                )}
                {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                  <button onClick={() => updateStatus(apt._id, 'cancelled')}
                    className="px-3 py-1.5 bg-red-50 text-red-500 text-xs font-bold rounded-lg border border-red-100 hover:bg-red-100 transition">
                    Отменить
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
