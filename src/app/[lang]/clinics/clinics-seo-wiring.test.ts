import { beforeEach, describe, expect, it, vi } from 'vitest';

// The pages are wired to the database and to next/font; replace both so generateMetadata can run in node.
const state = vi.hoisted(() => ({ clinic: null as unknown, listing: { clinics: [] as unknown[], total: 0 } }));

vi.mock('next/font/google', () => ({ Source_Serif_4: () => ({ variable: 'font-var', className: 'font-cls' }) }));
vi.mock('@/lib/mongodb', () => ({ default: async () => undefined }));
vi.mock('@/models/Clinic', () => ({
  default: { findOne: () => ({ populate: () => ({ lean: async () => state.clinic }) }) },
}));
vi.mock('@/lib/clinic-service', () => ({
  getClinicsPage: async () => state.listing,
  getClinics: async () => state.listing,
}));
vi.mock('@/components/ClinicViewTracker', () => ({ default: () => null }));
vi.mock('@/components/home/HomeFooter', () => ({ default: () => null }));

import { generateMetadata as profileMetadata } from './[slug]/page';
import { generateMetadata as listingMetadata } from './page';

const LONG = 'Подробное описание клиники с реальными фактами о врачах, оборудовании и услугах, которое написал владелец.';

const clinic = (over: Record<string, unknown> = {}) => ({
  slug: 'shifo',
  type: 'dental_clinic',
  status: 'approved',
  name: { ru: 'Шифо', uz: 'Shifo' },
  description: { ru: LONG },
  city: 'Душанбе',
  address: 'пр. Рудаки, 10',
  phone: '+992372210000',
  coverImage: 'https://res.cloudinary.com/x/image/upload/v1/cover.jpg',
  ...over,
});

const profile = (lang = 'ru', slug = 'shifo') => profileMetadata({ params: Promise.resolve({ slug, lang }) });
const listing = (sp: Record<string, string> = {}, lang = 'ru') =>
  listingMetadata({ params: Promise.resolve({ lang }), searchParams: Promise.resolve(sp) });

const title = (m: { title?: unknown }) => m.title as string;

beforeEach(() => {
  state.clinic = clinic();
  state.listing = { clinics: [], total: 0 };
});

describe('clinic profile metadata', () => {
  it('has a title with type and city, no site suffix (the layout adds it) and a real description', async () => {
    const m = await profile();
    expect(m.title).toBe('Шифо — Стоматология, Душанбе');
    expect(m.description).toContain('Подробное описание');
    expect(m.robots).toBeUndefined();
  });

  it('is self-canonical with the full hreflang set', async () => {
    const m = await profile('uz');
    expect(m.alternates?.canonical).toBe('https://duxtur.org/uz/clinics/shifo');
    expect(Object.keys(m.alternates?.languages ?? {}).sort()).toEqual(['kk', 'ky', 'ru', 'tg', 'uz', 'x-default']);
  });

  it('repeats siteName and locale in openGraph, which replaces the root one wholesale', async () => {
    const m = await profile('tg');
    expect(m.openGraph).toMatchObject({ siteName: 'Duxtur.org', locale: 'tg_TJ', url: 'https://duxtur.org/tg/clinics/shifo', type: 'website' });
    expect((m.openGraph as { alternateLocale: string[] }).alternateLocale).toHaveLength(4);
    expect((m.openGraph as { title: string }).title).toBe(`${title(m)} | Duxtur.org`);
  });

  it('shares the clinic photo as a 1200x630 JPEG on both Open Graph and Twitter', async () => {
    const m = await profile();
    const url = 'https://res.cloudinary.com/x/image/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/v1/cover.jpg';
    expect((m.openGraph as { images: unknown[] }).images[0]).toMatchObject({ url, width: 1200, height: 630, alt: 'Шифо' });
    expect(m.twitter).toMatchObject({ card: 'summary_large_image', images: [url] });
  });

  it('falls back to the default share image when the clinic has no photo', async () => {
    state.clinic = clinic({ coverImage: undefined, logo: undefined });
    const m = await profile();
    expect((m.openGraph as { images: unknown[] }).images[0]).toMatchObject({ url: 'https://duxtur.org/og-default.png' });
  });

  it('never leaves the description empty for an import without text', async () => {
    state.clinic = clinic({ status: 'pre_imported', description: { ru: '' } });
    const m = await profile();
    expect(m.description).toContain('Адрес: пр. Рудаки, 10.');
    expect(m.description).not.toBe('');
  });

  it('keeps a bare unclaimed import out of the index but lets its links be followed', async () => {
    state.clinic = clinic({ status: 'pre_imported', description: undefined });
    expect((await profile()).robots).toEqual({ index: false, follow: true });
  });

  it('indexes an import that carries real text', async () => {
    state.clinic = clinic({ status: 'pre_imported' });
    expect((await profile()).robots).toBeUndefined();
  });

  it('answers a missing clinic with noindex', async () => {
    state.clinic = null;
    expect((await profile('ru', 'nope')).robots).toEqual({ index: false, follow: false });
  });
});

