'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/i18n';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import BookingModal from '@/components/BookingModal';

interface Doctor {
  _id: string;
  name: string;
  image?: string;
  specialty: any;
  slug: string;
  schedule: any;
  consultationTypes: string[];
}

export default function ClinicBookingWidget({ doctors, lang }: { doctors: Doctor[], lang: string }) {
  const { t } = useT(lang);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showModal, setShowModal] = useState(false);

  if (!doctors || doctors.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5 md:p-8 border-b border-slate-50">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t('booking.title')}</h2>
        <p className="text-sm text-slate-400 font-bold mt-1 uppercase tracking-wider">{t('clinic.selectDoctorTime')}</p>
      </div>

      <div className="divide-y divide-slate-50">
        {doctors.map((doc) => (
          <div key={doc._id} className="p-4 md:p-6 hover:bg-slate-50/50 transition-colors">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Doctor Info */}
              <div className="flex items-center gap-4 min-w-0 md:min-w-[240px]">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                  <Image
                    src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                    alt={doc.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-black text-slate-900">{doc.name}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    {doc.specialty?.[lang] || doc.specialty?.ru}
                  </p>
                </div>
              </div>

              {/* Weekly Slots Preview */}
              <div className="flex-1 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[...Array(7)].map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() + i);
                  const dayNamesShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                  const dayKey = dayNamesShort[d.getDay()];
                  const isWorking = doc.schedule?.[dayKey]?.isWorking;

                  return (
                    <div
                      key={i}
                      className={`flex-shrink-0 w-20 md:w-24 p-2 md:p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                        isWorking ? 'bg-white border-slate-100' : 'bg-slate-50 border-transparent opacity-40'
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase text-slate-400">
                        {d.toLocaleDateString(lang, { weekday: 'short' })}
                      </span>
                      <span className="text-sm font-black text-slate-700">{d.getDate()}</span>
                      {isWorking ? (
                        <button
                          onClick={() => {
                            setSelectedDoctor(doc);
                            setShowModal(true);
                          }}
                          className="mt-1 text-[10px] font-black text-blue-600 uppercase hover:underline"
                        >
                          {doc.schedule[dayKey].open}
                        </button>
                      ) : (
                        <span className="mt-1 text-[10px] font-bold text-slate-300 uppercase">OFF</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center">
                <button
                  onClick={() => {
                    setSelectedDoctor(doc);
                    setShowModal(true);
                  }}
                  className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-100"
                >
                  {t('booking.book')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && selectedDoctor && (
          <BookingModal
            doctorId={selectedDoctor._id}
            doctorName={selectedDoctor.name}
            doctorSchedule={selectedDoctor.schedule}
            doctorConsultationTypes={selectedDoctor.consultationTypes || ['in_person']}
            lang={lang}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
