import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => {
  const model = () => ({
    findById: vi.fn(), find: vi.fn(), deleteOne: vi.fn(), deleteMany: vi.fn(), updateMany: vi.fn(),
    collection: { updateOne: vi.fn() },
  });
  return {
    dbConnect: vi.fn(), recordAudit: vi.fn(), reviewChanged: vi.fn(),
    doctor: model(), clinic: model(), article: model(), user: model(), review: model(),
    trash: { create: vi.fn(), findById: vi.fn(), deleteOne: vi.fn() },
  };
});

vi.mock('@/lib/mongodb', () => ({ default: m.dbConnect }));
vi.mock('@/lib/audit-log', () => ({ recordAudit: m.recordAudit }));
vi.mock('@/lib/review-service', () => ({ reviewChanged: m.reviewChanged }));
vi.mock('@/models/Doctor', () => ({ default: m.doctor }));
vi.mock('@/models/Clinic', () => ({ default: m.clinic }));
vi.mock('@/models/Article', () => ({ default: m.article }));
vi.mock('@/models/User', () => ({ default: m.user }));
vi.mock('@/models/Review', () => ({ default: m.review }));
vi.mock('@/models/TrashItem', () => ({ default: m.trash }));

import {
  purgeTrashItem, restoreTrashItem, trashArticle, trashClinic, trashDoctor, trashReview,
} from './admin-trash';

const ID = '507f1f77bcf86cd799439011';
const TRASH_ID = '607f1f77bcf86cd799439022';
const ACTOR = { userId: 'admin1', email: 'a@duxtur.org', role: 'portal_admin' };
const MANAGER = { userId: 'm1', email: 'm@duxtur.org', role: 'portal_manager' };
const chain = (v: unknown): { select: () => unknown; lean: () => Promise<unknown> } => ({ select: () => chain(v), lean: async () => v });
const order = (fn: ReturnType<typeof vi.fn>) => fn.mock.invocationCallOrder[0];

beforeEach(() => {
  vi.clearAllMocks();
  m.trash.create.mockResolvedValue({});
  m.trash.deleteOne.mockResolvedValue({});
  for (const model of [m.doctor, m.clinic, m.article, m.user, m.review]) {
    model.findById.mockReturnValue(chain(null));
    model.find.mockReturnValue(chain([]));
    model.collection.updateOne.mockResolvedValue({});
  }
});

