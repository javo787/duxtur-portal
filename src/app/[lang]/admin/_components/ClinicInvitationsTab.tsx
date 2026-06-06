'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Spinner, SectionHeader } from './_profile-sections/_shared';
import { AnimatePresence, motion } from 'framer-motion';

export function ClinicInvitationsTab({ lang }: { lang: string }) {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchInvitations = async () => {
    try {
      const res = await fetch('/api/clinic/invitations/doctor');
      const data = await res.json();
      if (Array.isArray(data)) {
        setInvitations(data.filter(inv => inv.status === 'pending'));
      }
    } catch (error) {
      console.error('Fetch invitations error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'accept' | 'decline') => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/clinic/invitations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setInvitations(prev => prev.filter(inv => inv._id !== id));
        setToast({
          message: action === 'accept' ? 'Приглашение принято' : 'Приглашение отклонено',
          type: 'success'
        });
      } else {
        const error = await res.json();
        setToast({ message: error.error || 'Ошибка', type: 'error' });
      }
    } catch (error) {
      console.error('Update invitation error:', error);
      setToast({ message: 'Ошибка соединения', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12 text-blue-600">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-3 ${
                toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? '✅' : '❌'} {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ваш статус</p>
            <p className="text-sm font-bold text-slate-700">Свободный специалист</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Приглашений</p>
            <p className="text-sm font-bold text-blue-600">{invitations.length} новых</p>
        </div>
      </div>

      {invitations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">🏥</div>
          <h4 className="text-lg font-black text-slate-800 mb-2">Нет приглашений от клиник</h4>
          <p className="text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto">
            Здесь будут появляться предложения о сотрудничестве от медицинских центров. Убедитесь, что ваш профиль заполнен на 100%.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <SectionHeader title="Новые предложения" />
          {invitations.map((inv) => (
            <div key={inv._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:border-blue-100 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden relative bg-slate-50 shrink-0 border border-slate-50 shadow-sm">
                    <Image
                    src={inv.clinicId.logo || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                    alt={inv.clinicId.name?.[lang] || inv.clinicId.name?.ru || ''}
                    fill
                    className="object-cover"
                    sizes="64px"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-black text-slate-900 text-base truncate">
                            {inv.clinicId.name?.[lang] || inv.clinicId.name?.ru}
                        </h4>
                        <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg border border-blue-100">
                            {inv.clinicId.type === 'clinic' ? 'Клиника' : inv.clinicId.type === 'hospital' ? 'Больница' : inv.clinicId.type}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            📍 {inv.clinicId.city}
                        </span>
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            👨‍⚕️ {inv.clinicId.doctorIds?.length || inv.clinicId.doctorCount || 0} врачей
                        </span>
                    </div>
                    {/* Specialty tags */}
                    <div className="flex flex-wrap gap-1.5">
                        {(inv.clinicId.specialties || []).slice(0, 3).map((spec: string) => (
                            <span key={spec} className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                {spec}
                            </span>
                        ))}
                        {(inv.clinicId.specialties || []).length > 3 && (
                            <span className="text-[9px] font-black text-slate-300">+{inv.clinicId.specialties.length - 3}</span>
                        )}
                    </div>
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0 pt-2 sm:pt-0">
                    <button
                    onClick={() => handleAction(inv._id, 'accept')}
                    disabled={!!processingId}
                    className="flex-1 sm:w-32 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-green-100"
                    >
                    {processingId === inv._id ? <Spinner /> : 'Принять'}
                    </button>
                    <button
                    onClick={() => handleAction(inv._id, 'decline')}
                    disabled={!!processingId}
                    className="flex-1 sm:w-32 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                    >
                    {processingId === inv._id ? <Spinner /> : 'Отказать'}
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
