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
 * @param {'print'|'image'} mode — 'print': разрыв страницы между сторонами (для PDF).
 *   'image': стороны друг под другом с видимым отступом (для единого скриншота).
 */
function renderCardHTML(doctor, lang, baseUrl, mode) {
  mode = mode === 'image' ? 'image' : 'print';
  const d = DICT[lang] || DICT.ru;
  const accent = doctor.accentColor || '#2563eb';
  const gradient = CATEGORY_GRADIENTS[doctor.categoryKey] || CATEGORY_GRADIENTS.general;
  const theme = doctor.cardTheme || 'dark';

  const name = truncate(doctor.name || '', 40);
  const nameWords = name.trim().split(/\s+/).filter(Boolean);
  // Фамилия Имя [Отчество]: если слов 3+, переносим последнее слово
  // (обычно отчество) на вторую строку — так и полное имя видно,
  // и первая строка не разъезжается по ширине карточки.
  const nameLine1 = nameWords.length >= 3 ? nameWords.slice(0, -1).join(' ') : name;
  const nameLine2 = nameWords.length >= 3 ? nameWords[nameWords.length - 1] : null;

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

  const SOCIAL_PATHS = {
    instagram: 'M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077',
    telegram: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
    whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
  };

  function row(type, handle) {
    return `<div class="social-row">
      <svg viewBox="0 0 24 24" fill="currentColor" class="social-icon"><path d="${SOCIAL_PATHS[type]}"/></svg>
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
  html, body { width: 90mm; ${mode === 'image' ? 'background: #d4d8de;' : ''} }
  body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; ${mode === 'image' ? 'padding: 3mm 0; display: flex; flex-direction: column; align-items: center; gap: 3mm;' : ''} }

  .card {
    width: 90mm;
    height: 50mm;
    position: relative;
    overflow: hidden;
    ${mode === 'print' ? 'page-break-after: always;' : 'border-radius: 2mm; box-shadow: 0 2mm 6mm rgba(15,23,42,0.18);'}
  }
  ${mode === 'print' ? '.card:last-child { page-break-after: avoid; }' : ''}

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
  .name-wrap { display: flex; flex-direction: column; gap: 0.2mm; }
  .name-line {
    font-family: 'PT Serif', Georgia, serif;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
  #name-line-1 { font-size: 13.5pt; color: #fff; }
  #name-line-2 { font-size: 9pt; color: rgba(255,255,255,0.68); font-weight: 600; margin-top: 0.3mm; }
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
        <div class="name-wrap">
          <div class="name-line" id="name-line-1">${esc(nameLine1)}</div>
          ${nameLine2 ? `<div class="name-line" id="name-line-2">${esc(nameLine2)}</div>` : ''}
        </div>
        ${workplace ? `<div class="workplace">${esc(workplace)}</div>` : ''}
        ${phone ? `<div class="phone"><span class="dot"></span>${esc(phone)}</div>` : ''}
        ${missionShort ? `<div class="mission-short" style="${nameLine2 ? '-webkit-line-clamp:1;' : ''}">\u00AB${esc(missionShort)}\u00BB</div>` : ''}
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

  <script>
    (function () {
      function fitToWidth(el, maxWidth, minPx) {
        if (!el) return;
        var size = parseFloat(getComputedStyle(el).fontSize);
        var guard = 0;
        while (el.scrollWidth > maxWidth && size > minPx && guard < 60) {
          size -= 0.4;
          el.style.fontSize = size + 'px';
          guard += 1;
        }
      }
      function run() {
        var wrap = document.querySelector('.name-wrap');
        if (wrap) {
          var maxWidth = wrap.getBoundingClientRect().width;
          fitToWidth(document.getElementById('name-line-1'), maxWidth, 15);
          fitToWidth(document.getElementById('name-line-2'), maxWidth, 10);
        }
        window.__cardReady = true;
      }
      if (document.readyState === 'complete') run();
      else window.addEventListener('load', run);
    })();
  </script>

</body>
</html>`;
}

module.exports = { renderCardHTML, CATEGORY_GRADIENTS };
