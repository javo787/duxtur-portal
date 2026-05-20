// src/components/MobileStickyShare.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useT } from '@/i18n';

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
  const { t } = useT(lang);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Умное скрытие при скролле вниз
  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      // Скролл вниз > 60px → скрыть; вверх → показать
      if (currentY > lastScrollY.current + 8 && currentY > 120) {
        setVisible(false);
      } else if (currentY < lastScrollY.current - 8) {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: `${doctorName} — ${specialtyLabel}`, url: doctorUrl });
    } else {
      setShowModal(true);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(doctorUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`${doctorName} — ${specialtyLabel}\n${doctorUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleTelegram = () => {
    const text = encodeURIComponent(`${doctorName} — ${specialtyLabel}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(doctorUrl)}&text=${text}`, '_blank');
  };

  return (
    <>
      {/* ── Sticky панель ── */}
      <div
        className={`
          lg:hidden fixed bottom-0 inset-x-0 z-50 share-area no-print
          transition-transform duration-300 ease-in-out
          ${visible ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.08)',
        }}
      >
        <div className="px-4 py-3 flex items-center gap-2.5">
          {/* Имя врача */}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-black text-gray-900 truncate leading-tight">{doctorName}</p>
            <p className="text-[11px] text-gray-400 truncate mt-0.5">{specialtyLabel}</p>
          </div>

          {/* Кнопки действий */}
          {/* Копировать */}
          <button
            onClick={handleCopy}
            className={`
              flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12px] font-bold
              transition-all duration-200 shrink-0
              ${copied
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 active:scale-95'
              }
            `}
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                {t('share.copied')}
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {t('share.copy')}
              </>
            )}
          </button>

          {/* Поделиться (нативный шейр) */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12px] font-bold bg-blue-600 text-white border border-blue-700 active:scale-95 transition-all duration-200 shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {t('share.shareProfile')}
          </button>
        </div>
      </div>

      {/* ── Модал QR / Соцсети ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center lg:items-center"
          onClick={() => setShowModal(false)}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Bottom sheet */}
          <div
            className="relative bg-white rounded-t-3xl lg:rounded-2xl w-full max-w-sm p-6 pb-safe"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 lg:hidden" />

            <h3 className="text-base font-black text-gray-900 mb-1">{t('share.shareProfile')}</h3>
            <p className="text-xs text-gray-400 mb-5 truncate">{doctorName} · {specialtyLabel}</p>

            {/* QR */}
            <div className="flex justify-center mb-5">
              <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
                <QRCodeSVG value={doctorUrl} size={140} />
              </div>
            </div>

            {/* Соцсети */}
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <button
                onClick={handleTelegram}
                className="flex items-center justify-center gap-2 bg-[#229ED9]/10 border border-[#229ED9]/20 text-[#0088cc] font-bold text-sm py-3 rounded-xl active:scale-95 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.012 9.482c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 14.6l-2.95-.92c-.642-.2-.655-.642.136-.953l11.52-4.44c.537-.194 1.006.131.686.961z" />
                </svg>
                Telegram
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-2 bg-[#25D366]/10 border border-[#25D366]/20 text-[#128C7E] font-bold text-sm py-3 rounded-xl active:scale-95 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </button>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-gray-100 text-gray-600 font-bold text-sm py-3 rounded-xl active:scale-95 transition"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
