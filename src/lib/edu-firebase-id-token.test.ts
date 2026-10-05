import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import { IdTokenError, googleKeyLoader, resetKeyCache, verifyFirebaseIdToken } from './edu-firebase-id-token';

// Public test certificate only (generated once with openssl, no private key is kept anywhere).
const TEST_CERT = `-----BEGIN CERTIFICATE-----
MIIDATCCAemgAwIBAgIUSwFWzpFvdeI5YOa6Y/teSZB+lTcwDQYJKoZIhvcNAQEL
BQAwDzENMAsGA1UEAwwEdGVzdDAgFw0yNjEwMDQxMjM1NDNaGA8yMTI2MDkxMDEy
MzU0M1owDzENMAsGA1UEAwwEdGVzdDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCC
AQoCggEBALKL4RKM12FrAESkVk3h6uymSBp0p9J2atRIwXtvsoJGxXqPNgjvp/ar
P28IOOru75uk2EENIOCNiKjUJY+yBPoLbW9ZQ81UPv31uLvpGCDI/yKEe/8x34Gu
J1E7laU0rFBz9Fbc9Tnce/ZHkfHgNHAeC/q2PTTzMo+oGJIOOv2zZCnV7PvklFdc
0FdG2uhuAOth3wkhlgsBB4IIuzqYbvvNXYlstZmQcZggW5DXjSaX6jKEe54tgTMI
RqutJZ2b9BaWw9YhAc9P4KM5jDm0A5H9DmsmcrJx75xG2XvFZp+ys7COVWgvIOtQ
9qHJucJXsTYvWNTWJ8zJmx0AMz2+xp0CAwEAAaNTMFEwHQYDVR0OBBYEFBz1Oc37
O03n+2M+N8XX3Y5Sr8d+MB8GA1UdIwQYMBaAFBz1Oc37O03n+2M+N8XX3Y5Sr8d+
MA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAAX0Po0URSgLu0R8
RGoNibOmp0yx8z6b0z3u+6lK7fOSOKRFVKlFA3D/FC2wDhqcvEu7KLC2mdS1MgcA
WbjFJ1o/53jSGAs4VW9dj/Wtt+N13qpagFy6M6U69n9U3Zw6II3KUjdcDJ+O+4N/
vEWsKOrXGCAyoj54AanEVVi9KRTO5rINhZ14Pbc0bgOJTbZjKYSN/rHLBloNgZGV
C1jGMRqfnZH9+LjIx9yzA3qG2uz5sMWsg/QfH2jJByUiut/OQELv7egVmD4YCiN5
DuZwzhRCSEFcgQjxk2VypIfNjd0vL0AKGyCuyd0/kfH6r8xWXV7WqRWEWAFUVeDc
5HA87l8=
-----END CERTIFICATE-----`;

const PROJECT = 'edu-proj';
const NOW = 1_800_000_000;
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const other = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

const b64 = (v: unknown) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');

function sign(payload: Record<string, unknown>, opts: { header?: Record<string, unknown>; key?: crypto.KeyObject } = {}) {
  const header = { alg: 'RS256', kid: 'k1', typ: 'JWT', ...opts.header };
  const input = `${b64(header)}.${b64(payload)}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(input), opts.key ?? privateKey).toString('base64url');
  return `${input}.${signature}`;
}

const good = {
  aud: PROJECT,
  iss: `https://securetoken.google.com/${PROJECT}`,
  sub: 'tg_123456',
  user_id: 'tg_123456',
  iat: NOW - 60,
  auth_time: NOW - 120,
  exp: NOW + 3000,
  firebase: { sign_in_provider: 'custom' },
};

const options = {
  projectId: PROJECT,
  now: () => NOW,
  getKey: async (kid: string) => (kid === 'k1' ? publicKey : null),
};

async function reasonOf(token: unknown, opts = options) {
  try {
    await verifyFirebaseIdToken(token, opts);
  } catch (error) {
    expect(error).toBeInstanceOf(IdTokenError);
    return (error as IdTokenError).reason;
  }
  return 'accepted';
}

