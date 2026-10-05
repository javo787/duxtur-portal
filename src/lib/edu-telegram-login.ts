import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import TelegramLogin from '@/models/TelegramLogin';

/**
 * What a login is for. The same bot and the same confirm-in-Telegram flow serve three things, and a token made for
 * one can never be used for another: the filters below always name the purpose.
 */
export type LoginPurpose = 'edu' | 'portal' | 'portal_link';

export const LOGIN_TTL_MS = 5 * 60 * 1000;
export const START_PREFIX = 'login_';
export const CALLBACK_PREFIX = 'el:';

const TOKEN_RE = /^[a-f0-9]{32}$/;

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/** 128-bit random value, hex-encoded (32 chars; fits Telegram's start/callback limits). */
export function randomToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function isValidToken(value: unknown): value is string {
  return typeof value === 'string' && TOKEN_RE.test(value);
}

/** "/start login_<token>" -> token, otherwise null. */
export function parseLoginStart(text: unknown): string | null {
  if (typeof text !== 'string') return null;
  const m = text.trim().match(/^\/start(?:@\w+)?\s+login_([a-f0-9]{32})$/);
  return m ? m[1] : null;
}

/** "el:<token>" -> token, otherwise null. */
export function parseLoginCallback(data: unknown): string | null {
  if (typeof data !== 'string' || !data.startsWith(CALLBACK_PREFIX)) return null;
  const token = data.slice(CALLBACK_PREFIX.length);
  return isValidToken(token) ? token : null;
}

// Logins made before `purpose` existed have none: they were all Edu logins.
const purposeFilter = (purpose: LoginPurpose): LoginPurpose | { $in: (LoginPurpose | null)[] } =>
  purpose === 'edu' ? { $in: ['edu', null] } : purpose;

export interface CreateLoginOptions {
  purpose?: LoginPurpose;
  /** portal_link: the signed-in portal user this login belongs to. */
  userId?: string;
  requestHint?: string;
}

export async function createLogin(options: CreateLoginOptions = {}) {
  await dbConnect();
  const token = randomToken();
  const pollSecret = randomToken();
  await TelegramLogin.create({
    tokenHash: sha256(token),
    pollSecretHash: sha256(pollSecret),
    purpose: options.purpose ?? 'edu',
    ...(options.userId ? { userId: options.userId } : {}),
    ...(options.requestHint ? { requestHint: options.requestHint } : {}),
    expiresAt: new Date(Date.now() + LOGIN_TTL_MS),
  });
  return { token, pollSecret, expiresInSec: LOGIN_TTL_MS / 1000 };
}

export interface PendingLoginInfo {
  purpose: LoginPurpose;
  requestHint: string | null;
}

/** What the bot needs to word its confirmation, or null when the token is unknown, used or expired. */
export async function pendingLoginInfo(token: string): Promise<PendingLoginInfo | null> {
  await dbConnect();
  const doc = await TelegramLogin.findOne({
    tokenHash: sha256(token),
    status: 'pending',
    expiresAt: { $gt: new Date() },
  }).lean<{ purpose?: LoginPurpose; requestHint?: string } | null>();
  if (!doc) return null;
  return { purpose: doc.purpose ?? 'edu', requestHint: doc.requestHint ?? null };
}

export async function isPendingLogin(token: string): Promise<boolean> {
  return (await pendingLoginInfo(token)) !== null;
}

export interface TelegramProfile {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
}

/** Atomically moves pending -> approved. Returns false if expired/unknown/already used. */
export async function approveLogin(token: string, tg: TelegramProfile): Promise<boolean> {
  await dbConnect();
  const res = await TelegramLogin.findOneAndUpdate(
    { tokenHash: sha256(token), status: 'pending', expiresAt: { $gt: new Date() } },
    { $set: { status: 'approved', telegram: tg } },
    { returnDocument: 'after' }
  );
  return !!res;
}

/** Which logins a poll may see: the purpose (default edu) and, for portal_link, the user who started it. */
export interface LoginScope {
  purpose?: LoginPurpose;
  userId?: string;
}

function scopeFilter(scope: LoginScope) {
  return {
    purpose: purposeFilter(scope.purpose ?? 'edu'),
    ...(scope.userId ? { userId: scope.userId } : {}),
  };
}

export type PeekResult = 'pending' | 'approved' | 'gone';

/**
 * Where a login stands, WITHOUT using it up. The browser polls this and only signs in (which consumes the login)
 * once it says "approved", so a poll can never swallow the login it is waiting for.
 */
export async function peekLogin(token: string, pollSecret: string, scope: LoginScope = {}): Promise<PeekResult> {
  await dbConnect();
  const doc = await TelegramLogin.findOne({
    tokenHash: sha256(token),
    pollSecretHash: sha256(pollSecret),
    ...scopeFilter(scope),
    expiresAt: { $gt: new Date() },
  })
    .select('status')
    .lean<{ status?: string } | null>();
  if (doc?.status === 'pending') return 'pending';
  if (doc?.status === 'approved') return 'approved';
  return 'gone';
}

export type ConsumeResult =
  | { state: 'pending' }
  | { state: 'gone' }
  | { state: 'approved'; telegram: TelegramProfile };

/**
 * Called by the polling client. Needs BOTH the token and the poll secret.
 * An approved login can be consumed exactly once (atomic approved -> consumed).
 */
export async function consumeLogin(token: string, pollSecret: string, scope: LoginScope = {}): Promise<ConsumeResult> {
  await dbConnect();
  const tokenHash = sha256(token);
  const pollSecretHash = sha256(pollSecret);
  const owner = scopeFilter(scope);

  const consumed = await TelegramLogin.findOneAndUpdate(
    { tokenHash, pollSecretHash, ...owner, status: 'approved', expiresAt: { $gt: new Date() } },
    { $set: { status: 'consumed' } },
    { returnDocument: 'before' }
  ).lean();

  if (consumed?.telegram) {
    const t = consumed.telegram;
    return { state: 'approved', telegram: { id: t.id, firstName: t.firstName, lastName: t.lastName, username: t.username } };
  }

  const stillPending = await TelegramLogin.exists({
    tokenHash,
    pollSecretHash,
    ...owner,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  });
  return stillPending ? { state: 'pending' } : { state: 'gone' };
}

export function displayName(tg: TelegramProfile): string {
  return [tg.firstName, tg.lastName].filter(Boolean).join(' ').trim() || tg.username || `Telegram ${tg.id}`;
}