describe('trashDoctor', () => {
  const doctor = { _id: ID, name: 'Иванов Иван', userId: 'u1' };

  beforeEach(() => {
    m.doctor.findById.mockReturnValue(chain(doctor));
    m.user.findById.mockReturnValue(chain({ _id: 'u1', email: 'doc@x.tj', role: 'doctor' }));
    m.article.find.mockReturnValue(chain([{ _id: 'a1' }, { _id: 'a2' }]));
    m.clinic.find.mockReturnValue(chain([{ _id: 'c1' }]));
  });

  it('writes the snapshot first and only then deletes, cleaning every reference', async () => {
    expect(await trashDoctor(ID, ACTOR)).toEqual({ ok: true });

    const snapshot = m.trash.create.mock.calls[0][0];
    expect(snapshot).toMatchObject({
      entityType: 'doctor', entityId: ID, label: 'Иванов Иван', deletedByEmail: 'a@duxtur.org',
      payload: { doctor, user: { _id: 'u1' }, articles: [{ _id: 'a1' }, { _id: 'a2' }], clinicIds: ['c1'] },
    });
    expect(snapshot.expiresAt.getTime()).toBeGreaterThan(Date.now() + 29 * 86400000);

    expect(m.article.deleteMany).toHaveBeenCalledWith({ authorId: ID });
    expect(m.clinic.updateMany).toHaveBeenCalledWith({ doctorIds: ID }, { $pull: { doctorIds: ID } });
    expect(m.user.deleteOne).toHaveBeenCalledWith({ _id: 'u1' });
    expect(m.doctor.deleteOne).toHaveBeenCalledWith({ _id: ID });
    for (const del of [m.article.deleteMany, m.clinic.updateMany, m.user.deleteOne, m.doctor.deleteOne]) {
      expect(order(m.trash.create)).toBeLessThan(order(del));
    }
    expect(m.recordAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'doctor.trashed', entityId: ID, entityLabel: 'Иванов Иван', meta: { articles: 2, hadAccount: true },
    }));
  });

  it('deletes nothing when the snapshot cannot be written', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    m.trash.create.mockRejectedValue(new Error('document too large'));
    const result = await trashDoctor(ID, ACTOR);
    expect(result).toEqual({ ok: false, error: expect.stringContaining('ничего не удалено') });
    for (const del of [m.article.deleteMany, m.clinic.updateMany, m.user.deleteOne, m.doctor.deleteOne]) {
      expect(del).not.toHaveBeenCalled();
    }
    expect(m.recordAudit).not.toHaveBeenCalled();
  });

  it('never deletes an administrator account that is linked to a doctor profile', async () => {
    m.user.findById.mockReturnValue(chain({ _id: 'u1', role: 'portal_admin' }));
    expect(await trashDoctor(ID, ACTOR)).toMatchObject({ ok: false, error: expect.stringContaining('администратора') });
    expect(m.trash.create).not.toHaveBeenCalled();
    expect(m.user.deleteOne).not.toHaveBeenCalled();
    expect(m.doctor.deleteOne).not.toHaveBeenCalled();
  });

  it('copes with a doctor that has no account', async () => {
    m.doctor.findById.mockReturnValue(chain({ _id: ID, name: 'Импорт' }));
    expect(await trashDoctor(ID, ACTOR)).toEqual({ ok: true });
    expect(m.user.findById).not.toHaveBeenCalled();
    expect(m.user.deleteOne).not.toHaveBeenCalled();
    expect(m.doctor.deleteOne).toHaveBeenCalled();
  });

  it('refuses a bad id and an unknown doctor without touching anything', async () => {
    expect(await trashDoctor('nope', ACTOR)).toMatchObject({ ok: false });
    expect(m.dbConnect).not.toHaveBeenCalled();
    m.doctor.findById.mockReturnValue(chain(null));
    expect(await trashDoctor(ID, ACTOR)).toEqual({ ok: false, error: 'Врач не найден' });
    expect(m.trash.create).not.toHaveBeenCalled();
  });
});

describe('trashClinic', () => {
  beforeEach(() => {
    m.clinic.findById.mockReturnValue(chain({ _id: ID, name: { ru: 'Клиника Нур' }, userId: 'u2' }));
    m.user.findById.mockReturnValue(chain({ _id: 'u2', role: 'clinic' }));
    m.doctor.find.mockReturnValue(chain([{ _id: 'd1' }, { _id: 'd2' }]));
  });

  it('keeps the owner and the linked doctors in the snapshot, unlinks the doctors, then deletes', async () => {
    expect(await trashClinic(ID, ACTOR)).toEqual({ ok: true });
    expect(m.trash.create.mock.calls[0][0].payload).toMatchObject({
      clinic: { _id: ID }, user: { _id: 'u2' }, doctorIds: ['d1', 'd2'],
    });
    expect(m.doctor.updateMany).toHaveBeenCalledWith({ clinicId: ID }, { $set: { clinicId: null } });
    expect(m.user.deleteOne).toHaveBeenCalledWith({ _id: 'u2' });
    expect(m.clinic.deleteOne).toHaveBeenCalledWith({ _id: ID });
    expect(order(m.trash.create)).toBeLessThan(order(m.doctor.updateMany));
    expect(m.recordAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'clinic.trashed', entityLabel: 'Клиника Нур', meta: { doctorsUnlinked: 2, hadAccount: true },
    }));
  });

  it('deletes nothing when the snapshot fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    m.trash.create.mockRejectedValue(new Error('boom'));
    expect(await trashClinic(ID, ACTOR)).toMatchObject({ ok: false });
    expect(m.doctor.updateMany).not.toHaveBeenCalled();
    expect(m.clinic.deleteOne).not.toHaveBeenCalled();
  });
});

