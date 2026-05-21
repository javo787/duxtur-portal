'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/i18n';
import { SectionHeader, Spinner } from '@/app/[lang]/admin/_components/_profile-sections/_shared';

export default function ClinicDoctorsTab({ lang, clinicId }: { lang: string, clinicId: string }) {
  const { t } = useT(lang);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteSlug, setInviteSlug] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [docsRes, invRes] = await Promise.all([
        fetch(`/api/clinic/doctors?clinicId=${clinicId}`),
        fetch(`/api/clinic/invitations?clinicId=${clinicId}`)
      ]);
      const docsData = await docsRes.json();
      const invData = await invRes.json();
      setDoctors(docsData);
      setInvitations(invData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteSlug) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/clinic/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId, doctorSlug: inviteSlug })
      });
      if (res.ok) {
        alert('Invitation sent');
        setInviteSlug('');
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInviting(false);
    }
  };

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="md" /></div>;

  return (
    <div className="space-y-8">
      {/* Invite Section */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm text-slate-800">
        <SectionHeader title={t('clinic.inviteDoctors')} />
        <div className="flex gap-3 mt-4">
           <input
             value={inviteSlug}
             onChange={e => setInviteSlug(e.target.value)}
             placeholder="Doctor slug or email"
             className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition"
           />
           <button
             onClick={handleInvite}
             disabled={inviting || !inviteSlug}
             className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black transition disabled:opacity-50"
           >
             {inviting ? <Spinner /> : t('clinic.sendInvite')}
           </button>
        </div>
      </div>

      {/* Linked Doctors */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 px-4">{t('clinic.doctors')} ({doctors.length})</h3>
        {doctors.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-10 text-center text-slate-400 border border-slate-100 shadow-sm">No doctors linked yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map(doc => (
              <div key={doc._id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 text-slate-800">
                 <img src={doc.image} className="w-14 h-14 rounded-2xl object-cover" />
                 <div className="flex-1">
                    <p className="font-black text-slate-900">{doc.name}</p>
                    <p className="text-xs text-blue-600 font-bold uppercase">{(doc.specialty as any)?.[lang] || (doc.specialty as any)?.ru}</p>
                 </div>
                 <button className="text-red-500 text-xs font-black uppercase hover:bg-red-50 px-3 py-2 rounded-xl transition">
                   {t('clinic.removeDoctor')}
                 </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 px-4">{t('clinic.invitations')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invitations.map(inv => (
              <div key={inv._id} className="bg-slate-100/50 p-6 rounded-3xl border border-white flex items-center gap-4 opacity-70 text-slate-800">
                 <div className="flex-1">
                    <p className="font-bold text-slate-700">{inv.doctorId.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase">{t('clinic.pendingInvitation')}</p>
                 </div>
                 <span className="text-xs text-slate-400 font-bold">{new Date(inv.sentAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
