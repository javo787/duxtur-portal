'use client';

import { useState } from 'react';
import BookingModal from '@/components/BookingModal';

export default function BookingButton({ doctor, lang }: { doctor: any; lang: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <span>📅</span> Записаться на прием
      </button>

      {isOpen && (
        <BookingModal
          doctorId={doctor.id}
          doctorName={doctor.name}
          doctorSchedule={doctor.schedule}
          doctorConsultationTypes={doctor.consultationTypes}
          lang={lang}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