describe('verifyFirebaseIdToken', () => {
  it('accepts a correctly signed token for this project and returns the uid from the token', async () => {
    const result = await verifyFirebaseIdToken(sign(good), options);
    expect(result).toEqual({ uid: 'tg_123456', provider: 'custom', authTime: NOW - 120 });
  });

  it('refuses a token signed with another key', async () => {
    expect(await reasonOf(sign(good, { key: other.privateKey }))).toBe('bad-signature');
  });

  it('refuses a payload that was changed after signing', async () => {
    const token = sign(good);
    const [h, , s] = token.split('.');
    const forged = `${h}.${b64({ ...good, sub: 'tg_999' })}.${s}`;
    expect(await reasonOf(forged)).toBe('bad-signature');
  });

  it('refuses unsigned and symmetric algorithms', async () => {
    expect(await reasonOf(sign(good, { header: { alg: 'none' } }))).toBe('bad-algorithm');
    expect(await reasonOf(sign(good, { header: { alg: 'HS256' } }))).toBe('bad-algorithm');
  });

  it('refuses an unknown key id and a missing one', async () => {
    expect(await reasonOf(sign(good, { header: { kid: 'nope' } }))).toBe('unknown-key');
    expect(await reasonOf(sign(good, { header: { kid: undefined } }))).toBe('unknown-key');
  });

  it('refuses a token from another Firebase project', async () => {
    expect(await reasonOf(sign({ ...good, aud: 'someone-else' }))).toBe('wrong-project');
    expect(await reasonOf(sign({ ...good, iss: 'https://securetoken.google.com/someone-else' }))).toBe('wrong-project');
  });

  it('refuses expired tokens and tokens from the future', async () => {
    expect(await reasonOf(sign({ ...good, exp: NOW - 1 }))).toBe('expired');
    expect(await reasonOf(sign({ ...good, exp: undefined }))).toBe('expired');
    expect(await reasonOf(sign({ ...good, iat: NOW + 3600 }))).toBe('not-yet-valid');
    expect(await reasonOf(sign({ ...good, auth_time: NOW + 3600 }))).toBe('not-yet-valid');
  });

  it('tolerates a minute of clock skew', async () => {
    expect(await reasonOf(sign({ ...good, iat: NOW + 30, auth_time: NOW + 30 }))).toBe('accepted');
  });

  it('refuses a missing, empty, oversized or mismatching subject', async () => {
    expect(await reasonOf(sign({ ...good, sub: undefined, user_id: undefined }))).toBe('bad-subject');
    expect(await reasonOf(sign({ ...good, sub: '', user_id: '' }))).toBe('bad-subject');
    expect(await reasonOf(sign({ ...good, sub: 'x'.repeat(129), user_id: undefined }))).toBe('bad-subject');
    expect(await reasonOf(sign({ ...good, user_id: 'tg_other' }))).toBe('bad-subject');
  });

  it('refuses things that are not tokens', async () => {
    for (const value of [undefined, null, 42, {}, '', 'abc', 'a.b', 'a.b.c.d', '..', 'x'.repeat(9000)]) {
      expect(await reasonOf(value)).toBe('malformed');
    }
    expect(await reasonOf(`${b64('not json')}.${b64(good)}.sig`)).toBe('malformed');
  });

  it('reports unavailable keys separately from a bad token', async () => {
    const down = { ...options, getKey: async () => { throw new Error('offline'); } };
    expect(await reasonOf(sign(good), down)).toBe('keys-unavailable');
  });

  it('has no provider when the token does not say', async () => {
    const result = await verifyFirebaseIdToken(sign({ ...good, firebase: undefined }), options);
    expect(result.provider).toBeNull();
  });
});

describe('googleKeyLoader', () => {
  beforeEach(() => resetKeyCache());

  const response = (body: unknown, maxAge = 3600, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'cache-control': `public, max-age=${maxAge}, must-revalidate` } });

  it('turns the published X.509 certificates into public keys', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ kid1: TEST_CERT }));
    const key = await googleKeyLoader(fetchImpl as unknown as typeof fetch)('kid1');
    expect(key?.type).toBe('public');
    expect(key?.export({ type: 'spki', format: 'der' })).toEqual(new crypto.X509Certificate(TEST_CERT).publicKey.export({ type: 'spki', format: 'der' }));
  });

  it('answers null for a key id Google does not publish', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ kid1: TEST_CERT }));
    expect(await googleKeyLoader(fetchImpl as unknown as typeof fetch)('other')).toBeNull();
  });

  it('fetches once while the cache is fresh, even for key ids it does not know', async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => response({ kid1: TEST_CERT }));
    const load = googleKeyLoader(fetchImpl as unknown as typeof fetch);
    await Promise.all([load('kid1'), load('a'), load('b')]);
    await load('kid1');
    await load('c');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('fetches again after the cache lifetime', async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => response({ kid1: TEST_CERT }, 0));
    const load = googleKeyLoader(fetchImpl as unknown as typeof fetch);
    await load('kid1');
    await load('kid1');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('fails (and does not cache the failure) when Google answers with an error', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response({}, 3600, 500))
      .mockResolvedValueOnce(response({ kid1: TEST_CERT }));
    const load = googleKeyLoader(fetchImpl as unknown as typeof fetch);
    await expect(load('kid1')).rejects.toThrow();
    expect((await load('kid1'))?.type).toBe('public');
  });
});
