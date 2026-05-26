'use client';

import { useState } from 'react';
import { useT } from '@/i18n';
import ClinicDoctors from './ClinicDoctors';
import ClinicServices from './ClinicServices';
import ClinicGallery from './ClinicGallery';
import ClinicReviews from './ClinicReviews';

export default function ClinicTabs({ clinic, lang }: { clinic: any, lang: string }) {
  const { t } = useT(lang);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: t('clinic.overview') },
    { id: 'doctors', label: t('clinic.doctors') },
    { id: 'services', label: t('clinic.services') },
    { id: 'reviews', label: t('clinic.reviews') },
    { id: 'gallery', label: t('clinic.gallery') },
  ];

  return (
    <div className="space-y-8">
      {/* Tab Switcher */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar bg-slate-200/50 p-1.5 rounded-3xl w-fit sticky top-20 z-20 backdrop-blur-md">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'
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
                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">{t('clinic.about')}</h2>
                   <p className="text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">{(clinic.description as any)[lang] || (clinic.description as any).ru}</p>
                </div>

                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">{t('clinic.specialties')}</h2>
                   <div className="flex flex-wrap gap-2">
                      {clinic.specialties.map((s: string) => (
                        <span key={s} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-wider">{s}</span>
                      ))}
                   </div>
                </div>
             </div>

             <div className="space-y-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <h2 className="text-sm font-black text-slate-400 mb-6 uppercase tracking-widest">{t('clinic.workingHours')}</h2>
                   <div className="space-y-3">
                      {['mon','tue','wed','thu','fri','sat','sun'].map((day) => (
                        <div key={day} className="flex justify-between items-center text-sm font-bold">
                           <span className="text-slate-400 uppercase tracking-tighter w-10">
                             {new Date(2024, 0, (['sun','mon','tue','wed','thu','fri','sat'].indexOf(day))).toLocaleDateString(lang, { weekday: 'short' })}
                           </span>
                           <div className="h-px flex-1 mx-4 bg-slate-50" />
                           {clinic.workingHours?.[day]?.isWorking ? (
                             <span className="text-slate-700">{clinic.workingHours[day].open} – {clinic.workingHours[day].close}</span>
                           ) : (
                             <span className="text-red-400">{t('doctor.dayOff')}</span>
                           )}
                        </div>
                      ))}
                   </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <h2 className="text-sm font-black text-slate-400 mb-6 uppercase tracking-widest">{t('clinic.contacts')}</h2>
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

        {activeTab === 'doctors' && <ClinicDoctors doctors={clinic.doctorIds} lang={lang} />}
        {activeTab === 'services' && <ClinicServices services={clinic.services} lang={lang} />}
        {activeTab === 'gallery' && <ClinicGallery photos={clinic.photos} />}
        {activeTab === 'reviews' && <ClinicReviews slug={clinic.slug} lang={lang} />}
      </div>
    </div>
  );
}