describe('trashArticle and trashReview', () => {
  it('moves an article to the trash under its title', async () => {
    m.article.findById.mockReturnValue(chain({ _id: ID, slug: 's', title: { ru: 'Про сердце' } }));
    expect(await trashArticle(ID, ACTOR)).toEqual({ ok: true });
    expect(m.trash.create.mock.calls[0][0]).toMatchObject({ entityType: 'article', label: 'Про сердце' });
    expect(m.article.deleteOne).toHaveBeenCalledWith({ _id: ID });
  });

  it('refreshes the numbers only for a review that was published', async () => {
    m.review.findById.mockReturnValue(chain({ _id: ID, text: 'Отличный приём', rating: 5, isVerified: true, doctorId: 'd1' }));
    expect(await trashReview(ID, ACTOR)).toEqual({ ok: true });
    expect(m.reviewChanged).toHaveBeenCalledTimes(1);
    expect(m.recordAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'review.trashed', meta: { rating: 5 } }));

    m.reviewChanged.mockClear();
    m.review.findById.mockReturnValue(chain({ _id: ID, text: 'Скрыт', rating: 1, isVerified: false }));
    await trashReview(ID, ACTOR);
    expect(m.reviewChanged).not.toHaveBeenCalled();
  });
});

describe('restoreTrashItem', () => {
  const item = (entityType: string, payload: Record<string, unknown>) =>
    chain({ _id: TRASH_ID, entityType, entityId: ID, label: 'Иванов Иван', payload });

  it('brings a doctor back with the account, the articles and the place in the clinic list', async () => {
    m.trash.findById.mockReturnValue(item('doctor', {
      doctor: { _id: ID, name: 'Иванов Иван' }, user: { _id: 'u1', email: 'doc@x.tj' },
      articles: [{ _id: 'a1', slug: 's1' }, { _id: 'a2', slug: 's2' }], clinicIds: ['c1'],
    }));
    expect(await restoreTrashItem(TRASH_ID, ACTOR)).toEqual({ ok: true });

    // inserted under the original _id, and a copy that already exists is left alone
    expect(m.user.collection.updateOne).toHaveBeenCalledWith({ _id: 'u1' }, { $setOnInsert: { email: 'doc@x.tj' } }, { upsert: true });
    expect(m.doctor.collection.updateOne).toHaveBeenCalledWith({ _id: ID }, { $setOnInsert: { name: 'Иванов Иван' } }, { upsert: true });
    expect(m.article.collection.updateOne).toHaveBeenCalledTimes(2);
    expect(m.clinic.updateMany).toHaveBeenCalledWith({ _id: { $in: ['c1'] } }, { $addToSet: { doctorIds: ID } });
    expect(m.trash.deleteOne).toHaveBeenCalledWith({ _id: TRASH_ID });
    expect(m.recordAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'trash.restored', entityType: 'doctor', entityId: ID }));
  });

  it('links a restored clinic back only to doctors that are still without a clinic', async () => {
    m.trash.findById.mockReturnValue(item('clinic', {
      clinic: { _id: ID, name: { ru: 'Нур' } }, user: null, doctorIds: ['d1', 'd2'],
    }));
    expect(await restoreTrashItem(TRASH_ID, ACTOR)).toEqual({ ok: true });
    expect(m.user.collection.updateOne).not.toHaveBeenCalled();
    expect(m.doctor.updateMany).toHaveBeenCalledWith({ _id: { $in: ['d1', 'd2'] }, clinicId: null }, { $set: { clinicId: ID } });
  });

  it('refreshes the numbers when a published review comes back', async () => {
    m.trash.findById.mockReturnValue(item('review', { review: { _id: ID, text: 'ok', isVerified: true, doctorId: 'd1' } }));
    await restoreTrashItem(TRASH_ID, ACTOR);
    expect(m.reviewChanged).toHaveBeenCalledTimes(1);
  });

  it('keeps the item in the trash and explains when the e-mail or the address is already taken', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    m.trash.findById.mockReturnValue(item('doctor', { doctor: { _id: ID, name: 'x' }, user: { _id: 'u1', email: 'doc@x.tj' } }));
    m.user.collection.updateOne.mockRejectedValue(Object.assign(new Error('E11000 duplicate key'), { code: 11000 }));
    const result = await restoreTrashItem(TRASH_ID, ACTOR);
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('уже занят') });
    expect(m.trash.deleteOne).not.toHaveBeenCalled();
    expect(m.recordAudit).not.toHaveBeenCalled();
  });

  it('keeps the item in the trash on any other failure, so the restore can be repeated', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    m.trash.findById.mockReturnValue(item('article', { article: { _id: ID, slug: 's' } }));
    m.article.collection.updateOne.mockRejectedValue(new Error('network'));
    expect(await restoreTrashItem(TRASH_ID, ACTOR)).toMatchObject({ ok: false });
    expect(m.trash.deleteOne).not.toHaveBeenCalled();
  });

  it('says so when the item is gone or the id is bad', async () => {
    m.trash.findById.mockReturnValue(chain(null));
    expect(await restoreTrashItem(TRASH_ID, ACTOR)).toMatchObject({ ok: false, error: expect.stringContaining('Записи уже нет') });
    expect(await restoreTrashItem('bad', ACTOR)).toMatchObject({ ok: false });
  });

  it('refuses an entity type it does not know', async () => {
    m.trash.findById.mockReturnValue(item('spaceship', {}));
    expect(await restoreTrashItem(TRASH_ID, ACTOR)).toMatchObject({ ok: false });
    expect(m.trash.deleteOne).not.toHaveBeenCalled();
  });
});

