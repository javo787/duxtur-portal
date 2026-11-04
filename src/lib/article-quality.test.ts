import { describe, expect, it } from 'vitest';
import { aiDataToCheckable, checkArticleQuality, extractUrls, isDeepLink, latinShare, sanitizeReferences } from './article-quality';

describe('isDeepLink', () => {
  it('accepts concrete pages and rejects bare home pages', () => {
    expect(isDeepLink('https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight')).toBe(true);
    expect(isDeepLink('https://doru.tj/product/96528032-ozempik-1mg-1')).toBe(true);
    expect(isDeepLink('https://www.thelancet.com')).toBe(false);
    expect(isDeepLink('https://pubmed.ncbi.nlm.nih.gov/')).toBe(false);
    expect(isDeepLink('not a url')).toBe(false);
  });
});

describe('extractUrls', () => {
  it('finds links and strips trailing punctuation', () => {
    expect(extractUrls('См. https://who.int/a/b. И www.moh.tj/x;')).toEqual(['https://who.int/a/b', 'https://www.moh.tj/x']);
  });
});

describe('sanitizeReferences', () => {
  it('drops home-page and placeholder references, keeps real ones and text-only ones', () => {
    const { references, dropped } = sanitizeReferences([
      'WHO: Obesity - https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
      'The Lancet: Once-Weekly Semaglutide - https://www.thelancet.com',
      'PubMed: GLP-1 - https://pubmed.ncbi.nlm.nih.gov/',
      'source1',
      'WHO: title - url',
      'Клинический протокол МЗ РТ, 2023',
    ]);
    expect(references).toEqual([
      'WHO: Obesity - https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
      'Клинический протокол МЗ РТ, 2023',
    ]);
    expect(dropped).toHaveLength(4);
  });

  it('puts back the links of the author that the model left out, without duplicates', () => {
    const source = 'Нарх: https://doru.tj/product/96528032-ozempik-1mg-1 ва https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight';
    const { references } = sanitizeReferences(['WHO - https://who.int/news-room/fact-sheets/detail/obesity-and-overweight/'], source);
    expect(references).toEqual([
      'WHO - https://who.int/news-room/fact-sheets/detail/obesity-and-overweight/',
      'https://doru.tj/product/96528032-ozempik-1mg-1',
    ]);
  });
});

const tajikBody = Array(8).fill('Доруҳои GLP-1 иштиҳоро паст мекунанд ва ба ғадуди зери меъда кӯмак мекунанд. '.repeat(5)).join('\n\n');
const good = {
  title: 'Оземпик: манфиат ва хавфҳо',
  overview: 'Дар Тоҷикистон ҳар дуюм калонсол вазни зиёдатӣ дорад. Ин мақола мефаҳмонад, ки доруҳои GLP-1 чӣ гуна кор мекунанд ва кай хатарноканд.',
  sections: [
    { title: 'Чӣ гуна амал мекунад', content: tajikBody },
    { title: 'Хавфҳо', content: tajikBody },
    { title: 'Тавсияҳо', content: '1. Бо духтур машварат кунед.' },
  ],
  references: ['WHO - https://www.who.int/a/b', 'Доруи Ман - https://doru.tj/product/1'],
};

describe('checkArticleQuality', () => {
  it('passes a complete Tajik article', () => {
    const report = checkArticleQuality(good, 'tg');
    expect(report.issues).toEqual([]);
    expect(report.score).toBe(100);
  });

  it('catches Russian text in a Tajik article and Arabic script', () => {
    const ru = { ...good, sections: good.sections.map(s => ({ ...s, content: Array(8).fill('Препарат снижает аппетит и помогает поджелудочной железе. '.repeat(5)).join('\n\n') })), title: 'Оземпик', overview: 'Короткое описание статьи о препарате для пациентов в стране и регионе сегодня.' };
    expect(checkArticleQuality(ru, 'tg').issues.map(i => i.code)).toContain('not_tajik');
    const fa = { ...good, overview: good.overview + ' داروهای' };
    expect(checkArticleQuality(fa, 'tg').issues.map(i => i.code)).toContain('arabic_script');
  });

  it('warns about a missing practical section, weak sources and hype', () => {
    const weak = {
      ...good,
      sections: good.sections.slice(0, 2).map(s => ({ ...s, content: s.content + ' Натиҷа 100% кафолат дода мешавад.' })),
      references: ['The Lancet - https://www.thelancet.com'],
    };
    const codes = checkArticleQuality(weak, 'tg').issues.map(i => i.code);
    expect(codes).toEqual(expect.arrayContaining(['few_sections', 'no_practical', 'weak_sources', 'hype']));
  });

  it('warns when the AI lost most of the author text and its numbers', () => {
    const source = 'Вазни зиёдатӣ 50,8% ва фарбеҳӣ 16,9%, диабет 12,6% ва 13,0%. '.repeat(10) + 'калима '.repeat(4000);
    const codes = checkArticleQuality(good, 'tg', source, 'write').issues.map(i => i.code);
    expect(codes).toEqual(expect.arrayContaining(['content_lost', 'numbers_lost']));
  });

  it('recognises practical sections by their usual titles', () => {
    for (const t of ['Практическое руководство: как действовать безопасно', 'Тавсияҳо', 'Когда обратиться к врачу', 'Amaliy tavsiyalar']) {
      const a = { ...good, sections: [...good.sections.slice(0, 2), { title: t, content: '1. Духтур.' }] };
      expect(checkArticleQuality(a, 'tg').issues.map(i => i.code)).not.toContain('no_practical');
    }
  });

  it('counts Latin letters without URLs', () => {
    expect(latinShare('Текст https://example.com/very/long/latin/path')).toBe(0);
    expect(latinShare('abc где')).toBe(0.5);
  });
});

describe('aiDataToCheckable', () => {
  it('reads the section fields of the AI JSON', () => {
    const a = aiDataToCheckable({ title: 'T', overview: 'O', section1_title: 'A', section1_content: 'a', section3_title: 'C', section3_content: 'c', references: ['x'] });
    expect(a.sections).toEqual([{ title: 'A', content: 'a' }, { title: 'C', content: 'c' }]);
    expect(a.references).toEqual(['x']);
  });
});
