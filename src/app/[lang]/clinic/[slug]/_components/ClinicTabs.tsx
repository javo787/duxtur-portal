'use client';

import { useState } from 'react';
import { useT } from '@/i18n';
import ClinicDoctors from './ClinicDoctors';
import ClinicServices from './ClinicServices';
import ClinicGallery from './ClinicGallery';
import ClinicReviews from './ClinicReviews';
import ClinicBookingWidget from './ClinicBookingWidget';
import ClinicRating from './ClinicRating';
import { motion } from 'framer-motion';
import { useScrollVisibility } from '@/hooks/useScrollVisibility';

interface MultilingualString {
  ru?: string;
  uz?: string;
  tg?: string;
  kk?: string;
  ky?: string;
}

interface Clinic {
  name: MultilingualString;
  slug: string;
  description: MultilingualString;
  quote?: MultilingualString;
  history?: MultilingualString;
  specialties: string[];
  workingHours?: Record<string, { open: string; close: string; isWorking: boolean }>;
  address: string;
  phone: string;
  photos: string[];
  doctorIds: any[];
  services: any[];
  rating: { avg: number; count: number };
}

const HEADER_HEIGHT = 64; // px
const STICKY_GAP = 8; // px
const TAB_OFFSET_VISIBLE = HEADER_HEIGHT + STICKY_GAP;
const TAB_OFFSET_HIDDEN = 16; // px

