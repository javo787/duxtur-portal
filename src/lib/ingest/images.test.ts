import { describe, it, expect } from 'vitest';
import { downloadImage, importClinicImages, prefetchSignedImages } from './images';
import { toClinicDoc, fillEmptyPatch } from './writer';
import type { RawClinic } from './types';

const bytes = (n: number) => new Uint8Array(n).fill(1);
const imageRes = (n: number, type = 'image/jpeg', headers: Record<string, string> = {}) =>
  new Response(bytes(n), { status: 200, headers: { 'content-type': type, ...headers } });
const asFetch = (fn: (url: string) => Response | Promise<Response>) =>
  (async (url: unknown) => fn(String(url))) as unknown as typeof fetch;

describe('downloadImage', () => {
  it('returns the bytes and content type of a normal image', async () => {
    const out = await downloadImage('https://ydoc.tj/a.jpg', asFetch(() => imageRes(10)));
    expect(out.buffer.length).toBe(10);
    expect(out.contentType).toBe('image/jpeg');
  });
  it('rejects an HTML error page served with 200', async () => {
    await expect(downloadImage('https://ydoc.tj/a.jpg', asFetch(() => imageRes(10, 'text/html; charset=utf-8'))))
      .rejects.toThrow(/content type/i);
  });
  it('rejects SVG (can carry scripts) and non-images', async () => {
    await expect(downloadImage('https://ydoc.tj/a.svg', asFetch(() => imageRes(10, 'image/svg+xml')))).rejects.toThrow(/content type/i);
  });
  it('rejects a body over 5 MB even when content-length lies or is missing', async () => {
    await expect(downloadImage('https://ydoc.tj/big.jpg', asFetch(() => imageRes(5 * 1024 * 1024 + 1)))).rejects.toThrow(/too large/i);
    await expect(
      downloadImage('https://ydoc.tj/big.jpg', asFetch(() => imageRes(5 * 1024 * 1024 + 1, 'image/png', { 'content-length': '100' })))
    ).rejects.toThrow(/too large/i);
  });
  it('refuses to follow a redirect to a host outside the allowlist (open-redirect SSRF)', async () => {
    const f = asFetch(u =>
      u === 'https://ydoc.tj/r.jpg'
        ? new Response('', { status: 302, headers: { location: 'https://169.254.169.254/latest/meta-data' } })
        : imageRes(10)
    );
    await expect(downloadImage('https://ydoc.tj/r.jpg', f, { allowedHosts: ['ydoc.tj'] })).rejects.toThrow(/redirect/i);
  });
  it('follows a redirect that stays on an allowed host, but not forever', async () => {
    const hop = asFetch(u =>
      u === 'https://ydoc.tj/old.jpg'
        ? new Response('', { status: 301, headers: { location: '/media/new.jpg' } })
        : imageRes(10)
    );
    const out = await downloadImage('https://ydoc.tj/old.jpg', hop, { allowedHosts: ['ydoc.tj'] });
    expect(out.buffer.length).toBe(10);

    const loop = asFetch(() => new Response('', { status: 302, headers: { location: 'https://ydoc.tj/loop.jpg' } }));
    await expect(downloadImage('https://ydoc.tj/loop.jpg', loop, { allowedHosts: ['ydoc.tj'] })).rejects.toThrow(/redirect/i);
  });
  it('rejects an empty body and a non-2xx status', async () => {
    await expect(downloadImage('https://ydoc.tj/a.jpg', asFetch(() => imageRes(0)))).rejects.toThrow(/empty/i);
    await expect(downloadImage('https://ydoc.tj/a.jpg', asFetch(() => new Response('', { status: 404 })))).rejects.toThrow(/404/);
  });
});

