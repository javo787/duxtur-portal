import { describe, it, expect, afterEach } from 'vitest';
import { envFlags, maskIp, maskRef, redact, scrubSecrets } from './edu-log';

afterEach(() => {
  delete process.env.EDU_TELEGRAM_BOT_TOKEN;
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
});

describe('edu-log', () => {
  it('masks tokens to a short reference', () => {
    expect(maskRef('a'.repeat(32))).toBe('aaaaaa…');
    expect(maskRef(undefined)).toBeNull();
  });

  it('masks the last octet of IPv4 and the tail of IPv6', () => {
    expect(maskIp('203.0.113.57')).toBe('203.0.113.x');
    expect(maskIp('2001:db8:85a3:8d3:1319:8a2e:370:7348')).toBe('2001:db8:85a3:…');
  });

  it('redacts secret-looking keys but keeps pre-masked tokenRef', () => {
    expect(
      redact({ token: 'abc', pollSecret: 'def', customToken: 'ghi', tokenRef: 'abcdef…', nested: { password: 'x', ok: 1 } })
    ).toEqual({ token: '[redacted]', pollSecret: '[redacted]', customToken: '[redacted]', tokenRef: 'abcdef…', nested: { password: '[redacted]', ok: 1 } });
  });

  it('keeps boolean/number flags under secret-looking keys (they are the point of the logs)', () => {
    expect(redact({ EDU_TELEGRAM_BOT_TOKEN: true, hasSecretHeader: false, tokenLength: 5, token: 'abc' })).toEqual({
      EDU_TELEGRAM_BOT_TOKEN: true,
      hasSecretHeader: false,
      tokenLength: 5,
      token: '[redacted]',
    });
  });

  it('cuts the bot token out of Telegram API URLs and known env secrets', () => {
    process.env.EDU_TELEGRAM_BOT_TOKEN = '123456:SECRET_value-1';
    const out = scrubSecrets('fetch failed https://api.telegram.org/bot123456:SECRET_value-1/sendMessage');
    expect(out).not.toContain('SECRET_value-1');
    expect(out).toContain('bot<redacted>');
  });

  it('reports configuration as booleans, never values', () => {
    process.env.EDU_TELEGRAM_BOT_TOKEN = '123456:SECRET';
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({ project_id: 'my-proj', private_key: 'PRIVATE' });
    const flags = envFlags();
    expect(flags.EDU_TELEGRAM_BOT_TOKEN).toBe(true);
    expect(flags.FIREBASE_SERVICE_ACCOUNT_JSON).toBe('ok');
    expect(flags.firebaseProjectId).toBe('my-proj');
    expect(JSON.stringify(flags)).not.toContain('PRIVATE');
    expect(JSON.stringify(flags)).not.toContain('123456:SECRET');
  });

  it('flags an unparsable service account JSON', () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = '{not json';
    expect(envFlags().FIREBASE_SERVICE_ACCOUNT_JSON).toBe('invalid-json');
  });
});
