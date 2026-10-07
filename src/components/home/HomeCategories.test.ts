import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import HomeCategories from './HomeCategories';

const render = (categoryCounts: Record<string, number>, lang = 'ru') =>
  renderToStaticMarkup(createElement(HomeCategories, { lang, dict: {}, categoryCounts }));
const hrefs = (html: string) => [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1].replace(/&amp;/g, '&'));

describe('HomeCategories', () => {
  it('links a topic that has a landing page to it, and any other topic to the filter (blogCategoryHref)', () => {
    const links = hrefs(render({ cardiology: 2, surgery: 1, pediatrics: 3 }));
    expect(links).toContain('/ru/blog/c/cardiology');
    expect(links).toContain('/ru/blog?category=surgery');
  });

  it('uses the reader language in the links', () => {
    expect(hrefs(render({ cardiology: 2, surgery: 1, pediatrics: 3 }, 'tg'))).toContain('/tg/blog/c/cardiology');
  });

  it('shows only topics that have articles, each with its own count', () => {
    const html = render({ cardiology: 2, surgery: 1, pediatrics: 3, neurology: 0 });
    expect(html).not.toContain('neurology');
    expect(html).not.toContain('Неврология'); // no link to an empty page
    expect(html).toContain('Кардиология');
    expect(html).toMatch(/Кардиология[\s\S]*?>2</);
  });

  it('renders nothing while there are fewer than three topics (a block with one chip looks like a mistake)', () => {
    expect(render({ cardiology: 2, surgery: 1 })).toBe('');
    expect(render({})).toBe('');
  });
});
