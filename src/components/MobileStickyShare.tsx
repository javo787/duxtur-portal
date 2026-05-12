// src/components/MobileStickyShare.tsx
'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface MobileStickyShareProps {
  doctorUrl: string;
  doctorName: string;
  specialtyLabel: string;
  lang: string;
}

export default function MobileStickyShare({
  doctorUrl,
  doctorName,
  specialtyLabel,
  lang,
}: MobileStickyShareProps) {
  const [showModal, setShowModal] = useState(false);

  const shareData = {
    title: `${doctorName} — ${specialtyLabel}`,
    url: doctorUrl,
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      setShowModal(true);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(doctorUrl);
  };

  const shareText = lang === 'uz' ? 'Ulashish' : 'Поделиться';
  const copyText = lang === 'uz' ? 'Nusxalash' : 'Копировать';

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 flex items-center justify-between gap-4 share-area z-50">
      <div className="min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{doctorName}</p>
        <p className="text-xs text-gray-500 truncate">{specialtyLabel}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={copyLink}
          className="bg-gray-100 text-gray-700 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-gray-200 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          {copyText}
        </button>
        <button
          onClick={handleNativeShare}
          className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-blue-700 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {shareText}
        </button>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <h3 className="font-bold text-gray-900 mb-2">QR-код</h3>
            <QRCodeSVG value={doctorUrl} size={200} className="mx-auto mb-4" />
            <button
              onClick={() => setShowModal(false)}
              className="bg-gray-100 text-gray-700 text-sm font-bold px-4 py-2 rounded-xl hover:bg-gray-200 transition"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
