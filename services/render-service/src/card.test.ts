import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./template', () => ({ renderCardHTML: vi.fn(() => '<html>card</html>') }));

import { BusyError, DoctorNotFoundError, RenderTimeoutError, createCardRenderer, type BrowserLike, type PageLike } from './card';

function fakePage(overrides: Partial<PageLike> = {}): PageLike & { closed: boolean } {
  const page = {
    closed: false,
    setViewport: vi.fn(async () => undefined),
    setContent: vi.fn(async () => undefined),
    waitForFunction: vi.fn(async () => true),
    screenshot: vi.fn(async () => new Uint8Array([137, 80, 78, 71])),
    pdf: vi.fn(async () => new Uint8Array([37, 80, 68, 70])),
    close: vi.fn(async () => {
      page.closed = true;
    }),
    ...overrides,
  };
  return page as unknown as PageLike & { closed: boolean };
}

function fakeBrowser(makePage: () => PageLike = () => fakePage()) {
  const browser = { newPage: vi.fn(async () => makePage()), close: vi.fn(async () => undefined) };
  return browser as unknown as BrowserLike & typeof browser;
}

const okDoctor = (slug = 'dr-test') => async (...args: [string, RequestInit?]) => {
  void args;
  return new Response(JSON.stringify({ slug, name: 'Dr' }), { status: 200 });
};