describe('importClinicImages', () => {
  const slug = 'klinika-vedanta-459659';
  const hosts = ['ydoc.tj'];
  const upload = async (_buf: Buffer, publicId: string) => `https://res.cloudinary.com/demo/image/upload/${publicId}.jpg`;
  const okFetch = asFetch(() => imageRes(10));

  it('logo -> /logo, first photo -> cover, second photo -> photos[0]; stops at two photos', async () => {
    const out = await importClinicImages({
      slug, allowedHosts: hosts, upload, fetchImpl: okFetch,
      logoUrl: 'https://ydoc.tj/m/logo.png',
      photoUrls: ['https://ydoc.tj/m/1.jpg', 'https://ydoc.tj/m/2.jpg', 'https://ydoc.tj/m/3.jpg'],
    });
    expect(out.images.logo).toBe('https://res.cloudinary.com/demo/image/upload/duxtur/clinics/klinika-vedanta-459659/logo.jpg');
    expect(out.images.coverImage).toBe('https://res.cloudinary.com/demo/image/upload/duxtur/clinics/klinika-vedanta-459659/cover.jpg');
    expect(out.images.photos).toEqual(['https://res.cloudinary.com/demo/image/upload/duxtur/clinics/klinika-vedanta-459659/photo-1.jpg']);
    expect(out.errors).toEqual([]);
  });

  it('never downloads from a host outside the allowlist', async () => {
    const seen: string[] = [];
    const out = await importClinicImages({
      slug, allowedHosts: hosts, upload,
      fetchImpl: asFetch(u => { seen.push(u); return imageRes(10); }),
      logoUrl: 'https://evil.example/logo.png',
      photoUrls: ['http://ydoc.tj/insecure.jpg', 'https://ydoc.tj/m/ok.jpg'],
    });
    expect(seen).toEqual(['https://ydoc.tj/m/ok.jpg']);
    expect(out.images.logo).toBeUndefined();
    expect(out.images.coverImage).toContain('/cover.jpg');
    expect(out.errors.some(e => /evil\.example/.test(e))).toBe(true);
  });

  it('one failed image does not block the others, and the failure is reported', async () => {
    const out = await importClinicImages({
      slug, allowedHosts: hosts, upload,
      fetchImpl: asFetch(u => (u.endsWith('logo.png') ? new Response('', { status: 500 }) : imageRes(10))),
      logoUrl: 'https://ydoc.tj/m/logo.png',
      photoUrls: ['https://ydoc.tj/m/1.jpg'],
    });
    expect(out.images.logo).toBeUndefined();
    expect(out.images.coverImage).toContain('/cover.jpg');
    expect(out.errors).toHaveLength(1);
    expect(out.errors[0]).toMatch(/logo[\s\S]*500/);
  });

  it('a failed upload is reported and leaves that field unset', async () => {
    const out = await importClinicImages({
      slug, allowedHosts: hosts, fetchImpl: okFetch,
      upload: async (_b, id) => { if (id.endsWith('/logo')) throw new Error('quota'); return `https://res.cloudinary.com/x/${id}.jpg`; },
      logoUrl: 'https://ydoc.tj/m/logo.png', photoUrls: [],
    });
    expect(out.images.logo).toBeUndefined();
    expect(out.errors[0]).toMatch(/quota/);
  });

  it('does nothing when there are no image URLs', async () => {
    const out = await importClinicImages({ slug, allowedHosts: hosts, upload, fetchImpl: okFetch });
    expect(out).toEqual({ images: {}, errors: [] });
  });
});

