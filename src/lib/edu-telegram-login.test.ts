import { describe, it, expect, vi, beforeEach } from 'vitest';

const findOneAndUpdate = vi.fn();
const exists = vi.fn();
const create = vi.fn();
const findOne = vi.fn();

vi.mock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/TelegramLogin', () => ({
  default: { findOneAndUpdate: (...a: unknown[]) => findOneAndUpdate(...a), exists: (...a: unknown[]) => exists(...a), create: (...a: unknown[]) => create(...a), findOne: (...a: unknown[]) => findOne(...a) },
}));

import {
  parseLoginStart,
  parseLoginCallback,
  isValidToken,
  randomToken,
  sha256,
  createLogin,
  approveLogin,
  consumeLogin,
  displayName,
} from './edu-telegram-login';

const TOKEN = 'a'.repeat(32);
const SECRET = 'b'.repeat(32);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('token helpers', () => {
  it('generates 32-char hex tokens that differ each time', () => {
    const a = randomToken();
    const b = randomToken();
    expect(isValidToken(a)).toBe(true);
    expect(a).not.toBe(b);
  });

  it('rejects malformed tokens', () => {
    expect(isValidToken('short')).toBe(false);
    expect(isValidToken('Z'.repeat(32))).toBe(false);
    expect(isValidToken(undefined)).toBe(false);
    expect(isValidToken({})).toBe(false);
  });
});

describe('payload parsing', () => {
  it('parses /start login_<token>', () => {
    expect(parseLoginStart(`/start login_${TOKEN}`)).toBe(TOKEN);
    expect(parseLoginStart(`/start@duxtur_bot login_${TOKEN}`)).toBe(TOKEN);
  });

  it('ignores plain /start and other payloads', () => {
    expect(parseLoginStart('/start')).toBeNull();
    expect(parseLoginStart('/start ref_123')).toBeNull();
    expect(parseLoginStart(`/start login_${TOKEN}extra`)).toBeNull();
    expect(parseLoginStart(undefined)).toBeNull();
  });

  it('parses callback data', () => {
    expect(parseLoginCallback(`el:${TOKEN}`)).toBe(TOKEN);
    expect(parseLoginCallback('el:nope')).toBeNull();
    expect(parseLoginCallback(`xx:${TOKEN}`)).toBeNull();
    expect(parseLoginCallback(null)).toBeNull();
  });
});

describe('login lifecycle', () => {
  it('stores only hashes when creating a login', async () => {
    const { token, pollSecret } = await createLogin();
    const doc = create.mock.calls[0][0];
    expect(doc.tokenHash).toBe(sha256(token));
    expect(doc.pollSecretHash).toBe(sha256(pollSecret));
    expect(JSON.stringify(doc)).not.toContain(token);
    expect(JSON.stringify(doc)).not.toContain(pollSecret);
    expect(doc.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('approve only matches a pending, unexpired login', async () => {
    findOneAndUpdate.mockResolvedValueOnce({});
    expect(await approveLogin(TOKEN, { id: 1, firstName: 'A' })).toBe(true);
    const filter = findOneAndUpdate.mock.calls[0][0];
    expect(filter.status).toBe('pending');
    expect(filter.tokenHash).toBe(sha256(TOKEN));
    expect(filter.expiresAt.$gt).toBeInstanceOf(Date);

    findOneAndUpdate.mockResolvedValueOnce(null);
    expect(await approveLogin(TOKEN, { id: 1, firstName: 'A' })).toBe(false);
  });

  it('consume requires both token and poll secret, and returns the profile once', async () => {
    findOneAndUpdate.mockReturnValueOnce({
      lean: () => Promise.resolve({ telegram: { id: 42, firstName: 'Ali', lastName: 'K', username: 'ali' } }),
    });
    const res = await consumeLogin(TOKEN, SECRET);
    expect(res).toEqual({ state: 'approved', telegram: { id: 42, firstName: 'Ali', lastName: 'K', username: 'ali' } });
    const filter = findOneAndUpdate.mock.calls[0][0];
    expect(filter.tokenHash).toBe(sha256(TOKEN));
    expect(filter.pollSecretHash).toBe(sha256(SECRET));
    expect(filter.status).toBe('approved');
  });

  it('reports pending, then gone', async () => {
    findOneAndUpdate.mockReturnValue({ lean: () => Promise.resolve(null) });
    exists.mockResolvedValueOnce({ _id: 1 });
    expect(await consumeLogin(TOKEN, SECRET)).toEqual({ state: 'pending' });
    exists.mockResolvedValueOnce(null);
    expect(await consumeLogin(TOKEN, SECRET)).toEqual({ state: 'gone' });
  });
});

describe('displayName', () => {
  it('joins names and falls back to username / id', () => {
    expect(displayName({ id: 1, firstName: 'Ali', lastName: 'Karimov' })).toBe('Ali Karimov');
    expect(displayName({ id: 1, firstName: '', username: 'ali' })).toBe('ali');
    expect(displayName({ id: 7, firstName: '' })).toBe('Telegram 7');
  });
});
