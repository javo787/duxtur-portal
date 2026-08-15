const express = require('express');
const puppeteer = require('puppeteer-core');
const { renderCardHTML } = require('./template');

const PORT = process.env.PORT || 3000;
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
const DUXTUR_BASE_URL = process.env.DUXTUR_BASE_URL || 'https://duxtur.org';
// Разрешаем CORS только с боевого домена и локальной разработки — сервис
// не должен превращаться в открытый PDF-рендер для чужих сайтов.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://duxtur.org,http://localhost:3000').split(',');

const app = express();

// ── Переиспользуемый инстанс браузера ──────────────────────────
// Запуск headless Chrome — самая дорогая часть (~0.5-1с). Держим
// браузер тёплым между запросами вместо запуска заново на каждый PDF.
let browserPromise = null;
async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      executablePath: CHROMIUM_PATH,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
      ],
    });
    browserPromise.catch(() => { browserPromise = null; });
  }
  return browserPromise;
}

// ── Простой rate limit по IP (30 запросов / минуту) ────────────
const hits = new Map();
function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const entry = hits.get(ip) || { count: 0, reset: now + windowMs };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + windowMs;
  }
  entry.count += 1;
  hits.set(ip, entry);
  if (entry.count > 30) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  next();
}

function cors(req, res, next) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
}

app.use(cors);

app.get('/healthz', (req, res) => res.json({ ok: true }));

app.get('/card/:doctorId', rateLimit, async (req, res) => {
  const { doctorId } = req.params;
  const lang = ['ru', 'uz', 'tg', 'kk', 'ky'].includes(req.query.lang) ? req.query.lang : 'ru';

  let page;
  try {
    // Данные врача берём из уже существующего продакшн-эндпоинта —
    // этот сервис не подключается к БД напрямую, только рендерит.
    const dataRes = await fetch(`${DUXTUR_BASE_URL}/api/doctor/${encodeURIComponent(doctorId)}/card?lang=${lang}`);
    if (!dataRes.ok) {
      return res.status(dataRes.status).json({ error: 'Doctor not found' });
    }
    const doctor = await dataRes.json();

    const html = renderCardHTML(doctor, lang, DUXTUR_BASE_URL);

    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 });

    const pdf = await page.pdf({
      width: '90mm',
      height: '50mm',
      printBackground: true,
      pageRanges: '1-2',
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="vizitka-${doctor.slug || doctorId}.pdf"`);
    res.send(pdf);
  } catch (err) {
    console.error('Card render error:', err);
    res.status(500).json({ error: 'Render failed' });
  } finally {
    if (page) await page.close().catch(() => {});
  }
});

app.listen(PORT, () => {
  console.log(`Card render service listening on :${PORT}`);
  // Прогреваем браузер сразу при старте, чтобы первый реальный запрос не ждал launch.
  getBrowser().catch((err) => console.error('Chromium warm-up failed:', err));
});

process.on('SIGTERM', async () => {
  if (browserPromise) {
    const browser = await browserPromise.catch(() => null);
    if (browser) await browser.close().catch(() => {});
  }
  process.exit(0);
});
