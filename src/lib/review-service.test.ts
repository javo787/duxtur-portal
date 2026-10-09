import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => {
  const chain = (value: () => unknown) => ({ select: () => ({ lean: () => Promise.resolve(value()) }) });
  return {
    user: null as unknown,
    doctor: null as unknown,
    authorDoctor: null as unknown,
    clinic: null as unknown,
    article: null as unknown,
    published: [] as Array<{ rating: number }>,
    upserted: 1,
    updateOne: vi.fn(),
    findReviews: vi.fn(),
    updateDoctor: vi.fn(),
    recalculateClinic: vi.fn(),
    revalidate: vi.fn(),
    notify: vi.fn(),
    chain,
  };
});

vi.mock('@/lib/mongodb', () => ({ default: vi.fn(async () => undefined) }));
vi.mock('@/lib/telegram', () => ({ notifyAdminNewReview: db.notify }));
vi.mock('next/cache', () => ({ revalidatePath: db.revalidate }));
vi.mock('@/app/actions/clinic', () => ({ recalculateClinicRating: db.recalculateClinic }));
vi.mock('@/models/User', () => ({ default: { findById: () => db.chain(() => db.user) } }));
vi.mock('@/models/Doctor', () => ({
  default: {
    // the doctor being reviewed, or the author of an article
    findById: (id: string) => db.chain(() => (id === ARTICLE_AUTHOR_ID ? db.authorDoctor : db.doctor)),
    findByIdAndUpdate: (...args: unknown[]) => db.updateDoctor(...args),
  },
}));
vi.mock('@/models/Clinic', () => ({ default: { findOne: () => db.chain(() => db.clinic), findById: () => db.chain(() => db.clinic) } }));
vi.mock('@/models/Article', () => ({ default: { findById: () => db.chain(() => db.article) } }));
vi.mock('@/models/Review', () => ({
  default: {
    updateOne: (...args: unknown[]) => {
      db.updateOne(...args);
      return Promise.resolve({ upsertedCount: db.upserted, upsertedId: '999999999999999999999999' });
    },
    find: (...args: unknown[]) => {
      db.findReviews(...args);
      return db.chain(() => db.published);
    },
  },
}));

import { articleRatingSummary, createReview, refreshReviewStats, reviewChanged } from './review-service';

const USER_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const DOCTOR_ID = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const ARTICLE_ID = 'cccccccccccccccccccccccc';
const ARTICLE_AUTHOR_ID = 'dddddddddddddddddddddddd';
const input = { rating: 5, text: 'Очень помог, спасибо.', isAnonymous: false };

beforeEach(() => {
  db.user = { name: 'Жавохир Нурматов', email: 'javo@example.test' };
  db.doctor = { _id: DOCTOR_ID, userId: 'eeeeeeeeeeeeeeeeeeeeeeee', clinicId: 'ffffffffffffffffffffffff', name: 'Каримов Рустам' };
  db.authorDoctor = { userId: 'eeeeeeeeeeeeeeeeeeeeeeee' };
  db.clinic = { _id: '111111111111111111111111', userId: 'eeeeeeeeeeeeeeeeeeeeeeee', name: { ru: 'Клиника Тест' }, slug: 'city-clinic' };
  db.article = { _id: ARTICLE_ID, authorId: ARTICLE_AUTHOR_ID, isVerified: true, title: { ru: 'Про сердце' } };
  db.published = [];
  db.upserted = 1;
  for (const mock of [db.updateOne, db.findReviews, db.updateDoctor, db.recalculateClinic, db.revalidate, db.notify]) mock.mockReset();
});

