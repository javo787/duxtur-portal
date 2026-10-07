import { describe, it, expect, vi, beforeEach } from 'vitest';

const { authMock, publishArticle } = vi.hoisted(() => ({ authMock: vi.fn(), publishArticle: vi.fn() }));
vi.mock('@/auth', () => ({ auth: authMock }));
vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('@/lib/author-articles', () => ({ publishArticle }));

interface Draft { _id: { toString(): string }; userId: string; language: string; title: string; data: unknown }
let user: Record<string, unknown> | null;
let doctor: Record<string, unknown> | null;
let drafts: Draft[];
let nextId: number;

vi.mock('@/models/User', () => ({ default: { findOne: async () => user } }));
vi.mock('@/models/Doctor', () => ({ default: { findOne: async () => doctor } }));
vi.mock('@/models/ArticleDraft', () => ({
  default: {
    countDocuments: async (f: { userId: string }) => drafts.filter(d => d.userId === f.userId).length,
    create: async (d: Omit<Draft, '_id'>) => {
      const id = `d${nextId++}`;
      const doc = { ...d, _id: { toString: () => id } };
      drafts.push(doc);
      return doc;
    },
    findOneAndUpdate: async (f: { _id: string; userId: string }, u: { $set: Partial<Draft> }) => {
      const doc = drafts.find(d => d._id.toString() === f._id && d.userId === f.userId);
      if (!doc) return null;
      Object.assign(doc, u.$set);
      return doc;
    },
    deleteOne: async (f: { _id: string; userId: string }) => {
      const i = drafts.findIndex(d => d._id.toString() === f._id && d.userId === f.userId);
      if (i >= 0) drafts.splice(i, 1);
      return { deletedCount: i >= 0 ? 1 : 0 };
    },
  },
}));

import { saveArticle } from './save-article';

const article = { title: 'Мигрень', overview: 'Кратко', section1_title: 'a', section1_content: 'b' };

beforeEach(() => {
  vi.clearAllMocks();
  drafts = [];
  nextId = 1;
  user = { _id: 'u1', email: 'a@x.tj', role: 'patient', name: 'Alisher Karimov' };
  doctor = null;
  authMock.mockResolvedValue({ user: { email: 'a@x.tj' } });
  publishArticle.mockResolvedValue('migren-12345');
});

describe('saveArticle', () => {
  it('needs a signed-in person', async () => {
    authMock.mockResolvedValue(null);
    expect(await saveArticle(article, 'ru')).toEqual({ success: false, error: 'Необходима авторизация' });
  });

  it('publishes at once for an approved doctor and removes the draft it came from', async () => {
    user = { ...user!, role: 'doctor' };
    doctor = { _id: 'doc1', status: 'approved' };
    drafts.push({ _id: { toString: () => 'old' }, userId: 'u1', language: 'ru', title: 't', data: {} });
    expect(await saveArticle(article, 'ru', 'old')).toEqual({ success: true, outcome: 'published', slug: 'migren-12345' });
    expect(publishArticle).toHaveBeenCalledWith(article, 'ru', 'doc1');
    expect(drafts).toHaveLength(0);
  });

  it('keeps a draft and says what is missing for a new account', async () => {
    const res = await saveArticle(article, 'ru');
    expect(res).toEqual({ success: true, outcome: 'draft', draftId: 'd1', missing: ['specialty', 'phone', 'documentImage'] });
    expect(publishArticle).not.toHaveBeenCalled();
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({ userId: 'u1', language: 'ru', title: 'Мигрень' });
  });

  it('keeps the draft as "awaiting" when the profile is complete and only the team\'s check is left', async () => {
    doctor = { _id: 'doc1', status: 'pending', name: 'Alisher Karimov', phone: '+992900112233', specialty: { ru: 'Кардиолог' }, documentImage: 'https://res.cloudinary.com/x' };
    const res = await saveArticle(article, 'ru');
    expect(res).toEqual({ success: true, outcome: 'awaiting', draftId: 'd1', missing: [] });
    expect(publishArticle).not.toHaveBeenCalled();
  });

  it('updates the draft it came from instead of making a second one', async () => {
    const first = await saveArticle(article, 'ru');
    const draftId = first.success && first.outcome !== 'published' ? first.draftId : '';
    await saveArticle({ ...article, title: 'Мигрень 2' }, 'ru', draftId);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].title).toBe('Мигрень 2');
  });

  it("does not touch somebody else's draft: a foreign draft id makes a new draft", async () => {
    drafts.push({ _id: { toString: () => 'theirs' }, userId: 'other', language: 'ru', title: 'чужой', data: {} });
    await saveArticle(article, 'ru', 'theirs');
    expect(drafts).toHaveLength(2);
    expect(drafts.find(d => d._id.toString() === 'theirs')?.title).toBe('чужой');
  });

  it('refuses a rejected or banned doctor', async () => {
    doctor = { _id: 'doc1', status: 'banned' };
    const res = await saveArticle(article, 'ru');
    expect(res.success).toBe(false);
    expect(drafts).toHaveLength(0);
  });

  it('refuses administrators and clinics, which do not write articles', async () => {
    for (const role of ['portal_admin', 'clinic']) {
      user = { ...user!, role };
      expect((await saveArticle(article, 'ru')).success, role).toBe(false);
    }
  });

  it('refuses a language the portal does not have, and anything that is not an article object', async () => {
    expect((await saveArticle(article, 'fr')).success).toBe(false);
    expect((await saveArticle('text', 'ru')).success).toBe(false);
    expect((await saveArticle(null, 'ru')).success).toBe(false);
    expect((await saveArticle([1], 'ru')).success).toBe(false);
  });

  it('refuses a huge text and too many drafts', async () => {
    expect((await saveArticle({ ...article, section1_content: 'x'.repeat(400_000) }, 'ru')).success).toBe(false);
    for (let i = 0; i < 20; i++) drafts.push({ _id: { toString: () => `x${i}` }, userId: 'u1', language: 'ru', title: '', data: {} });
    const res = await saveArticle(article, 'ru');
    expect(res.success).toBe(false);
    expect(drafts).toHaveLength(20);
  });
});
