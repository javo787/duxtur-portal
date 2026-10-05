import { describe, expect, it } from 'vitest';
import { BASE_URL, buildAlternates, buildFilterQuery, buildPageUrl, ogAlternateLocales, ogLocale, safeJsonLd } from './seo';

describe('safeJsonLd', () => {
  it('cannot be broken out of a <script> tag', () => {
    const out = safeJsonLd({ name: 'Клиника </script><script>alert(1)</script>' });
    expect(out).not.toContain('</script>');
    expect(out).not.toContain('<');
  });

  it('still parses back to the same data', () => {
    const data = { name: 'A </script> & B > C', n: 5, list: ['x'], ls: 'a\u2028b' };
    expect(JSON.parse(safeJsonLd(data))).toEqual(data);
  });

  it('does not throw on undefined', () => {
    expect(safeJsonLd(undefined)).toBe('null');
  });
});

describe('buildFilterQuery', () => {
  it('is empty without filters', () => {
    expect(buildFilterQuery()).toBe('');
    expect(buildFilterQuery({})).toBe('');
  });

  it('keeps one fixed order and encodes Cyrillic', () => {
    const a = buildFilterQuery({ type: 'dental_clinic', city: 'Душанбе' });
    const b = buildFilterQuery({ city: 'Душанбе', type: 'dental_clinic' });
    expect(a).toBe(b);
    expect(a).toBe('?city=%D0%94%D1%83%D1%88%D0%B0%D0%BD%D0%B1%D0%B5&type=dental_clinic');
  });

  it('ignores search and sort, which never get their own canonical URL', () => {
    expect(buildFilterQuery({ q: 'шифо', sort: 'reviews' })).toBe('');
  });

  it('adds page only from the second page on', () => {
    expect(buildFilterQuery({ page: 1 })).toBe('');
    expect(buildFilterQuery({ page: 2 })).toBe('?page=2');
    expect(buildFilterQuery({ city: 'Худжанд', page: 3 })).toContain('page=3');
    expect(buildFilterQuery({ page: 'abc' as unknown as number })).toBe('');
  });
});

describe('buildAlternates', () => {
  it('self-canonicalizes a paginated listing and mirrors the page in every language', () => {
    const alt = buildAlternates('clinics', 'uz', { page: 2 });
    expect(alt.canonical).toBe(`${BASE_URL}/uz/clinics?page=2`);
    expect(alt.languages.uz).toBe(alt.canonical);
    expect(alt.languages.tg).toBe(`${BASE_URL}/tg/clinics?page=2`);
    expect(alt.languages['x-default']).toBe(`${BASE_URL}/ru/clinics?page=2`);
  });

  it('lists all five languages plus x-default, and the self reference equals the canonical', () => {
    const alt = buildAlternates('clinics/shifo', 'kk');
    expect(Object.keys(alt.languages).sort()).toEqual(['kk', 'ky', 'ru', 'tg', 'uz', 'x-default']);
    expect(alt.languages.kk).toBe(alt.canonical);
  });

  it('keeps the home page free of a trailing slash', () => {
    expect(buildAlternates('', 'ru').canonical).toBe(`${BASE_URL}/ru`);
  });
});

describe('buildPageUrl / og locale', () => {
  it('builds the same URL the canonical uses', () => {
    expect(buildPageUrl('ru', 'clinics', { city: 'Душанбе' })).toBe(buildAlternates('clinics', 'ru', { city: 'Душанбе' }).canonical);
  });

  it('maps every site language to its own og:locale', () => {
    expect(ogLocale('uz')).toBe('uz_UZ');
    expect(ogLocale('tg')).toBe('tg_TJ');
    expect(ogLocale('xx')).toBe('ru_RU');
    expect(ogAlternateLocales('ru')).toHaveLength(4);
    expect(ogAlternateLocales('ru')).not.toContain('ru_RU');
  });
});
