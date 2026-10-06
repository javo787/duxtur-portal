import { describe, expect, it } from 'vitest';
import { resolveSitemap } from 'next/dist/build/webpack/loaders/metadata/resolve-route-data';
import { buildSitemapEntries, escapeXmlUrl, latest, type SitemapData } from './sitemap-entries';
import { MAX_FACETS_IN_SITEMAP } from './clinic-seo';

const LONG_TEXT = 'Подробное описание клиники с реальными фактами о врачах, оборудовании и услугах, которое написал владелец.';

const clinic = (slug: string, over: Record<string, unknown> = {}) => ({
  slug,
  status: 'approved',
  city: 'Душанбе',
  type: 'clinic',
  specialties: [] as string[],
  updatedAt: '2026-02-01T00:00:00.000Z',
  ...over,
});

const base = (over: Partial<SitemapData> = {}): SitemapData => ({
  articles: [],
  doctors: [],
  clinics: [],
  doctorSpecialties: {},
  ...over,
});

const urls = (data: SitemapData) => buildSitemapEntries(data).map((e) => e.url);

describe('escapeXmlUrl', () => {
  it('escapes the characters that are not allowed raw in XML', () => {
    expect(escapeXmlUrl('https://x.org/a?b=1&c=2')).toBe('https://x.org/a?b=1&amp;c=2');
    expect(escapeXmlUrl(`https://x.org/?a="1"&b='2'<>`)).toBe('https://x.org/?a=&quot;1&quot;&amp;b=&apos;2&apos;&lt;&gt;');
  });
});

describe('latest', () => {
  it('returns the newest valid date and ignores junk', () => {
    expect(latest('2026-01-01', new Date('2026-03-01'), undefined, null, 'not a date', '2026-02-01')?.toISOString().slice(0, 10)).toBe('2026-03-01');
    expect(latest()).toBeUndefined();
    expect(latest(undefined, 'nope')).toBeUndefined();
  });
});

