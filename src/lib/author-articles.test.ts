import { describe, it, expect, vi, beforeEach } from 'vitest';

interface Draft { _id: string; userId: string; language: string; title?: string; data: Record<string, unknown> }
let drafts: Draft[];
let created: Record<string, unknown>[];
let failCreateFor: string | null;

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('@/models/Article', () => ({
  default: {
    create: async (doc: Record<string, unknown>) => {
      if (failCreateFor && (doc.title as Record<string, string>).ru === failCreateFor) throw new Error('db down');
      created.push(doc);
      return doc;
    },
  },
}));
vi.mock('@/models/ArticleDraft', () => ({
  default: {
    find: (f: { userId: string }) => ({
      sort: () => ({ select: () => ({ lean: async () => drafts.filter(d => d.userId === f.userId).map(d => ({ _id: d._id })) }) }),
    }),
    findOneAndDelete: (f: { _id: string }) => ({
      lean: async () => {
        const i = drafts.findIndex(d => d._id === f._id);
        return i === -1 ? null : drafts.splice(i, 1)[0];
      },
    }),
    create: async (d: Omit<Draft, '_id'>) => { drafts.push({ ...d, _id: `restored-${drafts.length}` }); },
  },
}));

import { articleSlug, buildArticleDoc, publishDraftsOf } from './author-articles';

beforeEach(() => {
  drafts = [];
  created = [];
  failCreateFor = null;
});

describe('articleSlug', () => {
  it('transliterates Cyrillic, drops punctuation and ends with five digits of the clock', () => {
    expect(articleSlug('Мигрень: что делать?', 1_700_000_012_345)).toBe('migren-chto-delat-12345');
    expect(articleSlug('Дарди сар', 1_700_000_000_001)).toBe('dardi-sar-00001');
  });

  it('copes with an empty title', () => {
    expect(articleSlug('', 1_700_000_000_007)).toBe('article-00007');
  });
});

describe('buildArticleDoc', () => {
  it('keeps one language, strips HTML, and starts unverified', () => {
    const doc = buildArticleDoc(
      { title: '<b>Мигрень</b>', overview: 'Кратко', section1_title: 'Причины', section1_content: '<p>Текст</p>', image: 'https://x/i.jpg', references: ['PubMed'], aiGenerated: false },
      'ru',
      'doctor-1'
    );
    expect(doc).toMatchObject({
      authorId: 'doctor-1',
      title: { ru: 'Мигрень' },
      overview: { ru: 'Кратко' },
      section1_title: { ru: 'Причины' },
      section1_content: { ru: 'Текст' },
      section5_content: { ru: '' },
      image: 'https://x/i.jpg',
      references: ['PubMed'],
      isVerified: false,
      aiGenerated: false,
    });
  });

  it('survives garbage from the browser', () => {
    const doc = buildArticleDoc({ title: 5, overview: null, references: 'nope' }, 'tg', 'd');
    expect(doc).toMatchObject({ title: { tg: '' }, overview: { tg: '' }, references: [], aiGenerated: true, image: '' });
  });
});

describe('publishDraftsOf', () => {
  const draft = (id: string, title: string): Draft => ({ _id: id, userId: 'u1', language: 'ru', title, data: { title, overview: 'o' } });

  it('publishes every draft of the person, oldest first, and empties their drafts', async () => {
    drafts = [draft('a', 'Первая'), draft('b', 'Вторая'), { ...draft('c', 'Чужая'), userId: 'u2' }];
    const slugs = await publishDraftsOf('u1', 'doctor-1');
    expect(slugs).toHaveLength(2);
    expect(created.map(c => (c.title as Record<string, string>).ru)).toEqual(['Первая', 'Вторая']);
    expect(created.every(c => c.authorId === 'doctor-1')).toBe(true);
    expect(drafts.map(d => d._id)).toEqual(['c']);
  });

  it('does nothing for a person without drafts', async () => {
    expect(await publishDraftsOf('nobody', 'd')).toEqual([]);
  });

  it('puts a draft back when it could not be published, so nothing is lost', async () => {
    drafts = [draft('a', 'Сломается')];
    failCreateFor = 'Сломается';
    await expect(publishDraftsOf('u1', 'doctor-1')).rejects.toThrow('db down');
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({ userId: 'u1', title: 'Сломается' });
  });
});
