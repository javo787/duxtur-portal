import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { isSameOrigin } from './same-origin';

const req = (headers: Record<string, string>) => new NextRequest('https://www.duxtur.org/api/x', { method: 'POST', headers });

describe('isSameOrigin', () => {
  it('accepts a page of this site, on either host', () => {
    expect(isSameOrigin(req({ origin: 'https://www.duxtur.org', host: 'www.duxtur.org' }))).toBe(true);
    expect(isSameOrigin(req({ origin: 'https://duxtur.org', host: 'duxtur.org' }))).toBe(true);
    expect(isSameOrigin(req({ origin: 'http://localhost:3000', host: 'localhost:3000' }))).toBe(true);
  });

  it('prefers the forwarded host a proxy reports', () => {
    expect(isSameOrigin(req({ origin: 'https://www.duxtur.org', host: 'internal-1234.vercel', 'x-forwarded-host': 'www.duxtur.org' }))).toBe(true);
  });

  it('refuses another site, a missing Origin and garbage', () => {
    expect(isSameOrigin(req({ origin: 'https://evil.example', host: 'www.duxtur.org' }))).toBe(false);
    expect(isSameOrigin(req({ origin: 'https://www.duxtur.org.evil.example', host: 'www.duxtur.org' }))).toBe(false);
    expect(isSameOrigin(req({ host: 'www.duxtur.org' }))).toBe(false);
    expect(isSameOrigin(req({ origin: 'not a url', host: 'www.duxtur.org' }))).toBe(false);
  });
});
