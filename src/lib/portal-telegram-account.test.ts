import { describe, it, expect, beforeEach, vi } from 'vitest';

interface Doc {
  _id: { toString(): string };
  email?: string;
  role?: string;
  name?: string;
  image?: string;
  telegramId?: number | null;
  eduUid?: string | null;
  provider?: string;
}

// An in-memory stand-in for the two Mongoose models: only the calls portal-telegram-account makes.
let users: Doc[];
let doctors: { userId: Doc['_id']; status: string }[];
let nextId = 1;
let failNextCreateWith: Error | null = null;
let beforeCreate: (() => void) | null = null;

const oid = (n: string) => ({ toString: () => n });
const dup = () => Object.assign(new Error('E11000 duplicate key'), { code: 11000 });

type Cond = unknown;
function matchField(value: unknown, cond: Cond): boolean {
  if (cond && typeof cond === 'object' && '$exists' in (cond as object)) {
    return ((value !== undefined) === (cond as { $exists: boolean }).$exists);
  }
  if (cond === null) return value === null || value === undefined;
  return value === cond;
}
function matches(doc: Doc, filter: Record<string, unknown>): boolean {
  for (const [key, cond] of Object.entries(filter)) {
    if (key === '$or') {
      if (!(cond as Record<string, unknown>[]).some(alt => matches(doc, alt))) return false;
    } else if (key === '_id') {
      if (doc._id.toString() !== String(cond)) return false;
    } else if (!matchField((doc as unknown as Record<string, unknown>)[key], cond)) return false;
  }
  return true;
}
const chain = <T,>(run: () => T) => ({ select: () => ({ lean: async () => run() }), lean: async () => run() });

function assertUnique(candidate: Doc, ignore?: Doc) {
  for (const field of ['telegramId', 'eduUid'] as const) {
    const v = candidate[field];
    if (v === undefined || v === null) continue;
    if (users.some(u => u !== ignore && u[field] === v)) throw dup();
  }
}

vi.mock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/Doctor', () => ({
  default: { findOne: (f: { userId: Doc['_id'] }) => chain(() => doctors.find(d => d.userId.toString() === f.userId.toString()) ?? null) },
}));
vi.mock('@/models/User', () => ({
  default: {
    findOne: (f: Record<string, unknown>) => chain(() => users.find(u => matches(u, f)) ?? null),
    findById: (id: string) => chain(() => users.find(u => u._id.toString() === id) ?? null),
    exists: async (f: Record<string, unknown>) => (users.some(u => matches(u, f)) ? { _id: 1 } : null),
    findOneAndUpdate: (f: Record<string, unknown>, update: { $set: Partial<Doc> }) =>
      chain(() => {
        const doc = users.find(u => matches(u, f));
        if (!doc) return null;
        assertUnique({ ...doc, ...update.$set }, doc);
        Object.assign(doc, update.$set);
        return doc;
      }),
    create: async (data: Partial<Doc>) => {
      beforeCreate?.();
      if (failNextCreateWith) {
        const e = failNextCreateWith;
        failNextCreateWith = null;
        throw e;
      }
      const doc: Doc = { ...data, _id: oid(`u${nextId++}`) };
      assertUnique(doc);
      users.push(doc);
      return doc;
    },
  },
}));

import { attachTelegram, signInWithTelegram, telegramEduUid } from './portal-telegram-account';
import { isPlaceholderEmail } from './placeholder-email';

const tg = (id: number, firstName = 'Ali') => ({ id, firstName, lastName: 'Karimov', username: 'ali_k' });

beforeEach(() => {
  users = [];
  doctors = [];
  nextId = 1;
  failNextCreateWith = null;
  beforeCreate = null;
});

