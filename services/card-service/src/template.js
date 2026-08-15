// src/template.js
const { buildFontFaceCSS } = require('./fonts');

// Идентично src/lib/doctor-constants.ts (CATEGORY_GRADIENTS) в основном репозитории.
// Дублируется здесь намеренно: этот сервис — независимый модуль рендеринга,
// не имеющий доступа к исходникам Next.js-приложения.
const CATEGORY_GRADIENTS = {
  cardiology:    { from: '#991b1b', to: '#0f2a52' },
  neurology:     { from: '#5b21b6', to: '#0f2a52' },
  dentistry:     { from: '#0369a1', to: '#0f2a52' },
  pediatrics:    { from: '#d97706', to: '#0f2a52' },
  dermatology:   { from: '#be185d', to: '#0f2a52' },
  ophthalmology: { from: '#0891b2', to: '#0f2a52' },
  surgery:       { from: '#334155', to: '#0a1628' },
  gynecology:    { from: '#9d174d', to: '#0f2a52' },
  general:       { from: '#0f766e', to: '#0f2a52' },
};

const DICT = {
  ru: { verified: 'Верифицирован', years: 'лет опыта', scan: 'МОЙ ПРОФИЛЬ', scanBack: 'Сканируйте для полного профиля', reception: 'ЧАСЫ ПРИЁМА', langLabel: 'ЯЗЫКИ', mission: 'МОЯ МИССИЯ', contacts: 'КОНТАКТЫ', articles: 'статей' },
  uz: { verified: 'Tasdiqlangan', years: 'yil tajriba', scan: 'MENING PROFILIM', scanBack: 'To\u02bbliq profil uchun skanerlang', reception: 'QABUL VAQTI', langLabel: 'TILLAR', mission: 'MAQSADIM', contacts: 'KONTAKTLAR', articles: 'maqola' },
  tg: { verified: 'Тасдиқшуда', years: 'соли таҷриба', scan: 'ПРОФИЛИ МАН', scanBack: 'Барои профили пурра сканеркунед', reception: 'СОАТҲОИ ҚАБУЛ', langLabel: 'ЗАБОНҲО', mission: 'МАҚСАДИ МАН', contacts: 'ТАМОС', articles: 'мақола' },
  kk: { verified: 'Тексерілген', years: 'жыл тәжірибе', scan: 'МЕНІҢ ПРОФИЛІМ', scanBack: 'Толық профиль үшін сканерлеңіз', reception: 'ҚАБЫЛДАУ УАҚЫТЫ', langLabel: 'ТІЛДЕР', mission: 'МЕНІҢ МАҚСАТЫМ', contacts: 'БАЙЛАНЫС', articles: 'мақала' },
  ky: { verified: 'Текшерилген', years: 'жыл тажрыйба', scan: 'МЕНИН ПРОФИЛИМ', scanBack: 'Толук профиль учун скандаңыз', reception: 'КАБЫЛ АЛУУ УБАКТЫСЫ', langLabel: 'ТИЛДЕР', mission: 'МЕНИН МАКСАТЫМ', contacts: 'БАЙЛАНЫШ', articles: 'макала' },
};

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 1) + '\u2026' : str;
}

function socialHandle(url, type) {
  if (!url) return null;
  if (type === 'instagram') {
    const m = url.match(/instagram\.com\/([^/?]+)/);
    return m ? `@${m[1]}` : url;
  }
  if (type === 'telegram') {
    const m = url.match(/t(?:elegram)?\.me\/([^/?]+)/);
    return m ? `@${m[1]}` : url;
  }
  return url.replace('https://wa.me/', '').replace(/^\+?/, '+');
}

