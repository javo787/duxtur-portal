import { describe, it, expect } from 'vitest';
import { isEduPath } from './edu-routes';
import { EDU_CSP } from './edu-csp';

describe('isEduPath', () => {
  it('matches /edu and anything below it', () => {
    expect(isEduPath('/edu')).toBe(true);
    expect(isEduPath('/edu/')).toBe(true);
    expect(isEduPath('/edu/exam')).toBe(true);
    expect(isEduPath('/edu/_next/static/chunks/app.js')).toBe(true);
  });

  it('does not match look-alikes or localized portal routes', () => {
    expect(isEduPath('/eduardo')).toBe(false);
    expect(isEduPath('/education')).toBe(false);
    expect(isEduPath('/ru/edu')).toBe(false);
    expect(isEduPath('/')).toBe(false);
  });
});

describe('EDU_CSP', () => {
  const directive = (name: string) => EDU_CSP.split('; ').find(d => d.startsWith(`${name} `)) ?? '';

  it('allows what Firebase auth + Firestore need', () => {
    expect(directive('script-src')).toContain('https://apis.google.com');
    expect(directive('connect-src')).toContain('https://*.googleapis.com');
    expect(directive('frame-src')).toContain('https://*.firebaseapp.com');
    expect(directive('frame-src')).toContain('https://accounts.google.com');
    expect(directive('img-src')).toContain('https://lh3.googleusercontent.com');
  });

  it('stays strict elsewhere', () => {
    expect(EDU_CSP).not.toContain("'unsafe-eval'");
    expect(directive('object-src')).toBe("object-src 'none'");
    expect(directive('frame-ancestors')).toBe("frame-ancestors 'none'");
    expect(directive('default-src')).toBe("default-src 'self'");
  });
});