describe('signInWithTelegram', () => {
  it('registers a new patient with a placeholder e-mail and the Edu account of the same Telegram person', async () => {
    const res = await signInWithTelegram(tg(555));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.created).toBe(true);
    expect(res.user).toMatchObject({ role: 'patient', name: 'Ali Karimov' });
    expect(isPlaceholderEmail(res.user.email)).toBe(true);
    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({ telegramId: 555, eduUid: 'tg_555', provider: 'telegram', password: '' });
  });

  it('opens the same account the next time, without creating another', async () => {
    const first = await signInWithTelegram(tg(555));
    const second = await signInWithTelegram(tg(555, 'Renamed'));
    expect(first.ok && second.ok && first.user.id === second.user.id).toBe(true);
    expect(second.ok && second.created).toBe(false);
    expect(users).toHaveLength(1);
  });

  it('keeps two Telegram people in two accounts', async () => {
    const a = await signInWithTelegram(tg(1));
    const b = await signInWithTelegram(tg(2));
    expect(a.ok && b.ok && a.user.id !== b.user.id).toBe(true);
    expect(users).toHaveLength(2);
  });

  it('opens the account that was linked to this person\'s Edu Telegram account, and attaches the Telegram id', async () => {
    users.push({ _id: oid('google-user'), email: 'dr@mail.org', role: 'patient', name: 'Dr', eduUid: 'tg_777' });
    const res = await signInWithTelegram(tg(777));
    expect(res.ok && res.user.id).toBe('google-user');
    expect(res.ok && res.created).toBe(false);
    expect(users).toHaveLength(1);
    expect(users[0].telegramId).toBe(777);
  });

  it('never matches an account by name or e-mail', async () => {
    users.push({ _id: oid('same-name'), email: 'ali@mail.org', role: 'patient', name: 'Ali Karimov' });
    const res = await signInWithTelegram(tg(9));
    expect(res.ok && res.created).toBe(true);
    expect(users).toHaveLength(2);
    expect(users[0].telegramId).toBeUndefined();
  });

  it('does not take over an account that already has a different Telegram, even if it holds this Edu uid', async () => {
    users.push({ _id: oid('other'), email: 'o@mail.org', role: 'patient', telegramId: 111, eduUid: 'tg_222' });
    const res = await signInWithTelegram(tg(222));
    expect(res.ok && res.user.id).not.toBe('other');
    expect(users[0].telegramId).toBe(111);
    // The Edu uid is taken, so the new account is created without it rather than failing.
    expect(users[1]).toMatchObject({ telegramId: 222 });
    expect(users[1].eduUid).toBeUndefined();
  });

  it('survives two first sign-ins at once: the loser opens the winner\'s account', async () => {
    beforeCreate = () => {
      users.push({ _id: oid('winner'), email: 'w@telegram.invalid', role: 'patient', telegramId: 42, eduUid: 'tg_42' });
      failNextCreateWith = dup();
    };
    const res = await signInWithTelegram(tg(42));
    expect(res.ok && res.user.id).toBe('winner');
    expect(users).toHaveLength(1);
  });

  it('refuses a portal administrator: administrator power does not hang on a chat confirmation', async () => {
    users.push({ _id: oid('admin'), email: 'a@duxtur.org', role: 'portal_admin', telegramId: 5 });
    expect(await signInWithTelegram(tg(5))).toEqual({ ok: false, code: 'role_not_allowed' });
  });

  it('lets an approved doctor in and refuses one who is not approved', async () => {
    users.push({ _id: oid('doc1'), email: 'd@mail.org', role: 'doctor', telegramId: 6 });
    doctors.push({ userId: oid('doc1'), status: 'approved' });
    const ok = await signInWithTelegram(tg(6));
    expect(ok.ok && ok.user.role).toBe('doctor');

    users.push({ _id: oid('doc2'), email: 'e@mail.org', role: 'doctor', telegramId: 7 });
    doctors.push({ userId: oid('doc2'), status: 'pending' });
    expect(await signInWithTelegram(tg(7))).toEqual({ ok: false, code: 'doctor_not_approved' });

    users.push({ _id: oid('doc3'), email: 'f@mail.org', role: 'doctor', telegramId: 8 });
    expect(await signInWithTelegram(tg(8))).toEqual({ ok: false, code: 'doctor_not_approved' });
  });
});

describe('attachTelegram', () => {
  it('connects Telegram to the account and gives it the person\'s Edu account when it has none', async () => {
    users.push({ _id: oid('g1'), email: 'g@mail.org', role: 'patient' });
    expect(await attachTelegram('g1', tg(321))).toEqual({ ok: true, alreadyLinked: false, eduUid: telegramEduUid(321) });
    expect(users[0]).toMatchObject({ telegramId: 321, eduUid: 'tg_321' });
  });

  it('keeps the Edu account the user already has', async () => {
    users.push({ _id: oid('g1'), email: 'g@mail.org', role: 'patient', eduUid: 'dx_g1' });
    expect(await attachTelegram('g1', tg(321))).toEqual({ ok: true, alreadyLinked: false, eduUid: 'dx_g1' });
    expect(users[0].eduUid).toBe('dx_g1');
  });

  it('still connects when somebody else holds that Edu uid, and just leaves the Edu account alone', async () => {
    users.push({ _id: oid('g1'), email: 'g@mail.org', role: 'patient' });
    users.push({ _id: oid('x'), email: 'x@mail.org', role: 'patient', eduUid: 'tg_321' });
    expect(await attachTelegram('g1', tg(321))).toEqual({ ok: true, alreadyLinked: false, eduUid: null });
    expect(users[0].telegramId).toBe(321);
    expect(users[0].eduUid).toBeUndefined();
  });

  it('is a no-op when this Telegram is already on this account', async () => {
    users.push({ _id: oid('g1'), email: 'g@mail.org', telegramId: 321, eduUid: 'tg_321' });
    expect(await attachTelegram('g1', tg(321))).toEqual({ ok: true, alreadyLinked: true, eduUid: 'tg_321' });
  });

  it('refuses a Telegram that belongs to another account', async () => {
    users.push({ _id: oid('g1'), email: 'g@mail.org' });
    users.push({ _id: oid('t1'), email: 't@telegram.invalid', telegramId: 321 });
    expect(await attachTelegram('g1', tg(321))).toEqual({ ok: false, code: 'telegram_taken' });
    expect(users[0].telegramId).toBeUndefined();
  });

  it('refuses a second, different Telegram on one account', async () => {
    users.push({ _id: oid('g1'), email: 'g@mail.org', telegramId: 111 });
    expect(await attachTelegram('g1', tg(222))).toEqual({ ok: false, code: 'already_has_telegram' });
    expect(users[0].telegramId).toBe(111);
  });

  it('says not_found for an account that does not exist', async () => {
    expect(await attachTelegram('nobody', tg(1))).toEqual({ ok: false, code: 'not_found' });
  });
});
