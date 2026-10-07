import { describe, it, expect } from 'vitest';
import { eduReturnPath } from './edu-return';

describe('eduReturnPath', () => {
  it('accepts Edu and pages under it', () => {
    expect(eduReturnPath('/edu')).toBe('/edu');
    expect(eduReturnPath('/edu/')).toBe('/edu/');
    expect(eduReturnPath('/edu/dashboard/teacher')).toBe('/edu/dashboard/teacher');
  });

  it('takes the first value when the parameter is repeated', () => {
    expect(eduReturnPath(['/edu', 'https://evil.example'])).toBe('/edu');
    expect(eduReturnPath(['https://evil.example', '/edu'])).toBeNull();
  });

  it('refuses everything that leads elsewhere', () => {
    for (const bad of [
      'https://evil.example', '//evil.example', '/\\evil.example', 'edu', '/education', '/edu.evil.example', '/edu//evil.example',
      '/edu/../admin', '/edu/./x', '/edu/..', '/edu?next=//evil.example', '/edu#x', '/edu/x?y=1', '/ru/login', 'javascript:alert(1)', '/edu%2f..%2f',
    ]) {
      expect(eduReturnPath(bad), bad).toBeNull();
    }
  });

  it('refuses things that are not a short string', () => {
    expect(eduReturnPath(undefined)).toBeNull();
    expect(eduReturnPath(null)).toBeNull();
    expect(eduReturnPath('')).toBeNull();
    expect(eduReturnPath(42)).toBeNull();
    expect(eduReturnPath(`/edu/${'a'.repeat(250)}`)).toBeNull();
  });
});
