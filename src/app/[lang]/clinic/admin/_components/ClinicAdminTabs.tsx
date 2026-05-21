'use client';

import { useState } from 'react';
import { useT } from '@/i18n';
import ClinicOverviewTab from './ClinicOverviewTab';
import ClinicProfileTab from './ClinicProfileTab';
import ClinicDoctorsTab from './ClinicDoctorsTab';
import ClinicAppointmentsTab from './ClinicAppointmentsTab';
import ClinicReviewsTab from './ClinicReviewsTab';

export default function ClinicAdminTabs({ lang, clinic, stats }: { lang: string, clinic: any, stats: any }) {
  const { t } = useT(lang);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: t('clinic.overview'), icon: '📊' },
    { id: 'profile', label: t('clinic.profile'), icon: '🏥' },
    { id: 'doctors', label: t('clinic.doctors'), icon: '👨‍⚕️' },
    { id: 'appointments', label: t('booking.title'), icon: '📅' },
    { id: 'reviews', label: t('clinic.reviews'), icon: '⭐' },
  ];

  return (
    <div className="space-y-6">
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-2 py-3 flex justify-around items-center z-50 md:hidden">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all ${
              activeTab === tab.id ? 'text-blue-600 scale-110' : 'text-slate-400'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Desktop Sidebar (Optional, or just top tabs) */}
      <nav className="hidden md:flex gap-2 bg-slate-200/50 p-1.5 rounded-3xl w-fit mb-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div className="pb-10">
        {activeTab === 'overview' && <ClinicOverviewTab lang={lang} stats={stats} />}
        {activeTab === 'profile' && <ClinicProfileTab lang={lang} clinic={clinic} />}
        {activeTab === 'doctors' && <ClinicDoctorsTab lang={lang} clinicId={clinic._id} />}
        {activeTab === 'appointments' && <ClinicAppointmentsTab lang={lang} clinicId={clinic._id} />}
        {activeTab === 'reviews' && <ClinicReviewsTab lang={lang} clinicId={clinic._id} />}
      </div>
    </div>
  );
}
