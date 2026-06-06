'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // необходимо установить: npm install qrcode.react

interface ShareButtonProps {
  url: string;
  title: string;
}

export default function ShareButton({ url, title }: ShareButtonProps) {
  const [showQR, setShowQR] = useState(false);

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      setShowQR(!showQR);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(url).catch(() => {});
    alert('Ссылка скопирована!');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      <div className="flex gap-2">
        <button
          onClick={handleNativeShare}
          className="flex-1 bg-blue-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Поделиться
        </button>
        <button
          onClick={copyLink}
          className="bg-gray-100 text-gray-700 text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-gray-200 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          Копировать
        </button>
      </div>
      {showQR && (
        <div className="flex justify-center">
          <QRCodeSVG value={url} size={120} />
        </div>
      )}
    </div>
  );
}
