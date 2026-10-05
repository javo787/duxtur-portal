import { describe, it, expect } from 'vitest';
import { isPlaceholderEmail, placeholderEmail, realEmail } from './placeholder-email';

describe('placeholder e-mail', () => {
  it('can never be a deliverable address and is not guessable', () => {
    const a = placeholderEmail(123456);
    const b = placeholderEmail(123456);
    expect(a).toMatch(/^tg123456\.[a-f0-9]{12}@telegram\.invalid$/);
    expect(a).not.toBe(b);
  });

  it('is recognised whatever the case, and real addresses are not', () => {
    expect(isPlaceholderEmail('tg1.abc@telegram.invalid')).toBe(true);
    expect(isPlaceholderEmail('TG1.ABC@TELEGRAM.INVALID')).toBe(true);
    expect(isPlaceholderEmail('doctor@telegram.org')).toBe(false);
    expect(isPlaceholderEmail('x@telegram.invalid.example.com')).toBe(false);
    expect(isPlaceholderEmail(undefined)).toBe(false);
  });

  it('hides a placeholder and keeps a real address', () => {
    expect(realEmail('tg1.abc@telegram.invalid')).toBe('');
    expect(realEmail('doctor@mail.org')).toBe('doctor@mail.org');
    expect(realEmail(null)).toBe('');
  });
});
