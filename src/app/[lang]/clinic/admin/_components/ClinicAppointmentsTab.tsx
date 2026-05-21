'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/i18n';
import { SectionHeader, Spinner } from '@/app/[lang]/admin/_components/_profile-sections/_shared';

export default function ClinicAppointmentsTab({ lang, clinicId }: { lang: string, clinicId: string }) {
  const { t } = useT(lang);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="md" /></div>;

  return (
    <div className="space-y-6 text-slate-800">
      <SectionHeader title={t('booking.title')} subtitle={`Total: ${appointments.length}`} />

      {appointments.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-12 text-center text-slate-400 border border-slate-100 shadow-sm">
          <p className="text-4xl mb-4">📅</p>
          <p className="font-bold">No appointments found for this clinic</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map(app => (
            <div key={app._id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">{app.type}</span>
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
