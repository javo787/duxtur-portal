'use client';

import ShareButton from '@/app/[lang]/doctor/[id]/_components/ShareButton'; // или можно продублировать кнопку

interface MobileStickyShareProps {
  doctorUrl: string;
  doctorName: string;
  specialtyLabel: string;
}

export default function MobileStickyShare({ doctorUrl, doctorName, specialtyLabel }: MobileStickyShareProps) {
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 flex items-center justify-between gap-4 share-area z-50">
      <div className="min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{doctorName}</p>
        <p className="text-xs text-gray-500 truncate">{specialtyLabel}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => navigator.clipboard.writeText(doctorUrl)}
          className="bg-gray-100 text-gray-700 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-gray-200 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
          Копировать
        </button>
        <ShareButton url={doctorUrl} title={`${doctorName} — ${specialtyLabel}`} />
      </div>
    </div>
  );
}
