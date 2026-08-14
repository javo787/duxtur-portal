'use client';

import { useState } from 'react';
import { CalendarCheck2 } from 'lucide-react';
import BookingModal from '@/components/BookingModal';
import { useT } from '@/i18n';

export default function BookingButton({ doctor, lang }: { doctor: any; lang: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useT(lang);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 transition-all btn-spring flex items-center justify-center gap-2.5 text-sm"
      >
        <CalendarCheck2 className="w-[18px] h-[18px]" strokeWidth={2.25} />
        {t('doctor.bookAppointment')}
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
