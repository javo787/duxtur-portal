import { describe, it, expect } from 'vitest';
import { cloudinaryImageUrl, isCloudinaryUpload } from './cloudinary-image';
import { getOptimizedCloudinaryUrl } from './utils';

const BASE = 'https://res.cloudinary.com/demo/image/upload';

describe('isCloudinaryUpload', () => {
  it('accepts upload URLs of res.cloudinary.com only', () => {
    expect(isCloudinaryUpload(`${BASE}/v1/doctors/a.jpg`)).toBe(true);
    expect(isCloudinaryUpload('https://images.unsplash.com/photo-1?w=400')).toBe(false);
    expect(isCloudinaryUpload('/logo.png')).toBe(false);
    expect(isCloudinaryUpload('https://res.cloudinary.com/demo/video/upload/v1/a.mp4')).toBe(false);
    expect(isCloudinaryUpload({ src: '/x.png' })).toBe(false);
  });
});

describe('cloudinaryImageUrl', () => {
  it('keeps the crop and the aspect ratio chosen by getOptimizedCloudinaryUrl, at the requested width', () => {
    const src = getOptimizedCloudinaryUrl(`${BASE}/v1/blog/a.jpg`, { width: 900, height: 600, crop: 'fill' });
    expect(src).toBe(`${BASE}/f_auto,q_auto,w_900,h_600,c_fill/v1/blog/a.jpg`);
    expect(cloudinaryImageUrl(src, 640)).toBe(`${BASE}/f_auto,q_auto,w_640,h_427,c_fill/v1/blog/a.jpg`);
    expect(cloudinaryImageUrl(src, 1200)).toBe(`${BASE}/f_auto,q_auto,w_1200,h_800,c_fill/v1/blog/a.jpg`);
  });

  it('keeps c_limit and c_fit', () => {
    const logo = getOptimizedCloudinaryUrl(`${BASE}/v1/logos/l.png`, { width: 200, height: 200, crop: 'limit' });
    expect(cloudinaryImageUrl(logo, 96)).toBe(`${BASE}/f_auto,q_auto,w_96,h_96,c_limit/v1/logos/l.png`);
  });

  it('scales down without an aspect ratio for a plain upload URL (no transformation)', () => {
    expect(cloudinaryImageUrl(`${BASE}/v1712345678/blog/a.jpg`, 828)).toBe(`${BASE}/f_auto,q_auto,w_828,c_limit/v1712345678/blog/a.jpg`);
    expect(cloudinaryImageUrl(`${BASE}/blog/a.jpg`, 640)).toBe(`${BASE}/f_auto,q_auto,w_640,c_limit/blog/a.jpg`);
  });

  it('does not mistake a version or a folder for a transformation', () => {
    expect(cloudinaryImageUrl(`${BASE}/v1/doctors_2024/a.jpg`, 400)).toBe(`${BASE}/f_auto,q_auto,w_400,c_limit/v1/doctors_2024/a.jpg`);
    expect(cloudinaryImageUrl(`${BASE}/doctors_2024/a.jpg`, 400)).toBe(`${BASE}/f_auto,q_auto,w_400,c_limit/doctors_2024/a.jpg`);
  });

  it('width-only transformation scales down, never up', () => {
    expect(cloudinaryImageUrl(`${BASE}/f_auto,q_auto,w_1600/v1/a.jpg`, 750)).toBe(`${BASE}/f_auto,q_auto,w_750,c_limit/v1/a.jpg`);
  });

  it('caps the width and keeps extra transformation tokens', () => {
    expect(cloudinaryImageUrl(`${BASE}/f_auto,q_auto,w_900,h_600,c_fill,g_face/v1/a.jpg`, 3840))
      .toBe(`${BASE}/f_auto,q_auto,w_2048,h_1365,c_fill,g_face/v1/a.jpg`);
  });

  it('leaves other URLs alone', () => {
    expect(cloudinaryImageUrl('https://images.unsplash.com/photo-1?w=400', 640)).toBe('https://images.unsplash.com/photo-1?w=400');
  });
});
