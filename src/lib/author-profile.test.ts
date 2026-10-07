import { describe, it, expect } from 'vitest';
import { evaluateAuthor, isFullName, isPhone } from './author-profile';

const complete = { status: 'pending', name: 'Alisher Karimov', phone: '+992 900 11 22 33', specialty: { ru: 'Кардиолог' }, documentImage: 'https://res.cloudinary.com/x/d.jpg' };

describe('isFullName', () => {
  it('wants two real words', () => {
    expect(isFullName('Alisher Karimov')).toBe(true);
    expect(isFullName('  Каримов   Алишер  ')).toBe(true);
    expect(isFullName('Ali')).toBe(false);
    expect(isFullName('A K')).toBe(false);
    expect(isFullName('👨‍⚕️ 🩺')).toBe(false);
    expect(isFullName('')).toBe(false);
    expect(isFullName(undefined)).toBe(false);
  });
});

describe('isPhone', () => {
  it('accepts anything with 7 to 15 digits', () => {
    expect(isPhone('+992 900 11 22 33')).toBe(true);
    expect(isPhone('(900) 112233')).toBe(true);
    expect(isPhone('12345')).toBe(false);
    expect(isPhone('1'.repeat(16))).toBe(false);
    expect(isPhone('call me')).toBe(false);
    expect(isPhone(undefined)).toBe(false);
  });
});

describe('evaluateAuthor', () => {
  it('a person without a doctor profile is new and lacks specialty, phone and diploma (the name of the account may do)', () => {
    expect(evaluateAuthor('Alisher Karimov', null)).toEqual({
      standing: 'new', missing: ['specialty', 'phone', 'documentImage'], canPublishNow: false, canSubmit: false,
    });
  });

  it('a short account name is asked for again', () => {
    expect(evaluateAuthor('Ali', null).missing).toEqual(['name', 'specialty', 'phone', 'documentImage']);
  });

  it('an approved doctor is never asked for anything and publishes at once', () => {
    expect(evaluateAuthor('', { status: 'approved' })).toEqual({ standing: 'approved', missing: [], canPublishNow: true, canSubmit: true });
  });

  it('a complete pending profile has nothing missing but is not published at once', () => {
    expect(evaluateAuthor('', complete)).toEqual({ standing: 'pending', missing: [], canPublishNow: false, canSubmit: true });
  });

  it('a pending profile that lacks a phone says so', () => {
    expect(evaluateAuthor('', { ...complete, phone: '' }).missing).toEqual(['phone']);
  });

  it('counts a specialty in any language', () => {
    expect(evaluateAuthor('', { ...complete, specialty: { tg: 'Табиби дил' } }).missing).toEqual([]);
    expect(evaluateAuthor('', { ...complete, specialty: { ru: '  ' } }).missing).toEqual(['specialty']);
  });

  it('rejected and banned doctors are blocked', () => {
    for (const status of ['rejected', 'banned']) {
      expect(evaluateAuthor('x y', { status })).toMatchObject({ standing: 'blocked', canPublishNow: false, canSubmit: false });
    }
  });
});
