'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useT } from '@/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface BookingModalProps {
  doctorId: string;
  doctorName: string;
  doctorSchedule: any;
  doctorConsultationTypes: string[];
  lang: string;
  onClose: () => void;
}

export default function BookingModal({ doctorId, doctorName, doctorSchedule, doctorConsultationTypes, lang, onClose }: BookingModalProps) {
  const { t } = useT(lang);
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    phone: '',
    email: session?.user?.email || '',
    type: doctorConsultationTypes[0] || 'in_person',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedDate) {
      setIsLoadingSlots(true);
      fetch(`/api/doctor/schedule?doctorId=${doctorId}&date=${selectedDate}`)
        .then(r => r.json())
        .then(data => {
            setAvailableSlots(data);
            setIsLoadingSlots(false);
        })
        .catch(() => setIsLoadingSlots(false));
    }
  }, [selectedDate, doctorId]);

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Введите имя';
    if (!formData.phone.trim()) newErrors.phone = 'Введите номер телефона';
    // Basic phone validation
    if (formData.phone.trim() && !/^\+?[0-9\s-]{7,20}$/.test(formData.phone)) {
        newErrors.phone = 'Некорректный формат номера';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBooking = async () => {
    if (!validateStep3()) return;
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
    if (!selectedDate || !selectedSlot) return;

    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hours, minutes] = selectedSlot.split(':').map(Number);

    const startDate = new Date(year, month - 1, day, hours, minutes);
    const endDate = new Date(startDate.getTime() + 30 * 60000);

    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const start = formatICSDate(startDate);
    const end = formatICSDate(endDate);

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${start}
DTEND:${end}
SUMMARY:${t('booking.title')}: ${doctorName}
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

  const workingHoursText = () => {
    if (!doctorSchedule) return null;
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const workingDays = days.filter(d => doctorSchedule[d]?.isWorking);
    if (workingDays.length === 0) return null;

    // Group consecutive days if possible, or just show a simplified version
    const firstDay = workingDays[0];
    const lastDay = workingDays[workingDays.length - 1];

    const dayLabels: any = { mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс' };

    return `График: ${dayLabels[firstDay]}–${dayLabels[lastDay]} ${doctorSchedule[firstDay].open}–${doctorSchedule[firstDay].close}`;
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-white rounded-t-3xl sm:rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">{t('booking.success')}</h2>
          <p className="text-slate-500 mb-8">
            <span className="font-bold text-slate-700">{doctorName}</span><br />
            {new Date(selectedDate!).toLocaleDateString(lang, { day: 'numeric', month: 'long' })} в {selectedSlot}
            <span className="inline-block ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded">
                {formData.type === 'in_person' ? 'Очно' : formData.type === 'online' ? 'Онлайн' : 'На дому'}
            </span>
          </p>
          <div className="space-y-3">
            <button onClick={downloadICS} className="w-full py-3.5 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-[0.98]">
              📅 {t('booking.addToCalendar')}
            </button>
            <Link
                href={`/${lang}/patient/appointments`}
                className="block w-full py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all active:scale-[0.98] shadow-lg shadow-blue-200"
            >
              Мои записи
            </Link>
            <button onClick={onClose} className="w-full py-3 text-slate-400 font-bold text-sm">Закрыть</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="font-black text-slate-900 text-lg leading-tight">{t('booking.title')}</h2>
            <p className="text-xs text-slate-400 font-medium">{doctorName}</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-300 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-2 bg-slate-50 border-b flex items-center justify-between gap-4">
          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${(step / 3) * 100}%` }}
                className="h-full bg-blue-500 rounded-full"
            />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
            Шаг {step} из 3
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Working Hours Info */}
            <div className="mb-6 p-3 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
                <span className="text-xl">🕒</span>
                <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider leading-tight">
                    {workingHoursText() || 'График работы уточняйте у врача'}
                </p>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-slate-800 uppercase tracking-wide text-sm">{t('booking.selectDate')}</h3>
                    <span className="text-[10px] font-bold text-slate-400">Выберите день</span>
                  </div>

                  {/* Horizontal Scrollable Date Picker */}
                  <div
                    ref={scrollContainerRef}
                    className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide snap-x"
                  >
                    {[...Array(14)].map((_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() + i); // Start from today
                      const iso = d.toISOString().split('T')[0];

                      const dayNamesShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                      const dayKey = dayNamesShort[d.getDay()];
                      const isWorking = doctorSchedule?.[dayKey]?.isWorking;

                      // Check if it's too late for today (e.g., after working hours)
                      const isToday = i === 0;
                      let isPast = false;
                      if (isToday && isWorking) {
                          const now = new Date();
                          const [closeH, closeM] = (doctorSchedule[dayKey].close || '18:00').split(':').map(Number);
                          const closeTime = new Date();
                          closeTime.setHours(closeH, closeM, 0);
                          if (now > closeTime) isPast = true;
                      }

                      const isDisabled = !isWorking || isPast;

                      return (
                        <button
                          key={iso}
                          disabled={isDisabled}
                          onClick={() => { setSelectedDate(iso); setStep(2); }}
                          className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all snap-center border-2 ${
                            selectedDate === iso
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-105' :
                            isDisabled
                                ? 'opacity-20 cursor-not-allowed border-transparent'
                                : 'bg-slate-50 border-slate-50 hover:border-blue-200 text-slate-600'
                          }`}
                        >
                          <div className="text-[10px] font-black uppercase">{d.toLocaleDateString(lang, { weekday: 'short' })}</div>
                          <div className="text-xl font-black">{d.getDate()}</div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-slate-800 uppercase tracking-wide text-sm">{t('booking.selectTime')}</h3>
                    <button onClick={() => setStep(1)} className="text-[10px] font-bold text-blue-600 uppercase">Изменить дату</button>
                  </div>

                  {isLoadingSlots ? (
                    <div className="grid grid-cols-3 gap-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 min-[400px]:grid-cols-4 gap-2.5">
                        {availableSlots.map(s => (
                        <button
                            key={s}
                            onClick={() => { setSelectedSlot(s); setStep(3); }}
                            className={`py-3.5 rounded-2xl border-2 font-black text-sm transition-all active:scale-95 ${
                                selectedSlot === s
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                                : 'border-slate-50 bg-slate-50 text-slate-700 hover:border-blue-100'
                            }`}
                        >
                            {s}
                        </button>
                        ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                        <div className="text-4xl mb-4">😴</div>
                        <p className="text-slate-400 font-bold text-sm">На этот день нет свободных слотов</p>
                        <button onClick={() => setStep(1)} className="mt-4 px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs">Выбрать другой день</button>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-slate-800 uppercase tracking-wide text-sm">{t('booking.yourDetails')}</h3>
                    <div className="text-[10px] font-bold text-slate-400">
                        {new Date(selectedDate!).toLocaleDateString(lang, { day: 'numeric', month: 'short' })} — {selectedSlot}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                        <input
                            className={`w-full p-4 bg-slate-50 border-2 rounded-2xl text-sm font-bold transition-all focus:bg-white focus:border-blue-500 outline-none ${errors.name ? 'border-red-200' : 'border-slate-50'}`}
                            placeholder={t('booking.yourName')}
                            value={formData.name}
                            onChange={e => {
                                setFormData({...formData, name: e.target.value});
                                if (errors.name) setErrors({...errors, name: ''});
                            }}
                        />
                        {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-2 uppercase tracking-wider">{errors.name}</p>}
                    </div>

                    <div>
                        <input
                            className={`w-full p-4 bg-slate-50 border-2 rounded-2xl text-sm font-bold transition-all focus:bg-white focus:border-blue-500 outline-none ${errors.phone ? 'border-red-200' : 'border-slate-50'}`}
                            placeholder={t('booking.phone')}
                            value={formData.phone}
                            onChange={e => {
                                setFormData({...formData, phone: e.target.value});
                                if (errors.phone) setErrors({...errors, phone: ''});
                            }}
                        />
                        {errors.phone && <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-2 uppercase tracking-wider">{errors.phone}</p>}
                    </div>

                    <div>
                        <input
                            className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-bold transition-all focus:bg-white focus:border-blue-500 outline-none"
                            placeholder="Email (необязательно)"
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <label className="block">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Тип консультации</span>
                            <select
                                className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-500 outline-none appearance-none"
                                value={formData.type}
                                onChange={e => setFormData({...formData, type: e.target.value})}
                            >
                                {doctorConsultationTypes.map(typ => (
                                <option key={typ} value={typ}>
                                    {typ === 'in_person' ? '🏥 Очно в клинике' : typ === 'online' ? '💻 Онлайн консультация' : '🏠 Выезд на дом'}
                                </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <textarea
                        className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-500 outline-none min-h-[100px] resize-none"
                        placeholder={t('booking.notes')}
                        value={formData.notes}
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                        onClick={() => setStep(2)}
                        className="p-4 bg-slate-100 text-slate-600 rounded-2xl font-bold active:scale-95 transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        disabled={isSubmitting}
                        onClick={handleBooking}
                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-blue-200"
                    >
                        {isSubmitting ? 'Бронирование...' : t('booking.book')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