describe('createReview', () => {
  it('publishes a doctor review at once under the full name, once per person, and counts it for the clinic too', async () => {
    db.published = [{ rating: 5 }];
    expect(await createReview({ kind: 'doctor', id: DOCTOR_ID }, USER_ID, input)).toEqual({ ok: true, id: '999999999999999999999999' });
    const [filter, update, options] = db.updateOne.mock.calls[0];
    expect(filter).toEqual({ patientId: USER_ID, doctorId: DOCTOR_ID });
    expect(update.$setOnInsert).toEqual({
      clinicId: 'ffffffffffffffffffffffff',
      rating: 5,
      text: input.text,
      isAnonymous: false,
      authorName: 'Жавохир Нурматов',
      isVerified: true,
    });
    expect(options).toEqual({ upsert: true });
    // numbers of the doctor and the clinic, and fresh pages
    expect(db.updateDoctor).toHaveBeenCalledWith(DOCTOR_ID, { reviewCount: 1, reviewSum: 5, reviewAvg: 5 });
    expect(db.recalculateClinic).toHaveBeenCalledWith('ffffffffffffffffffffffff');
  });

  it('with "hide the name" only the masked name is stored', async () => {
    await createReview({ kind: 'doctor', id: DOCTOR_ID }, USER_ID, { ...input, isAnonymous: true });
    const stored = db.updateOne.mock.calls[0][1].$setOnInsert;
    expect(stored.authorName).toBe('Жа*** Н.');
    expect(stored.isAnonymous).toBe(true);
    expect(JSON.stringify(stored)).not.toContain('Нурматов');
    expect(JSON.stringify(stored)).not.toContain('javo@example.test');
  });

  it('tells the administrator who wrote it and what the visitors see', async () => {
    await createReview({ kind: 'doctor', id: DOCTOR_ID }, USER_ID, { ...input, isAnonymous: true });
    expect(db.notify).toHaveBeenCalledWith({
      kind: 'doctor',
      subject: 'Каримов Рустам',
      rating: 5,
      text: input.text,
      shownAs: 'Жа*** Н.',
      account: 'Жавохир Нурматов, javo@example.test',
    });
  });

  it('the review stays saved when the numbers or the notice cannot be updated', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    db.updateDoctor.mockRejectedValue(new Error('db hiccup'));
    expect(await createReview({ kind: 'doctor', id: DOCTOR_ID }, USER_ID, input)).toMatchObject({ ok: true });
  });

  it('says "duplicate" when the person already reviewed this, and then changes nothing else', async () => {
    db.upserted = 0;
    expect(await createReview({ kind: 'doctor', id: DOCTOR_ID }, USER_ID, input)).toEqual({ ok: false, code: 'duplicate' });
    expect(db.updateDoctor).not.toHaveBeenCalled();
    expect(db.notify).not.toHaveBeenCalled();
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
    const [filter, update] = db.updateOne.mock.calls[0];
    expect(filter).toEqual({
      patientId: USER_ID,
      clinicId: '111111111111111111111111',
      doctorId: { $exists: false },
      articleId: { $exists: false },
    });
    expect(update.$setOnInsert).not.toHaveProperty('doctorId');
    expect(db.recalculateClinic).toHaveBeenCalledWith('111111111111111111111111');
    expect(db.updateDoctor).not.toHaveBeenCalled();
  });

  it('an article review changes no doctor or clinic numbers, only the article pages', async () => {
    db.article = { ...(db.article as object), slug: 'x' };
    await createReview({ kind: 'article', id: ARTICLE_ID }, USER_ID, input);
    expect(db.updateOne.mock.calls[0][0]).toEqual({ patientId: USER_ID, articleId: ARTICLE_ID });
    expect(db.updateDoctor).not.toHaveBeenCalled();
    expect(db.recalculateClinic).not.toHaveBeenCalled();
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
    db.user = { name: '', email: 'x@example.test' };
    await createReview({ kind: 'doctor', id: DOCTOR_ID }, USER_ID, input);
    expect(db.updateOne.mock.calls[0][1].$setOnInsert.authorName).toBe('');
  });
});

describe('refreshReviewStats / reviewChanged', () => {
  it('recounts a doctor from the published reviews only', async () => {
    db.published = [{ rating: 5 }, { rating: 4 }, { rating: 4 }];
    await refreshReviewStats({ doctorId: DOCTOR_ID, clinicId: 'ffffffffffffffffffffffff' });
    expect(db.findReviews).toHaveBeenCalledWith({ doctorId: DOCTOR_ID, isVerified: true });
    expect(db.updateDoctor).toHaveBeenCalledWith(DOCTOR_ID, { reviewCount: 3, reviewSum: 13, reviewAvg: 4.3 });
    expect(db.recalculateClinic).toHaveBeenCalledWith('ffffffffffffffffffffffff');
  });

  it('a doctor with nothing published goes back to zero; the clinic is found through the doctor when the review lacks it', async () => {
    db.doctor = { clinicId: 'ffffffffffffffffffffffff' };
    await refreshReviewStats({ doctorId: DOCTOR_ID });
    expect(db.updateDoctor).toHaveBeenCalledWith(DOCTOR_ID, { reviewCount: 0, reviewSum: 0, reviewAvg: 0 });
    expect(db.recalculateClinic).toHaveBeenCalledWith('ffffffffffffffffffffffff');
  });

  it('refreshes the pages of the doctor, the clinic and the article in every language', async () => {
    db.doctor = { slug: 'dr-seed' };
    db.clinic = { slug: 'city-clinic' };
    db.article = { slug: 'heart' };
    await reviewChanged({ doctorId: DOCTOR_ID, clinicId: 'x', articleId: ARTICLE_ID });
    const paths = db.revalidate.mock.calls.map(call => call[0]);
    expect(paths).toContain('/ru/doctor/dr-seed');
    expect(paths).toContain('/tg/clinics/city-clinic');
    expect(paths).toContain('/ky/blog/heart');
    expect(paths).toHaveLength(15);
  });
});

describe('articleRatingSummary', () => {
  it('counts the old votes and the published reviews together', async () => {
    db.published = [{ rating: 5 }];
    expect(await articleRatingSummary({ _id: ARTICLE_ID, ratings: [5, 4] })).toEqual({ avg: 4.7, count: 3 });
    expect(db.findReviews).toHaveBeenCalledWith({ articleId: ARTICLE_ID, isVerified: true });
  });

  it('works with only old votes, only reviews, or neither', async () => {
    expect(await articleRatingSummary({ _id: ARTICLE_ID, ratings: [4, 5] })).toEqual({ avg: 4.5, count: 2 });
    db.published = [{ rating: 5 }, { rating: 4 }];
    expect(await articleRatingSummary({ _id: ARTICLE_ID })).toEqual({ avg: 4.5, count: 2 });
    db.published = [];
    expect(await articleRatingSummary({ _id: ARTICLE_ID })).toEqual({ avg: 0, count: 0 });
  });
});
