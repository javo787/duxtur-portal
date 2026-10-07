import { describe, expect, it } from 'vitest';
import { bingVerificationOther } from './bing-verification';

describe('bingVerificationOther', () => {
  it('renders msvalidate.01 for a Bing token', () => {
    expect(bingVerificationOther({ BING_SITE_VERIFICATION: '0123456789ABCDEF0123456789ABCDEF' })).toEqual({
      'msvalidate.01': '0123456789ABCDEF0123456789ABCDEF',
    });
  });

  it('renders nothing when unset or not a plain token', () => {
    expect(bingVerificationOther({})).toBeUndefined();
    expect(bingVerificationOther({ BING_SITE_VERIFICATION: '' })).toBeUndefined();
    expect(bingVerificationOther({ BING_SITE_VERIFICATION: '"><script>alert(1)</script>' })).toBeUndefined();
  });
});
