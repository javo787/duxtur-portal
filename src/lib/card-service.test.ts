import { describe, expect, it, vi } from 'vitest';
import { CARD_SERVICE_TIMEOUT_MS, CardServiceError, cardServiceOrigin, fallbackFor, fetchCardFromService, warmCardService } from './card-service';

const asFetch = (fn: unknown) => fn as unknown as typeof fetch;
// A typed mock so that `mock.calls[0][0]` is the URL.
const okFetch = (make: () => Response) =>
  vi.fn(async (...args: [string, RequestInit?]) => {
    void args;
    return make();
  });

describe('cardServiceOrigin', () => {
  it('is the https origin, or empty when not configured or unsafe', () => {
    expect(cardServiceOrigin('https://duxtur-render.onrender.com/')).toBe('https://duxtur-render.onrender.com');
    expect(cardServiceOrigin(undefined)).toBe('');
    expect(cardServiceOrigin('http://duxtur-render.onrender.com')).toBe('');
    expect(cardServiceOrigin('javascript:alert(1)')).toBe('');
  });
});

describe('warmCardService', () => {
  it('sends one fire-and-forget request that cannot be read (no-cors): it only has to wake the instance', () => {
    const fetchImpl = vi.fn(async () => new Response(null));
    warmCardService('https://r.example', asFetch(fetchImpl));
    expect(fetchImpl).toHaveBeenCalledWith('https://r.example/warm', expect.objectContaining({ mode: 'no-cors', cache: 'no-store' }));
  });

  it('does nothing without a service, and never throws when the request fails', async () => {
    const fetchImpl = vi.fn(async () => Promise.reject(new Error('offline')));
    warmCardService('', asFetch(fetchImpl));
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(() => warmCardService('https://r.example', asFetch(fetchImpl))).not.toThrow();
    await Promise.resolve();
  });
});

describe('fetchCardFromService', () => {
  const base = { origin: 'https://r.example', slug: 'dr-ivanov', lang: 'ru', format: 'pdf' as const };

  it('asks for the right file and returns it', async () => {
    const fetchImpl = okFetch(() => new Response(new Blob(['%PDF']), { status: 200 }));
    const blob = await fetchCardFromService({ ...base, fetchImpl: asFetch(fetchImpl) });
    expect(await blob.text()).toBe('%PDF');
    expect(fetchImpl.mock.calls[0][0]).toBe('https://r.example/card/dr-ivanov?lang=ru&format=pdf');
  });

  it('encodes the slug, so it cannot add path or query parts', async () => {
    const fetchImpl = okFetch(() => new Response(new Blob(['x'])));
    await fetchCardFromService({ ...base, slug: '../x?a=1#', fetchImpl: asFetch(fetchImpl) });
    expect(fetchImpl.mock.calls[0][0]).toBe('https://r.example/card/..%2Fx%3Fa%3D1%23?lang=ru&format=pdf');
  });

  it('turns an error status into a CardServiceError that carries it (503 = busy)', async () => {
    const fetchImpl = asFetch(async () => new Response('busy', { status: 503 }));
    await expect(fetchCardFromService({ ...base, fetchImpl })).rejects.toMatchObject({ status: 503, name: 'Error' });
    await expect(fetchCardFromService({ ...base, fetchImpl })).rejects.toBeInstanceOf(CardServiceError);
  });

  it('turns a timeout and a network failure into CardServiceError', async () => {
    const timeout = asFetch(async () => Promise.reject(new DOMException('timed out', 'TimeoutError')));
    await expect(fetchCardFromService({ ...base, fetchImpl: timeout, timeoutMs: 5 })).rejects.toThrow(/no answer within 5 ms/);
    const offline = asFetch(async () => Promise.reject(new TypeError('Failed to fetch')));
    await expect(fetchCardFromService({ ...base, fetchImpl: offline })).rejects.toThrow(/network error/);
  });

  it('gives up before a cold start of a minute would make the user wait for it', () => {
    expect(CARD_SERVICE_TIMEOUT_MS).toBeLessThanOrEqual(30_000);
  });
});

describe('fallbackFor', () => {
  it('uses the browser renderer for a PDF, but never hands over a PDF when a PNG was asked for', () => {
    expect(fallbackFor('pdf')).toBe('browser-pdf');
    expect(fallbackFor('image')).toBe('tell-user');
  });
});
