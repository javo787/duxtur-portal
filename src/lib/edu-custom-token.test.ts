import crypto from 'crypto';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { createEduCustomToken } from './edu-custom-token';

const EMAIL = 'firebase-adminsdk-x@my-proj.iam.gserviceaccount.com';
let privatePem: string;
let publicKey: crypto.KeyObject;

beforeAll(() => {
  const { privateKey, publicKey: pub } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  publicKey = pub;
});

afterEach(() => {
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
});

const decode = (part: string) => JSON.parse(Buffer.from(part, 'base64url').toString());

function configure(privateKey = privatePem, escapeNewlines = true) {
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
    type: 'service_account',
    project_id: 'my-proj',
    client_email: EMAIL,
    // Keys pasted into Vercel env vars arrive with literal backslash-n sequences.
    private_key: escapeNewlines ? privateKey.replace(/\n/g, '\\n') : privateKey,
  });
}

describe('createEduCustomToken', () => {
  it('signs a Firebase custom token: RS256 header, documented claims, valid signature', async () => {
    configure();
    const before = Math.floor(Date.now() / 1000);
    const token = await createEduCustomToken('tg_123', { provider: 'telegram', telegramId: 123, tgName: 'Ali' });
    const [h, p, s] = token.split('.');

    expect(decode(h)).toEqual({ alg: 'RS256', typ: 'JWT' });
    const payload = decode(p);
    expect(payload.iss).toBe(EMAIL);
    expect(payload.sub).toBe(EMAIL);
    expect(payload.aud).toBe('https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit');
    expect(payload.uid).toBe('tg_123');
    expect(payload.claims).toEqual({ provider: 'telegram', telegramId: 123, tgName: 'Ali' });
    expect(payload.iat).toBeGreaterThanOrEqual(before);
    expect(payload.exp - payload.iat).toBe(3600);

    expect(crypto.verify('RSA-SHA256', Buffer.from(`${h}.${p}`), publicKey, Buffer.from(s, 'base64url'))).toBe(true);
  });

  it('works whether the key has real or escaped newlines', async () => {
    configure(privatePem, false);
    await expect(createEduCustomToken('tg_1', {})).resolves.toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    configure(privatePem, true);
    await expect(createEduCustomToken('tg_1', {})).resolves.toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
  });

  it('omits the claims object when there are none', async () => {
    configure();
    const payload = decode((await createEduCustomToken('tg_1')).split('.')[1]);
    expect(payload).not.toHaveProperty('claims');
  });

  it('fails with a readable message when the env var is missing, not JSON, or incomplete', async () => {
    await expect(createEduCustomToken('tg_1', {})).rejects.toThrow('FIREBASE_SERVICE_ACCOUNT_JSON is not configured');
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = '{not json';
    await expect(createEduCustomToken('tg_1', {})).rejects.toThrow('not valid JSON');
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({ project_id: 'x' });
    await expect(createEduCustomToken('tg_1', {})).rejects.toThrow('client_email and private_key');
  });

  it('fails when the private key is not a usable key', async () => {
    configure('-----BEGIN PRIVATE KEY-----\nnot a key\n-----END PRIVATE KEY-----\n');
    await expect(createEduCustomToken('tg_1', {})).rejects.toThrow();
  });

  it('rejects an empty or over-long uid and reserved claim names', async () => {
    configure();
    await expect(createEduCustomToken('', {})).rejects.toThrow('uid must be');
    await expect(createEduCustomToken('x'.repeat(129), {})).rejects.toThrow('uid must be');
    await expect(createEduCustomToken('tg_1', { sub: 'evil' })).rejects.toThrow('Reserved claim');
    await expect(createEduCustomToken('tg_1', { exp: 1 })).rejects.toThrow('Reserved claim');
  });
});
