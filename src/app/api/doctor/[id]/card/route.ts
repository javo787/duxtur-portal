  import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Article from '@/models/Article';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectToDatabase();
  const { id } = await params;

  const doctor = await Doctor.findOne({ slug: id }).lean() as any;
  if (!doctor) return new NextResponse('Not found', { status: 404 });

  const articles = await Article.find({ author: doctor._id, published: true })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean() as any[];

  const lang = req.nextUrl.searchParams.get('lang') || doctor.defaultLang || 'ru';
  const format = req.nextUrl.searchParams.get('format') || 'html';

  const t = (field: any) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[lang] || field['ru'] || '';
  };

  const dict: Record<string, { articles: string; years: string; languages: string; verified: string; hours: string }> = {
    ru: { articles: 'статей', years: 'лет', languages: 'языков', verified: 'Проверенный врач', hours: 'Часы приёма' },
    uz: { articles: 'maqola', years: 'yil', languages: 'til', verified: 'Tasdiqlangan shifokor', hours: 'Qabul vaqti' },
    tg: { articles: 'мақола', years: 'сол', languages: 'забон', verified: 'Духтури тасдиқшуда', hours: 'Соати қабул' },
    kk: { articles: 'мақала', years: 'жыл', languages: 'тіл', verified: 'Тексерілген дәрігер', hours: 'Қабылдау уақыты' },
    ky: { articles: 'макала', years: 'жыл', languages: 'тил', verified: 'Текшерилген дарыгер', hours: 'Кабыл алуу убактысы' },
  };
  const __ = (key: 'articles' | 'years' | 'languages' | 'verified' | 'hours') =>
    dict[lang]?.[key] || dict.ru[key];

  const doctorUrl = `https://duxtur.org/${lang}/doctor/${doctor.slug}`;
  const specialtyLabel = t(doctor.specialty) || t(doctor.specialization) || 'Врач';

  // Соцсети
  const getSocial = (url: string, type: 'instagram' | 'telegram' | 'whatsapp') => {
    if (!url) return null;
    let username = '';
    if (type === 'instagram') {
      const match = url.match(/instagram\.com\/([^/?]+)/);
      username = match ? match[1] : url;
    } else if (type === 'telegram') {
      const match = url.match(/t(?:elegram)?\.me\/([^/?]+)/);
      username = match ? match[1] : url;
    } else if (type === 'whatsapp') {
      username = url.replace('https://wa.me/', '').replace(/[^0-9]/g, '');
    }
    return { url, username };
  };

  const instagram = getSocial(doctor.instagram, 'instagram');
  const telegram = getSocial(doctor.telegram, 'telegram');
  const whatsapp = getSocial(doctor.whatsapp, 'whatsapp');

  const accentColor = doctor.accentColor || '#2563eb';
  const theme = doctor.cardTheme || 'dark';

  // Счётчик скачиваний (увеличиваем только при генерации PDF)
  if (format === 'pdf') {
    await Doctor.updateOne({ slug: id }, { $inc: { downloadsCount: 1 } });
  }

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(doctorUrl)}&bgcolor=${theme === 'dark' ? '060d1a' : 'ffffff'}&color=${theme === 'dark' ? 'ffffff' : '000000'}&margin=4`;

  // Определяем цвета в зависимости от темы
  const bgColor = theme === 'dark' ? '#060d1a' : '#ffffff';
  const textColor = theme === 'dark' ? '#ffffff' : '#1e293b';
  const secondaryText = theme === 'dark' ? 'rgba(148,163,184,0.8)' : 'rgba(71,85,105,0.8)';
  const statLabelColor = theme === 'dark' ? '#64748b' : '#94a3b8';
  const cardBg = theme === 'dark' ? '#060d1a' : '#ffffff';
  const borderColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', sans-serif;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 90mm;
    height: 50mm;
    margin: 0 auto;
    background: ${bgColor};
    color: ${textColor};
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 3mm;
    position: relative;
  }
  .accent-bar {
    height: 2px;
    background: linear-gradient(90deg, ${accentColor} 0%, #10b981 50%, ${accentColor} 100%);
    flex-shrink: 0;
  }
  .content {
    display: flex;
    flex: 1;
    padding: 3mm 4mm;
    gap: 3mm;
  }
  .left {
    display: flex;
    align-items: center;
    gap: 2.5mm;
    flex: 1;
    min-width: 0;
  }
  .photo {
    width: 16mm;
    height: 16mm;
    border-radius: 2mm;
    object-fit: cover;
    border: 0.5mm solid ${borderColor};
    flex-shrink: 0;
    background: ${theme === 'dark' ? '#1e293b' : '#e2e8f0'};
  }
  .info { flex: 1; min-width: 0; }
  .name { font-size: 11pt; font-weight: 900; line-height: 1.1; letter-spacing: -0.3px; color: ${textColor}; }
  .specialty { font-size: 6pt; color: ${accentColor}; font-weight: 600; margin: 1mm 0; }
  .workplace { font-size: 5pt; color: ${secondaryText}; line-height: 1.3; }
  .right { display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; flex-shrink: 0; }
  .verified-icon {
    background: rgba(16,185,129,0.15);
    border: 0.5px solid rgba(16,185,129,0.4);
    border-radius: 50%;
    width: 5mm; height: 5mm;
    display: flex; align-items: center; justify-content: center;
    font-size: 3mm; color: #10b981; font-weight: bold;
  }
  .socials { display: flex; flex-direction: column; gap: 1.5mm; align-items: flex-end; }
  .social-item {
    display: flex; align-items: center; gap: 1.5mm;
    font-size: 4.5pt; color: ${secondaryText}; text-decoration: none;
  }
  .social-item svg { width: 3mm; height: 3mm; flex-shrink: 0; fill: ${secondaryText}; }
  .qr-code { width: 14mm; height: 14mm; background: #fff; border-radius: 1.5mm; padding: 1mm; }
  .qr-code img { width: 100%; height: 100%; }
  .footer {
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end;
    padding: 1.5mm 4mm 3mm; font-size: 4.5pt; color: ${statLabelColor};
  }
  .working-hours { font-size: 4.5pt; color: ${statLabelColor}; margin-bottom: 1mm; display: flex; gap: 1mm; }
  .stats { display: flex; gap: 3mm; }
  .stat { text-align: center; }
  .stat-val { font-size: 7pt; font-weight: 700; color: ${textColor}; line-height: 1; }
  .stat-lbl { color: ${statLabelColor}; margin-top: 0.5mm; }
  .profile-url { text-align: right; color: ${accentColor}; word-break: break-all; max-width: 30mm; }
  @media print {
    body { background: none; }
    .page { margin: 0; page-break-after: avoid; }
    @page { size: 90mm 50mm; margin: 0; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="accent-bar"></div>
  <div class="content">
    <div class="left">
      ${doctor.image
        ? `<img src="${doctor.image}" class="photo" alt="${doctor.name}" crossorigin="anonymous">`
        : `<div class="photo" style="display:flex;align-items:center;justify-content:center;font-size:6mm;color:${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};">👤</div>`
      }
      <div class="info">
        <div class="name">${doctor.name}</div>
        <div class="specialty">${specialtyLabel}</div>
        ${doctor.workplace ? `<div class="workplace">${doctor.workplace}</div>` : ''}
      </div>
    </div>
    <div class="right">
      <div class="verified-icon" title="${__('verified')}">✓</div>
      ${instagram || telegram || whatsapp ? `
      <div class="socials">
        ${instagram ? `
        <div class="social-item">
          <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          <span>@${instagram.username}</span>
        </div>` : ''}
        ${telegram ? `
        <div class="social-item">
          <svg viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm4.295 6.484l-1.555 7.789c-.116.572-.414.711-.832.438l-2.291-1.698-1.103 1.066c-.122.122-.224.224-.462.224l.165-2.35 4.273-3.845c.186-.165-.041-.258-.288-.092l-5.284 3.32-2.278-.714c-.494-.155-.505-.494.104-.732l8.912-3.438c.413-.155.775.092.641.732z"/></svg>
          <span>@${telegram.username}</span>
        </div>` : ''}
        ${whatsapp ? `
        <div class="social-item">
          <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004c-1.466 0-2.81-.403-3.983-1.103l-.286-.169-2.983.78.798-2.911-.188-.299c-.765-1.218-1.169-2.625-1.169-4.083 0-4.185 3.413-7.593 7.605-7.593 2.033 0 3.945.792 5.381 2.227 1.435 1.435 2.225 3.347 2.225 5.375-.001 4.187-3.414 7.596-7.596 7.596zm6.78-14.268c-1.808-1.809-4.214-2.806-6.774-2.806-5.284 0-9.584 4.296-9.588 9.577-.001 1.688.44 3.337 1.278 4.792l-1.359 4.957 5.077-1.332c1.401.765 2.98 1.168 4.592 1.168h.004c5.283 0 9.583-4.296 9.587-9.577 0-2.559-.996-4.967-2.807-6.779"/></svg>
          <span>WhatsApp</span>
        </div>` : ''}
      </div>` : ''}
      <div class="qr-code">
        <img src="${qrApiUrl}" alt="QR">
      </div>
    </div>
  </div>
  <div class="footer">
    ${doctor.workingHours ? `
    <div class="working-hours">
      <span>${__('hours')}:</span>
      <span style="color:${textColor};">${doctor.workingHours}</span>
    </div>` : ''}
    <div class="stats">
      ${articles.length > 0 ? `<div class="stat"><div class="stat-val">${articles.length}</div><div class="stat-lbl">${__('articles')}</div></div>` : ''}
      ${doctor.experience > 0 ? `<div class="stat"><div class="stat-val">${doctor.experience}</div><div class="stat-lbl">${__('years')}</div></div>` : ''}
      ${doctor.languages?.length > 0 ? `<div class="stat"><div class="stat-val">${doctor.languages.length}</div><div class="stat-lbl">${__('languages')}</div></div>` : ''}
    </div>
    <div class="profile-url">${doctorUrl.replace('https://', '')}</div>
  </div>
  <div class="accent-bar"></div>
</div>
</body>
</html>`;

  // PDF generation
  if (format === 'pdf') {
    let browser;
    try {
      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
        ignoreHTTPSErrors: true,
      });
      const page = await browser.newPage();
      await page.setViewport({ width: 340, height: 189 });
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        width: '90mm',
        height: '50mm',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });

      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="vizitka-${doctor.slug}.pdf"`,
        },
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      return new NextResponse('PDF generation failed', { status: 500 });
    } finally {
      if (browser) await browser.close();
    }
  }

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}      