describe('buildSitemapEntries', () => {
  it('lists each section in all five languages', () => {
    const list = urls(base());
    for (const lang of ['ru', 'uz', 'tg', 'kk', 'ky']) {
      for (const path of ['', '/blog', '/doctors', '/authors', '/clinics', '/clinic/register', '/about', '/editorial']) {
        expect(list).toContain(`https://www.duxtur.org/${lang}${path}`);
      }
    }
  });

  it('no longer lists the private patient page', () => {
    expect(urls(base()).some((u) => u.includes('/patient/'))).toBe(false);
  });

  it('lists approved clinics, and an import only once it has text of its own', () => {
    const list = urls(
      base({
        clinics: [
          clinic('verified'),
          clinic('bare-import', { status: 'pre_imported' }),
          clinic('import-with-text', { status: 'pre_imported', description: { ru: LONG_TEXT } }),
        ],
      }),
    );
    expect(list).toContain('https://www.duxtur.org/ru/clinics/verified');
    expect(list).toContain('https://www.duxtur.org/ru/clinics/import-with-text');
    expect(list).not.toContain('https://www.duxtur.org/ru/clinics/bare-import');
  });

  it('adds only facets with enough clinics, with the canonical query', () => {
    const clinics = [clinic('a', { type: 'dental_clinic' }), clinic('b', { type: 'dental_clinic' }), clinic('c', { type: 'dental_clinic' }), clinic('d', { city: 'Худжанд', type: 'hospital' })];
    const list = urls(base({ clinics }));
    expect(list).toContain('https://www.duxtur.org/ru/clinics?city=%D0%94%D1%83%D1%88%D0%B0%D0%BD%D0%B1%D0%B5');
    expect(list).toContain('https://www.duxtur.org/uz/clinics?type=dental_clinic');
    expect(list).toContain('https://www.duxtur.org/ru/clinics?city=%D0%94%D1%83%D1%88%D0%B0%D0%BD%D0%B1%D0%B5&amp;type=dental_clinic');
    expect(list.some((u) => u.includes('hospital'))).toBe(false);
    expect(list.some((u) => u.includes('%D0%A5%D1%83%D0%B4%D0%B6%D0%B0%D0%BD%D0%B4'))).toBe(false);
  });

  it('caps the number of facets', () => {
    const cities = ['Душанбе', 'Худжанд', 'Куляб', 'Бохтар', 'Ташкент', 'Самарканд', 'Алматы', 'Бишкек', 'Астана'];
    const types = ['clinic', 'hospital', 'diagnostic_center', 'dental_clinic', 'eye_clinic', 'maternity', 'rehabilitation', 'polyclinic'];
    const specialties = ['cardiology', 'neurology', 'dentistry', 'pediatrics', 'dermatology', 'surgery', 'gynecology', 'tests', 'general', 'endocrinology', 'urology'];
    const clinics = cities.flatMap((city) =>
      types.flatMap((type) => specialties.flatMap((sp) => [0, 1, 2].map((i) => clinic(`${city}-${type}-${sp}-${i}`, { city, type, specialties: [sp] })))),
    );
    const facetUrls = urls(base({ clinics })).filter((u) => u.includes('/ru/clinics?'));
    expect(facetUrls.length).toBe(MAX_FACETS_IN_SITEMAP);
  });

  it('uses real modification dates and leaves out the ones it does not know', () => {
    const entries = buildSitemapEntries(
      base({
        clinics: [clinic('a', { updatedAt: '2026-02-01T00:00:00.000Z' }), clinic('b', { updatedAt: '2026-04-01T00:00:00.000Z' })],
        articles: [{ slug: 'x', updatedAt: '2026-03-01T00:00:00.000Z', title: { ru: 'Длинный заголовок статьи' } }],
      }),
    );
    const find = (url: string) => entries.find((e) => e.url === url);
    expect(find('https://www.duxtur.org/ru/clinics/a')?.lastModified).toEqual(new Date('2026-02-01T00:00:00.000Z'));
    expect(find('https://www.duxtur.org/ru/clinics')?.lastModified).toEqual(new Date('2026-04-01T00:00:00.000Z'));
    expect(find('https://www.duxtur.org/ru/blog')?.lastModified).toEqual(new Date('2026-03-01T00:00:00.000Z'));
    expect(find('https://www.duxtur.org/ru')?.lastModified).toEqual(new Date('2026-04-01T00:00:00.000Z'));
    // nothing to base a date on: no lastmod at all, rather than "now"
    expect(find('https://www.duxtur.org/ru/about')).not.toHaveProperty('lastModified');
    expect(find('https://www.duxtur.org/ru/clinic/register')).not.toHaveProperty('lastModified');
    expect(find('https://www.duxtur.org/ru/doctors')).not.toHaveProperty('lastModified');
  });

  it('lists articles only in the languages that have a title', () => {
    const list = urls(base({ articles: [{ slug: 'a', title: { ru: 'Заголовок на русском', uz: 'Sarlavha oʻzbekcha' } }, { slug: 'none', title: {} }] }));
    expect(list).toContain('https://www.duxtur.org/ru/blog/a');
    expect(list).toContain('https://www.duxtur.org/uz/blog/a');
    expect(list).not.toContain('https://www.duxtur.org/tg/blog/a');
    expect(list.some((u) => u.includes('/blog/none'))).toBe(false);
  });

  it('falls back to the id for a doctor without a slug', () => {
    const list = urls(base({ doctors: [{ slug: 'ivanov', _id: '1' }, { _id: '64b0c0ffee0000000000abcd' }] }));
    expect(list).toContain('https://www.duxtur.org/ru/doctor/ivanov');
    expect(list).toContain('https://www.duxtur.org/ru/doctor/64b0c0ffee0000000000abcd');
  });

  it('has no duplicate URLs', () => {
    const clinics = [clinic('a'), clinic('b'), clinic('c')];
    const list = urls(
      base({
        clinics,
        doctors: [{ slug: 'a', _id: '1', specialty: { ru: 'Кардиология' } }],
        doctorSpecialties: { cardiology: 'Кардиология' },
      }),
    );
    expect(new Set(list).size).toBe(list.length);
  });

  it('does not list the doctors map: it is client-only, with nothing for a crawler to read', () => {
    expect(urls(base()).some((u) => u.includes('/doctors/map'))).toBe(false);
  });

  it('lists a specialty page only when an approved doctor is on it, dated by its newest doctor', () => {
    const entries = buildSitemapEntries(
      base({
        doctors: [
          { slug: 'a', _id: '1', specialty: { ru: 'Кардиология' }, updatedAt: '2026-01-10T00:00:00.000Z' },
          { slug: 'b', _id: '2', specialty: { ru: 'Кардиология' }, updatedAt: '2026-03-05T00:00:00.000Z' },
          { slug: 'c', _id: '3', specialty: { ru: 'Неврология' }, updatedAt: '2026-02-01T00:00:00.000Z' },
          { slug: 'd', _id: '4', specialty: { ru: 'Название, которого нет в справочнике' } },
        ],
        doctorSpecialties: { cardiology: 'Кардиология', neurology: 'Неврология', dentistry: 'Стоматология' },
      }),
    );
    const find = (url: string) => entries.find((e) => e.url === url);
    expect(find('https://www.duxtur.org/ru/doctors/cardiology')?.lastModified).toEqual(new Date('2026-03-05T00:00:00.000Z'));
    expect(find('https://www.duxtur.org/ru/doctors/neurology')?.lastModified).toEqual(new Date('2026-02-01T00:00:00.000Z'));
    // nobody practises dentistry here: an empty page is noindex, so it must not be in the sitemap
    for (const lang of ['ru', 'uz', 'tg', 'kk', 'ky']) {
      expect(find(`https://www.duxtur.org/${lang}/doctors/dentistry`)).toBeUndefined();
    }
  });
});

describe('the sitemap as Next writes it', () => {
  const data = base({
    clinics: [clinic('a', { type: 'dental_clinic' }), clinic('b', { type: 'dental_clinic' }), clinic('c', { type: 'dental_clinic' })],
  });
  const xml = resolveSitemap(buildSitemapEntries(data));

  it('is well-formed: every ampersand is an entity', () => {
    // Next does not escape <loc> itself; if a Next upgrade starts to, this fails on "&amp;amp;" before it ships.
    expect(xml).toMatch(/&amp;type=dental_clinic/);
    expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/);
    expect(xml).not.toContain('&amp;amp;');
  });

  it('carries no empty <lastmod>', () => {
    expect(xml).not.toContain('<lastmod></lastmod>');
    expect(xml).not.toContain('Invalid');
  });
});
