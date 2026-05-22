'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Spinner } from './_profile-sections/_shared';

export function ClinicInvitationsTab({ lang }: { lang: string }) {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

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
      } else {
        const error = await res.json();
        alert(error.error || 'Ошибка');
      }
    } catch (error) {
      console.error('Update invitation error:', error);
      alert('Ошибка соединения');
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

  if (invitations.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
        <div className="text-4xl mb-4">🏥</div>
        <p className="text-slate-500 font-medium">Нет приглашений от клиник</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((inv) => (
        <div key={inv._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden relative bg-slate-50 shrink-0">
            <Image
              src={inv.clinicId.logo || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
              alt={inv.clinicId.name?.[lang] || inv.clinicId.name?.ru || ''}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 truncate">
              {inv.clinicId.name?.[lang] || inv.clinicId.name?.ru}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">📍 {inv.clinicId.city}</span>
              <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                {inv.clinicId.type}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => handleAction(inv._id, 'accept')}
              disabled={!!processingId}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              {processingId === inv._id ? <Spinner /> : '✅ Принять'}
            </button>
            <button
              onClick={() => handleAction(inv._id, 'decline')}
              disabled={!!processingId}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              {processingId === inv._id ? <Spinner /> : '❌ Отказать'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