describe('purgeTrashItem', () => {
  it('erases the snapshot and logs it', async () => {
    m.trash.findById.mockReturnValue(chain({ _id: TRASH_ID, entityType: 'clinic', entityId: ID, label: 'Нур' }));
    expect(await purgeTrashItem(TRASH_ID, ACTOR)).toEqual({ ok: true });
    expect(m.trash.deleteOne).toHaveBeenCalledWith({ _id: TRASH_ID });
    expect(m.recordAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'trash.purged', entityType: 'clinic', entityLabel: 'Нур' }));
  });
  it('is a clear error for something that is not there', async () => {
    m.trash.findById.mockReturnValue(chain(null));
    expect(await purgeTrashItem(TRASH_ID, ACTOR)).toMatchObject({ ok: false });
    expect(m.recordAudit).not.toHaveBeenCalled();
  });
});

describe('who may use the trash', () => {
  const item = (deletedById: string) =>
    chain({ _id: TRASH_ID, entityType: 'article', entityId: ID, label: 'Статья', deletedById, payload: { article: { _id: ID, slug: 's' } } });

  it('a manager restores and erases what they deleted themselves', async () => {
    m.trash.findById.mockReturnValue(item('m1'));
    expect(await restoreTrashItem(TRASH_ID, MANAGER)).toEqual({ ok: true });
    m.trash.findById.mockReturnValue(item('m1'));
    expect(await purgeTrashItem(TRASH_ID, MANAGER)).toEqual({ ok: true });
  });

  it('a manager cannot touch what the administrator or another manager deleted', async () => {
    for (const deletedBy of ['admin1', 'm2', '']) {
      m.trash.findById.mockReturnValue(item(deletedBy));
      expect(await restoreTrashItem(TRASH_ID, MANAGER)).toMatchObject({ ok: false, error: expect.stringContaining('не ваша') });
      expect(await purgeTrashItem(TRASH_ID, MANAGER)).toMatchObject({ ok: false });
    }
    expect(m.article.collection.updateOne).not.toHaveBeenCalled();
    expect(m.trash.deleteOne).not.toHaveBeenCalled();
  });

  it('the administrator may use everything', async () => {
    m.trash.findById.mockReturnValue(item('m2'));
    expect(await restoreTrashItem(TRASH_ID, ACTOR)).toEqual({ ok: true });
  });

  it('anybody without a staff role may use nothing', async () => {
    m.trash.findById.mockReturnValue(item('someone'));
    expect(await restoreTrashItem(TRASH_ID, { userId: 'someone', email: 'x@x.tj' })).toMatchObject({ ok: false });
    expect(await restoreTrashItem(TRASH_ID, { userId: 'someone', email: 'x@x.tj', role: 'doctor' })).toMatchObject({ ok: false });
    expect(m.trash.deleteOne).not.toHaveBeenCalled();
  });
});
