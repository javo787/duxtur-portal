import { describe, it, expect, vi, beforeEach } from 'vitest';

const { authMock, notifyAdmin, translate, publishDraftsOf } = vi.hoisted(() => ({
  authMock: vi.fn(),
  notifyAdmin: vi.fn(),
  translate: vi.fn(),
  publishDraftsOf: vi.fn(),
}));
vi.mock('@/auth', () => ({ auth: authMock }));
vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('@/lib/telegram', () => ({ notifyAdminNewDoctor: notifyAdmin }));
vi.mock('@/lib/translation-service', () => ({ translateText: translate }));
vi.mock('@/lib/author-articles', () => ({ publishDraftsOf }));
// after() runs its callback right away here, so the test can look at what it did
vi.mock('next/server', () => ({ after: (fn: () => Promise<void>) => void fn() }));

interface Draft { _id: { toString(): string }; userId: string; language: string; title?: string; updatedAt?: Date; data: Record<string, unknown> }
let user: Record<string, unknown> | null;
let doctor: Record<string, unknown> | null;
let drafts: Draft[];
const userUpdates: Record<string, unknown>[] = [];
const doctorUpdates: Record<string, unknown>[] = [];
const createdDoctors: Record<string, unknown>[] = [];

vi.mock('@/models/User', () => ({
  default: {
    findOne: async () => user,
    updateOne: async (_f: unknown, u: Record<string, unknown>) => void userUpdates.push(u),
  },
}));
vi.mock('@/models/Doctor', () => ({
  default: {
    findOne: async () => doctor,
    updateOne: async (_f: unknown, u: Record<string, unknown>) => void doctorUpdates.push(u),
    create: async (d: Record<string, unknown>) => {
      createdDoctors.push(d);
      return { ...d, _id: 'new-doctor' };
    },
  },
}));
vi.mock('@/models/ArticleDraft', () => ({
  default: {
    find: () => ({ sort: () => ({ select: () => ({ lean: async () => drafts }) }) }),
    findOne: (f: { _id: string; userId: string }) => ({
      lean: async () => drafts.find(d => d._id.toString() === f._id && d.userId === f.userId) ?? null,
    }),
    deleteOne: async (f: { _id: string; userId: string }) => {
      const i = drafts.findIndex(d => d._id.toString() === f._id && d.userId === f.userId);
      if (i >= 0) drafts.splice(i, 1);
      return { deletedCount: i >= 0 ? 1 : 0 };
    },
  },
}));

import { completeAuthorProfile, deleteAuthorDraft, getAuthorDraft, getStudioState, publishMyDrafts } from './author';

const DIPLOMA = 'https://res.cloudinary.com/dprydst2c/image/upload/v1/diplomas/d.jpg';
const full = { name: 'Alisher Karimov', specialty: 'Кардиолог', phone: '+992 900 11 22 33', documentImageUrl: DIPLOMA };
const draft = (id: string, userId = 'u1'): Draft => ({ _id: { toString: () => id }, userId, language: 'ru', title: `T${id}`, updatedAt: new Date('2026-10-01T10:00:00Z'), data: { title: `T${id}` } });

beforeEach(() => {
  vi.clearAllMocks();
  userUpdates.length = doctorUpdates.length = createdDoctors.length = 0;
  drafts = [];
  user = { _id: 'u1', email: 'a@x.tj', role: 'patient', name: 'Ali', image: '' };
  doctor = null;
  authMock.mockResolvedValue({ user: { email: 'a@x.tj' } });
  translate.mockResolvedValue({ ru: 'Кардиолог', uz: 'Kardiolog', kk: 'k', ky: 'k', tg: 'Табиби дил', didFallback: false });
});

describe('getStudioState', () => {
  it('is signed out without a session', async () => {
    authMock.mockResolvedValue(null);
    expect(await getStudioState()).toMatchObject({ signedIn: false, drafts: [] });
  });

  it('describes a new account with its drafts', async () => {
    drafts = [draft('a'), draft('b')];
    const state = await getStudioState();
    expect(state).toMatchObject({ signedIn: true, role: 'patient', standing: 'new' });
    expect(state.missing).toEqual(['name', 'specialty', 'phone', 'documentImage']);
    expect(state.drafts).toEqual([
      { id: 'a', title: 'Ta', language: 'ru', updatedAt: '2026-10-01T10:00:00.000Z' },
      { id: 'b', title: 'Tb', language: 'ru', updatedAt: '2026-10-01T10:00:00.000Z' },
    ]);
  });

  it('reports the role from the database, so a freshly approved doctor is noticed', async () => {
    user = { ...user!, role: 'doctor', name: 'Alisher Karimov' };
    doctor = { status: 'approved' };
    expect(await getStudioState()).toMatchObject({ role: 'doctor', standing: 'approved', missing: [] });
  });
});

