import { httpsOrigin } from '@/lib/study-api';

/**
 * Client side of the Render card service (services/render-service): PDF/PNG business cards drawn by headless Chromium.
 *
 * A Free Render instance sleeps after 15 minutes without traffic and needs about a minute to wake up, so the button
 *  1. wakes the service as soon as the page is shown (warmCardService), not when the user clicks, and
 *  2. never waits longer than CARD_SERVICE_TIMEOUT_MS: after that a PDF is made in the browser instead.
 */

export const CARD_SERVICE_TIMEOUT_MS = 25_000;

/** https origin of the service, or '' (not configured: the button uses the browser renderer only). */
export function cardServiceOrigin(value: string | undefined = process.env.NEXT_PUBLIC_CARD_SERVICE_URL): string {
  return httpsOrigin(value);
}

type FetchLike = typeof fetch;

/** Fire and forget. no-cors: the answer is not needed, only the request that wakes the instance. */
export function warmCardService(origin: string, fetchImpl: FetchLike = fetch): void {
  if (!origin) return;
  fetchImpl(`${origin}/warm`, { mode: 'no-cors', cache: 'no-store', keepalive: true }).catch(() => undefined);
}

export type CardFormat = 'pdf' | 'image';

export interface CardRequest {
  origin: string;
  slug: string;
  lang: string;
  format: CardFormat;
  timeoutMs?: number;
  fetchImpl?: FetchLike;
}

export class CardServiceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}

/** The finished file from the service, or a CardServiceError (error status, timeout, network) for the caller to handle. */
export async function fetchCardFromService({ origin, slug, lang, format, timeoutMs = CARD_SERVICE_TIMEOUT_MS, fetchImpl = fetch }: CardRequest): Promise<Blob> {
  let res: Response;
  try {
    res = await fetchImpl(`${origin}/card/${encodeURIComponent(slug)}?lang=${encodeURIComponent(lang)}&format=${format}`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError');
    throw new CardServiceError(timedOut ? `no answer within ${timeoutMs} ms` : 'network error');
  }
  if (!res.ok) throw new CardServiceError(`service answered ${res.status}`, res.status);
  return res.blob();
}

/**
 * What to do when the service cannot deliver. The browser renderer only makes a PDF, so for a PNG request it must not
 * quietly hand over a PDF instead: the user is told to try again or to take the PDF.
 */
export function fallbackFor(format: CardFormat): 'browser-pdf' | 'tell-user' {
  return format === 'pdf' ? 'browser-pdf' : 'tell-user';
}
