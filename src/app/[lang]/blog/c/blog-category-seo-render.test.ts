import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Renders the real category page (data mocked): an empty category is noindex, one with an article is indexable,
// and the breadcrumb (visible and JSON-LD) is in the page language, never the English "Blog".
const { state } = vi.hoisted(() => ({ state: { articles: [] as unknown[] } }));

const query = () => {
  const q: any = { populate: () => q, select: () => q, limit: () => q, sort: () => q, lean: async () => state.articles };
  return q;
};

vi.mock('next/image', () => ({ default: () => null }));
vi.mock('@/components/FadeIn', () => ({ default: ({ children }: { children: unknown }) => children }));
vi.mock('@/lib/mongodb', () => ({ default: async () => undefined }));
vi.mock('@/models/Doctor', () => ({ default: {} }));
vi.mock('@/models/Article', () => ({ default: { find: () => query() } }));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

import CategoryPage, { generateMetadata, revalidate } from './[category]/page';

const params = (lang: string, category = 'cardiology') => ({ params: Promise.resolve({ lang, category }) });
const html = async (lang: string) => renderToStaticMarkup((await CategoryPage(params(lang))) as ReactElement);
const article = {
  _id: 'a1',
  slug: 'gipertoniya-28002',
  category: 'cardiology',
  createdAt: new Date('2026-10-01T00:00:00Z'),
  title: { tg: 'Гипертония дар ҳомиладорӣ' },
  overview: { tg: 'Матн.' },
};

beforeEach(() => {
  state.articles = [];
});

describe('category metadata', () => {
  it('keeps an empty category out of the index, with a canonical and no hreflang', async () => {
    const meta: any = await generateMetadata(params('ru'));
    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(meta.alternates).toEqual({ canonical: 'https://www.duxtur.org/ru/blog/c/cardiology' });
  });

  it('indexes a category as soon as it lists an article (also one shown in another language)', async () => {
    state.articles = [article];
    const meta: any = await generateMetadata(params('ru'));
    expect(meta.robots).toBeUndefined();
    expect(meta.alternates.languages.tg).toBe('https://www.duxtur.org/tg/blog/c/cardiology');
  });

  it('a title-less article does not count', async () => {
    state.articles = [{ ...article, title: { tg: '  ' } }];
    expect(((await generateMetadata(params('ru'))) as any).robots).toEqual({ index: false, follow: true });
  });

  it('is rebuilt periodically, so the noindex goes away without a deploy', () => {
    expect(revalidate).toBeGreaterThan(0);
  });
});

describe('category breadcrumb', () => {
  it.each([
    ['ru', 'Главная', 'Статьи'],
    ['tg', 'Асосӣ', 'Мақолаҳо'],
  ])('is in the page language (%s), visible and in JSON-LD', async (lang, home, articles) => {
    const markup = await html(lang);
    expect(markup).not.toMatch(/>Blog</);
    expect(markup).toContain('aria-label="Breadcrumb"');
    const ld = JSON.parse(markup.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
    const items = ld.breadcrumb.itemListElement;
    expect(items.map((i: any) => i.name)).toEqual([home, articles, expect.any(String)]);
    expect(items.map((i: any) => i.item)).toEqual([
      `https://www.duxtur.org/${lang}`,
      `https://www.duxtur.org/${lang}/blog`,
      `https://www.duxtur.org/${lang}/blog/c/cardiology`,
    ]);
    expect(ld.breadcrumb['@context']).toBeUndefined();
    expect(markup).toContain(`>${home}</a>`);
    expect(markup).toContain(`>${articles}</a>`);
  });
});
