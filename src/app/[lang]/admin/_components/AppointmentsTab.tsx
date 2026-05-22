'use client';

import { useState, useEffect, useMemo } from 'react';

type FilterStatus = 'all' | 'upcoming' | 'completed' | 'cancelled';

export function AppointmentsTab({ lang }: { lang: string }) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  const fetchAppointments = () => {
    setIsLoading(true);
    fetch('/api/doctor/appointments')
      .then(r => r.json())
      .then(data => {
        setAppointments(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(() => {
        setAppointments([]);
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

  const filteredAppointments = useMemo(() => {
    if (activeFilter === 'all') return appointments;
    if (activeFilter === 'upcoming') return appointments.filter(a => a.status === 'confirmed' || a.status === 'pending');
    if (activeFilter === 'completed') return appointments.filter(a => a.status === 'completed');
    if (activeFilter === 'cancelled') return appointments.filter(a => a.status === 'cancelled' || a.status === 'no_show');
    return appointments;
  }, [appointments, activeFilter]);

  const todayAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(a => a.date === today && a.status !== 'cancelled');
  }, [appointments]);

  if (isLoading) return <div className="py-10 text-center text-slate-400">Загрузка...</div>;

  return (
    <div className="space-y-6">
      {/* Stats cards – 2 columns */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Всего записей</p>
          <p className="text-2xl font-black mt-1 text-slate-900">{appointments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Предстоит</p>
          <p className="text-2xl font-black mt-1 text-blue-600">
            {appointments.filter((a: any) => a.status === 'confirmed' || a.status === 'pending').length}
          </p>
        </div>
      </div>

      {/* Today's appointments section */}
      {todayAppointments.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Записи на сегодня</h3>
          </div>
          <div className="space-y-3">
            {todayAppointments.map((apt: any) => (
              <AppointmentCard key={apt._id} apt={apt} onStatusUpdate={updateStatus} isToday />
            ))}
          </div>
        </section>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(['all', 'upcoming', 'completed', 'cancelled'] as FilterStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap border-2 ${
              activeFilter === f
                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
            }`}
          >
            {f === 'all' ? 'Все' : f === 'upcoming' ? 'Предстоящие' : f === 'completed' ? 'Завершенные' : 'Отмененные'}
          </button>
        ))}
      </div>

      {filteredAppointments.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-4xl shadow-inner">
            {activeFilter === 'cancelled' ? '🚫' : activeFilter === 'completed' ? '✅' : '📅'}
          </div>
          <div>
            <p className="font-black text-slate-800 text-lg">
              {activeFilter === 'all' ? 'Пока нет записей' :
               activeFilter === 'upcoming' ? 'Нет предстоящих записей' :
               activeFilter === 'completed' ? 'Нет завершенных записей' : 'Нет отмененных записей'}
            </p>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-[240px] mx-auto">
              {activeFilter === 'all' ? 'Когда пациенты запишутся на приём, они появятся здесь' :
               'В этой категории пока пусто. Попробуйте выбрать другой фильтр.'}
            </p>
          </div>
        </div>
      ) : (
        /* Appointment cards */
        <div className="space-y-3">
          {filteredAppointments.map((apt: any) => (
            <AppointmentCard key={apt._id} apt={apt} onStatusUpdate={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ apt, onStatusUpdate, isToday = false }: { apt: any, onStatusUpdate: (id: string, s: string) => void, isToday?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 ${isToday ? 'border-blue-200 shadow-md ring-1 ring-blue-50' : 'border-slate-100 shadow-sm'}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="font-black text-slate-900 text-base">{apt.patientName}</p>
            <p className="text-xs font-bold text-slate-400 mt-0.5 tracking-tight">{apt.patientPhone}</p>
          </div>
          <span className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 border-2 ${
            apt.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-100' :
            apt.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
            apt.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-100' :
            apt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
            'bg-slate-50 text-slate-500 border-slate-100'
          }`}>
            {apt.status === 'confirmed' ? 'Подтверждён' :
             apt.status === 'pending' ? 'Ожидает' :
             apt.status === 'completed' ? 'Завершён' :
             apt.status === 'cancelled' ? 'Отменён' :
             apt.status === 'no_show' ? 'Не пришёл' : apt.status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-50 px-3 py-2 rounded-xl">
             <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Дата</p>
             <p className="text-xs font-bold text-slate-700 whitespace-nowrap">📅 {new Date(apt.date).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}</p>
          </div>
          <div className="bg-slate-50 px-3 py-2 rounded-xl">
             <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Время</p>
             <p className="text-xs font-bold text-slate-700">🕒 {apt.timeSlot}</p>
          </div>
          <div className="bg-slate-50 px-3 py-2 rounded-xl col-span-2 sm:col-span-1">
             <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Формат</p>
             <p className="text-xs font-bold text-slate-700">
                {apt.type === 'in_person' ? '🏥 Очно' : apt.type === 'online' ? '💻 Онлайн' : '🏠 На дому'}
             </p>
          </div>
        </div>

        {apt.notes && (
          <div className="mb-4 p-3 bg-blue-50/50 rounded-xl border border-blue-50">
            <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Заметка пациента</p>
            <p className="text-[13px] text-slate-700 italic leading-relaxed">"{apt.notes}"</p>
          </div>
        )}

        <div className="flex gap-2 flex-wrap pt-2 border-t border-slate-50">
          {apt.status === 'pending' && (
            <button onClick={() => onStatusUpdate(apt._id, 'confirmed')}
              className="flex-1 min-w-[120px] px-4 py-2.5 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-100 active:scale-95">
              ✅ Подтвердить
            </button>
          )}
          {apt.status === 'confirmed' && (
            <>
              <button onClick={() => onStatusUpdate(apt._id, 'completed')}
                className="flex-1 min-w-[100px] px-4 py-2.5 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition shadow-md shadow-emerald-100 active:scale-95">
                ✔ Завершить
              </button>
              <button onClick={() => onStatusUpdate(apt._id, 'no_show')}
                className="px-4 py-2.5 bg-amber-50 text-amber-700 text-[11px] font-black uppercase tracking-widest rounded-xl border-2 border-amber-100 hover:bg-amber-100 transition active:scale-95">
                Не пришёл
              </button>
            </>
          )}
          {apt.status !== 'cancelled' && apt.status !== 'completed' && apt.status !== 'no_show' && (
            <button onClick={() => onStatusUpdate(apt._id, 'cancelled')}
              className="px-4 py-2.5 bg-red-50 text-red-500 text-[11px] font-black uppercase tracking-widest rounded-xl border-2 border-red-50 hover:bg-red-100 transition active:scale-95">
              Отменить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