describe('completeAuthorProfile', () => {
  it('creates a pending doctor profile from the four facts, tells the team, and uses the name as the byline', async () => {
    expect(await completeAuthorProfile(full)).toEqual({ success: true, standing: 'pending' });
    expect(createdDoctors).toHaveLength(1);
    expect(createdDoctors[0]).toMatchObject({
      userId: 'u1', name: 'Alisher Karimov', phone: '+992 900 11 22 33', specialty: { ru: 'Кардиолог' },
      documentImage: DIPLOMA, status: 'pending',
    });
    expect(notifyAdmin).toHaveBeenCalledWith('Alisher Karimov', '+992 900 11 22 33', 'Кардиолог', DIPLOMA);
    expect(userUpdates).toEqual([{ $set: { name: 'Alisher Karimov' } }]);
  });

  it('translates the specialty in the background', async () => {
    await completeAuthorProfile(full);
    await Promise.resolve();
    expect(translate).toHaveBeenCalledWith('Кардиолог');
    const translated = doctorUpdates.find(u => (u as { $set?: { specialty?: unknown } }).$set?.specialty);
    expect(translated).toEqual({ $set: { specialty: { ru: 'Кардиолог', uz: 'Kardiolog', kk: 'k', ky: 'k', tg: 'Табиби дил' } } });
  });

  it('asks for the first thing that is still missing instead of creating half a profile', async () => {
    expect(await completeAuthorProfile({ name: 'Alisher Karimov', specialty: 'Кардиолог', phone: '+992900112233' })).toMatchObject({
      success: false, field: 'documentImageUrl',
    });
    expect(createdDoctors).toHaveLength(0);
    expect(notifyAdmin).not.toHaveBeenCalled();
  });

  it('completes an existing pending profile with just the missing field', async () => {
    user = { ...user!, name: 'Alisher Karimov' };
    doctor = { _id: 'doc1', status: 'pending', name: 'Alisher Karimov', phone: '', specialty: { ru: 'Кардиолог' }, documentImage: DIPLOMA };
    expect(await completeAuthorProfile({ phone: '+992 900 11 22 33' })).toEqual({ success: true, standing: 'pending' });
    expect(doctorUpdates[0]).toEqual({ $set: { phone: '+992 900 11 22 33' } });
    expect(createdDoctors).toHaveLength(0);
    expect(notifyAdmin).not.toHaveBeenCalled();
  });

  it('checks each value: a one-word name, a bad phone, a diploma that is not an uploaded file', async () => {
    expect(await completeAuthorProfile({ ...full, name: 'Ali' })).toMatchObject({ success: false, field: 'name' });
    expect(await completeAuthorProfile({ ...full, phone: '12' })).toMatchObject({ success: false, field: 'phone' });
    expect(await completeAuthorProfile({ ...full, specialty: ' ' })).toMatchObject({ success: false, field: 'specialty' });
    expect(await completeAuthorProfile({ ...full, documentImageUrl: 'https://evil.example/d.jpg' })).toMatchObject({ success: false, field: 'documentImageUrl' });
    expect(createdDoctors).toHaveLength(0);
  });

  it('strips HTML from what is typed', async () => {
    await completeAuthorProfile({ ...full, specialty: '<script>x</script>Кардиолог' });
    expect(createdDoctors[0].specialty).toEqual({ ru: 'xКардиолог' });
  });

  it('needs a session, and is closed to approved, rejected and banned doctors, administrators and clinics', async () => {
    authMock.mockResolvedValue(null);
    expect(await completeAuthorProfile(full)).toMatchObject({ success: false });
    authMock.mockResolvedValue({ user: { email: 'a@x.tj' } });
    for (const status of ['approved', 'rejected', 'banned']) {
      doctor = { _id: 'd', status };
      expect((await completeAuthorProfile(full)).success, status).toBe(false);
    }
    doctor = null;
    for (const role of ['portal_admin', 'clinic']) {
      user = { ...user!, role };
      expect((await completeAuthorProfile(full)).success, role).toBe(false);
    }
    expect(createdDoctors).toHaveLength(0);
  });
});

describe('drafts', () => {
  it('opens only the drafts of the signed-in person', async () => {
    drafts = [draft('mine'), draft('theirs', 'other')];
    expect(await getAuthorDraft('mine')).toMatchObject({ success: true, language: 'ru' });
    expect(await getAuthorDraft('theirs')).toEqual({ success: false, error: 'Черновик не найден' });
  });

  it('deletes only their own drafts', async () => {
    drafts = [draft('mine'), draft('theirs', 'other')];
    expect(await deleteAuthorDraft('theirs')).toEqual({ success: false });
    expect(await deleteAuthorDraft('mine')).toEqual({ success: true });
    expect(drafts.map(d => d._id.toString())).toEqual(['theirs']);
  });

  it('publishes the drafts of an approved doctor only', async () => {
    publishDraftsOf.mockResolvedValue(['a', 'b']);
    doctor = { _id: 'doc1', status: 'pending' };
    expect((await publishMyDrafts()).success).toBe(false);
    expect(publishDraftsOf).not.toHaveBeenCalled();
    doctor = { _id: 'doc1', status: 'approved' };
    expect(await publishMyDrafts()).toEqual({ success: true, published: 2 });
    expect(publishDraftsOf).toHaveBeenCalledWith('u1', 'doc1');
  });
});
