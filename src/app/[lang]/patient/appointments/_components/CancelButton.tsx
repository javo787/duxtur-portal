'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CancelButtonProps {
  appointmentId: string;
}

export default function CancelButton({ appointmentId }: CancelButtonProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    if (!confirm('Вы уверены, что хотите отменить запись?')) return;

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', cancelReason: 'Отменено пациентом' })
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(`Ошибка: ${data.error || 'Не удалось отменить запись'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Произошла ошибка при отмене записи');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={isCancelling}
      className="block text-xs font-bold text-red-500 hover:underline disabled:opacity-50"
    >
      {isCancelling ? 'Отмена...' : 'Отменить'}
    </button>
  );
}
