import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import HomeHero from './HomeHero';

const render = (dict: Record<string, string>, lang = 'ru') => renderToStaticMarkup(createElement(HomeHero, { lang, dict }));

describe('HomeHero texts', () => {
  it('uses the content dictionary when it has the keys', () => {
    const html = render({ hero_badge: 'BADGE', hero_title: 'TITLE', hero_subtitle: 'SUBTITLE', hero_cta_read: 'READ' });
    for (const text of ['BADGE', 'TITLE', 'SUBTITLE', 'READ']) expect(html).toContain(text);
  });

  it('falls back to the interface dictionary, never to an empty paragraph', () => {
    const html = render({ hero_title: 'TITLE' });
    expect(html).toContain('Статьи от практикующих врачей'); // badge
    expect(html).toContain('Проверенная информация о симптомах'); // subtitle
    expect(html).toContain('Читать статьи'); // link
    expect(html).not.toMatch(/<p[^>]*>\s*<\/p>/);
  });

  it('has one search form pointing at the reader language', () => {
    const html = render({ hero_title: 'T' }, 'tg');
    expect(html).toContain('action="/tg/search"');
    expect(html.match(/role="search"/g)).toHaveLength(1);
  });
});
