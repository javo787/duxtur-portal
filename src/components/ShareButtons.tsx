'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // npm install qrcode.react

type Props = { url: string; title: string; lang: string };

const ui: Record<string, Record<string, string>> = {
  share:  { ru: 'Поделиться', uz: 'Ulashish', tg: 'Мубодила', kk: 'Бөлісу', ky: 'Бөлүшүү' },
  copied: { ru: 'Скопировано!', uz: 'Nusxalandi!', tg: 'Нусха гирифта шуд!', kk: 'Көшірілді!', ky: 'Көчүрүлдү!' },
  copy:   { ru: 'Копировать', uz: 'Nusxalash', tg: 'Нусха гирифтан', kk: 'Көшіру', ky: 'Көчүрүү' },
  qr:     { ru: 'QR-код', uz: 'QR-kod', tg: 'QR-код', kk: 'QR-код', ky: 'QR-код' },
};

const L = (key: string, lang: string) => ui[key]?.[lang] || ui[key]?.ru;

export default function ShareButtons({ url, title, lang }: Props) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // На устройствах с Web Share API показываем системный диалог, иначе показываем QR
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      setShowQR(!showQR);
    }
  };

  return (
    <div className="space-y-3">
      {/* Основной ряд кнопок */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-bold text-gray-500">{L('share', lang)}:</span>

        {/* Telegram */}
        <a
          href={`https://t.me/share/url?url=${encoded}&text=${encodedTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#229ED9] hover:bg-[#1a8bbf] text-white rounded-xl font-bold text-sm transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.667l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.892z" />
          </svg>
          Telegram
        </a>

        {/* WhatsApp */}
        <a
          href={`https://wa.me/?text=${encodedTitle}%20${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#1db954] text-white rounded-xl font-bold text-sm transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          WhatsApp
        </a>

        {/* Копировать ссылку */}
        <button
          onClick={copyLink}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition shadow-sm border ${
            copied
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {L('copied', lang)}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {L('copy', lang)}
            </>
          )}
        </button>

        {/* QR-код (только на десктопе или где нет Web Share) */}
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2m0 0H8m4-7V4m0 0L8 8m4-4l4 4m-4 7v4m0 0l-4-4m4 4l4-4" />
          </svg>
          {L('qr', lang)}
        </button>
      </div>

      {/* QR-код, если показано */}
      {showQR && (
        <div className="flex justify-center p-3 bg-white border rounded-2xl shadow-sm">
          <QRCodeSVG value={url} size={140} />
        </div>
      )}
    </div>
  );
}
