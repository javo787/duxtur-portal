// src/app/api/doctor/[id]/card/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Article from '@/models/Article';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectToDatabase();

  const doctor = await Doctor.findOne({ slug: params.id }).lean() as any;
  if (!doctor) {
    return new NextResponse('Not found', { status: 404 });
  }

  const articles = await Article.find({ author: doctor._id, published: true })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean() as any[];

  const lang = req.nextUrl.searchParams.get('lang') || 'ru';

  const t = (field: any) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[lang] || field['ru'] || '';
  };

  const doctorUrl = `https://duxtur.org/${lang}/doctor/${doctor.slug}`;
  const specialtyLabel = t(doctor.specialty) || t(doctor.specialization) || 'Врач';
  const mission = t(doctor.bio) || t(doctor.mission) || 'Помогаю пациентам достичь лучшего здоровья';

  // QR как SVG inline — не нужен внешний сервис
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(doctorUrl)}&bgcolor=060d1a&color=ffffff&margin=8`;
  const qrLightUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(doctorUrl)}&bgcolor=0f172a&color=ffffff&margin=8`;

  const topArticles = articles.slice(0, 4);

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doctor.name} — duxtur.org</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: #f1f5f9;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Общий контейнер страницы ── */
    .page {
      width: 90mm;
      min-height: 54mm;
      margin: 0 auto;
      position: relative;
      overflow: hidden;
    }

    /* ── Страница 1 — тёмная ── */
    .page-1 {
      background: #060d1a;
      color: white;
      page-break-after: always;
      display: flex;
      flex-direction: column;
    }

    /* ── Страница 2 — светлая ── */
    .page-2 {
      background: #f8fafc;
      color: #0f172a;
    }

    .accent-bar {
      height: 3px;
      background: linear-gradient(90deg, #2563eb 0%, #10b981 50%, #2563eb 100%);
      flex-shrink: 0;
    }

    /* ══ СТРАНИЦА 1 ══ */
    .p1-header {
      padding: 6mm 8mm 4mm;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .logo-text {
      font-size: 13pt;
      font-weight: 900;
      color: #fff;
      letter-spacing: -0.3px;
    }
    .logo-text span { color: #334155; font-weight: 300; }

    .logo-sub {
      font-size: 5pt;
      color: #475569;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-top: 1mm;
    }

    .logo-img {
      width: 10mm;
      height: 10mm;
      object-fit: contain;
      opacity: 0.9;
    }

    .verified-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      background: rgba(16,185,129,0.15);
      border: 0.5px solid rgba(16,185,129,0.4);
      border-radius: 20px;
      padding: 2px 7px;
      font-size: 5.5pt;
      color: #10b981;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .p1-photo-section {
      padding: 0 8mm;
      display: flex;
      align-items: center;
      gap: 5mm;
      margin-bottom: 4mm;
    }

    .doctor-photo {
      width: 22mm;
      height: 22mm;
      border-radius: 4mm;
      object-fit: cover;
      border: 0.5mm solid rgba(255,255,255,0.12);
      box-shadow: 0 4mm 12mm rgba(37,99,235,0.3);
      flex-shrink: 0;
      background: #0f2a52;
    }

    .doctor-info { flex: 1; min-width: 0; }

    .specialty-pill {
      display: inline-block;
      background: rgba(59,130,246,0.2);
      border: 0.3px solid rgba(59,130,246,0.4);
      color: #60a5fa;
      font-size: 5.5pt;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 1.5px 6px;
      border-radius: 20px;
      margin-bottom: 2mm;
    }

    .doctor-name {
      font-size: 16pt;
      font-weight: 900;
      color: #fff;
      line-height: 1.1;
      letter-spacing: -0.5px;
    }

    .doctor-workplace {
      font-size: 6pt;
      color: rgba(148,163,184,0.7);
      margin-top: 1.5mm;
      line-height: 1.4;
    }

    .divider-line {
      width: 15mm;
      height: 0.5mm;
      background: linear-gradient(90deg, transparent, #3b82f6, transparent);
      margin: 2mm 8mm;
    }

    .mission-text {
      font-size: 7pt;
      color: rgba(148,163,184,0.85);
      font-style: italic;
      line-height: 1.6;
      padding: 0 8mm;
      margin-bottom: 4mm;
    }

    .stats-row {
      display: flex;
      gap: 2mm;
      padding: 0 8mm;
      margin-bottom: 5mm;
    }

    .stat-card {
      background: rgba(255,255,255,0.05);
      border: 0.3px solid rgba(255,255,255,0.1);
      border-radius: 3mm;
      padding: 2.5mm 4mm;
      text-align: center;
      flex: 1;
    }

    .stat-val {
      font-size: 13pt;
      font-weight: 900;
      color: #fff;
      line-height: 1;
    }

    .stat-lbl {
      font-size: 5pt;
      color: #64748b;
      margin-top: 1mm;
      letter-spacing: 0.05em;
    }

    .p1-footer {
      margin-top: auto;
      padding: 3mm 8mm 5mm;
      border-top: 0.3px solid rgba(255,255,255,0.07);
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .contact-block {}

    .phone-number {
      font-size: 11pt;
      font-weight: 700;
      color: #fff;
      margin-bottom: 1mm;
    }

    .profile-url {
      font-size: 5.5pt;
      color: #3b82f6;
      font-weight: 600;
      margin-bottom: 1mm;
      word-break: break-all;
    }

    .scan-hint {
      font-size: 5pt;
      color: #475569;
    }

    .qr-block {
      background: #fff;
      border-radius: 2mm;
      padding: 1.5mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1mm;
    }

    .qr-block img { width: 14mm; height: 14mm; display: block; }

    .qr-label {
      font-size: 4pt;
      color: #64748b;
      letter-spacing: 0.08em;
      font-weight: 700;
    }

    /* ══ СТРАНИЦА 2 ══ */
    .p2-header {
      padding: 5mm 8mm 4mm;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 0.3px solid #e2e8f0;
    }

    .p2-tagline {
      font-size: 5pt;
      color: #94a3b8;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 1.5mm;
    }

    .p2-name {
      font-size: 14pt;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
      line-height: 1.1;
    }

    .p2-specialty {
      font-size: 7pt;
      color: #3b82f6;
      font-weight: 600;
      margin-top: 1mm;
    }

    .p2-logo {
      text-align: right;
    }

    .p2-logo-img {
      width: 8mm;
      height: 8mm;
      object-fit: contain;
      margin-bottom: 1mm;
      display: block;
      margin-left: auto;
    }

    .p2-logo-text {
      font-size: 9pt;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    .p2-logo-text span { color: #cbd5e1; font-weight: 300; }

    .p2-logo-sub {
      font-size: 4.5pt;
      color: #94a3b8;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-top: 0.5mm;
    }

    .mission-block {
      margin: 4mm 8mm;
      background: linear-gradient(135deg, #0f2a52 0%, #1e3a6e 100%);
      border-radius: 3mm;
      padding: 4mm 5mm;
      position: relative;
      overflow: hidden;
    }

    .mission-block::before {
      content: '"';
      position: absolute;
      top: -2mm;
      right: 2mm;
      font-size: 36pt;
      color: rgba(255,255,255,0.04);
      line-height: 1;
      font-family: Georgia, serif;
    }

    .mission-block-label {
      font-size: 5pt;
      color: #3b82f6;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 2mm;
    }

    .mission-block-text {
      font-size: 7.5pt;
      color: #fff;
      font-style: italic;
      line-height: 1.6;
    }

    .articles-section {
      padding: 0 8mm;
      margin-bottom: 4mm;
    }

    .articles-label {
      font-size: 5pt;
      color: #94a3b8;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 2mm;
    }

    .article-item {
      display: flex;
      align-items: center;
      gap: 3mm;
      background: #fff;
      border: 0.3px solid #e2e8f0;
      border-radius: 2mm;
      padding: 2.5mm 3mm;
      margin-bottom: 1.5mm;
    }

    .article-num {
      width: 5mm;
      height: 5mm;
      background: #eff6ff;
      border: 0.3px solid #bfdbfe;
      border-radius: 1.5mm;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 6pt;
      font-weight: 700;
      color: #2563eb;
      flex-shrink: 0;
    }

    .article-title {
      font-size: 6.5pt;
      font-weight: 600;
      color: #0f172a;
      line-height: 1.3;
      flex: 1;
    }

    .article-read {
      font-size: 5pt;
      color: #3b82f6;
      font-weight: 700;
      flex-shrink: 0;
    }

    .p2-footer {
      margin-top: auto;
      padding: 3mm 8mm 5mm;
      border-top: 0.3px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .p2-footer-left { flex: 1; margin-right: 4mm; }

    .p2-footer-title {
      font-size: 7.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 1.5mm;
    }

    .p2-footer-desc {
      font-size: 5.5pt;
      color: #64748b;
      line-height: 1.5;
      margin-bottom: 2.5mm;
    }

    .lang-pills { display: flex; gap: 1mm; flex-wrap: wrap; }

    .lang-pill {
      font-size: 4.5pt;
      background: #eff6ff;
      color: #2563eb;
      border: 0.3px solid #bfdbfe;
      border-radius: 1mm;
      padding: 1px 3px;
      font-weight: 700;
    }

    .qr2-block {
      background: #0f172a;
      border-radius: 2mm;
      padding: 1.5mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1mm;
      flex-shrink: 0;
    }

    .qr2-block img { width: 14mm; height: 14mm; display: block; }

    .qr2-label {
      font-size: 4pt;
      color: #64748b;
      letter-spacing: 0.08em;
      font-weight: 700;
    }

    /* ── Print styles ── */
    @media print {
      body { background: none; }
      .page { margin: 0; }
      .print-hint { display: none; }
      @page {
        size: 90mm 148mm;
        margin: 0;
      }
    }

    /* ── Подсказка для браузера (не печатается) ── */
    .print-hint {
      text-align: center;
      padding: 8mm 0 4mm;
      font-size: 8pt;
      color: #94a3b8;
    }
  </style>
</head>
<body>

<div class="print-hint">
  Нажмите <strong>Ctrl+P</strong> (или ⌘+P на Mac) → «Сохранить как PDF» → Размер: A6 или Custom 90×148mm
</div>

<!-- ══════════ СТРАНИЦА 1 — ЛИЦЕВАЯ ══════════ -->
<div class="page page-1">
  <div class="accent-bar"></div>

  <!-- Шапка: лого + бейдж -->
  <div class="p1-header">
    <div>
      <div style="display:flex;align-items:center;gap:2.5mm;">
        <img src="https://duxtur.org/logo.png" class="logo-img" alt="duxtur" onerror="this.style.display='none'">
        <div>
          <div class="logo-text">duxtur<span>.org</span></div>
          <div class="logo-sub">Медицинский портал</div>
        </div>
      </div>
    </div>
    <div>
      <div class="verified-badge">✓ Верифицированный врач</div>
    </div>
  </div>

  <!-- Фото + имя -->
  <div class="p1-photo-section">
    ${doctor.image
      ? `<img src="${doctor.image}" class="doctor-photo" alt="${doctor.name}" crossorigin="anonymous">`
      : `<div class="doctor-photo" style="display:flex;align-items:center;justify-content:center;">
           <svg width="30" height="30" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)">
             <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
           </svg>
         </div>`
    }
    <div class="doctor-info">
      <div class="specialty-pill">${specialtyLabel}</div>
      <div class="doctor-name">${doctor.name}</div>
      ${doctor.workplace ? `<div class="doctor-workplace">${doctor.workplace}</div>` : ''}
    </div>
  </div>

  <div class="divider-line"></div>

  <!-- Миссия -->
  <div class="mission-text">«${mission}»</div>

  <!-- Статистика -->
  <div class="stats-row">
    ${articles.length > 0 ? `
    <div class="stat-card">
      <div class="stat-val">${articles.length}</div>
      <div class="stat-lbl">публикаций</div>
    </div>` : ''}
    ${doctor.experience > 0 ? `
    <div class="stat-card">
      <div class="stat-val">${doctor.experience}</div>
      <div class="stat-lbl">лет опыта</div>
    </div>` : ''}
    ${doctor.languages?.length > 0 ? `
    <div class="stat-card">
      <div class="stat-val">${doctor.languages.length}</div>
      <div class="stat-lbl">${doctor.languages.length === 1 ? 'язык' : 'языка'}</div>
    </div>` : ''}
  </div>

  <!-- Футер: контакт + QR -->
  <div class="p1-footer">
    <div class="contact-block">
      ${doctor.phone ? `<div class="phone-number">${doctor.phone}</div>` : ''}
      <div class="profile-url">${doctorUrl.replace('https://', '')}</div>
      <div class="scan-hint">Сканируйте QR для полного профиля →</div>
    </div>
    <div class="qr-block">
      <img src="${qrApiUrl}" alt="QR">
      <div class="qr-label">МОЙ ПРОФИЛЬ</div>
    </div>
  </div>

  <div class="accent-bar"></div>
</div>

<!-- ══════════ СТРАНИЦА 2 — ОБОРОТ ══════════ -->
<div class="page page-2" style="margin-top: 8mm;">
  <div class="accent-bar"></div>

  <!-- Шапка -->
  <div class="p2-header">
    <div>
      <div class="p2-tagline">Советы от эксперта</div>
      <div class="p2-name">${doctor.name}</div>
      <div class="p2-specialty">${specialtyLabel}</div>
    </div>
    <div class="p2-logo">
      <img src="https://duxtur.org/logo.png" class="p2-logo-img" alt="duxtur" onerror="this.style.display='none'">
      <div class="p2-logo-text">duxtur<span>.org</span></div>
      <div class="p2-logo-sub">Медицинский портал</div>
    </div>
  </div>

  <!-- Блок миссии -->
  <div class="mission-block">
    <div class="mission-block-label">Моя миссия</div>
    <div class="mission-block-text">${mission}</div>
  </div>

  <!-- Статьи -->
  ${topArticles.length > 0 ? `
  <div class="articles-section">
    <div class="articles-label">Мои публикации на duxtur.org</div>
    ${topArticles.map((a: any, i: number) => `
    <div class="article-item">
      <div class="article-num">${i + 1}</div>
      <div class="article-title">${t(a.title)}</div>
      <div class="article-read">ЧИТАТЬ →</div>
    </div>`).join('')}
  </div>` : `
  <div class="articles-section">
    <div class="articles-label">Мои публикации на duxtur.org</div>
    <div class="article-item">
      <div class="article-num">→</div>
      <div class="article-title">Все материалы доступны по QR-коду</div>
    </div>
  </div>`}

  <!-- Футер -->
  <div class="p2-footer">
    <div class="p2-footer-left">
      <div class="p2-footer-title">Читайте проверенные медицинские статьи</div>
      <div class="p2-footer-desc">Все материалы написаны и проверены практикующими врачами. Только достоверная информация о здоровье на вашем языке.</div>
      <div class="lang-pills">
        <span class="lang-pill">Тадж</span>
        <span class="lang-pill">Узб</span>
        <span class="lang-pill">Рус</span>
        <span class="lang-pill">Каз</span>
        <span class="lang-pill">Кырг</span>
      </div>
    </div>
    <div class="qr2-block">
      <img src="${qrLightUrl}" alt="QR">
      <div class="qr2-label" style="color:#475569;">МОИ СТАТЬИ</div>
    </div>
  </div>

  <div class="accent-bar"></div>
</div>

</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
