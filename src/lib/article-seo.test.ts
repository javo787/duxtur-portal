import { describe, expect, it } from 'vitest';
import {
  articleMetaDescription,
  articleOgImage,
  articleSeoTitle,
  buildArticleJsonLd,
  markdownToPlainText,
  readingStats,
  referenceToCitation,
  type ArticleJsonLdInput,
} from './article-seo';

describe('markdownToPlainText', () => {
  it('drops markdown and HTML, keeps the words', () => {
    expect(markdownToPlainText('## Симптомы\n\n**Важно:** читайте [инструкцию](https://x.org) и *не* <b>ждите</b>.\n- один\n- два'))
      .toBe('Симптомы Важно: читайте инструкцию и не ждите . один два');
  });
  it('copes with empty input', () => {
    expect(markdownToPlainText(undefined)).toBe('');
  });
});

describe('articleMetaDescription', () => {
  const long =
    'Препараты группы GLP-1 (семаглутид, тирзепатид) стали самой обсуждаемой медицинской темой в мире. Однако для жителей Таджикистана, где почти половина взрослого населения имеет лишний вес, важно знать риски.';

  it('never cuts a word in half and stays within 160 characters', () => {
    const d = articleMetaDescription(long);
    expect(Array.from(d).length).toBeLessThanOrEqual(160);
    expect(d.endsWith('взрослого ')).toBe(false);
  });

  it('stops at the end of a sentence when one ends late enough', () => {
    expect(articleMetaDescription(long)).toBe('Препараты группы GLP-1 (семаглутид, тирзепатид) стали самой обсуждаемой медицинской темой в мире.');
  });

  it('cuts on a word with an ellipsis when there is no sentence end', () => {
    const d = articleMetaDescription('слово '.repeat(60));
    expect(d.endsWith('слово…')).toBe(true);
    expect(Array.from(d).length).toBeLessThanOrEqual(160);
  });

  it('leaves a short overview as it is, without markdown', () => {
    expect(articleMetaDescription('**Мигрень** — частая причина головной боли.')).toBe('Мигрень — частая причина головной боли.');
  });
});

describe('articleSeoTitle', () => {
  it('lets the layout add the brand to a short title', () => {
    expect(articleSeoTitle('Мигрень: что делать')).toBe('Мигрень: что делать');
  });
  it('drops the brand when the title is long', () => {
    expect(articleSeoTitle('Оземпик и GLP-1 в Таджикистане: польза, риски и защита от подделок')).toEqual({
      absolute: 'Оземпик и GLP-1 в Таджикистане: польза, риски и защита от подделок',
    });
  });
});

describe('readingStats', () => {
  it('counts the words of all parts, at least one minute', () => {
    expect(readingStats(['один два', undefined, '**три**'])).toEqual({ wordCount: 3, minutes: 1 });
    expect(readingStats(['слово '.repeat(401)]).minutes).toBe(3);
  });
});

describe('articleOgImage', () => {
  it('crops a Cloudinary image to 1200x630 JPEG', () => {
    const img = articleOgImage('https://res.cloudinary.com/x/image/upload/v1/a.jpg', { title: 'T', author: 'A', lang: 'ru' });
    expect(img).toEqual({
      url: 'https://res.cloudinary.com/x/image/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/v1/a.jpg',
      alt: 'T',
      width: 1200,
      height: 630,
    });
  });
  it('falls back to the generated card', () => {
    const img = articleOgImage(undefined, { title: 'Мигрень', author: '', lang: 'tg' });
    expect(img.url).toBe('https://www.duxtur.org/og?title=%D0%9C%D0%B8%D0%B3%D1%80%D0%B5%D0%BD%D1%8C&author=Duxtur&lang=tg');
  });
});

describe('referenceToCitation', () => {
  it('turns a reference with a link into a CreativeWork', () => {
    expect(referenceToCitation('ВОЗ — https://www.who.int/news.')).toEqual({ '@type': 'CreativeWork', name: 'ВОЗ', url: 'https://www.who.int/news' });
    expect(referenceToCitation('www.medlineplus.gov/x')).toEqual({ '@type': 'CreativeWork', url: 'https://www.medlineplus.gov/x' });
  });
  it('keeps a reference without a link as text', () => {
    expect(referenceToCitation('Клинические рекомендации МЗ РТ, 2024')).toBe('Клинические рекомендации МЗ РТ, 2024');
  });
});

describe('buildArticleJsonLd', () => {
  const base: ArticleJsonLdInput = {
    url: 'https://www.duxtur.org/ru/blog/migren-12345',
    lang: 'ru',
    title: 'Мигрень',
    description: 'Кратко.',
    image: { url: 'https://img/x.jpg', alt: 'Мигрень', width: 1200, height: 630 },
    datePublished: new Date('2026-01-01T00:00:00Z'),
    dateModified: new Date('2026-02-01T00:00:00Z'),
    lastReviewed: new Date('2026-03-01T00:00:00Z'),
    wordCount: 500,
    minutes: 3,
    section: 'Неврология',
    sectionUrl: 'https://www.duxtur.org/ru/blog/c/neurology',
    author: { kind: 'person', name: 'Др. Иванов', url: 'https://www.duxtur.org/ru/doctor/ivanov', jobTitle: 'Невролог' },
    reviewer: null,
    references: ['ВОЗ — https://www.who.int'],
    views: 10,
    sectionIds: ['section1'],
    breadcrumb: { home: 'Главная', blog: 'Статьи' },
  };

  it('has a breadcrumb whose last item is the article URL with its language', () => {
    const ld = buildArticleJsonLd(base) as any;
    const items = ld.breadcrumb.itemListElement;
    expect(items.map((i: any) => i.name)).toEqual(['Главная', 'Статьи', 'Неврология', 'Мигрень']);
    expect(items.at(-1).item).toBe(base.url);
    expect(items[1].item).toBe('https://www.duxtur.org/ru/blog');
    expect(ld.breadcrumb['@context']).toBeUndefined();
  });

  it('uses schema.org properties (lastReviewed, not dateReviewed) and the latest date as dateModified', () => {
    const ld = buildArticleJsonLd(base) as any;
    expect(ld.lastReviewed).toBe('2026-03-01T00:00:00.000Z');
    expect(ld.dateReviewed).toBeUndefined();
    expect(ld.dateModified).toBe('2026-03-01T00:00:00.000Z');
    expect(ld.mainEntityOfPage).toBe(base.url);
    expect(ld.articleSection).toBe('Неврология');
    expect(ld.citation).toEqual([{ '@type': 'CreativeWork', name: 'ВОЗ', url: 'https://www.who.int' }]);
    expect(ld.image).toEqual({ '@type': 'ImageObject', url: 'https://img/x.jpg', width: 1200, height: 630 });
  });

  it('credits the portal, never an invented person, when there is no author', () => {
    const ld = buildArticleJsonLd({ ...base, author: null, section: undefined, sectionUrl: undefined, references: [] }) as any;
    expect(ld.author['@type']).toBe('Organization');
    expect(ld.author.name).toBe('Duxtur.org');
    expect(ld.citation).toBeUndefined();
    expect(ld.breadcrumb.itemListElement).toHaveLength(3);
  });
});
