import express, { type NextFunction, type Request, type Response } from 'express';
import { handleAdminBotUpdate, isAdminWebhookAuthorized, type AdminBotUpdate } from '@/lib/bots/admin-bot';
import { handleEduBotUpdate, type TelegramUpdate } from '@/lib/bots/edu-bot';
import { isValidWebhookSecret } from '@/lib/edu-telegram-bot';
import { describeError, eduLog, newReqId } from '@/lib/edu-log';
import {
  BusyError,
  DoctorNotFoundError,
  LANGS,
  RenderTimeoutError,
  createCardRenderer,
  type BrowserLike,
  type CardFormat,
  type CardLang,
} from './card';
import { corsMiddleware, createRateLimiter, parseOrigins } from './http';

/**
 * One always-on process for everything that must not live on Vercel's serverless functions:
 *
 *   POST /telegram/edu    webhook of the Edu login bot (@duxtur_bot)      same code as api/edu-auth/telegram/webhook on Vercel
 *   POST /telegram/admin  webhook of the admin/doctor bot                  same code as api/telegram/webhook on Vercel
 *   GET  /card/:id        business card as PDF or PNG (headless Chromium)
 *   GET  /warm            starts Chromium ahead of the click
 *   GET  /healthz         cheap liveness check: what the keep-alive pinger calls
 *
 * Everything is in ONE service on purpose: a Render Free workspace has 750 instance hours a month, which is about one
 * service running around the clock. See docs/RENDER_SETUP.md.
 */

const PORT = Number(process.env.PORT) || 3000;
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
const DUXTUR_BASE_URL = (process.env.DUXTUR_BASE_URL || 'https://www.duxtur.org').replace(/\/$/, '');
const ALLOWED_ORIGINS = parseOrigins(process.env.ALLOWED_ORIGINS);

const CHROMIUM_ARGS = [
  '--no-sandbox', // runs as an unprivileged user inside the container (see Dockerfile)
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-extensions',
  '--disable-background-networking',
  '--mute-audio',
  '--hide-scrollbars',
  '--font-render-hinting=none',
  '--js-flags=--max-old-space-size=192', // keep Chromium's JS heap small: the instance has 512 MB in total
];

const cards = createCardRenderer({
  baseUrl: DUXTUR_BASE_URL,
  launch: async () => {
    // Loaded on first use, so the bots start without paying for puppeteer. The name is a variable on purpose: the bundler
    // must leave it as a runtime require of the installed package.
    const moduleName = 'puppeteer-core';
    const puppeteer = (await import(moduleName)).default;
    return (await puppeteer.launch({ executablePath: CHROMIUM_PATH, headless: true, args: CHROMIUM_ARGS })) as BrowserLike;
  },
});

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // Render's load balancer: req.ip is the real client

const jsonBody = express.json({ limit: '256kb' });
const cardLimiter = createRateLimiter(30, 60_000);
const warmLimiter = createRateLimiter(6, 60_000);
const cors = corsMiddleware(ALLOWED_ORIGINS);

app.get('/healthz', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ ok: true, uptimeSec: Math.round(process.uptime()) });
});

// ── Telegram webhooks ───────────────────────────────────────────────────────────────────────────────────────────────
// Telegram must always get a 2xx once the request is authentic, or it retries in a storm.

app.post('/telegram/edu', jsonBody, async (req: Request, res: Response) => {
  const reqId = newReqId();
  const startedAt = Date.now();
  const secretHeader = req.get('x-telegram-bot-api-secret-token') ?? null;
  if (!isValidWebhookSecret(secretHeader)) {
    eduLog('webhook', reqId, 'webhook:unauthorized', {
      host: 'render',
      hasSecretHeader: !!secretHeader,
      secretConfigured: !!process.env.EDU_TELEGRAM_BOT_SECRET,
      hint: !process.env.EDU_TELEGRAM_BOT_SECRET
        ? 'EDU_TELEGRAM_BOT_SECRET is not set on Render: every update is rejected'
        : 'header differs from EDU_TELEGRAM_BOT_SECRET: re-run setWebhook with the same secret_token',
    }, 'warn');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    await handleEduBotUpdate(req.body as TelegramUpdate, reqId, startedAt);
  } catch (error) {
    eduLog('webhook', reqId, 'webhook:error', { host: 'render', ...describeError(error), tookMs: Date.now() - startedAt }, 'error');
  }
  res.json({ ok: true });
});

app.post('/telegram/admin', jsonBody, async (req: Request, res: Response) => {
  // Header only: a secret in the URL would end up in Render's access logs.
  if (!isAdminWebhookAuthorized(req.get('x-telegram-bot-api-secret-token') ?? null, null)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const result = await handleAdminBotUpdate((req.body ?? {}) as AdminBotUpdate);
    if (result === 'rate_limited') {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }
  } catch (error) {
    console.error('[admin-bot] update failed', describeError(error));
  }
  res.json({ ok: true });
});

// ── Cards ───────────────────────────────────────────────────────────────────────────────────────────────────────────

// app.use, not a per-route argument: Express answers OPTIONS itself and would skip middleware attached to app.get.
app.use('/warm', cors);
app.use('/card', cors);

app.get('/warm', (req, res) => {
  if (!warmLimiter.hit(req.ip ?? 'unknown')) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }
  void cards.warm().catch((error) => console.error('[cards] warm-up failed', describeError(error)));
  res.status(202).json({ ok: true });
});

app.get('/card/:doctorId', async (req, res) => {
  if (!cardLimiter.hit(req.ip ?? 'unknown')) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }
  const doctorId = req.params.doctorId;
  if (!doctorId || doctorId.length > 120) {
    res.status(400).json({ error: 'Bad doctor id' });
    return;
  }
  const lang = (LANGS as readonly string[]).includes(String(req.query.lang)) ? (String(req.query.lang) as CardLang) : 'ru';
  const format: CardFormat = req.query.format === 'image' ? 'image' : 'pdf';

  try {
    const out = await cards.render(doctorId, lang, format);
    res.setHeader('Content-Type', out.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${out.filename}"`);
    res.send(out.body);
  } catch (error) {
    if (error instanceof DoctorNotFoundError) {
      res.status(error.status).json({ error: 'Doctor not found' });
    } else if (error instanceof BusyError) {
      res.setHeader('Retry-After', '20');
      res.status(503).json({ error: 'Busy, try again in a few seconds' });
    } else if (error instanceof RenderTimeoutError) {
      res.status(504).json({ error: 'Render took too long' });
    } else {
      console.error('[cards] render failed', describeError(error));
      res.status(500).json({ error: 'Render failed' });
    }
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Malformed JSON and the like: a clean JSON error instead of Express's HTML page.
app.use((error: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  void _next;
  res.status(error.status && error.status < 500 ? error.status : 500).json({ error: 'Bad request' });
});

const server = app.listen(PORT, () => {
  console.log(
    `[render-service] listening on :${PORT}`,
    JSON.stringify({
      eduBot: !!(process.env.EDU_TELEGRAM_BOT_TOKEN && process.env.EDU_TELEGRAM_BOT_SECRET),
      adminBot: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_SECRET),
      mongo: !!process.env.MONGODB_URI,
      upstash: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
      cardsFrom: DUXTUR_BASE_URL,
      origins: ALLOWED_ORIGINS,
    }),
  );
});

// Render sends SIGTERM on every deploy and before it spins a Free service down.
process.on('SIGTERM', () => {
  server.close();
  void cards.close().finally(() => process.exit(0));
  setTimeout(() => process.exit(0), 8_000).unref();
});
