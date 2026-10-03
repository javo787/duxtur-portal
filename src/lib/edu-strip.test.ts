import { describe, it, expect } from 'vitest';
import { shouldShowEduStrip } from './edu-strip';

describe('shouldShowEduStrip', () => {
  it.each(['/ru/blog', '/tg/blog/some-article', '/uz/doctors', '/kk/doctors/cardiologist', '/ky/clinics', '/ru/clinics/some-clinic', '/ru/search', '/ru/about', '/ru/authors', '/ru/editorial', '/ru/doctor/abc-123'])(
    'shows on %s',
    path => expect(shouldShowEduStrip(path)).toBe(true)
  );

  it.each(['/', '/ru', '/tg', '/ru/'])('hides on the home page %s (its header already has the link)', path =>
    expect(shouldShowEduStrip(path)).toBe(false)
  );

  it.each(['/ru/admin', '/ru/admin/portal/doctors', '/ru/login', '/ru/register', '/ru/signup', '/ru/forgot-password', '/ru/reset-password', '/ru/clinic/admin', '/ru/clinic/register'])(
    'hides on %s',
    path => expect(shouldShowEduStrip(path)).toBe(false)
  );

  it('does not confuse public /clinics pages with the /clinic account area', () => {
    expect(shouldShowEduStrip('/ru/clinics')).toBe(true);
    expect(shouldShowEduStrip('/ru/clinic/admin')).toBe(false);
  });
});