describe('createCardRenderer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('renders a PDF as real bytes (a Buffer, not JSON) and asks the production API for the doctor', async () => {
    const fetchImpl = vi.fn(okDoctor());
    const page = fakePage();
    const renderer = createCardRenderer({ baseUrl: 'https://www.duxtur.org', launch: async () => fakeBrowser(() => page), fetchImpl: fetchImpl as unknown as typeof fetch });

    const out = await renderer.render('dr-test', 'ru', 'pdf');

    expect(String(fetchImpl.mock.calls[0][0])).toBe('https://www.duxtur.org/api/doctor/dr-test/card?lang=ru');
    expect(Buffer.isBuffer(out.body)).toBe(true);
    expect([...out.body]).toEqual([37, 80, 68, 70]);
    expect(out).toMatchObject({ contentType: 'application/pdf', filename: 'vizitka-dr-test.pdf' });
    expect(page.setViewport).toHaveBeenCalledWith({ width: 340, height: 400, deviceScaleFactor: 2 });
    expect(page.pdf).toHaveBeenCalledWith(expect.objectContaining({ width: '90mm', height: '50mm', pageRanges: '1-2' }));
    expect(page.closed).toBe(true);
  });

  it('renders a PNG at 4x', async () => {
    const page = fakePage();
    const renderer = createCardRenderer({ baseUrl: 'https://x.test', launch: async () => fakeBrowser(() => page), fetchImpl: okDoctor() as unknown as typeof fetch });
    const out = await renderer.render('a', 'uz', 'image');
    expect(out).toMatchObject({ contentType: 'image/png', filename: 'vizitka-dr-test.png' });
    expect(page.setViewport).toHaveBeenCalledWith(expect.objectContaining({ deviceScaleFactor: 4 }));
  });

  it('passes the doctor API status through as DoctorNotFoundError, without touching the browser', async () => {
    const launch = vi.fn(async () => fakeBrowser());
    const renderer = createCardRenderer({ baseUrl: 'https://x.test', launch, fetchImpl: (async () => new Response('', { status: 404 })) as unknown as typeof fetch });
    await expect(renderer.render('nobody', 'ru', 'pdf')).rejects.toMatchObject({ status: 404 });
    await expect(renderer.render('nobody', 'ru', 'pdf')).rejects.toBeInstanceOf(DoctorNotFoundError);
    expect(launch).not.toHaveBeenCalled();
  });

  it('keeps one browser for several renders and closes the page even when drawing fails', async () => {
    const pages: ReturnType<typeof fakePage>[] = [];
    const browser = fakeBrowser(() => {
      const p = fakePage(pages.length === 0 ? { pdf: vi.fn(async () => Promise.reject(new Error('crash'))) } : {});
      pages.push(p);
      return p;
    });
    const launch = vi.fn(async () => browser);
    const renderer = createCardRenderer({ baseUrl: 'https://x.test', launch, fetchImpl: okDoctor() as unknown as typeof fetch });

    await expect(renderer.render('a', 'ru', 'pdf')).rejects.toThrow('crash');
    await renderer.render('a', 'ru', 'pdf');

    expect(launch).toHaveBeenCalledTimes(1);
    expect(pages.every((p) => p.closed)).toBe(true);
  });

  it('closes Chromium after the idle time and starts a new one on the next request', async () => {
    const browsers: ReturnType<typeof fakeBrowser>[] = [];
    const launch = vi.fn(async () => {
      const b = fakeBrowser();
      browsers.push(b);
      return b;
    });
    const renderer = createCardRenderer({ baseUrl: 'https://x.test', launch, idleMs: 60_000, fetchImpl: okDoctor() as unknown as typeof fetch });

    await renderer.render('a', 'ru', 'pdf');
    expect(renderer.stats().browser).toBe(true);
    await vi.advanceTimersByTimeAsync(59_000);
    expect(browsers[0].close).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2_000);
    expect(browsers[0].close).toHaveBeenCalledTimes(1);
    expect(renderer.stats().browser).toBe(false);

    await renderer.render('a', 'ru', 'pdf');
    expect(launch).toHaveBeenCalledTimes(2);
  });

  it('answers busy at once when the single render slot and the queue are taken', async () => {
    let release!: () => void;
    const hold = new Promise<void>((r) => (release = r));
    const renderer = createCardRenderer({
      baseUrl: 'https://x.test',
      maxWaiting: 1,
      launch: async () => fakeBrowser(() => fakePage({ pdf: vi.fn(async () => (await hold, new Uint8Array([1]))) })),
      fetchImpl: okDoctor() as unknown as typeof fetch,
    });

    const first = renderer.render('a', 'ru', 'pdf');
    await vi.advanceTimersByTimeAsync(0);
    const second = renderer.render('b', 'ru', 'pdf');
    await expect(renderer.render('c', 'ru', 'pdf')).rejects.toBeInstanceOf(BusyError);

    release();
    await expect(first).resolves.toBeDefined();
    await expect(second).resolves.toBeDefined();
  });

  it('gives up on a render that hangs, restarts Chromium and frees the slot', async () => {
    const browsers: ReturnType<typeof fakeBrowser>[] = [];
    const launch = vi.fn(async () => {
      const b = fakeBrowser(() => fakePage(browsers.length === 1 ? { pdf: vi.fn(() => new Promise<Uint8Array>(() => undefined)) } : {}));
      browsers.push(b);
      return b;
    });
    const renderer = createCardRenderer({ baseUrl: 'https://x.test', launch, renderTimeoutMs: 10_000, fetchImpl: okDoctor() as unknown as typeof fetch });

    const hung = renderer.render('a', 'ru', 'pdf');
    const assertion = expect(hung).rejects.toBeInstanceOf(RenderTimeoutError);
    await vi.advanceTimersByTimeAsync(10_001);
    await assertion;
    expect(browsers[0].close).toHaveBeenCalled();

    await expect(renderer.render('a', 'ru', 'pdf')).resolves.toBeDefined();
    expect(launch).toHaveBeenCalledTimes(2);
  });

  it('warm() starts Chromium without rendering anything', async () => {
    const launch = vi.fn(async () => fakeBrowser());
    const renderer = createCardRenderer({ baseUrl: 'https://x.test', launch, fetchImpl: okDoctor() as unknown as typeof fetch });
    await renderer.warm();
    expect(launch).toHaveBeenCalledTimes(1);
    expect(renderer.stats()).toEqual({ browser: true, running: 0, waiting: 0 });
    await renderer.close();
    expect(renderer.stats().browser).toBe(false);
  });
});
