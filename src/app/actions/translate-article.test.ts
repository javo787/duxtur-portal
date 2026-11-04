import { describe, it, expect, vi, beforeEach } from 'vitest';

const { actorMock, authMock, revalidatePath } = vi.hoisted(() => ({ actorMock: vi.fn(), authMock: vi.fn(), revalidatePath: vi.fn() }));
vi.mock('@/lib/article-access', () => ({ getArticleActor: actorMock }));
vi.mock('@/auth', () => ({ auth: authMock }));
vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: async () => ({ success: true }) }));
vi.mock('next/cache', () => ({ revalidatePath }));

type Doc = Record<string, unknown> & { _id: string; slug: string; authorId: string };
let articles: Doc[];
let updates: { filter: unknown; set: Record<string, unknown> }[];
const match = (d: Doc, f: Record<string, unknown>) => Object.entries(f).every(([k, v]) => d[k] === v);
const query = <T,>(value: T) => ({ select: () => query(value), sort: () => query(value), limit: () => query(value), lean: async () => value });

vi.mock('@/models/Article', () => ({
  default: {
    find: (f: Record<string, unknown>) => query(articles.filter(d => match(d, f))),
    findOne: (f: Record<string, unknown>) => query(articles.find(d => match(d, f)) ?? null),
    updateOne: async (filter: unknown, u: { $set: Record<string, unknown> }) => { updates.push({ filter, set: u.$set }); },
  },
}));
vi.mock('@/models/User', () => ({ default: { findOne: () => query({ _id: 'u-admin' }) } }));
vi.mock('@/models/Doctor', () => ({ default: { findOne: () => query({ _id: 'editorial' }) } }));

import { getArticleForTranslation, listMyArticlesForTranslation, saveArticleTranslation } from './translate-article';

beforeEach(() => {
  updates = [];
  articles = [
    { _id: 'a1', slug: 'ozempik-42100', authorId: 'editorial', isVerified: true, title: { ru: 'Оземпик' }, overview: { ru: 'Кратко' }, references: ['WHO - https://www.who.int/a/b'] },
    { _id: 'a2', slug: 'migren-1', authorId: 'doc1', isVerified: true, title: { ru: 'Мигрень', tg: 'Мигрен' }, overview: { ru: 'а', tg: 'б' }, references: [] },
  ];
  authMock.mockResolvedValue({ user: { email: 'a@b.c' } });
});

describe('translate-article', () => {
  it('the super admin sees the articles of the editorial byline', async () => {
    actorMock.mockResolvedValue({ kind: 'admin' });
    const res = await listMyArticlesForTranslation();
    expect(res).toEqual({ success: true, articles: [{ slug: 'ozempik-42100', title: 'Оземпик', languages: ['ru'] }] });
  });

  it('a doctor sees only their own articles and cannot load somebody else\'s', async () => {
    actorMock.mockResolvedValue({ kind: 'doctor', doctorId: 'doc1' });
    const list = await listMyArticlesForTranslation();
    expect(list.success && list.articles.map(a => a.slug)).toEqual(['migren-1']);
    expect(await getArticleForTranslation('ozempik-42100', 'ru')).toEqual({ success: false, error: 'Статья не найдена' });
    expect(await saveArticleTranslation('ozempik-42100', 'tg', { title: 'Т' })).toEqual({ success: false, error: 'Статья не найдена' });
    expect(updates).toHaveLength(0);
  });

  it('loads the text of the chosen language', async () => {
    actorMock.mockResolvedValue({ kind: 'admin' });
    const res = await getArticleForTranslation('ozempik-42100', 'ru');
    expect(res.success && res.text).toContain('# Оземпик');
    expect(await getArticleForTranslation('ozempik-42100', 'tg')).toEqual({ success: false, error: 'У статьи нет этой языковой версии' });
  });

  it('saves the translation into the same article; the admin keeps the verification, a doctor goes to moderation', async () => {
    actorMock.mockResolvedValue({ kind: 'admin' });
    const res = await saveArticleTranslation('ozempik-42100', 'tg', { title: 'Оземпик дар Тоҷикистон', overview: 'Мухтасар' });
    expect(res).toEqual({ success: true, slug: 'ozempik-42100', language: 'tg', moderated: false });
    expect(updates[0].filter).toEqual({ _id: 'a1' });
    expect(updates[0].set).toMatchObject({ 'title.tg': 'Оземпик дар Тоҷикистон', 'overview.tg': 'Мухтасар', isVerified: true });

    actorMock.mockResolvedValue({ kind: 'doctor', doctorId: 'doc1' });
    const doc = await saveArticleTranslation('migren-1', 'uz', { title: 'Migren' });
    expect(doc).toMatchObject({ success: true, moderated: true });
    expect(updates[1].set).toMatchObject({ 'title.uz': 'Migren', isVerified: false });
  });

  it('rejects an unknown language and an empty title', async () => {
    actorMock.mockResolvedValue({ kind: 'admin' });
    expect(await saveArticleTranslation('ozempik-42100', 'fr', { title: 'x' })).toMatchObject({ success: false });
    expect(await saveArticleTranslation('ozempik-42100', 'tg', { title: ' ' })).toMatchObject({ success: false });
  });
});
