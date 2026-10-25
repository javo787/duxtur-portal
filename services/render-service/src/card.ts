import { BusyError, createGate } from './http';
import { renderCardHTML } from './template';

export { BusyError };

export const LANGS = ['ru', 'uz', 'tg', 'kk', 'ky'] as const;
export type CardLang = (typeof LANGS)[number];
export type CardFormat = 'pdf' | 'image';

export class DoctorNotFoundError extends Error {
  constructor(public readonly status: number) {
    super(`doctor data request answered ${status}`);
  }
}

export class RenderTimeoutError extends Error {
  constructor(ms: number) {
    super(`rendering took longer than ${ms} ms`);
  }
}

/** The slice of a puppeteer page/browser the renderer uses, so tests can supply a fake one. */
export interface PageLike {
  setViewport(v: { width: number; height: number; deviceScaleFactor: number }): Promise<void>;
  setContent(html: string, options: { waitUntil: 'networkidle0'; timeout: number }): Promise<void>;
  waitForFunction(fn: string, options: { timeout: number }): Promise<unknown>;
  screenshot(options: { type: 'png'; fullPage: boolean }): Promise<Uint8Array>;
  pdf(options: Record<string, unknown>): Promise<Uint8Array>;
  close(): Promise<void>;
}
export interface BrowserLike {
  newPage(): Promise<PageLike>;
  close(): Promise<void>;
  on?(event: 'disconnected', listener: () => void): unknown;
}

export interface CardOutput {
  body: Buffer;
  contentType: string;
  filename: string;
}

export interface CardRendererOptions {
  baseUrl: string;
  launch: () => Promise<BrowserLike>;
  fetchImpl?: typeof fetch;
  /** Close Chromium after this long without work: it is the biggest memory user on a 512 MB instance. */
  idleMs?: number;
  /** One render must not hold the queue for longer than this (a Free instance has 0.1 CPU). */
  renderTimeoutMs?: number;
  maxWaiting?: number;
}

export interface CardRenderer {
  render(doctorId: string, lang: CardLang, format: CardFormat): Promise<CardOutput>;
  /** Start Chromium ahead of the click. */
  warm(): Promise<void>;
  close(): Promise<void>;
  stats(): { browser: boolean; running: number; waiting: number };
}

const withTimeout = <T>(work: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new RenderTimeoutError(ms)), ms);
    work.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });

export function createCardRenderer(opts: CardRendererOptions): CardRenderer {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const idleMs = opts.idleMs ?? 90_000;
  const renderTimeoutMs = opts.renderTimeoutMs ?? 45_000;
  const gate = createGate(1, opts.maxWaiting ?? 2);

  let browserPromise: Promise<BrowserLike> | null = null;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  function getBrowser(): Promise<BrowserLike> {
    if (!browserPromise) {
      const launched = opts.launch();
      browserPromise = launched;
      const forget = () => {
        if (browserPromise === launched) browserPromise = null;
      };
      launched.then((b) => b.on?.('disconnected', forget)).catch(forget);
    }
    return browserPromise;
  }

  async function closeBrowser(): Promise<void> {
    const current = browserPromise;
    browserPromise = null;
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = null;
    const browser = await current?.catch(() => null);
    await browser?.close().catch(() => undefined);
  }

  function touch() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => void closeBrowser(), idleMs);
    idleTimer.unref?.();
  }

  async function draw(html: string, format: CardFormat, filenameBase: string): Promise<CardOutput> {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      // 4x for the PNG download: thin QR lines and type stay sharp even full-screen; 2x is plenty for the PDF.
      await page.setViewport({ width: 340, height: 400, deviceScaleFactor: format === 'image' ? 4 : 2 });
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15_000 });
      // The page fits the name font to the width with a script: wait for it, or the frame can be taken too early.
      await page.waitForFunction('window.__cardReady === true', { timeout: 5_000 }).catch(() => undefined);

      // page.screenshot()/page.pdf() return a Uint8Array, not a Buffer (puppeteer v22+): wrap it, or res.send() would
      // serialize it as JSON under a PDF/PNG content type.
      if (format === 'image') {
        const png = await page.screenshot({ type: 'png', fullPage: true });
        return { body: Buffer.from(png), contentType: 'image/png', filename: `${filenameBase}.png` };
      }
      const pdf = await page.pdf({
        width: '90mm',
        height: '50mm',
        printBackground: true,
        pageRanges: '1-2',
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
      return { body: Buffer.from(pdf), contentType: 'application/pdf', filename: `${filenameBase}.pdf` };
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  return {
    async render(doctorId, lang, format) {
      return gate.run(async () => {
        // The doctor's data comes from the production API: this service has no database access of its own for cards.
        const dataRes = await fetchImpl(`${opts.baseUrl}/api/doctor/${encodeURIComponent(doctorId)}/card?lang=${lang}`, {
          signal: AbortSignal.timeout(10_000),
        });
        if (!dataRes.ok) throw new DoctorNotFoundError(dataRes.status);
        const doctor = (await dataRes.json()) as { slug?: string };

        const html = renderCardHTML(doctor, lang, opts.baseUrl, format === 'image' ? 'image' : 'print');
        try {
          return await withTimeout(draw(html, format, `vizitka-${doctor.slug || doctorId}`), renderTimeoutMs);
        } catch (error) {
          // A render that hung or crashed may have left Chromium in a bad state: start fresh next time.
          if (error instanceof RenderTimeoutError) await closeBrowser();
          throw error;
        } finally {
          touch();
        }
      });
    },
    async warm() {
      await getBrowser();
      touch();
    },
    close: closeBrowser,
    stats: () => ({ browser: browserPromise !== null, ...gate.stats() }),
  };
}
