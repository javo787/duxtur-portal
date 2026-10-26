import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  dbConnect: vi.fn(),
  doctor: { findById: vi.fn(), find: vi.fn() },
  clinic: { findById: vi.fn(), find: vi.fn() },
  article: { findById: vi.fn() },
  review: { findById: vi.fn() },
}));
vi.mock('@/lib/mongodb', () => ({ default: m.dbConnect }));
vi.mock('@/models/Doctor', () => ({ default: m.doctor }));
vi.mock('@/models/Clinic', () => ({ default: m.clinic }));
vi.mock('@/models/Article', () => ({ default: m.article }));
vi.mock('@/models/Review', () => ({ default: m.review }));

import { checkAccess, managedIds } from './admin-scope';

const ID = '507f1f77bcf86cd799439011';
const chain = (v: unknown): { select: () => unknown; lean: () => Promise<unknown> } => ({ select: () => chain(v), lean: async () => v });
const admin = { userId: 'a1', email: 'a@x.tj', role: 'portal_admin' as const };
const manager = { userId: 'm1', email: 'm@x.tj', role: 'portal_manager' as const };

beforeEach(() => {
  vi.clearAllMocks();
  for (const model of [m.doctor, m.clinic, m.article, m.review]) model.findById.mockReturnValue(chain(null));
});

describe('checkAccess', () => {
  it('lets the administrator through without reading the database', async () => {
    expect(await checkAccess(admin, 'delete', 'doctor', ID)).toEqual({ ok: true, record: {} });
    expect(m.dbConnect).not.toHaveBeenCalled();
  });

  it('refuses a malformed id for everybody', async () => {
    for (const who of [admin, manager]) {
      expect(await checkAccess(who, 'edit', 'doctor', '{"$ne":1}')).toEqual({ ok: false, error: 'Некорректный идентификатор' });
    }
  });

  it('a manager is let through to their own doctor or clinic and refused the rest', async () => {
    m.doctor.findById.mockReturnValue(chain({ managedBy: 'm1', status: 'approved' }));
    expect(await checkAccess(manager, 'delete', 'doctor', ID)).toMatchObject({ ok: true });
    m.doctor.findById.mockReturnValue(chain({ managedBy: 'm2', status: 'approved' }));
    expect(await checkAccess(manager, 'delete', 'doctor', ID)).toMatchObject({ ok: false, error: expect.stringContaining('не ваша') });
    m.clinic.findById.mockReturnValue(chain({ status: 'approved' }));
    expect(await checkAccess(manager, 'edit', 'clinic', ID)).toMatchObject({ ok: false });
  });

  it('a manager takes an untaken application, but cannot edit or delete it yet', async () => {
    m.clinic.findById.mockReturnValue(chain({ status: 'pending' }));
    expect(await checkAccess(manager, 'approve', 'clinic', ID)).toEqual({ ok: true, record: { status: 'pending' } });
    expect(await checkAccess(manager, 'reject', 'clinic', ID)).toMatchObject({ ok: true });
    expect(await checkAccess(manager, 'delete', 'clinic', ID)).toMatchObject({ ok: false });
    expect(await checkAccess(manager, 'edit', 'clinic', ID)).toMatchObject({ ok: false });
  });

  it('does not reveal anything about a record that does not exist', async () => {
    expect(await checkAccess(manager, 'edit', 'doctor', ID)).toEqual({ ok: false, error: 'Запись не найдена' });
  });

  it('an article belongs to whoever manages its author', async () => {
    m.article.findById.mockReturnValue(chain({ authorId: 'd1' }));
    m.doctor.findById.mockReturnValue(chain({ managedBy: 'm1' }));
    expect(await checkAccess(manager, 'delete', 'article', ID)).toMatchObject({ ok: true });
    m.doctor.findById.mockReturnValue(chain({ managedBy: 'm2' }));
    expect(await checkAccess(manager, 'delete', 'article', ID)).toMatchObject({ ok: false });
    m.doctor.findById.mockReturnValue(chain(null));
    expect(await checkAccess(manager, 'delete', 'article', ID)).toMatchObject({ ok: false });
  });

  it('an article cannot be taken from the queue: only its author\'s manager may approve it', async () => {
    m.article.findById.mockReturnValue(chain({ authorId: 'd1' }));
    m.doctor.findById.mockReturnValue(chain({ status: 'pending' }));
    expect(await checkAccess(manager, 'approve', 'article', ID)).toMatchObject({ ok: false });
  });

  it('a review belongs to whoever manages the doctor or the clinic it is about', async () => {
    m.review.findById.mockReturnValue(chain({ doctorId: 'd1', clinicId: 'c1' }));
    m.doctor.findById.mockReturnValue(chain({ managedBy: 'm2' }));
    m.clinic.findById.mockReturnValue(chain({ managedBy: 'm1' }));
    expect(await checkAccess(manager, 'edit', 'review', ID)).toMatchObject({ ok: true });
    m.clinic.findById.mockReturnValue(chain({ managedBy: 'm2' }));
    expect(await checkAccess(manager, 'edit', 'review', ID)).toMatchObject({ ok: false });
    m.review.findById.mockReturnValue(chain({ articleId: 'a1' }));
    expect(await checkAccess(manager, 'edit', 'review', ID)).toMatchObject({ ok: false });
  });
});

describe('managedIds', () => {
  it('lists the doctors and clinics of a manager', async () => {
    m.doctor.find.mockReturnValue(chain([{ _id: 'd1' }, { _id: 'd2' }]));
    m.clinic.find.mockReturnValue(chain([{ _id: 'c1' }]));
    expect(await managedIds(manager)).toEqual({ doctorIds: ['d1', 'd2'], clinicIds: ['c1'] });
    expect(m.doctor.find).toHaveBeenCalledWith({ managedBy: 'm1' });
    expect(m.clinic.find).toHaveBeenCalledWith({ managedBy: 'm1' });
  });
});
