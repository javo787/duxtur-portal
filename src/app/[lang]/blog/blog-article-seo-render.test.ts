import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Renders the real article page (data and interactive children mocked) to prove the SEO pieces are wired:
// meta tags, the JSON-LD breadcrumb with the language in every URL, the visible breadcrumb and <time> tags.
const { state, nothing } = vi.hoisted(() => ({
  state: { article: null as unknown },
  nothing: () => ({ default: () => null }),
}));

const query = (value: () => unknown) => {
  const q: any = { populate: () => q, select: () => q, limit: () => q, sort: () => q, lean: async () => value() };
  return q;
};

vi.mock('next/font/google', () => ({ Source_Serif_4: () => ({ variable: 'font-var', className: 'font-cls' }) }));
vi.mock('next/image', () => ({ default: () => null }));
vi.mock('@/lib/mongodb', () => ({ default: async () => undefined }));
vi.mock('@/models/Article', () => ({
  default: { findOne: () => query(() => state.article), find: () => query(() => []) },
}));
vi.mock('@/lib/review-service', () => ({
  articleRatingSummary: async () => ({ avg: 0, count: 0 }),
  listPublicReviews: async () => [],
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));
vi.mock('@/components/ArticleEngagement', nothing);
vi.mock('@/components/ArticleShare', nothing);
vi.mock('@/components/reviews/ArticleReviews', nothing);
vi.mock('@/components/TableOfContents', nothing);
vi.mock('@/components/ViewCounter', nothing);
vi.mock('@/components/ArticleLanguageNotice', nothing);

import BlogPage, { generateMetadata } from './[slug]/page';

const html = (el: unknown) => renderToStaticMarkup(el as ReactElement);
const params = (lang: string) => ({ params: Promise.resolve({ slug: 'ozempik-42100', lang }) });

function jsonLd(markup: string): any {
  const m = markup.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  return JSON.parse(m![1]);
}

// A copy of the GLP-1 article on duxtur.org: long title, long overview cut mid-word before this change.
const article = (over: Record<string, unknown> = {}) => ({
  _id: 'a1',
  slug: 'ozempik-42100',
  category: 'cardiology',
  createdAt: new Date('2026-10-01T05:39:02Z'),
  updatedAt: new Date('2026-11-04T06:38:51Z'),
  image: 'https://res.cloudinary.com/dprydst2c/image/upload/v1793770739/clinics/r1gk8v87hjuhqmb0lmnt.jpg',
  authorId: { _id: 'd1', name: 'Редакция Duxtur', isEditorial: true },
  title: { ru: 'Оземпик и GLP-1 в Таджикистане: польза, риски и защита от подделок' },
  overview: {
    ru: '**Препараты группы GLP-1** (семаглутид, тирзепатид) стали самой обсуждаемой медицинской темой в мире. Однако для жителей Таджикистана, где почти половина взрослого населения имеет лишний вес, важно знать риски.',
  },
  section1_title: { ru: 'Как работают препараты' },
  section1_content: { ru: 'Текст раздела.' },
  references: ['ВОЗ — https://www.who.int/news'],
  views: 2,
  ...over,
});

beforeEach(() => {
  state.article = article();
});

describe('article metadata', () => {
  it('has a clean description, og:url, site name, 1200x630 image and a localized reading time', async () => {
    const meta: any = await generateMetadata(params('ru'));
    expect(meta.title).toEqual({ absolute: 'Оземпик и GLP-1 в Таджикистане: польза, риски и защита от подделок' });
    expect(meta.description).toBe('Препараты группы GLP-1 (семаглутид, тирзепатид) стали самой обсуждаемой медицинской темой в мире.');
    expect(meta.openGraph.url).toBe('https://www.duxtur.org/ru/blog/ozempik-42100');
    expect(meta.openGraph.siteName).toBe('Duxtur.org');
    expect(meta.openGraph.section).toBe('Кардиология');
    expect(meta.openGraph.alternateLocale).toEqual([]);
    expect(meta.openGraph.images[0]).toMatchObject({ width: 1200, height: 630, alt: meta.twitter.title });
    expect(meta.openGraph.images[0].url).toContain('/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/');
    expect(meta.other['twitter:label2']).toBe('Время чтения');
    expect(meta.other['twitter:data2']).toBe('1 мин чтения');
  });

  it('keeps the brand on a short title and noindexes a missing article', async () => {
    state.article = article({ title: { ru: 'Мигрень' } });
    expect((await generateMetadata(params('ru'))).title).toBe('Мигрень');
    state.article = null;
    expect((await generateMetadata(params('ru'))).robots).toEqual({ index: false, follow: false });
  });
});

describe('article page', () => {
  it('puts the language into every breadcrumb URL and links the category landing page', async () => {
    const markup = html(await BlogPage(params('ru')));
    const ld = jsonLd(markup);
    const crumbs = ld.breadcrumb.itemListElement;
    expect(crumbs.map((c: any) => c.item)).toEqual([
      'https://www.duxtur.org/ru',
      'https://www.duxtur.org/ru/blog',
      'https://www.duxtur.org/ru/blog/c/cardiology',
      'https://www.duxtur.org/ru/blog/ozempik-42100',
    ]);
    expect(crumbs[1].name).toBe('Статьи');
    expect(ld.author).toMatchObject({ '@type': 'Organization', url: 'https://www.duxtur.org/ru/editorial' });
    expect(markup).toContain('aria-label="Breadcrumb"');
    expect(markup).toContain('href="/ru/blog/c/cardiology"');
    expect(markup).toContain('<time dateTime="2026-10-01T05:39:02.000Z">');
    expect(markup).toContain('Обновлено');
  });

  it('links a category without a landing page to the filtered list, not to a 404', async () => {
    state.article = article({ category: 'gynecology' });
    const markup = html(await BlogPage(params('ru')));
    expect(markup).toContain('href="/ru/blog?category=gynecology"');
    expect(markup).not.toContain('/blog/c/gynecology');
  });
});
