'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/i18n';
import { SectionHeader, Spinner } from '@/app/[lang]/admin/_components/_profile-sections/_shared';

export default function ClinicAppointmentsTab({ lang, clinicId }: { lang: string, clinicId: string }) {
  const { t } = useT(lang);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetch('/api/clinic/appointments')
      .then(res => res.json())
      .then(data => {
        setAppointments(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const filtered = appointments.filter(a => statusFilter === 'all' || a.status === statusFilter);

  const exportCSV = () => {
    let csv = '\uFEFFPatient,Date,Time,Type,Doctor,Status\n';
    appointments.forEach((app: any) => {
      csv += `"${app.patientName}","${new Date(app.date).toLocaleDateString()}","${app.timeSlot}","${app.type}","${app.doctorId?.name}","${app.status}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `clinic-appointments-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="md" /></div>;

  return (
    <div className="space-y-6 text-slate-800 pb-20">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <SectionHeader title={t('booking.title')} subtitle={`Total: ${appointments.length}`} />
        <div className="flex gap-2">
           <select
             value={statusFilter}
             onChange={e => setStatusFilter(e.target.value)}
             className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
           >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
           </select>
           <button
             onClick={exportCSV}
             className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition"
           >
             💾 CSV
           </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-12 text-center text-slate-400 border border-slate-100 shadow-sm">
          <p className="text-4xl mb-4">📅</p>
          <p className="font-bold">No appointments found for this clinic</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(app => (
            <div key={app._id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">{app.type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      app.status === 'completed' ? 'bg-green-50 text-green-600' :
                      app.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                      app.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                      'bg-slate-50 text-slate-600'
                    }`}>
                      {app.status}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">{new Date(app.date).toLocaleDateString()} at {app.timeSlot}</span>
                  </div>
                  <p className="font-black text-slate-900">{app.patientName}</p>
                  <p className="text-sm text-slate-500 font-bold">{app.patientPhone}</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Doctor</p>
                  <p className="text-sm font-bold text-slate-700">{app.doctorId.name}</p>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
