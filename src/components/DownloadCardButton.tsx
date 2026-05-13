// src/components/DownloadCardButton.tsx
'use client';

import { useState } from 'react';

interface DownloadCardButtonProps {
  doctorName: string;
  doctorSlug?: string;
  specialtyLabel: string;
  mission: string;
  experience?: number;
  workplace?: string;
  languages?: string[];
  phone?: string;
  doctorUrl: string;
  articlesCount: number;
  lang: string;
}

export default function DownloadCardButton({
  doctorName,
  specialtyLabel,
  mission,
  experience,
  workplace,
  languages,
  phone,
  doctorUrl,
  articlesCount,
  lang,
}: DownloadCardButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const [{ default: jsPDF }, { default: QRCode }] = await Promise.all([
        import('jspdf'),
        import('qrcode'),
      ]);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const W = 210; // A4 ширина
      const H = 297; // A4 высота

      // ══════════════════════════════════
      // СТРАНИЦА 1 — ТЁМНАЯ (лицевая)
      // ══════════════════════════════════

      // Фон
      pdf.setFillColor(6, 13, 26);
      pdf.rect(0, 0, W, H, 'F');

      // Верхняя градиентная полоска (имитируем 3 прямоугольника)
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, W / 2, 2, 'F');
      pdf.setFillColor(16, 185, 129);
      pdf.rect(W / 2, 0, W / 2, 2, 'F');

      // Декоративный круг (правый верх)
      pdf.setFillColor(20, 40, 80);
      pdf.circle(185, 30, 45, 'F');

      // Декоративный круг (левый низ)
      pdf.setFillColor(10, 30, 55);
      pdf.circle(15, 260, 40, 'F');

      // ── Логотип ──
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(255, 255, 255);
      pdf.text('duxtur', 20, 18);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(18);
      pdf.setTextColor(50, 65, 85);
      pdf.text('.org', 43, 18);

      pdf.setFontSize(7);
      pdf.setTextColor(80, 100, 120);
      pdf.text('МЕДИЦИНСКИЙ ПОРТАЛ ЦЕНТРАЛЬНОЙ АЗИИ', 20, 23);

      // ── Бейдж «Верифицирован» ──
      pdf.setFillColor(10, 40, 30);
      pdf.roundedRect(140, 10, 55, 10, 3, 3, 'F');
      pdf.setDrawColor(16, 185, 129);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(140, 10, 55, 10, 3, 3, 'S');
      pdf.setFontSize(7);
      pdf.setTextColor(16, 185, 129);
      pdf.text('✓  ВЕРИФИЦИРОВАННЫЙ ВРАЧ', 167.5, 15.8, { align: 'center' });

      // ── Специальность ──
      pdf.setFontSize(9);
      pdf.setTextColor(59, 130, 246);
      pdf.setFont('helvetica', 'bold');
      pdf.text(specialtyLabel.toUpperCase(), W / 2, 85, { align: 'center' });

      // ── Имя ──
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(32);
      pdf.setTextColor(255, 255, 255);
      pdf.text(doctorName, W / 2, 100, { align: 'center' });

      // ── Разделитель ──
      pdf.setDrawColor(37, 99, 235);
      pdf.setLineWidth(0.8);
      pdf.line(85, 106, 125, 106);

      // ── Миссия ──
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(11);
      pdf.setTextColor(148, 163, 184);
      const missionShort = mission.length > 90 ? mission.slice(0, 87) + '...' : mission;
      const missionLines = pdf.splitTextToSize(`«${missionShort}»`, 150);
      pdf.text(missionLines, W / 2, 116, { align: 'center' });

      // ── Карточки со статистикой ──
      const stats: Array<{ val: string; lbl: string }> = [];
      if (experience && experience > 0) stats.push({ val: `${experience}`, lbl: 'лет опыта' });
      if (articlesCount > 0) stats.push({ val: `${articlesCount}`, lbl: 'публикаций' });
      if (languages && languages.length > 0) stats.push({ val: `${languages.length}`, lbl: 'языка' });

      const cardW = 40;
      const cardH = 22;
      const gap = 6;
      const totalW = stats.length * cardW + (stats.length - 1) * gap;
      let sx = (W - totalW) / 2;
      const sy = 142;

      stats.forEach(({ val, lbl }) => {
        pdf.setFillColor(15, 25, 45);
        pdf.setDrawColor(30, 50, 80);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(sx, sy, cardW, cardH, 4, 4, 'FD');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.setTextColor(255, 255, 255);
        pdf.text(val, sx + cardW / 2, sy + 10, { align: 'center' });
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(100, 116, 139);
        pdf.text(lbl, sx + cardW / 2, sy + 17, { align: 'center' });
        sx += cardW + gap;
      });

      // ── Место работы ──
      if (workplace) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(148, 163, 184);
        pdf.text(workplace, W / 2, 178, { align: 'center' });
      }

      // ── Разделитель снизу ──
      pdf.setDrawColor(25, 40, 65);
      pdf.setLineWidth(0.3);
      pdf.line(20, 240, W - 20, 240);

      // ── Телефон и ссылка ──
      if (phone) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(255, 255, 255);
        pdf.text(phone, 20, 253);
      }

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(59, 130, 246);
      pdf.text(doctorUrl.replace('https://', ''), 20, phone ? 260 : 253);

      pdf.setFontSize(7);
      pdf.setTextColor(71, 85, 105);
      pdf.text('Сканируйте QR для полного профиля →', 20, phone ? 266 : 259);

      // ── QR код (страница 1) ──
      try {
        const qrDataUrl = await QRCode.toDataURL(doctorUrl, {
          width: 256,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        });
        // Белый фон под QR
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(155, 243, 36, 36, 4, 4, 'F');
        pdf.addImage(qrDataUrl, 'PNG', 157, 245, 32, 32);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6);
        pdf.setTextColor(100, 116, 139);
        pdf.text('МОЙ ПРОФИЛЬ', 173, 282, { align: 'center' });
      } catch (e) {
        // QR не критичен — пропускаем
      }

      // ── Нижняя полоска ──
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, H - 2, W / 2, 2, 'F');
      pdf.setFillColor(16, 185, 129);
      pdf.rect(W / 2, H - 2, W / 2, 2, 'F');

      // ══════════════════════════════════
      // СТРАНИЦА 2 — СВЕТЛАЯ (оборот)
      // ══════════════════════════════════
      pdf.addPage();

      // Фон
      pdf.setFillColor(248, 250, 252);
      pdf.rect(0, 0, W, H, 'F');

      // Верхняя полоска
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, W / 2, 2, 'F');
      pdf.setFillColor(16, 185, 129);
      pdf.rect(W / 2, 0, W / 2, 2, 'F');

      // Декоративный угол
      pdf.setFillColor(239, 246, 255);
      pdf.circle(W, 0, 50, 'F');

      // ── Шапка страницы 2 ──
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      pdf.text('СОВЕТЫ ОТ ЭКСПЕРТА', 20, 16);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(22);
      pdf.setTextColor(15, 23, 42);
      pdf.text(doctorName, 20, 27);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(59, 130, 246);
      pdf.text(specialtyLabel, 20, 34);

      // Логотип справа
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      pdf.text('duxtur', W - 20, 18, { align: 'right' });
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(203, 213, 225);
      pdf.text('.org', W - 20 + pdf.getTextWidth('duxtur') - pdf.getTextWidth('duxtur'), 18);

      // Горизонтальная линия
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(20, 40, W - 20, 40);

      // ── Блок миссии ──
      pdf.setFillColor(15, 42, 82);
      pdf.roundedRect(20, 48, W - 40, 38, 6, 6, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(59, 130, 246);
      pdf.text('МОЯ МИССИЯ', 28, 57);

      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      const missionLines2 = pdf.splitTextToSize(mission, 155);
      pdf.text(missionLines2.slice(0, 3), 28, 65);

      // ── Публикации ──
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      pdf.text('МОИ ПУБЛИКАЦИИ НА DUXTUR.ORG', 20, 98);

      // Примерные строки статей (данные приходят через props, но здесь у нас нет массива)
      // Рисуем плейсхолдер-карточки, если есть articlesCount
      const placeholderTitles = [
        'Статьи и материалы доступны на сайте',
        'Сканируйте QR-код для чтения',
      ];

      placeholderTitles.forEach((title, i) => {
        const ay = 103 + i * 18;
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(20, ay, W - 40, 14, 3, 3, 'FD');

        // Номер
        pdf.setFillColor(239, 246, 255);
        pdf.setDrawColor(191, 219, 254);
        pdf.roundedRect(24, ay + 3, 8, 8, 2, 2, 'FD');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(37, 99, 235);
        pdf.text(`${i + 1}`, 28, ay + 8.5, { align: 'center' });

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(15, 23, 42);
        pdf.text(title, 36, ay + 8.5);
      });

      // ── Нижний блок ──
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(20, H - 60, W - 20, H - 60);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Читайте проверенные медицинские статьи', 20, H - 50);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      const descLines = pdf.splitTextToSize(
        'Все материалы написаны и проверены практикующими врачами. Только достоверная информация о здоровье на вашем языке.',
        120
      );
      pdf.text(descLines, 20, H - 44);

      // Языки
      const langs = ['Тадж', 'Узб', 'Рус', 'Каз', 'Кырг'];
      let lx = 20;
      langs.forEach((l) => {
        const lw = pdf.getTextWidth(l) + 8;
        pdf.setFillColor(239, 246, 255);
        pdf.setDrawColor(191, 219, 254);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(lx, H - 28, lw, 7, 2, 2, 'FD');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6);
        pdf.setTextColor(37, 99, 235);
        pdf.text(l, lx + lw / 2, H - 23.5, { align: 'center' });
        lx += lw + 4;
      });

      // ── QR код страница 2 (тёмный) ──
      try {
        const qrDataUrl2 = await QRCode.toDataURL(doctorUrl, {
          width: 256,
          margin: 1,
          color: { dark: '#ffffff', light: '#0f172a' },
        });
        pdf.setFillColor(15, 23, 42);
        pdf.roundedRect(W - 56, H - 57, 36, 36, 4, 4, 'F');
        pdf.addImage(qrDataUrl2, 'PNG', W - 54, H - 55, 32, 32);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6);
        pdf.setTextColor(100, 116, 139);
        pdf.text('МОИ СТАТЬИ', W - 38, H - 17, { align: 'center' });
      } catch (e) {
        // пропускаем
      }

      // Нижняя полоска
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, H - 2, W / 2, 2, 'F');
      pdf.setFillColor(16, 185, 129);
      pdf.rect(W / 2, H - 2, W / 2, 2, 'F');

      // ── Скачиваем ──
      const fileName = `${doctorName.replace(/\s+/g, '_')}_duxtur.pdf`;
      pdf.save(fileName);

    } catch (err) {
      console.error('PDF error:', err);
      alert('Не удалось создать PDF. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const btnText = lang === 'uz' ? 'Vizitka yuklab olish' : 'Скачать визитку (PDF)';
  const loadingText = lang === 'uz' ? 'Yaratilmoqda...' : 'Создаётся...';

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="no-print w-full bg-gradient-to-r from-[#0a1628] to-[#0f2a52] border border-blue-900/40 rounded-2xl p-4 flex items-center justify-center gap-2.5 text-sm font-bold text-white hover:from-[#0f2a52] hover:to-[#1a3a6e] transition-all duration-300 shadow-sm disabled:opacity-60 disabled:cursor-wait"
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
          </svg>
          {loadingText}
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          {btnText}
        </>
      )}
    </button>
  );
}