describe('writer + images/specialties', () => {
  const raw: RawClinic = {
    source: 'ydoc', sourceId: '/dushanbe/lpu/vedanta', name: 'Клиника «Vedanta»', city: 'Душанбе',
    phones: [], specialties: ['cardiology', 'surgery'],
  };
  const images = { logo: 'https://cdn/l.jpg', coverImage: 'https://cdn/c.jpg', photos: ['https://cdn/p1.jpg'] };

  it('toClinicDoc stores uploaded images and specialties on a new pre_imported clinic', () => {
    const doc = toClinicDoc(raw, new Date('2026-10-06'), images) as Record<string, unknown>;
    expect(doc.logo).toBe('https://cdn/l.jpg');
    expect(doc.coverImage).toBe('https://cdn/c.jpg');
    expect(doc.photos).toEqual(['https://cdn/p1.jpg']);
    expect(doc.specialties).toEqual(['cardiology', 'surgery']);
    expect(doc.status).toBe('pre_imported');
  });

  it('toClinicDoc without images adds no image keys (nothing blank to overwrite later)', () => {
    const doc = toClinicDoc({ ...raw, specialties: undefined }) as Record<string, unknown>;
    expect('logo' in doc).toBe(false);
    expect('coverImage' in doc).toBe(false);
    expect('photos' in doc).toBe(false);
    expect('specialties' in doc).toBe(false);
  });

  it('fillEmptyPatch fills empty logo/cover/photos/specialties', () => {
    const patch = fillEmptyPatch({ logo: '', coverImage: '', photos: [], specialties: [] } as never, raw, images);
    expect(patch.logo).toBe('https://cdn/l.jpg');
    expect(patch.coverImage).toBe('https://cdn/c.jpg');
    expect(patch.photos).toEqual(['https://cdn/p1.jpg']);
    expect(patch.specialties).toEqual(['cardiology', 'surgery']);
  });

  it('fillEmptyPatch NEVER overwrites images or specialties that already exist', () => {
    const existing = {
      logo: 'https://clinic-own/logo.png', coverImage: 'https://clinic-own/cover.png',
      photos: ['https://clinic-own/1.png'], specialties: ['dentistry'],
    };
    const patch = fillEmptyPatch(existing as never, raw, images);
    for (const k of ['logo', 'coverImage', 'photos', 'specialties']) expect(k in patch).toBe(false);
  });
});

describe('signed (short-lived) image URLs', () => {
  const SIGNED = 'https://s3.regru.cloud/samt/icons/75/logo.png?X-Amz-Expires=300&X-Amz-Signature=secret123';
  const hosts = ['samt.tj', 's3.regru.cloud'];

  it('prefetchSignedImages downloads signed URLs right away and serves them later without touching the origin', async () => {
    let originCalls = 0;
    const origin = asFetch(() => { originCalls++; return imageRes(10); });
    const { fetch: served, errors } = await prefetchSignedImages([SIGNED], { allowedHosts: hosts, fetchImpl: origin });
    expect(errors).toEqual([]);
    expect(originCalls).toBe(1);

    const res = await served(SIGNED);
    expect(res.ok).toBe(true);
    expect(res.headers.get('content-type')).toBe('image/jpeg');
    expect((await res.arrayBuffer()).byteLength).toBe(10);
    expect(originCalls).toBe(1); // the link has expired by now; it must not be requested again
  });

  it('leaves plain URLs alone: not prefetched, passed through when asked for', async () => {
    const seen: string[] = [];
    const origin = asFetch(u => { seen.push(u); return imageRes(10); });
    const { fetch: served } = await prefetchSignedImages(['https://ydoc.tj/m/a.jpg'], { allowedHosts: ['ydoc.tj'], fetchImpl: origin });
    expect(seen).toEqual([]);
    await served('https://ydoc.tj/m/a.jpg');
    expect(seen).toEqual(['https://ydoc.tj/m/a.jpg']);
  });

  it('does not download a signed URL on an unexpected host, and errors never contain the signature', async () => {
    const seen: string[] = [];
    const evil = 'https://evil.example/x.png?X-Amz-Signature=secret123';
    const { errors } = await prefetchSignedImages([evil, SIGNED], {
      allowedHosts: hosts,
      fetchImpl: asFetch(u => (u.includes('regru') ? new Response('', { status: 403 }) : (seen.push(u), imageRes(10)))),
    });
    expect(seen).toEqual([]);
    expect(errors).toHaveLength(2);
    expect(errors.join(' ')).not.toContain('secret123');
  });

  it('importClinicImages never prints a signed URL in its error list', async () => {
    const out = await importClinicImages({
      slug: 's', allowedHosts: ['samt.tj'], upload: async () => 'x', fetchImpl: asFetch(() => imageRes(10)),
      logoUrl: 'https://evil.example/x.png?X-Amz-Signature=secret123',
    });
    expect(out.errors).toHaveLength(1);
    expect(out.errors[0]).not.toContain('secret123');
  });
});
