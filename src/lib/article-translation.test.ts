import { describe, expect, it } from 'vitest';
import { articleToSourceText, languagesOf, translationUpdate } from './article-translation';

const article = {
  title: { ru: 'Оземпик в Таджикистане', tg: '' },
  overview: { ru: 'Кратко о препарате.' },
  section1_title: { ru: 'Как работает' },
  section1_content: { ru: 'Снижает аппетит.' },
  section3_title: { ru: 'Риски' },
  section3_content: { ru: 'Тошнота.' },
  references: ['WHO - https://www.who.int/a/b'],
};

describe('languagesOf', () => {
  it('lists only languages with a title and some text', () => {
    expect(languagesOf(article)).toEqual(['ru']);
    expect(languagesOf({ ...article, title: { ru: 'X', tg: 'Т' }, overview: { ru: 'a', tg: 'б' } })).toEqual(['ru', 'tg']);
  });
});

describe('articleToSourceText', () => {
  it('builds plain text with headings, skipping empty sections, with sources at the end', () => {
    expect(articleToSourceText(article, 'ru')).toBe(
      '# Оземпик в Таджикистане\n\nКратко о препарате.\n\n## Как работает\n\nСнижает аппетит.\n\n## Риски\n\nТошнота.\n\n## Sources\n- WHO - https://www.who.int/a/b',
    );
  });
});

describe('translationUpdate', () => {
  it('sets every field of the language, empties missing sections, strips HTML and keeps shared sources', () => {
    const u = translationUpdate({ title: '<b>Оземпик</b>', overview: 'Мухтасар', section1_title: 'Чӣ тавр', section1_content: 'Матн', references: ['x - https://a.b/c'] }, 'tg', ['WHO - https://www.who.int/a/b']);
    expect(u['title.tg']).toBe('Оземпик');
    expect(u['section1_content.tg']).toBe('Матн');
    expect(u['section5_content.tg']).toBe('');
    expect(u.references).toBeUndefined();
    expect(Object.keys(u).some(k => k.endsWith('.ru'))).toBe(false);
  });

  it('fills sources only when the article has none, without home-page links', () => {
    const u = translationUpdate({ title: 'T', references: ['Lancet - https://www.thelancet.com', 'WHO - https://www.who.int/a/b'] }, 'tg', []);
    expect(u.references).toEqual(['WHO - https://www.who.int/a/b']);
  });
});
