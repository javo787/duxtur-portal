import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, buildPublicId } from '../cloudinary-upload';
import { isAllowedImageUrl, isSignedUrl, redactSignedUrl } from './adapters/scrapegraph';
import { USER_AGENT } from './adapters/website';
import type { ClinicImages } from './types';

const MAX_REDIRECTS = 3;
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));
/** Presigned URLs carry a credential: never let one reach a log or a report. */
const safe = (url: string) => redactSignedUrl(url) ?? url;

export interface DownloadOptions {
  /** When set, every redirect hop must also be on one of these hosts. */
  allowedHosts?: readonly string[];
  timeoutMs?: number;
}

/**
 * Downloads one image with the same limits the upload form enforces (JPG/PNG/WebP, <= 5 MB).
 * The body is read as a stream and cut off at the limit, so a hostile server cannot make us
 * buffer an unbounded response.
 */
export async function downloadImage(
  url: string,
  fetchImpl: typeof fetch = fetch,
  opts: DownloadOptions = {}
): Promise<{ buffer: Buffer; contentType: string }> {
  let current = url;
  for (let hop = 0; ; hop++) {
    const res = await fetchImpl(current, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'image/jpeg,image/png,image/webp' },
      redirect: 'manual',
      signal: AbortSignal.timeout(opts.timeoutMs ?? 20_000),
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) throw new Error(`HTTP ${res.status} redirect without a location`);
      if (hop >= MAX_REDIRECTS) throw new Error('Too many redirects');
      const next = new URL(location, current).href;
      if (opts.allowedHosts && !isAllowedImageUrl(next, opts.allowedHosts)) {
        throw new Error(`Refused redirect to ${new URL(next).host}`);
      }
      current = next;
      continue;
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(contentType)) {
      throw new Error(`Unexpected content type "${contentType || 'none'}"`);
    }
    const declared = Number(res.headers.get('content-length'));
    if (declared > MAX_IMAGE_BYTES) throw new Error('Image too large (over 5 MB)');

    const chunks: Uint8Array[] = [];
    let total = 0;
    const reader = res.body?.getReader();
    if (!reader) throw new Error('Empty image');
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_IMAGE_BYTES) {
        await reader.cancel();
        throw new Error('Image too large (over 5 MB)');
      }
      chunks.push(value);
    }
    if (total === 0) throw new Error('Empty image');
    return { buffer: Buffer.concat(chunks), contentType };
  }
}

export interface ImportImagesOptions {
  slug: string;
  logoUrl?: string;
  photoUrls?: string[];
  /** Directory host plus the clinic's own host. Anything else is refused. */
  allowedHosts: readonly string[];
  /** Stores the bytes under `publicId` and returns the final HTTPS URL (Cloudinary in production). */
  upload: (buffer: Buffer, publicId: string) => Promise<string>;
  fetchImpl?: typeof fetch;
  /** Total photos kept: the first becomes the cover, the rest go to the gallery. Default 2. */
  maxPhotos?: number;
}

/**
 * Re-hosts a clinic's logo and a couple of photos. Each image is independent: one failure is
 * reported in `errors` and never blocks the others.
 */
export async function importClinicImages(opts: ImportImagesOptions): Promise<{ images: ClinicImages; errors: string[] }> {
  const images: ClinicImages = {};
  const errors: string[] = [];
  const f = opts.fetchImpl ?? fetch;

  const usable = (role: string, url: string): boolean => {
    if (isAllowedImageUrl(url, opts.allowedHosts)) return true;
    errors.push(`${role}: image URL not allowed (${safe(url)})`);
    return false;
  };
  const store = async (role: string, url: string, publicId: string): Promise<string | undefined> => {
    try {
      const { buffer } = await downloadImage(url, f, { allowedHosts: opts.allowedHosts });
      return await opts.upload(buffer, publicId);
    } catch (e) {
      errors.push(`${role}: ${errMsg(e)}`);
      return undefined;
    }
  };

  if (opts.logoUrl && usable('logo', opts.logoUrl)) {
    const url = await store('logo', opts.logoUrl, buildPublicId('clinics', opts.slug, 'logo'));
    if (url) images.logo = url;
  }

  const photos = (opts.photoUrls ?? []).filter(u => usable('photo', u)).slice(0, opts.maxPhotos ?? 2);
  const gallery: string[] = [];
  for (const [i, photoUrl] of photos.entries()) {
    if (i === 0) {
      const url = await store('cover', photoUrl, buildPublicId('clinics', opts.slug, 'cover'));
      if (url) images.coverImage = url;
    } else {
      const url = await store(`photo-${i}`, photoUrl, `${buildPublicId('clinics', opts.slug, 'photo')}-${i}`);
      if (url) gallery.push(url);
    }
  }
  if (gallery.length) images.photos = gallery;

  return { images, errors };
}

/**
 * Some sources (samt.tj) hand out presigned image links that die after ~5 minutes, which is
 * shorter than a full run (geocoding, matching, DB writes). Call this right after collecting:
 * signed URLs are downloaded immediately and later served from memory by the returned `fetch`;
 * every other URL passes straight through. Nothing is persisted.
 */
export async function prefetchSignedImages(
  urls: string[],
  opts: { allowedHosts: readonly string[]; fetchImpl?: typeof fetch }
): Promise<{ fetch: typeof fetch; errors: string[] }> {
  const f = opts.fetchImpl ?? fetch;
  const kept = new Map<string, { buffer: Buffer; contentType: string }>();
  const errors: string[] = [];

  for (const url of urls) {
    if (!isSignedUrl(url)) continue;
    if (!isAllowedImageUrl(url, opts.allowedHosts)) {
      errors.push(`prefetch: image URL not allowed (${safe(url)})`);
      continue;
    }
    try {
      kept.set(url, await downloadImage(url, f, { allowedHosts: opts.allowedHosts }));
    } catch (e) {
      errors.push(`prefetch ${safe(url)}: ${errMsg(e)}`);
    }
  }

  const served = (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const hit = kept.get(String(input));
    if (hit) return new Response(new Uint8Array(hit.buffer), { status: 200, headers: { 'content-type': hit.contentType } });
    return f(input, init);
  }) as typeof fetch;

  return { fetch: served, errors };
}