describe('clinic directory metadata', () => {
  const cards = (n: number) => Array.from({ length: n }, (_, i) => clinic({ slug: `c${i}` }));

  it('gives the base listing its own title and a description about clinics', async () => {
    state.listing = { clinics: cards(20), total: 45 };
    const m = await listing();
    expect(m.title).toBe('Клиники: адрес, телефон, отзывы');
    expect(m.description).toContain('Каталог клиник');
    expect(m.robots).toBeUndefined();
    expect(m.alternates?.canonical).toBe('https://duxtur.org/ru/clinics');
  });

  it('gives a city listing its own title, description and canonical', async () => {
    state.listing = { clinics: cards(5), total: 5 };
    const m = await listing({ city: 'душанбе', type: 'dental_clinic' });
    expect(m.title).toBe('Стоматология — Душанбе: адрес, телефон, отзывы');
    expect(m.alternates?.canonical).toBe('https://duxtur.org/ru/clinics?city=%D0%94%D1%83%D1%88%D0%B0%D0%BD%D0%B1%D0%B5&type=dental_clinic');
    expect(m.robots).toBeUndefined();
  });

  it('self-canonicalizes a later page instead of pointing at page one', async () => {
    state.listing = { clinics: cards(5), total: 45 };
    const m = await listing({ page: '3' });
    expect(m.alternates?.canonical).toBe('https://duxtur.org/ru/clinics?page=3');
    expect(title(m)).toContain('(3)');
  });

  it('noindexes a page beyond the last one', async () => {
    state.listing = { clinics: [], total: 45 };
    expect((await listing({ page: '99' })).robots).toEqual({ index: false, follow: true });
  });

  it('noindexes a thin facet, an empty result and a search', async () => {
    state.listing = { clinics: cards(2), total: 2 };
    const thin = await listing({ city: 'Худжанд' });
    expect(thin.robots).toEqual({ index: false, follow: true });
    expect(thin.alternates).toEqual({ canonical: 'https://duxtur.org/ru/clinics?city=%D0%A5%D1%83%D0%B4%D0%B6%D0%B0%D0%BD%D0%B4' });

    state.listing = { clinics: [], total: 0 };
    expect((await listing({ city: 'Астана' })).robots).toEqual({ index: false, follow: true });

    state.listing = { clinics: cards(10), total: 10 };
    const search = await listing({ q: 'шифо' });
    expect(search.robots).toEqual({ index: false, follow: true });
    expect(search.alternates).toBeUndefined();
  });

  it('does not let sorting create a new canonical URL', async () => {
    state.listing = { clinics: cards(20), total: 45 };
    expect((await listing({ sort: 'reviews' })).alternates?.canonical).toBe('https://duxtur.org/ru/clinics');
  });

  it('localizes title and locale', async () => {
    state.listing = { clinics: cards(5), total: 5 };
    const m = await listing({ city: 'Душанбе', type: 'dental_clinic' }, 'uz');
    expect(m.title).toBe('Stomatologiya — Dushanbe');
    expect(m.openGraph).toMatchObject({ locale: 'uz_UZ', siteName: 'Duxtur.org' });
  });
});
