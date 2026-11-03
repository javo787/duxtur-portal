import { describe, expect, it } from 'vitest';
import { yandexVerificationOther } from './yandex-verification';

describe('yandexVerificationOther', () => {
  it('renders yandex for a Yandex token', () => {
    expect(yandexVerificationOther({ YANDEX_VERIFICATION: '1234567890abcdef' })).toEqual({
      yandex: '1234567890abcdef',
    });
  });

  it('renders nothing when unset or not a plain token', () => {
    expect(yandexVerificationOther({})).toBeUndefined();
    expect(yandexVerificationOther({ YANDEX_VERIFICATION: '' })).toBeUndefined();
    expect(yandexVerificationOther({ YANDEX_VERIFICATION: '"><script>alert(1)</script>' })).toBeUndefined();
  });
});