export default function ClinicTabs({ clinic, lang }: { clinic: Clinic; lang: string }) {
  const { t } = useT(lang);
  const [activeTab, setActiveTab] = useState('overview');
  const { visible: headerVisible } = useScrollVisibility();

  const tabs = [
    { id: 'overview', label: t('clinic.overview') },
    { id: 'booking', label: t('booking.title') },
    { id: 'doctors', label: t('clinic.doctors') },
    { id: 'services', label: t('clinic.services') },
    { id: 'reviews', label: t('clinic.reviews') },
    { id: 'gallery', label: t('clinic.gallery') },
  ];

  return (
    <div className="space-y-8" id="clinic-tabs-container">
      {/* Tab Switcher */}
      <div
        className="flex gap-1.5 overflow-x-auto no-scrollbar bg-white/95 backdrop-blur-xl p-1.5 rounded-2xl md:rounded-[2rem] w-fit max-w-full sticky z-20 border border-slate-200/50 shadow-xl shadow-slate-200/20 transition-all duration-300"
        style={{ top: headerVisible ? `${TAB_OFFSET_VISIBLE}px` : `${TAB_OFFSET_HIDDEN}px` }}
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 md:px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap z-10 ${
              activeTab === tab.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white shadow-sm rounded-2xl -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-800">
             <div className="lg:col-span-2 space-y-8">
                {/* Quote Section */}
                {((clinic.quote as any)?.[lang] || (clinic.quote as any)?.ru) && (
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 xs:p-6 md:p-20 rounded-3xl md:rounded-[3rem] text-white relative overflow-hidden shadow-2xl shadow-blue-500/30">
                    <span className="absolute top-8 left-8 text-8xl opacity-10 font-serif">“</span>
                    <p className="text-lg xs:text-xl md:text-3xl font-black italic leading-relaxed relative z-10 tracking-tight">
                      {(clinic.quote as any)[lang] || (clinic.quote as any).ru}
                    </p>
                    <div className="mt-10 flex items-center gap-4">
                      <div className="w-12 h-1 bg-white/30 rounded-full" />
                      <p className="text-xs font-black uppercase tracking-widest text-blue-100">{t('clinic.chiefQuote')}</p>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                  </div>
                )}

                <div className="bg-white p-4 xs:p-6 md:p-12 rounded-3xl md:rounded-[3rem] border border-slate-200/50 shadow-sm">
                   <h2 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight font-display">{t('clinic.about')}</h2>
                   <p className="text-slate-600/90 leading-relaxed whitespace-pre-wrap font-medium tracking-tight text-lg">
                      {(clinic.description as any)[lang] || (clinic.description as any).ru}
                   </p>
                </div>

                {/* History Section */}
                {((clinic.history as any)?.[lang] || (clinic.history as any)?.ru) && (
                  <div className="bg-white p-4 xs:p-6 md:p-12 rounded-3xl md:rounded-[3rem] border border-slate-200/50 shadow-sm">
                    <h2 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight font-display">{t('clinic.history')}</h2>
                    <p className="text-slate-600/90 leading-relaxed whitespace-pre-wrap font-medium tracking-tight text-lg">
                      {(clinic.history as any)[lang] || (clinic.history as any).ru}
                    </p>
                  </div>
                )}

                <div className="bg-white p-4 xs:p-6 md:p-12 rounded-3xl md:rounded-[3rem] border border-slate-200/50 shadow-sm">
                   <h2 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight font-display">{t('clinic.specialties')}</h2>
                   <div className="flex flex-wrap gap-2">
                      {clinic.specialties.map((s: string) => (
                        <span key={s} className="px-5 py-2.5 bg-blue-50/50 text-blue-600 rounded-2xl text-xs font-black uppercase tracking-wider border border-blue-100/50">{s}</span>
                      ))}
                   </div>
                </div>
             </div>

             <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">{t('doctor.reviewRating')}</h2>
                  <ClinicRating avg={clinic.rating?.avg || 0} count={clinic.rating?.count || 0} lang={lang} />
                </div>

                <div className="bg-white p-4 xs:p-6 rounded-3xl border border-slate-200/50 shadow-sm">
                   <h2 className="text-sm font-black text-slate-400 mb-8 uppercase tracking-widest">{t('clinic.workingHours')}</h2>
                   <div className="space-y-4">
                      {['mon','tue','wed','thu','fri','sat','sun'].map((day) => (
                        <div key={day} className="flex justify-between items-center text-sm font-bold">
                           <span className="text-slate-400 uppercase tracking-tighter w-10">
                             {new Date(2024, 0, (['sun','mon','tue','wed','thu','fri','sat'].indexOf(day))).toLocaleDateString(lang, { weekday: 'short' })}
                           </span>
                           <div className="h-px flex-1 mx-4 bg-slate-100" />
                           {clinic.workingHours?.[day]?.isWorking ? (
                             <span className="text-slate-900 font-black">{clinic.workingHours[day].open} – {clinic.workingHours[day].close}</span>
                           ) : (
                             <span className="text-red-400 font-black">{t('doctor.dayOff')}</span>
                           )}
                        </div>
                      ))}
                   </div>
                </div>

                <div className="bg-white p-4 xs:p-6 rounded-3xl border border-slate-200/50 shadow-sm">
                   <h2 className="text-sm font-black text-slate-400 mb-8 uppercase tracking-widest">{t('clinic.contacts')}</h2>
                   <div className="space-y-4">
                      <div>
                         <p className="text-[10px] font-black text-slate-300 uppercase mb-1">{t('clinic.address')}</p>
                         <p className="text-sm font-bold text-slate-700">{clinic.address}</p>
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-slate-300 uppercase mb-1">{t('auth.registerPhone')}</p>
                         <p className="text-sm font-bold text-slate-700">{clinic.phone}</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'booking' && <ClinicBookingWidget doctors={clinic.doctorIds} lang={lang} />}
        {activeTab === 'doctors' && <ClinicDoctors doctors={clinic.doctorIds} lang={lang} />}
        {activeTab === 'services' && <ClinicServices services={clinic.services} lang={lang} />}
        {activeTab === 'gallery' && <ClinicGallery photos={clinic.photos} />}
        {activeTab === 'reviews' && <ClinicReviews slug={clinic.slug} lang={lang} rating={clinic.rating} />}
      </div>
    </div>
  );
}
