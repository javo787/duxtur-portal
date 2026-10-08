import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => {
  const chain = (value: () => unknown) => ({ select: () => ({ lean: () => Promise.resolve(value()) }) });
  return {
    user: null as unknown,
    doctor: null as unknown,
    authorDoctor: null as unknown,
    clinic: null as unknown,
    article: null as unknown,
    upserted: 1,
    rows: [] as Array<{ sum: number; count: number }>,
    updateOne: vi.fn(),
    chain,
  };
});

vi.mock('@/lib/mongodb', () => ({ default: vi.fn(async () => undefined) }));
vi.mock('@/models/User', () => ({ default: { findById: () => db.chain(() => db.user) } }));
vi.mock('@/models/Doctor', () => ({
  default: {
    // the doctor being reviewed, or the author of an article
    findById: (id: string) => db.chain(() => (id === ARTICLE_AUTHOR_ID ? db.authorDoctor : db.doctor)),
  },
}));
vi.mock('@/models/Clinic', () => ({ default: { findOne: () => db.chain(() => db.clinic) } }));
vi.mock('@/models/Article', () => ({ default: { findById: () => db.chain(() => db.article) } }));
vi.mock('@/models/Review', () => ({
  default: {
    updateOne: (...args: unknown[]) => {
      db.updateOne(...args);
      return Promise.resolve({ upsertedCount: db.upserted });
    },
    aggregate: () => Promise.resolve(db.rows),
  },
}));

import { articleRatingSummary, createReview } from './review-service';

const USER_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const DOCTOR_ID = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const ARTICLE_ID = 'cccccccccccccccccccccccc';
const ARTICLE_AUTHOR_ID = 'dddddddddddddddddddddddd';
const input = { rating: 5, text: 'Очень помог, спасибо.', isAnonymous: false };

beforeEach(() => {
  db.user = { name: 'Жавохир Нурматов' };
  db.doctor = { _id: DOCTOR_ID, userId: 'eeeeeeeeeeeeeeeeeeeeeeee', clinicId: 'ffffffffffffffffffffffff' };
  db.authorDoctor = { userId: 'eeeeeeeeeeeeeeeeeeeeeeee' };
  db.clinic = { _id: '111111111111111111111111', userId: 'eeeeeeeeeeeeeeeeeeeeeeee' };
  db.article = { _id: ARTICLE_ID, authorId: ARTICLE_AUTHOR_ID, isVerified: true };
  db.upserted = 1;
  db.rows = [];
  db.updateOne.mockClear();
});

describe('createReview', () => {
  it('stores a doctor review as waiting, with the masked name and the doctor\'s clinic, once per person', async () => {
    expect(await createReview({ kind: 'doctor', id: DOCTOR_ID }, USER_ID, input)).toEqual({ ok: true });
    const [filter, update, options] = db.updateOne.mock.calls[0];
    expect(filter).toEqual({ patientId: USER_ID, doctorId: DOCTOR_ID });
    expect(update.$setOnInsert).toMatchObject({
      rating: 5,
      text: input.text,
      isAnonymous: false,
      authorName: 'Жа*** Н.',
      isVerified: false,
      clinicId: 'ffffffffffffffffffffffff',
    });
    expect(JSON.stringify(update)).not.toContain('Нурматов');
    expect(options).toEqual({ upsert: true });
  });

  it('says "duplicate" when the person already reviewed this', async () => {
    db.upserted = 0;
    expect(await createReview({ kind: 'doctor', id: DOCTOR_ID }, USER_ID, input)).toEqual({ ok: false, code: 'duplicate' });
  });

  it('refuses a review of the person\'s own doctor profile, clinic or article', async () => {
    db.doctor = { _id: DOCTOR_ID, userId: USER_ID };
    expect(await createReview({ kind: 'doctor', id: DOCTOR_ID }, USER_ID, input)).toEqual({ ok: false, code: 'own' });
    db.clinic = { _id: '111111111111111111111111', userId: USER_ID };
    expect(await createReview({ kind: 'clinic', slug: 'c' }, USER_ID, input)).toEqual({ ok: false, code: 'own' });
    db.authorDoctor = { userId: USER_ID };
    expect(await createReview({ kind: 'article', id: ARTICLE_ID }, USER_ID, input)).toEqual({ ok: false, code: 'own' });
    expect(db.updateOne).not.toHaveBeenCalled();
  });

  it('a clinic review is not mixed up with reviews of its doctors or articles', async () => {
    await createReview({ kind: 'clinic', slug: 'city-clinic' }, USER_ID, input);
    expect(db.updateOne.mock.calls[0][0]).toEqual({
      patientId: USER_ID,
      clinicId: '111111111111111111111111',
      doctorId: { $exists: false },
      articleId: { $exists: false },
    });
  });

  it('does not find what is not there: bad id, unknown doctor or clinic, an article nobody can read', async () => {
    expect(await createReview({ kind: 'doctor', id: 'not-an-id' }, USER_ID, input)).toEqual({ ok: false, code: 'not_found' });
    db.doctor = null;
    expect(await createReview({ kind: 'doctor', id: DOCTOR_ID }, USER_ID, input)).toEqual({ ok: false, code: 'not_found' });
    db.clinic = null;
    expect(await createReview({ kind: 'clinic', slug: 'x' }, USER_ID, input)).toEqual({ ok: false, code: 'not_found' });
    db.article = { _id: ARTICLE_ID, authorId: ARTICLE_AUTHOR_ID, isVerified: false };
    expect(await createReview({ kind: 'article', id: ARTICLE_ID }, USER_ID, input)).toEqual({ ok: false, code: 'not_found' });
    expect(db.updateOne).not.toHaveBeenCalled();
  });

  it('needs a real account', async () => {
    expect(await createReview({ kind: 'doctor', id: DOCTOR_ID }, 'nope', input)).toEqual({ ok: false, code: 'no_user' });
    db.user = null;
    expect(await createReview({ kind: 'doctor', id: DOCTOR_ID }, USER_ID, input)).toEqual({ ok: false, code: 'no_user' });
  });

  it('stores no name for an account without a usable one', async () => {
    db.user = { name: '' };
    await createReview({ kind: 'doctor', id: DOCTOR_ID }, USER_ID, input);
    expect(db.updateOne.mock.calls[0][1].$setOnInsert.authorName).toBe('');
  });
});

describe('articleRatingSummary', () => {
  it('counts the old votes and the approved reviews together', async () => {
    db.rows = [{ sum: 5, count: 1 }];
    expect(await articleRatingSummary({ _id: ARTICLE_ID, ratings: [5, 4] })).toEqual({ avg: 4.7, count: 3 });
  });

  it('works with only old votes, only reviews, or neither', async () => {
    expect(await articleRatingSummary({ _id: ARTICLE_ID, ratings: [4, 5] })).toEqual({ avg: 4.5, count: 2 });
    db.rows = [{ sum: 9, count: 2 }];
    expect(await articleRatingSummary({ _id: ARTICLE_ID })).toEqual({ avg: 4.5, count: 2 });
    db.rows = [];
    expect(await articleRatingSummary({ _id: ARTICLE_ID })).toEqual({ avg: 0, count: 0 });
  });
});
