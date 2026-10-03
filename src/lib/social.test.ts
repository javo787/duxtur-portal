import { describe, it, expect } from 'vitest';
import { normalizeFacebookUrl, facebookHref } from './social';

describe('normalizeFacebookUrl', () => {
  it('accepts the common page address shapes and canonicalizes them', () => {
    expect(normalizeFacebookUrl('https://www.facebook.com/dlcshifo/')).toBe('https://www.facebook.com/dlcshifo');
    expect(normalizeFacebookUrl('facebook.com/dlcshifo')).toBe('https://www.facebook.com/dlcshifo');
    expect(normalizeFacebookUrl('m.facebook.com/dlcshifo')).toBe('https://www.facebook.com/dlcshifo');
    expect(normalizeFacebookUrl('http://fb.com/dlcshifo')).toBe('https://www.facebook.com/dlcshifo');
    expect(normalizeFacebookUrl('https://fb.me/dlcshifo')).toBe('https://www.facebook.com/dlcshifo');
    expect(normalizeFacebookUrl('https://web.facebook.com/p/Nasl-Dushanbe-100057?ref=x#y')).toBe('https://www.facebook.com/p/Nasl-Dushanbe-100057');
  });
  it('accepts a bare handle, with or without @', () => {
    expect(normalizeFacebookUrl('dlcshifo')).toBe('https://www.facebook.com/dlcshifo');
    expect(normalizeFacebookUrl('@nasl.clinic')).toBe('https://www.facebook.com/nasl.clinic');
  });
  it('keeps only the id of profile.php links', () => {
    expect(normalizeFacebookUrl('https://www.facebook.com/profile.php?id=100057123456789&sk=about')).toBe('https://www.facebook.com/profile.php?id=100057123456789');
    expect(normalizeFacebookUrl('https://www.facebook.com/profile.php')).toBeNull();
    expect(normalizeFacebookUrl('https://www.facebook.com/profile.php?id=abc')).toBeNull();
  });
  it('supports non-Latin page paths', () => {
    expect(normalizeFacebookUrl('https://www.facebook.com/p/Медицинский-центр-Насл-100057')).toContain('/p/');
  });
  it('rejects other hosts, scripts, action links and junk', () => {
    expect(normalizeFacebookUrl('https://evil.com/facebook.com/x')).toBeNull();
    expect(normalizeFacebookUrl('https://facebook.com.evil.com/page')).toBeNull();
    expect(normalizeFacebookUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeFacebookUrl('https://www.facebook.com/sharer/sharer.php?u=x')).toBeNull();
    expect(normalizeFacebookUrl('https://www.facebook.com/')).toBeNull();
    expect(normalizeFacebookUrl('abc')).toBeNull();
    expect(normalizeFacebookUrl('two words')).toBeNull();
    expect(normalizeFacebookUrl('')).toBeNull();
  });
});

describe('facebookHref', () => {
  it('never returns a link for malformed stored values', () => {
    expect(facebookHref('https://www.facebook.com/dlcshifo')).toBe('https://www.facebook.com/dlcshifo');
    expect(facebookHref('javascript:alert(1)')).toBeNull();
    expect(facebookHref('')).toBeNull();
    expect(facebookHref(undefined)).toBeNull();
  });
});
