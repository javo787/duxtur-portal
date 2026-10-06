import { describe, it, expect } from 'vitest';
import { EDU_BRIDGE_MESSAGE, parseBridgeMessage } from './edu-bridge-client';

describe('parseBridgeMessage', () => {
  it('accepts a signed-in answer with a token', () => {
    expect(parseBridgeMessage({ type: EDU_BRIDGE_MESSAGE, signedIn: true, idToken: 'a.b.c', name: 'Ali', image: 'https://x/y.png' })).toEqual({
      signedIn: true,
      idToken: 'a.b.c',
      name: 'Ali',
      image: 'https://x/y.png',
    });
  });

  it('accepts a signed-out answer', () => {
    expect(parseBridgeMessage({ type: EDU_BRIDGE_MESSAGE, signedIn: false })).toEqual({ signedIn: false });
  });

  it('ignores messages that are not for the bridge', () => {
    expect(parseBridgeMessage({ type: 'other', signedIn: true, idToken: 'x' })).toBeNull();
    expect(parseBridgeMessage('hello')).toBeNull();
    expect(parseBridgeMessage(null)).toBeNull();
  });

  it('refuses a signed-in answer without a usable token', () => {
    expect(parseBridgeMessage({ type: EDU_BRIDGE_MESSAGE, signedIn: true })).toBeNull();
    expect(parseBridgeMessage({ type: EDU_BRIDGE_MESSAGE, signedIn: true, idToken: '' })).toBeNull();
    expect(parseBridgeMessage({ type: EDU_BRIDGE_MESSAGE, signedIn: true, idToken: 'x'.repeat(9000) })).toBeNull();
  });

  it('drops a picture that is not https and trims the name', () => {
    const result = parseBridgeMessage({ type: EDU_BRIDGE_MESSAGE, signedIn: true, idToken: 't', name: 'n'.repeat(300), image: 'javascript:alert(1)' });
    expect(result).toMatchObject({ signedIn: true, image: '' });
    expect(result && result.signedIn && result.name.length).toBe(100);
  });
});
