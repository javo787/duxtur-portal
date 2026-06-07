'use client';

import { useState } from 'react';
import { useT } from '@/i18n';
import ClinicDoctors from './ClinicDoctors';
import ClinicServices from './ClinicServices';
import ClinicGallery from './ClinicGallery';
import ClinicReviews from './ClinicReviews';
import ClinicBookingWidget from './ClinicBookingWidget';
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
        className="flex gap-1 overflow-x-auto no-scrollbar bg-white sticky z-20 border-b border-slate-200 shadow-sm transition-all duration-300 -mx-4 md:-mx-8 px-4 md:px-8"
        style={{ top: headerVisible ? `${TAB_OFFSET_VISIBLE}px` : `${TAB_OFFSET_HIDDEN}px` }}
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 md:px-6 py-4 text-[13px] font-semibold uppercase tracking-wide transition-all whitespace-nowrap border-b-2 ${
              activeTab === tab.id
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-500 hover:text-slate-900 border-transparent'
            }`}
          >
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

                <div className="bg-[#f8faff] p-8 rounded-xl border-l-4 border-blue-600 shadow-sm">
                   <h2 className="text-[13px] font-bold text-[#94a3b8] mb-4 uppercase tracking-[0.12em]">{t('clinic.about')}</h2>
                   <p className="text-[15px] leading-[1.7] text-[#374151] whitespace-pre-wrap">
                      {(clinic.description as any)[lang] || (clinic.description as any).ru}
                   </p>
                </div>

                {/* History Section */}
                {((clinic.history as any)?.[lang] || (clinic.history as any)?.ru) && (
                  <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm">
                    <h2 className="text-[13px] font-bold text-[#94a3b8] mb-4 uppercase tracking-[0.12em]">{t('clinic.history')}</h2>
                    <p className="text-[15px] leading-[1.7] text-[#374151] whitespace-pre-wrap">
                      {(clinic.history as any)[lang] || (clinic.history as any).ru}
                    </p>
                  </div>
                )}

                <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm">
                   <h2 className="text-[13px] font-bold text-[#94a3b8] mb-6 uppercase tracking-[0.12em]">{t('clinic.specialties')}</h2>
                   <div className="flex flex-wrap gap-2">
                      {clinic.specialties.map((s: string) => (
                        <span key={s} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold uppercase tracking-wide">
                          {s}
                        </span>
                      ))}
                   </div>
                </div>
             </div>

             <div className="space-y-8">
                {/* Premium Trust Signals Sidebar */}
                <div className="space-y-4">
                   <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
                      {/* Rating Trust Card */}
                      <div className="text-center pb-6 border-b border-slate-50">
                        <div className="text-4xl font-black text-slate-900 mb-1">
                          {clinic.rating?.avg?.toFixed(1) || '0.0'} <span className="text-lg text-slate-300 font-medium">/ 5</span>
                        </div>
                        <div className="flex justify-center text-amber-400 text-lg mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i}>{i < Math.round(clinic.rating?.avg || 0) ? '★' : '☆'}</span>
                          ))}
                        </div>
                        <div className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">
                          {clinic.rating?.count || 0} {t('blog.ratings')}
                        </div>
                      </div>

                      {/* Verified Badge Card */}
                      <div className="flex items-center gap-4 group">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{t('clinic.verified')}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{t('doctor.diplomaVerified')}</p>
                        </div>
                      </div>

                      {/* Doctor Count */}
                      <div className="flex items-center gap-4 group">
                        <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center shrink-0">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{t('common.doctors')}: {clinic.doctorIds?.length || 0}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{t('home.authorsSubtitle')}</p>
                        </div>
                      </div>

                      {/* Founded Date */}
                      {(clinic as any).createdAt && (
                        <div className="flex items-center gap-4 group border-t border-slate-50 pt-6">
                           <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.12em]">
                             {t('common.since')} {new Date((clinic as any).createdAt).getFullYear()}
                           </div>
                        </div>
                      )}
                   </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                   <h2 className="text-[13px] font-bold text-[#94a3b8] mb-6 uppercase tracking-[0.12em]">{t('clinic.workingHours')}</h2>
                   <div className="space-y-1">
                      {['mon','tue','wed','thu','fri','sat','sun'].map((day) => {
                        const isToday = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase() === day;
                        return (
                          <div key={day} className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm ${isToday ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-600'}`}>
                             <span className="uppercase w-10">
                               {new Date(2024, 0, (['sun','mon','tue','wed','thu','fri','sat'].indexOf(day))).toLocaleDateString(lang, { weekday: 'short' })}
                             </span>
                             {clinic.workingHours?.[day]?.isWorking ? (
                               <span>{clinic.workingHours[day].open} – {clinic.workingHours[day].close}</span>
                             ) : (
                               <span className="text-red-400 font-medium">{t('doctor.dayOff')}</span>
                             )}
                          </div>
                        );
                      })}
                   </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                   <h2 className="text-[13px] font-bold text-[#94a3b8] mb-6 uppercase tracking-[0.12em]">{t('clinic.contacts')}</h2>
                   <div className="space-y-4">
                      <div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t('clinic.address')}</p>
                         <p className="text-sm font-bold text-[#374151]">{clinic.address}</p>
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t('auth.registerPhone')}</p>
                         <p className="text-sm font-bold text-[#374151]">{clinic.phone}</p>
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
