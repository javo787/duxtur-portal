import { describe, expect, it } from 'vitest';
import {
  articleLanguages,
  buildArticleAlternates,
  previewLanguages,
  resolveArticleLanguage,
  resolveListLanguage,
  resolvePreviewLanguage,
} from './article-lang';

const only = (lang: string, extra: Record<string, unknown> = {}) => ({
  title: { [lang]: 'Заголовок' },
  overview: { [lang]: 'Вступление' },
  section1_content: { [lang]: 'Текст раздела' },
  ...extra,
});

describe('articleLanguages', () => {
  it('lists the languages that have title, overview and a section', () => {
    const a = { ...only('tg'), title: { tg: 'a', ru: 'b' }, overview: { tg: 'a', ru: 'b' } };
    expect(articleLanguages(a)).toEqual(['tg']); // ru has no section text
  });

  it('does not count a title translated on its own', () => {
    const a = { ...only('tg'), title: { tg: 'сарлавҳа', ru: 'Заголовок' } };
    expect(articleLanguages(a)).toEqual(['tg']);
  });

  it('counts legacy sections too', () => {
    const a = { title: { uz: 't' }, overview: { uz: 'o' }, causes: { uz: 'c' } };
    expect(articleLanguages(a)).toEqual(['uz']);
  });

  it('falls back to title + overview for a short article without sections', () => {
    const a = { title: { ru: 't' }, overview: { ru: 'o' } };
    expect(articleLanguages(a)).toEqual(['ru']);
  });

  it('ignores blank strings', () => {
    expect(articleLanguages({ title: { ru: '  ' }, overview: { ru: 'o' }, section1_content: { ru: 'x' } })).toEqual([]);
  });
});

describe('resolveArticleLanguage', () => {
  it('keeps the requested language when the article has it', () => {
    const a = { ...only('ru'), title: { ru: 'a', tg: 'b' }, overview: { ru: 'a', tg: 'b' }, section1_content: { ru: 'a', tg: 'b' } };
    expect(resolveArticleLanguage(a, 'tg')).toMatchObject({ contentLang: 'tg', isFallback: false });
  });

  it('shows a Tajik-only article on /ru in Tajik and flags it', () => {
    expect(resolveArticleLanguage(only('tg'), 'ru')).toMatchObject({ contentLang: 'tg', isFallback: true, available: ['tg'] });
  });

  it('prefers Russian when the requested language is missing', () => {
    const a = { ...only('ru'), title: { ru: 'a', uz: 'b' }, overview: { ru: 'a', uz: 'b' }, section1_content: { ru: 'a', uz: 'b' } };
    expect(resolveArticleLanguage(a, 'tg')).toMatchObject({ contentLang: 'ru', isFallback: true });
  });

  it('takes the next language in a fixed order when Russian is missing too', () => {
    const a = { title: { kk: 't', uz: 't' }, overview: { kk: 'o', uz: 'o' }, section1_content: { kk: 's', uz: 's' } };
    expect(resolveArticleLanguage(a, 'ru').contentLang).toBe('uz'); // order: ru, tg, uz, kk, ky
  });

  it('treats an unknown language as Russian', () => {
    expect(resolveArticleLanguage(only('ru'), 'xx')).toMatchObject({ contentLang: 'ru', isFallback: false });
  });

  it('keeps the request, with no fallback, for an article without any text', () => {
    expect(resolveArticleLanguage({}, 'tg')).toMatchObject({ contentLang: 'tg', isFallback: false, available: [] });
  });
});

describe('preview (lists and related articles)', () => {
  it('needs only title and overview', () => {
    const a = { title: { tg: 't' }, overview: { tg: 'o' } };
    expect(previewLanguages(a)).toEqual(['tg']);
    expect(resolvePreviewLanguage(a, 'ru')).toMatchObject({ contentLang: 'tg', isFallback: true });
  });
});

describe('resolveListLanguage', () => {
  it('lists an article that has only a title, in the language of that title', () => {
    expect(resolveListLanguage({ title: { tg: 't' } }, 'ru')).toMatchObject({ contentLang: 'tg', isFallback: true });
  });

  it('behaves like the preview when title and overview exist', () => {
    expect(resolveListLanguage({ title: { ru: 't' }, overview: { ru: 'o' } }, 'ru')).toMatchObject({ contentLang: 'ru', isFallback: false });
  });
});

describe('buildArticleAlternates', () => {
  it('lists only available languages, canonical on the real version', () => {
    expect(buildArticleAlternates('https://x.org', 'a', ['tg'], 'tg')).toEqual({
      canonical: 'https://x.org/tg/blog/a',
      languages: { tg: 'https://x.org/tg/blog/a', 'x-default': 'https://x.org/tg/blog/a' },
    });
  });

  it('points x-default at Russian when it exists', () => {
    const r = buildArticleAlternates('https://x.org', 'a', ['ru', 'tg'], 'ru');
    expect(r.languages['x-default']).toBe('https://x.org/ru/blog/a');
    expect(Object.keys(r.languages)).toEqual(['ru', 'tg', 'x-default']);
  });
});
