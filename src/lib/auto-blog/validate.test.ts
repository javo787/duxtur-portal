import { describe, expect, it } from 'vitest';
import { makeArticle } from './test-fixtures';
import { sanitizeText, toLocalized, validateLocalized } from './validate';
import { LANGS, type Lang } from './types';

describe('validateLocalized', () => {
  it.each(LANGS as readonly Lang[])('accepts a well-formed %s article', (lang) => {
    const ru = makeArticle('ru');
    expect(validateLocalized(lang, makeArticle(lang), lang === 'ru' ? undefined : ru)).toEqual([]);
  });

  it('rejects the wrong number of sections', () => {
    const a = makeArticle('ru');
    a.sections = a.sections.slice(0, 4);
    expect(validateLocalized('ru', a).join()).toMatch(/4 sections/);
  });

  it('rejects short and truncated sections', () => {
    const a = makeArticle('ru');
    a.sections[2].content = 'Слишком коротко.';
    expect(validateLocalized('ru', a).join()).toMatch(/section 3: body too short/);
  });

  it('rejects HTML, links and markdown headings', () => {
    const a = makeArticle('ru');
    a.sections[0].content += '\n<script>alert(1)</script>';
    a.sections[1].content += '\nСмотрите https://example.com/buy';
    a.sections[2].content += '\n## Заголовок внутри текста';
    const errors = validateLocalized('ru', a).join();
    expect(errors).toMatch(/HTML/);
    expect(errors).toMatch(/link/);
    expect(errors).toMatch(/headings/);
  });

  it.each(['Принимайте 500 мг дважды в день', 'Take 5 mg daily', 'витамин D 1000 МЕ', 'доза 2,5 мкг'])('rejects a drug dose: %s', (dose) => {
    const a = makeArticle('ru');
    a.sections[3].content += ` ${dose}.`;
    expect(validateLocalized('ru', a).join()).toMatch(/dose/);
  });

  it('does not mistake ordinary numbers and words for a dose', () => {
    const a = makeArticle('ru');
    a.sections[3].content += ' Двигайтесь 30 минут в день, давление 140 мм рт. ст., вес 70 кг, мгновенно не проходит.';
    expect(validateLocalized('ru', a)).toEqual([]);
  });

  it('requires Latin script for Uzbek', () => {
    const errors = validateLocalized('uz', makeArticle('ru'), makeArticle('ru')).join();
    expect(errors).toMatch(/Uzbek must be Latin/);
  });

  it('rejects Persian/Arabic script for Tajik', () => {
    const a = makeArticle('tg');
    a.sections[0].content += ' فشار خون بالا';
    expect(validateLocalized('tg', a, makeArticle('ru')).join()).toMatch(/Arabic/);
  });

  it.each(['tg', 'kk', 'ky'] as const)('catches Russian passed off as %s', (lang) => {
    const russianAsLang = makeArticle('ru', { title: 'Высокое давление: другой заголовок для проверки' });
    expect(validateLocalized(lang, russianAsLang, makeArticle('ru')).join()).toMatch(/language-specific letters/);
  });

  it('catches an untranslated title and a wildly different length', () => {
    const ru = makeArticle('ru');
    const a = makeArticle('kk', { title: ru.title });
    expect(validateLocalized('kk', a, ru).join()).toMatch(/title was not translated/);

    const tiny = makeArticle('kk');
    tiny.sections = tiny.sections.map((s) => ({ ...s, content: s.content.slice(0, 260) }));
    const huge = makeArticle('ru');
    huge.sections = huge.sections.map((s) => ({ ...s, content: s.content.repeat(5).slice(0, 4400) }));
    expect(validateLocalized('kk', tiny, huge).join()).toMatch(/length ratio/);
  });
});

describe('sanitizeText / toLocalized', () => {
  it('strips tags and turns headings into bold lines', () => {
    expect(sanitizeText('Привет <b>мир</b>\r\n## Раздел\n\n\n\nТекст')).toBe('Привет мир\n**Раздел**\n\nТекст');
  });

  it('builds an article from a loose object and rejects bad shapes', () => {
    const ok = toLocalized({ title: '## Заголовок', overview: 'О', sections: [{ title: '**Раздел**', content: 'Текст <i>тут</i>' }] });
    expect(ok).toEqual({ title: 'Заголовок', overview: 'О', sections: [{ title: 'Раздел', content: 'Текст тут' }] });
    expect(toLocalized(null)).toBeNull();
    expect(toLocalized({ title: 'x', overview: 'y' })).toBeNull();
    expect(toLocalized({ title: 'x', overview: 'y', sections: [{ title: 1, content: 'z' }] })).toBeNull();
  });
});
