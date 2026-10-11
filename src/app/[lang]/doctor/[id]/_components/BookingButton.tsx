'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { CalendarCheck2 } from 'lucide-react';
import { useT } from '@/i18n/client';

// The modal (and framer-motion with it) is only needed after a click, so it must not weigh on first load.
const BookingModal = dynamic(() => import('@/components/BookingModal'), { ssr: false });

export default function BookingButton({ doctor, lang }: { doctor: any; lang: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useT();

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
          // lean() skips schema defaults, so a doctor saved before the field existed has none; the modal reads [0]
          doctorConsultationTypes={doctor.consultationTypes?.length ? doctor.consultationTypes : ['in_person']}
          lang={lang}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
