import { describe, it, expect } from 'vitest';
import { normalizeClinicContacts } from './clinic-contacts';

describe('normalizeClinicContacts', () => {
  it('normalizes every contact field to its stored format', () => {
    const d: Record<string, unknown> = {
      phone: '92 000 0000', phone2: '+992 37 221 0000', website: 'nur.tj',
      instagram: 'https://instagram.com/nur_clinic/', telegram: '@nur_clinic',
      whatsapp: '+992 98 774 6263', facebook: 'facebook.com/nur.clinic',
    };
    expect(normalizeClinicContacts(d)).toBeNull();
    expect(d).toEqual({
      phone: '+992920000000', phone2: '+992372210000', website: 'https://nur.tj/',
      instagram: 'nur_clinic', telegram: 'nur_clinic', whatsapp: '992987746263',
      facebook: 'https://www.facebook.com/nur.clinic',
    });
  });
  it('leaves absent fields alone and lets an empty string clear a field', () => {
    const d: Record<string, unknown> = { facebook: '', name: 'x' };
    expect(normalizeClinicContacts(d)).toBeNull();
    expect(d).toEqual({ facebook: '', name: 'x' });
  });
  it('reports the first malformed value instead of saving it', () => {
    expect(normalizeClinicContacts({ phone: '123' })).toMatch(/телефона/);
    expect(normalizeClinicContacts({ website: 'not a url' })).toMatch(/сайт/);
    expect(normalizeClinicContacts({ instagram: 'a b' })).toMatch(/Instagram/);
    expect(normalizeClinicContacts({ whatsapp: '12' })).toMatch(/WhatsApp/);
    expect(normalizeClinicContacts({ facebook: 'https://evil.com/x' })).toMatch(/Facebook/);
    expect(normalizeClinicContacts({ facebook: 'javascript:alert(1)' })).toMatch(/Facebook/);
  });
});
