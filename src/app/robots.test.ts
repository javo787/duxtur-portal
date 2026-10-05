import { describe, expect, it } from 'vitest';
import robots from './robots';

const rule = () => {
  const r = robots().rules;
  return Array.isArray(r) ? r[0] : r;
};
const disallow = () => ([] as string[]).concat(rule().disallow ?? []);

/** The matching Google uses: a rule is a path prefix in which "*" matches anything (including "/"). */
function blocked(path: string): boolean {
  return disallow().some((pattern) => {
    const re = new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*'));
    return re.test(path);
  });
}

describe('robots.txt', () => {
  it('keeps the clinic recruitment page crawlable in every language', () => {
    for (const lang of ['ru', 'uz', 'tg', 'kk', 'ky']) {
      expect(blocked(`/${lang}/clinic/register`)).toBe(false);
    }
  });

  it('still blocks the account pages and private areas in every language', () => {
    for (const lang of ['ru', 'uz', 'tg', 'kk', 'ky']) {
      for (const path of ['login', 'register', 'signup', 'forgot-password', 'reset-password', 'search', 'admin', 'admin/portal/clinics', 'patient', 'patient/profile', 'clinic/admin']) {
        expect(blocked(`/${lang}/${path}`)).toBe(true);
      }
    }
    expect(blocked('/api/clinics')).toBe(true);
    expect(blocked('/private/x')).toBe(true);
  });

  it('keeps everything that should rank crawlable', () => {
    for (const path of ['/ru', '/ru/clinics', '/ru/clinics/shifo', '/ru/clinics?city=%D0%94%D1%83%D1%88%D0%B0%D0%BD%D0%B1%D0%B5', '/ru/clinics?page=2', '/ru/doctors', '/ru/doctor/ivanov', '/ru/blog/some-article', '/_next/static/chunk.js']) {
      expect(blocked(path)).toBe(false);
    }
  });

  it('blocks only the sorted and searched views of the directory', () => {
    expect(blocked('/ru/clinics?sort=reviews&page=1')).toBe(true);
    expect(blocked('/ru/clinics?city=%D0%94&sort=doctors')).toBe(true);
    expect(blocked('/uz/clinics?q=shifo')).toBe(true);
    expect(blocked('/ru/clinics?type=hospital')).toBe(false);
  });

  it('declares one group for every crawler and the sitemap', () => {
    expect(rule().userAgent).toBe('*');
    expect(rule()).not.toHaveProperty('crawlDelay');
    expect(robots().sitemap).toBe('https://duxtur.org/sitemap.xml');
  });
});
