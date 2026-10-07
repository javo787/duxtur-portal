import { beforeEach, describe, expect, it, vi } from 'vitest';

// The pages are wired to the database and to client components; replace them so generateMetadata can run in node.
const state = vi.hoisted(() => ({ total: 0 }));

vi.mock('@/lib/mongodb', () => ({ default: async () => undefined }));
vi.mock('@/models/Doctor', () => ({ default: { countDocuments: async () => state.total } }));
vi.mock('@/models/Article', () => ({ default: {} }));
vi.mock('./_components/DoctorsPageContent', () => ({ default: () => null }));
vi.mock('./_components/DoctorsSortSelect', () => ({ DoctorsSortSelect: () => null }));
vi.mock('@/components/ContactDoctorButton', () => ({ default: () => null }));
vi.mock('@/components/FadeIn', () => ({ default: () => null }));

import { generateMetadata as directoryMetadata } from './page';
import { generateMetadata as specialtyMetadata } from './[specialty]/page';
import { generateMetadata as mapMetadata } from './map/layout';
import { generateMetadata as blogMetadata } from '../blog/page';

const HREFLANG = ['kk', 'ky', 'ru', 'tg', 'uz', 'x-default'];
const hreflang = (m: { alternates?: { languages?: unknown } | null }) => Object.keys((m.alternates?.languages as object) ?? {}).sort();

const directory = (sp: Record<string, string | string[]> = {}, lang = 'ru') =>
  directoryMetadata({ params: Promise.resolve({ lang }), searchParams: Promise.resolve(sp) });
const specialty = (slug: string, sp: Record<string, string> = {}, lang = 'ru') =>
  specialtyMetadata({ params: Promise.resolve({ lang, specialty: slug }), searchParams: Promise.resolve(sp) });
const blog = (sp: Record<string, string> = {}, lang = 'ru') =>
  blogMetadata({ params: Promise.resolve({ lang }), searchParams: Promise.resolve(sp) });

beforeEach(() => {
  state.total = 5;
});

describe('doctors directory metadata', () => {
  it('is self-canonical with the full hreflang set on the plain list', async () => {
    const m = await directory();
    expect(m.alternates?.canonical).toBe('https://www.duxtur.org/ru/doctors');
    expect(hreflang(m)).toEqual(HREFLANG);
  });

  it('points ?specialty= on its own at the landing page of that specialty, without hreflang', async () => {
    const m = await directory({ specialty: 'cardiology' }, 'tg');
    expect(m.alternates?.canonical).toBe('https://www.duxtur.org/tg/doctors/cardiology');
    expect(hreflang(m)).toEqual([]);
  });

  it('points a narrowed, sorted or paged list at the plain directory, without hreflang', async () => {
    const variants: Record<string, string>[] = [{ specialty: 'cardiology', city: 'Душанбе' }, { sort: 'rating' }, { page: '2' }, { specialty: 'nonsense' }];
    for (const sp of variants) {
      const m = await directory(sp);
      expect(m.alternates?.canonical).toBe('https://www.duxtur.org/ru/doctors');
      expect(hreflang(m)).toEqual([]);
    }
  });
});

describe('doctors specialty page metadata', () => {
  it('is self-canonical with the full hreflang set and indexable when it lists doctors', async () => {
    const m = await specialty('cardiology');
    expect(m.alternates?.canonical).toBe('https://www.duxtur.org/ru/doctors/cardiology');
    expect(hreflang(m)).toEqual(HREFLANG);
    expect(m.robots).toBeUndefined();
  });

  it('keeps an empty specialty out of the index but lets its links be followed, with no hreflang', async () => {
    state.total = 0;
    const m = await specialty('cardiology');
    expect(m.robots).toEqual({ index: false, follow: true });
    expect(hreflang(m)).toEqual([]);
  });

  it('treats a city, type, sorting or later page as a variant of the page, without hreflang', async () => {
    const variants: Record<string, string>[] = [{ city: 'Худжанд' }, { type: 'online' }, { sort: 'rating' }, { page: '2' }];
    for (const sp of variants) {
      const m = await specialty('cardiology', sp);
      expect(m.alternates?.canonical).toBe('https://www.duxtur.org/ru/doctors/cardiology');
      expect(hreflang(m)).toEqual([]);
      expect(m.robots).toBeUndefined();
    }
  });

  it('answers an unknown specialty with a 404', async () => {
    await expect(specialty('nonsense')).rejects.toThrow();
  });
});

describe('doctors map metadata', () => {
  it('is out of the index (a client-only map has nothing to read) and canonical to itself', async () => {
    const m = await mapMetadata({ params: Promise.resolve({ lang: 'ru' }) });
    expect(m.robots).toEqual({ index: false, follow: true });
    expect(m.alternates?.canonical).toBe('https://www.duxtur.org/ru/doctors/map');
    expect(hreflang(m)).toEqual([]);
  });
});

describe('blog index metadata', () => {
  it('is self-canonical with the full hreflang set on the plain index', async () => {
    const m = await blog();
    expect(m.alternates?.canonical).toBe('https://www.duxtur.org/ru/blog');
    expect(hreflang(m)).toEqual(HREFLANG);
  });

  it('points ?category= at the landing page when the category has one', async () => {
    const m = await blog({ category: 'cardiology' }, 'uz');
    expect(m.alternates?.canonical).toBe('https://www.duxtur.org/uz/blog/c/cardiology');
    expect(hreflang(m)).toEqual([]);
  });

  it('points ?category= of a category without a landing page at the plain index', async () => {
    const m = await blog({ category: 'surgery' });
    expect(m.alternates?.canonical).toBe('https://www.duxtur.org/ru/blog');
    expect(hreflang(m)).toEqual([]);
  });
});
