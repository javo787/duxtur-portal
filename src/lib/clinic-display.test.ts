import { describe, it, expect } from 'vitest';
import { isUnverifiedImport, specialtyId, telegramUrl, instagramUrl, whatsappUrl, websiteHost, safeHttpUrl } from './clinic-display';

describe('clinic-display', () => {
  it('flags imported clinics by status, not by dataSource', () => {
    expect(isUnverifiedImport({ status: 'pre_imported' })).toBe(true);
    expect(isUnverifiedImport({ status: 'approved' })).toBe(false);
    expect(isUnverifiedImport({})).toBe(false);
  });
  it('maps both ids and legacy Russian labels to a specialty id', () => {
    expect(specialtyId('surgery')).toBe('surgery');
    expect(specialtyId('Хирургия')).toBe('surgery');
    expect(specialtyId(' хирургия ')).toBe('surgery');
    expect(specialtyId('general')).toBe('general');
    expect(specialtyId('endocrinology')).toBe('endocrinology');
    expect(specialtyId('alchemy')).toBeNull();
  });
  it('builds social links from bare handles', () => {
    expect(telegramUrl('@nur')).toBe('https://t.me/nur');
    expect(instagramUrl('nur_clinic')).toBe('https://instagram.com/nur_clinic');
    expect(whatsappUrl('992987746263')).toBe('https://wa.me/992987746263');
  });
  it('shows a clean host and blocks non-http links', () => {
    expect(websiteHost('https://www.vedanta.tj/')).toBe('vedanta.tj');
    expect(safeHttpUrl('https://vedanta.tj/')).toBe('https://vedanta.tj/');
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('not a url')).toBeNull();
  });
});
