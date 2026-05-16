'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface BookingModalProps {
  doctorId: string;
  doctorName: string;
  doctorSchedule: any;
  doctorConsultationTypes: string[];
  lang: string;
  onClose: () => void;
}

export default function BookingModal({ doctorId, doctorName, doctorSchedule, doctorConsultationTypes, lang, onClose }: BookingModalProps) {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    phone: '',
    email: session?.user?.email || '',
    type: doctorConsultationTypes[0] || 'in_person',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      fetch(`/api/doctor/schedule?doctorId=${doctorId}&date=${selectedDate}`)
        .then(r => r.json())
        .then(setAvailableSlots);
    }
  }, [selectedDate, doctorId]);

  const labels: any = {
    ru: { step1: 'Выберите дату', step2: 'Выберите время', step3: 'Ваши данные', step4: 'Подтверждение', book: 'Записаться', success: 'Вы успешно записаны!', ics: 'Добавить в календарь' },
    uz: { step1: 'Sanani tanlang', step2: 'Vaqtni tanlang', step3: 'Ma’lumotlar', step4: 'Tasdiqlash', book: 'Yozilish', success: 'Muvaffaqiyatli yozildingiz!', ics: 'Kalendarga qoʻshish' },
    tg: { step1: 'Санаро интихоб кунед', step2: 'Вақтро интихоб кунед', step3: 'Маълумоти шумо', step4: 'Тасдиқ', book: 'Сабт шудан', success: 'Шумо бомуваффақият сабт шудед!', ics: 'Ба тақвим илова кунед' },
    kk: { step1: 'Күнді таңдаңыз', step2: 'Уақытты таңдаңыз', step3: 'Сіздің деректеріңіз', step4: 'Растау', book: 'Жазылу', success: 'Сіз сәтті жазылдыңыз!', ics: 'Күнтізбеге қосу' },
    ky: { step1: 'Күндү тандаңыз', step2: 'Убакытты тандаңыз', step3: 'Сиздин маалыматтар', step4: 'Ырастоо', book: 'Жазылуу', success: 'Сиз ийгиликтүү жазылдыңыз!', ics: 'Күнтізбеге кошуу' }
  };
  const L = (k: string) => labels[lang]?.[k] || labels.ru[k];

  const handleBooking = async () => {
    setIsSubmitting(true);
    const res = await fetch('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        doctorId,
        patientName: formData.name,
        patientPhone: formData.phone,
        patientEmail: formData.email,
        date: selectedDate,
        timeSlot: selectedSlot,
        type: formData.type,
        notes: formData.notes
      })
    });
    setIsSubmitting(false);
    if (res.ok) setIsSuccess(true);
  };

  const downloadICS = () => {
    const start = `${selectedDate?.replace(/-/g, '')}T${selectedSlot?.replace(':', '')}00`;
    const end = `${selectedDate?.replace(/-/g, '')}T${selectedSlot?.replace(':', '')}30`; // Default 30 min
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${start}
DTEND:${end}
SUMMARY:Запись к врачу: ${doctorName}
DESCRIPTION:Консультация (${formData.type})
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `booking-${selectedDate}.ics`;
    link.click();
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-black mb-2">{L('success')}</h2>
          <p className="text-slate-500 mb-6">{doctorName}, {selectedDate} в {selectedSlot}</p>
          <div className="space-y-3">
            <button onClick={downloadICS} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition">
              📅 {L('ics')}
            </button>
            <button onClick={onClose} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Закрыть</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="font-black text-slate-900">Запись к врачу</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold">{L('step1')}</h3>
              <div className="grid grid-cols-7 gap-1">
                 {/* Simplified calendar logic */}
                 {[...Array(14)].map((_, i) => {
                   const d = new Date();
                   d.setDate(d.getDate() + i + 1);
                   const iso = d.toISOString().split('T')[0];
                   return (
                     <button
                       key={iso}
                       onClick={() => { setSelectedDate(iso); setStep(2); }}
                       className={`p-2 rounded-lg text-center transition ${selectedDate === iso ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}
                     >
                       <div className="text-[10px] uppercase">{d.toLocaleDateString(lang, { weekday: 'short' })}</div>
                       <div className="font-bold">{d.getDate()}</div>
                     </button>
                   );
                 })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold">{L('step2')}</h3>
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map(s => (
                  <button
                    key={s}
                    onClick={() => { setSelectedSlot(s); setStep(3); }}
                    className={`py-2 rounded-lg border font-bold text-sm ${selectedSlot === s ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-100 hover:border-blue-300'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="text-sm text-blue-600 font-bold">← Назад</button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold">{L('step3')}</h3>
              <input
                className="w-full p-3 bg-slate-50 border rounded-xl"
                placeholder="Ваше имя"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
              <input
                className="w-full p-3 bg-slate-50 border rounded-xl"
                placeholder="Телефон"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
              <select
                className="w-full p-3 bg-slate-50 border rounded-xl"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                {doctorConsultationTypes.map(t => (
                  <option key={t} value={t}>{t === 'in_person' ? 'В клинике' : t === 'online' ? 'Онлайн' : 'На дому'}</option>
                ))}
              </select>
              <textarea
                className="w-full p-3 bg-slate-50 border rounded-xl"
                placeholder="Жалобы или примечания"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
              <button
                disabled={isSubmitting || !formData.name || !formData.phone}
                onClick={handleBooking}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Бронирование...' : L('book')}
              </button>
              <button onClick={() => setStep(2)} className="text-sm text-blue-600 font-bold">← Назад</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
