// src/components/DownloadCardButton.tsx
'use client';

import { useState } from 'react';

interface DownloadCardButtonProps {
  doctorName: string;
  lang: string;
}

export default function DownloadCardButton({ doctorName, lang }: DownloadCardButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // Динамический импорт — грузим только по клику
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const page1 = document.getElementById('card-page-1');
      const page2 = document.getElementById('card-page-2');

      if (!page1 || !page2) {
        alert('Ошибка генерации. Попробуйте ещё раз.');
        return;
      }

      // Рендерим страницу 1
      const canvas1 = await html2canvas(page1, {
        scale: 2,              // Ретина качество
        useCORS: true,         // Для фото врача с другого домена
        allowTaint: false,
        backgroundColor: '#060d1a',
        logging: false,
        width: 794,
        height: 1123,
      });

      // Рендерим страницу 2
      const canvas2 = await html2canvas(page2, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#f8fafc',
        logging: false,
        width: 794,
        height: 1123,
      });

      // Создаём PDF A4
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();   // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      // Страница 1
      const img1 = canvas1.toDataURL('image/jpeg', 0.95);
      pdf.addImage(img1, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      // Страница 2
      pdf.addPage();
      const img2 = canvas2.toDataURL('image/jpeg', 0.95);
      pdf.addImage(img2, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      // Скачиваем
      const fileName = `${doctorName.replace(/\s+/g, '_')}_duxtur.pdf`;
      pdf.save(fileName);

    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Не удалось создать PDF. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const btnText = lang === 'uz' ? "Vizitka yuklab olish" : "Скачать визитку (PDF)";
  const loadingText = lang === 'uz' ? "Yaratilmoqda..." : "Создаётся...";

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="no-print w-full bg-gradient-to-r from-[#0a1628] to-[#0f2a52] border border-blue-900/40 rounded-2xl p-4 flex items-center justify-center gap-2.5 text-sm font-bold text-white hover:from-[#0f2a52] hover:to-[#1a3a6e] transition-all duration-300 shadow-sm disabled:opacity-60 disabled:cursor-wait"
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
          </svg>
          {loadingText}
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M15 9a3 3 0 11-6 0 3 3 0 016 0zM3 17c0-3.2 6.4-4.8 9.6-4.8 3.2 0 9.6 1.6 9.6 4.8M4.5 21h15M12 15v6" />
          </svg>
          {btnText}
        </>
      )}
    </button>
  );
}
