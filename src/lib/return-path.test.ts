import { describe, expect, it } from 'vitest';
import { returnPath, reviewReturnPath } from './return-path';

describe('reviewReturnPath', () => {
  it.each([
    '/ru/doctor/abc123',
    '/tg/doctor/dr-ivanov',
    '/uz/clinics/city-clinic/',
    '/kk/blog/gipertoniya',
    '/ky/blog/%D0%B3%D0%B8%D0%BF%D0%B5%D1%80',
  ])('accepts %s', path => {
    expect(reviewReturnPath(path)).toBe(path);
  });

  it('takes the first value when the parameter is repeated', () => {
    expect(reviewReturnPath(['/ru/blog/a', 'https://evil.example'])).toBe('/ru/blog/a');
  });

  it.each([
    undefined,
    null,
    42,
    '',
    'https://evil.example/ru/doctor/a',
    '//evil.example',
    '/\\evil.example',
    '/ru/doctor/',
    '/ru/doctor',
    '/ru/doctors/a',
    '/en/doctor/a',
    '/ru/doctor/a/b',
    '/ru/doctor/a?x=1',
    '/ru/doctor/a#top',
    '/ru/doctor/..',
    '/ru/doctor/%2e%2e',
    '/ru/doctor/%2E%2E/',
    '/ru/doctor/a%2Fb',
    '/ru/doctor/a%5Cb',
    '/ru/doctor/a%ZZ',
    '/ru/admin',
    '/ru/login',
    'javascript:alert(1)',
    `/ru/blog/${'a'.repeat(400)}`,
  ])('rejects %j', value => {
    expect(reviewReturnPath(value)).toBeNull();
  });
});

describe('returnPath', () => {
  it('accepts Edu and review pages, nothing else', () => {
    expect(returnPath('/edu')).toBe('/edu');
    expect(returnPath('/edu/dashboard/teacher')).toBe('/edu/dashboard/teacher');
    expect(returnPath('/ru/doctor/abc')).toBe('/ru/doctor/abc');
    expect(returnPath('/ru/admin/portal')).toBeNull();
    expect(returnPath('https://evil.example')).toBeNull();
  });
});
