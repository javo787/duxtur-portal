import { describe, it, expect } from 'vitest';
import { describeRequest } from './request-hint';

const headers = (h: Record<string, string>) => ({ get: (k: string) => h[k.toLowerCase()] ?? null });
const CHROME_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
const SAFARI_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const EDGE_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0';

describe('describeRequest', () => {
  it('names the browser, the system and the place', () => {
    expect(describeRequest(headers({ 'user-agent': CHROME_ANDROID, 'x-vercel-ip-city': 'Dushanbe', 'x-vercel-ip-country': 'TJ' }))).toBe(
      'Chrome, Android · Dushanbe, TJ'
    );
    expect(describeRequest(headers({ 'user-agent': SAFARI_IOS }))).toBe('Safari, iOS');
    expect(describeRequest(headers({ 'user-agent': EDGE_WIN }))).toBe('Edge, Windows');
  });

  it('decodes a percent-encoded city and survives a broken one', () => {
    expect(describeRequest(headers({ 'x-vercel-ip-city': 'S%C3%A3o%20Paulo', 'x-vercel-ip-country': 'BR' }))).toBe('São Paulo, BR');
    expect(describeRequest(headers({ 'x-vercel-ip-city': '%E0%A4%A', 'x-vercel-ip-country': 'TJ' }))).toBe('TJ');
  });

  it('keeps markup and control characters out of a Telegram message', () => {
    const hint = describeRequest(headers({ 'x-vercel-ip-city': '<b>Evil</b>\n[click](http://x)' }));
    expect(hint).not.toMatch(/[<>\[\]\n]/);
  });

  it('is empty when nothing is known and never longer than 80 characters', () => {
    expect(describeRequest(headers({}))).toBe('');
    expect(describeRequest(headers({ 'x-vercel-ip-city': 'a'.repeat(200) })).length).toBeLessThanOrEqual(80);
  });
});
