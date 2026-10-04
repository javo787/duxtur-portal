import { describe, it, expect, beforeEach, vi } from 'vitest';

interface Doc {
  _id: string;
  eduUid?: string | null;
}

// A tiny in-memory stand-in for the Mongoose User model: just the calls edu-account-link makes.
let docs: Doc[];
let duplicateOnUpdate = false;
let beforeUpdate: (() => void) | null = null;

const query = <T,>(run: () => T) => ({ select: () => ({ lean: async () => run() }) });

const matchesFilter = (doc: Doc, filter: Record<string, unknown>): boolean => {
  if ('_id' in filter && doc._id !== filter._id) return false;
  if ('eduUid' in filter) {
    const cond = filter.eduUid as unknown;
    if (typeof cond === 'string' && doc.eduUid !== cond) return false;
    if (cond && typeof cond === 'object') {
      const c = cond as { $exists?: boolean; $ne?: unknown; $not?: { $regex: string } };
      const has = doc.eduUid !== undefined;
      if (c.$exists !== undefined && has !== c.$exists) return false;
      if ('$ne' in c && doc.eduUid === c.$ne) return false;
      if (c.$not && typeof doc.eduUid === 'string' && new RegExp(c.$not.$regex).test(doc.eduUid)) return false;
    }
  }
  if (Array.isArray(filter.$or)) {
    const ok = (filter.$or as Record<string, unknown>[]).some(alt => {
      const cond = alt.eduUid as { $exists?: boolean } | null;
      if (cond === null) return doc.eduUid === null;
      return cond?.$exists === false && doc.eduUid === undefined;
    });
    if (!ok) return false;
  }
  return true;
};

vi.mock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/User', () => ({
  default: {
    findById: (id: string) => query(() => docs.find(d => d._id === id) ?? null),
    findOne: (filter: Record<string, unknown>) => query(() => docs.find(d => matchesFilter(d, filter)) ?? null),
    findOneAndUpdate: (filter: Record<string, unknown>, update: { $set?: { eduUid: string }; $unset?: { eduUid: string } }) =>
      query(() => {
        beforeUpdate?.();
        const doc = docs.find(d => matchesFilter(d, filter));
        if (!doc) return null;
        const before = { ...doc };
        if (update.$set) {
          if (duplicateOnUpdate) throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
          doc.eduUid = update.$set.eduUid;
        }
        if (update.$unset) delete doc.eduUid;
        return update.$set ? { ...doc } : before; // unlink asks for the document as it was before
      }),
  },
}));

import { generatedEduUid, getOrCreateEduUid, linkEduUid, unlinkEduUid } from './edu-account-link';

beforeEach(() => {
  docs = [{ _id: 'u1' }, { _id: 'u2' }, { _id: 'u3', eduUid: 'tg_333' }];
  duplicateOnUpdate = false;
  beforeUpdate = null;
});

describe('getOrCreateEduUid', () => {
  it('returns the uid that is already linked, without changing it', async () => {
    expect(await getOrCreateEduUid('u3')).toEqual({ eduUid: 'tg_333', created: false });
  });

  it('generates dx_<id> on first use and keeps it afterwards', async () => {
    expect(await getOrCreateEduUid('u1')).toEqual({ eduUid: 'dx_u1', created: true });
    expect(docs[0].eduUid).toBe('dx_u1');
    expect(await getOrCreateEduUid('u1')).toEqual({ eduUid: 'dx_u1', created: false });
  });

  it('uses the uid a parallel request linked in the meantime', async () => {
    beforeUpdate = () => {
      docs[0].eduUid = 'tg_777'; // linked between our read and our write
    };
    const result = await getOrCreateEduUid('u1');
    expect(result).toEqual({ eduUid: 'tg_777', created: false });
  });

  it('knows nothing about an unknown account', async () => {
    expect(await getOrCreateEduUid('ghost')).toBeNull();
  });
});

describe('linkEduUid', () => {
  it('links an Edu uid to an account that has none', async () => {
    expect(await linkEduUid('u1', 'tg_111')).toEqual({ ok: true, eduUid: 'tg_111', alreadyLinked: false });
    expect(docs[0].eduUid).toBe('tg_111');
  });

  it('is idempotent for the same pair', async () => {
    expect(await linkEduUid('u3', 'tg_333')).toEqual({ ok: true, eduUid: 'tg_333', alreadyLinked: true });
  });

  it('never replaces a link the account already has', async () => {
    expect(await linkEduUid('u3', 'tg_444')).toEqual({ ok: false, code: 'portal_already_linked' });
    expect(docs[2].eduUid).toBe('tg_333');
  });

  it('never gives one Edu account to two portal accounts', async () => {
    expect(await linkEduUid('u1', 'tg_333')).toEqual({ ok: false, code: 'edu_uid_taken' });
    expect(docs[0].eduUid).toBeUndefined();
  });

  it('survives losing the race for the same Edu uid (unique index)', async () => {
    duplicateOnUpdate = true;
    expect(await linkEduUid('u1', 'tg_555')).toEqual({ ok: false, code: 'edu_uid_taken' });
  });

  it('reports a link that appeared between the check and the write', async () => {
    beforeUpdate = () => {
      docs[0].eduUid = 'tg_888';
    };
    expect(await linkEduUid('u1', 'tg_555')).toEqual({ ok: false, code: 'portal_already_linked' });
    expect(docs[0].eduUid).toBe('tg_888');
  });

  it('lets an account link its own generated dx_ uid and nobody else\'s', async () => {
    expect(await linkEduUid('u1', generatedEduUid('u1'))).toMatchObject({ ok: true });
    expect(await linkEduUid('u2', generatedEduUid('u1'))).toEqual({ ok: false, code: 'invalid_uid' });
  });

  it('rejects empty and oversized uids and unknown accounts', async () => {
    expect(await linkEduUid('u1', '')).toEqual({ ok: false, code: 'invalid_uid' });
    expect(await linkEduUid('u1', 'x'.repeat(129))).toEqual({ ok: false, code: 'invalid_uid' });
    expect(await linkEduUid('ghost', 'tg_1')).toEqual({ ok: false, code: 'not_found' });
  });
});

describe('unlinkEduUid', () => {
  it('detaches and reports what was detached', async () => {
    expect(await unlinkEduUid('u3')).toEqual({ ok: true, previous: 'tg_333' });
    expect(docs[2].eduUid).toBeUndefined();
  });

  it('does nothing for an account without a link', async () => {
    expect(await unlinkEduUid('u1')).toEqual({ ok: true, previous: null });
  });

  it('keeps a generated dx_ uid: the portal is the only way into that Edu profile', async () => {
    await getOrCreateEduUid('u1');
    expect(await unlinkEduUid('u1')).toEqual({ ok: false, code: 'cannot_unlink' });
    expect(docs[0].eduUid).toBe('dx_u1');
  });

  it('frees the Edu uid for another account afterwards', async () => {
    await unlinkEduUid('u3');
    expect(await linkEduUid('u1', 'tg_333')).toMatchObject({ ok: true });
  });
});
