import { describe, it, expect, beforeEach, vi } from 'vitest';

interface Doc {
  _id: { toString(): string };
  email?: string;
  role?: string;
  name?: string;
  image?: string;
  eduUid?: string | null;
  provider?: string;
}

let users: Doc[];
let doctors: { userId: Doc['_id']; status: string }[];
let nextId = 1;
let beforeCreate: (() => void) | null = null;
const signInWithTelegram = vi.fn();

const oid = (n: string) => ({ toString: () => n });
const dup = () => Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
const matches = (doc: Doc, filter: Record<string, unknown>) =>
  Object.entries(filter).every(([k, v]) => (doc as unknown as Record<string, unknown>)[k] === v);
const chain = <T,>(run: () => T) => ({ select: () => ({ lean: async () => run() }), lean: async () => run() });

vi.mock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/portal-telegram-account', () => ({
  TELEGRAM_EDU_PREFIX: 'tg_',
  signInWithTelegram: (...a: unknown[]) => signInWithTelegram(...a),
}));
vi.mock('@/models/Doctor', () => ({
  default: { findOne: (f: { userId: Doc['_id'] }) => chain(() => doctors.find(d => d.userId.toString() === f.userId.toString()) ?? null) },
}));
vi.mock('@/models/User', () => ({
  default: {
    findOne: (f: Record<string, unknown>) => chain(() => users.find(u => matches(u, f)) ?? null),
    exists: async (f: Record<string, unknown>) => (users.some(u => matches(u, f)) ? { _id: 1 } : null),
    create: async (data: Partial<Doc>) => {
      beforeCreate?.();
      const doc: Doc = { ...data, _id: oid(`u${nextId++}`) };
      if (doc.eduUid && users.some(u => u.eduUid === doc.eduUid)) throw dup();
      if (users.some(u => u.email === doc.email)) throw dup();
      users.push(doc);
      return doc;
    },
  },
}));

import { signInWithEdu } from './portal-edu-account';

const google = (over: Record<string, unknown> = {}) => ({
  uid: 'GoogleUid123', provider: 'google.com', authTime: 1, email: 'dr@gmail.com', emailVerified: true, name: 'Dr Karimov', picture: 'https://lh3/p.png', ...over,
});

beforeEach(() => {
  users = [];
  doctors = [];
  nextId = 1;
  beforeCreate = null;
  signInWithTelegram.mockReset();
});

describe('signInWithEdu', () => {
  it('sends a Telegram uid through the Telegram rules, so both doors open one account', async () => {
    signInWithTelegram.mockResolvedValue({ ok: true, user: { id: 'u9' }, created: false });
    const res = await signInWithEdu({ uid: 'tg_12345', provider: 'custom', authTime: 1, tgName: 'Ali K' });
    expect(res).toEqual({ ok: true, user: { id: 'u9' }, created: false });
    expect(signInWithTelegram).toHaveBeenCalledWith({ id: 12345, firstName: 'Ali K' });
  });

  it('passes on a refusal of the Telegram rules (an unapproved doctor)', async () => {
    signInWithTelegram.mockResolvedValue({ ok: false, code: 'doctor_not_approved' });
    expect(await signInWithEdu({ uid: 'tg_1', provider: 'custom', authTime: 1 })).toEqual({ ok: false, code: 'doctor_not_approved' });
  });

  it('does not treat something that only looks like a Telegram uid as one', async () => {
    for (const uid of ['tg_', 'tg_12x', 'tg_1234567890123456', 'xtg_12']) {
      expect(await signInWithEdu({ uid, provider: 'custom', authTime: 1 })).toEqual({ ok: false, code: 'unsupported' });
    }
    expect(signInWithTelegram).not.toHaveBeenCalled();
  });

  it('opens the portal account that holds the Edu uid', async () => {
    users.push({ _id: oid('p1'), email: 'a@b.tj', role: 'patient', name: 'Ali', eduUid: 'GoogleUid123' });
    const res = await signInWithEdu(google({ email: 'someone-else@gmail.com' }));
    expect(res).toMatchObject({ ok: true, created: false, user: { id: 'p1', email: 'a@b.tj' } });
    expect(users).toHaveLength(1);
  });

  it('opens a generated dx_ uid only through the account that holds it, never by creating one', async () => {
    expect(await signInWithEdu({ uid: 'dx_abc', provider: 'custom', authTime: 1 })).toEqual({ ok: false, code: 'unsupported' });
    users.push({ _id: oid('abc'), email: 'a@b.tj', role: 'patient', eduUid: 'dx_abc' });
    expect(await signInWithEdu({ uid: 'dx_abc', provider: 'custom', authTime: 1 })).toMatchObject({ ok: true, user: { id: 'abc' } });
  });

  it('refuses an administrator and an unapproved doctor, even through the Edu uid', async () => {
    users.push({ _id: oid('adm'), email: 'a@b.tj', role: 'portal_admin', eduUid: 'GoogleUid123' });
    expect(await signInWithEdu(google())).toEqual({ ok: false, code: 'role_not_allowed' });

    users = [{ _id: oid('doc'), email: 'd@b.tj', role: 'doctor', eduUid: 'GoogleUid123' }];
    doctors = [{ userId: oid('doc'), status: 'pending' }];
    expect(await signInWithEdu(google())).toEqual({ ok: false, code: 'doctor_not_approved' });

    doctors = [{ userId: oid('doc'), status: 'approved' }];
    expect(await signInWithEdu(google())).toMatchObject({ ok: true, user: { id: 'doc', role: 'doctor' } });
  });

  it('registers a new patient with the verified Google address, holding the Edu uid', async () => {
    const res = await signInWithEdu(google());
    expect(res).toMatchObject({ ok: true, created: true, user: { email: 'dr@gmail.com', role: 'patient', name: 'Dr Karimov' } });
    expect(users[0]).toMatchObject({ eduUid: 'GoogleUid123', provider: 'google', password: '', image: 'https://lh3/p.png' });
  });

  it('never merges by e-mail: an address that already has an account is refused', async () => {
    users.push({ _id: oid('p1'), email: 'dr@gmail.com', role: 'doctor' });
    expect(await signInWithEdu(google())).toEqual({ ok: false, code: 'email_in_use' });
    expect(users).toHaveLength(1);
    expect(users[0].eduUid).toBeUndefined();
  });

  it('does not register anybody on an unverified address, or without a provider that vouches for it', async () => {
    expect(await signInWithEdu(google({ emailVerified: false }))).toEqual({ ok: false, code: 'unsupported' });
    expect(await signInWithEdu(google({ email: undefined }))).toEqual({ ok: false, code: 'unsupported' });
    expect(await signInWithEdu(google({ provider: 'password' }))).toEqual({ ok: false, code: 'unsupported' });
    expect(await signInWithEdu(google({ provider: 'custom' }))).toEqual({ ok: false, code: 'unsupported' });
    expect(users).toHaveLength(0);
  });

  it('survives two first sign-ins at once: the second one finds the account of the first', async () => {
    beforeCreate = () => {
      beforeCreate = null;
      users.push({ _id: oid('raced'), email: 'dr@gmail.com', role: 'patient', eduUid: 'GoogleUid123' });
    };
    const res = await signInWithEdu(google());
    expect(res).toMatchObject({ ok: true, created: false, user: { id: 'raced' } });
    expect(users).toHaveLength(1);
  });
});