function qrUrl(data, size, bg, fg) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&bgcolor=${bg}&color=${fg}&margin=3&ecc=M`;
}

/**
 * @param {object} doctor  — ответ /api/doctor/[id]/card
 * @param {string} lang
 * @param {string} baseUrl — https://duxtur.org (для QR и подписи URL)
 */
function renderCardHTML(doctor, lang, baseUrl) {
  const d = DICT[lang] || DICT.ru;
  const accent = doctor.accentColor || '#2563eb';
  const gradient = CATEGORY_GRADIENTS[doctor.categoryKey] || CATEGORY_GRADIENTS.general;
  const theme = doctor.cardTheme || 'dark';

  const name = truncate(doctor.name || '', 32);
  const specialty = truncate(doctor.specialty || '', 34);
  const workplace = truncate(doctor.workplace || '', 40);
  const missionShort = truncate(doctor.mission || doctor.bio || '', 78);
  const missionFull = truncate(doctor.mission || doctor.bio || '', 210);
  const phone = doctor.phone ? (doctor.phone.startsWith('+') ? doctor.phone : `+${doctor.phone}`) : null;

  const ig = socialHandle(doctor.instagram, 'instagram');
  const tg = socialHandle(doctor.telegram, 'telegram');
  const wa = socialHandle(doctor.whatsapp, 'whatsapp');

  const profileUrl = `${baseUrl}/${lang}/doctor/${doctor.slug}`;
  const profileUrlLabel = profileUrl.replace(/^https?:\/\//, '');

  const qrFront = qrUrl(profileUrl, 200, '00000000', theme === 'dark' ? 'ffffff' : '0f172a');
  const qrBack = qrUrl(profileUrl, 260, '00000000', '0f172a');

  const langTags = (doctor.languages || [])
    .map((l) => `<span class="tag">${esc(l)}</span>`)
    .join('');

  function row(type, handle) {
    const icons = {
      instagram: '<circle cx="12" cy="12" r="4"/><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>',
      telegram: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7Z"/>',
      whatsapp: '<path d="M3 21l1.65-4.95A9 9 0 1 1 8.05 19.35Z"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0zM8 13.5c1 2 2.5 3 4.5 3.5"/>',
    };
    return `<div class="social-row">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="social-icon">${icons[type]}</svg>
      <span>${esc(handle)}</span>
    </div>`;
  }

  const socialRows = [
    ig ? row('instagram', ig) : '',
    tg ? row('telegram', tg) : '',
    wa ? row('whatsapp', wa) : '',
  ].join('');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<style>
  ${buildFontFaceCSS()}

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 90mm; }
  body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }

  .card {
    width: 90mm;
    height: 50mm;
    position: relative;
    overflow: hidden;
    page-break-after: always;
  }
  .card:last-child { page-break-after: avoid; }

  /* ============ ЛИЦЕВАЯ СТОРОНА ============ */
  .front {
    background: linear-gradient(150deg, ${gradient.from} 0%, #0f2a52 55%, ${gradient.to} 100%);
    display: flex;
    flex-direction: column;
    color: #fff;
  }
  .front .glow {
    position: absolute;
    width: 42mm; height: 42mm;
    border-radius: 50%;
    top: -16mm; right: -12mm;
    background: radial-gradient(circle, ${accent} 0%, transparent 70%);
    opacity: 0.30;
    filter: blur(1px);
  }
  .front .grid {
    position: absolute; inset: 0;
    opacity: 0.05;
    background-image:
      linear-gradient(rgba(255,255,255,0.9) 0.4px, transparent 0.4px),
      linear-gradient(90deg, rgba(255,255,255,0.9) 0.4px, transparent 0.4px);
    background-size: 4mm 4mm;
  }
  .accent-line { height: 0.6mm; background: linear-gradient(90deg, transparent, ${accent}, transparent); position: relative; z-index: 1; }

  .front-top {
    position: relative; z-index: 1;
    display: flex; justify-content: space-between; align-items: center;
    padding: 3mm 4.5mm 0;
  }
  .wordmark { font-size: 8.5pt; font-weight: 800; letter-spacing: -0.2pt; }
  .wordmark span { color: rgba(255,255,255,0.35); font-weight: 400; }
  .verified-badge {
    display: flex; align-items: center; gap: 1.2mm;
    background: rgba(16,185,129,0.15); border: 0.3mm solid rgba(16,185,129,0.35);
    border-radius: 3mm; padding: 0.8mm 2.4mm;
  }
  .verified-badge svg { width: 2.6mm; height: 2.6mm; }
  .verified-badge span { font-size: 6pt; font-weight: 700; color: #34d399; letter-spacing: 0.02em; }

  .front-body {
    position: relative; z-index: 1;
    flex: 1;
    display: flex; align-items: center;
    gap: 3.2mm;
    padding: 2mm 4.5mm;
  }
  .photo {
    width: 15.5mm; height: 15.5mm; border-radius: 3.4mm;
    object-fit: cover; flex-shrink: 0;
    box-shadow: 0 0 0 0.35mm ${accent}80, 0 1.5mm 3mm rgba(0,0,0,0.35);
  }
  .photo-fallback {
    width: 15.5mm; height: 15.5mm; border-radius: 3.4mm; flex-shrink: 0;
    background: linear-gradient(135deg, #0f2a52, #1e3a6e);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 0 0.35mm ${accent}80;
  }
  .photo-fallback svg { width: 7mm; height: 7mm; opacity: 0.35; }

  .info { flex: 1; min-width: 0; }
  .specialty-pill {
    display: inline-block;
    background: ${accent}30; border: 0.25mm solid ${accent}55;
    border-radius: 3mm; padding: 0.6mm 2.2mm;
    font-size: 5.6pt; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
    color: rgba(255,255,255,0.95);
    margin-bottom: 1.1mm;
    max-width: 100%;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .name {
    font-family: 'PT Serif', Georgia, serif;
    font-size: 13.5pt; font-weight: 700; line-height: 1.08;
    letter-spacing: -0.01em;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .workplace {
    font-size: 6.6pt; color: rgba(255,255,255,0.6); margin-top: 0.8mm;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .phone {
    font-size: 8.4pt; font-weight: 700; margin-top: 1.6mm;
    display: flex; align-items: center; gap: 1.2mm;
  }
  .phone .dot { width: 1.4mm; height: 1.4mm; border-radius: 50%; background: ${accent}; }
  .mission-short {
    font-size: 6.1pt; color: rgba(255,255,255,0.55); font-style: italic;
    margin-top: 1.6mm; line-height: 1.35;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }

  .qr-col {
    flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 1mm;
  }
  .qr-box {
    width: 12.5mm; height: 12.5mm; border-radius: 2mm;
    background: rgba(255,255,255,0.06); border: 0.25mm solid rgba(255,255,255,0.12);
    display: flex; align-items: center; justify-content: center; padding: 1mm;
  }
  .qr-box img { width: 100%; height: 100%; }
  .qr-label { font-size: 4.8pt; color: rgba(255,255,255,0.4); letter-spacing: 0.06em; }

  .front-bottom {
    position: relative; z-index: 1;
    display: flex; justify-content: space-between; align-items: center;
    padding: 1.6mm 4.5mm 2.4mm;
    border-top: 0.25mm solid rgba(255,255,255,0.08);
    margin-top: auto;
  }
  .stats { display: flex; gap: 3mm; }
  .stat { font-size: 6pt; color: rgba(255,255,255,0.45); }
  .stat b { color: rgba(255,255,255,0.85); font-weight: 700; }
  .url { font-size: 5.6pt; color: rgba(255,255,255,0.35); letter-spacing: 0.02em; }

  /* ============ ОБОРОТНАЯ СТОРОНА ============ */
  .back {
    background: #fafafa;
    display: flex; flex-direction: column;
    color: #0f172a;
  }
  .back-top {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding: 3mm 4.5mm 2mm;
    border-bottom: 0.25mm solid #e5e7eb;
  }
  .back-name { font-family: 'PT Serif', Georgia, serif; font-size: 9.5pt; font-weight: 700; }
  .back-specialty { font-size: 6.2pt; color: ${accent}; font-weight: 600; margin-top: 0.4mm; }
  .back-wordmark { font-size: 7pt; font-weight: 800; color: #cbd5e1; text-align: right; }
  .back-wordmark b { color: #0f172a; }

  .back-body { flex: 1; display: flex; padding: 2.4mm 4.5mm; gap: 3.5mm; }
  .back-left { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2.2mm; }

  .block-label {
    font-size: 5pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    color: #94a3b8; margin-bottom: 1mm;
  }
  .social-row { display: flex; align-items: center; gap: 1.4mm; font-size: 6.4pt; color: #334155; margin-bottom: 0.9mm; }
  .social-icon { width: 3mm; height: 3mm; color: ${accent}; flex-shrink: 0; }
  .block-value { font-size: 6.4pt; color: #334155; line-height: 1.4; }
  .tags { display: flex; flex-wrap: wrap; gap: 1mm; }
  .tag {
    font-size: 5.4pt; font-weight: 600; color: ${accent};
    background: ${accent}14; border: 0.25mm solid ${accent}30;
    border-radius: 1.4mm; padding: 0.5mm 1.6mm;
  }

  .back-right { width: 24mm; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 1.4mm; }
  .big-qr { width: 20mm; height: 20mm; border-radius: 2mm; padding: 1mm; background: #fff; border: 0.25mm solid #e5e7eb; }
  .big-qr img { width: 100%; height: 100%; }
  .scan-text { font-size: 4.6pt; color: #94a3b8; text-align: center; line-height: 1.3; }

  .mission-box {
    margin: 0 4.5mm; padding: 2mm 2.8mm;
    background: linear-gradient(135deg, #0f2a52, ${gradient.to});
    border-radius: 2.2mm; position: relative; overflow: hidden;
  }
  .mission-box .q {
    position: absolute; top: -3mm; right: -1mm; font-size: 20pt; color: rgba(255,255,255,0.06);
    font-family: 'PT Serif', Georgia, serif;
  }
  .mission-label { font-size: 4.8pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${accent === '#2563eb' ? '#93c5fd' : accent}; margin-bottom: 0.8mm; }
  .mission-text { font-size: 6.2pt; color: #fff; font-style: italic; line-height: 1.4; }

  .back-bottom {
    display: flex; justify-content: space-between; align-items: center;
    padding: 1.8mm 4.5mm 2.6mm; border-top: 0.25mm solid #e5e7eb; margin-top: auto;
  }
  .back-bottom .url { font-size: 5.4pt; color: #94a3b8; }
</style>
</head>
<body>

  <!-- ЛИЦЕВАЯ -->
  <div class="card front">
    <div class="grid"></div>
    <div class="glow"></div>
    <div class="accent-line"></div>
    <div class="front-top">
      <div class="wordmark">duxtur<span>.org</span></div>
      <div class="verified-badge">
        <svg viewBox="0 0 20 20" fill="#34d399"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
        <span>${esc(d.verified)}</span>
      </div>
    </div>
    <div class="front-body">
      ${doctor.image
        ? `<img class="photo" src="${esc(doctor.image)}" crossorigin="anonymous" />`
        : `<div class="photo-fallback"><svg viewBox="0 0 24 24" fill="#fff"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg></div>`
      }
      <div class="info">
        ${specialty ? `<div class="specialty-pill">${esc(specialty)}</div>` : ''}
        <div class="name">${esc(name)}</div>
        ${workplace ? `<div class="workplace">${esc(workplace)}</div>` : ''}
        ${phone ? `<div class="phone"><span class="dot"></span>${esc(phone)}</div>` : ''}
        ${missionShort ? `<div class="mission-short">\u00AB${esc(missionShort)}\u00BB</div>` : ''}
      </div>
      <div class="qr-col">
        <div class="qr-box"><img src="${qrFront}" /></div>
        <div class="qr-label">${esc(d.scan)}</div>
      </div>
    </div>
    <div class="front-bottom">
      <div class="stats">
        ${doctor.articlesCount ? `<div class="stat"><b>${doctor.articlesCount}</b> ${esc(d.articles)}</div>` : ''}
        ${doctor.experience ? `<div class="stat"><b>${doctor.experience}</b> ${esc(d.years)}</div>` : ''}
      </div>
      <div class="url">${esc(profileUrlLabel)}</div>
    </div>
  </div>

  <!-- ОБОРОТНАЯ -->
  <div class="card back">
    <div class="back-top">
      <div>
        <div class="back-name">${esc(name)}</div>
        ${specialty ? `<div class="back-specialty">${esc(specialty)}</div>` : ''}
      </div>
      <div class="back-wordmark"><b>duxtur</b>.org</div>
    </div>
    <div class="back-body">
      <div class="back-left">
        ${socialRows ? `<div><div class="block-label">${esc(d.contacts)}</div>${socialRows}</div>` : ''}
        ${doctor.workingHours ? `<div><div class="block-label">${esc(d.reception)}</div><div class="block-value">${esc(doctor.workingHours)}</div></div>` : ''}
        ${langTags ? `<div><div class="block-label">${esc(d.langLabel)}</div><div class="tags">${langTags}</div></div>` : ''}
      </div>
      <div class="back-right">
        <div class="big-qr"><img src="${qrBack}" /></div>
        <div class="scan-text">${esc(d.scanBack)}</div>
      </div>
    </div>
    ${missionFull ? `
    <div class="mission-box">
      <div class="q">&rdquo;</div>
      <div class="mission-label">${esc(d.mission)}</div>
      <div class="mission-text">\u00AB${esc(missionFull)}\u00BB</div>
    </div>` : ''}
    <div class="back-bottom">
      <div class="url">${esc(profileUrlLabel)}</div>
    </div>
  </div>

</body>
</html>`;
}

module.exports = { renderCardHTML, CATEGORY_GRADIENTS };
