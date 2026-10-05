import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Renders the real page components to HTML (data and heavy children mocked) to prove the pieces are wired:
// the JSON-LD actually ends up in a <script> tag, as parseable JSON, and cannot be broken out of.
const { state, nothing } = vi.hoisted(() => ({
  state: { clinic: null as unknown, listing: { clinics: [] as unknown[], total: 0 } },
  nothing: () => ({ default: () => null }),
}));

vi.mock('next/font/google', () => ({ Source_Serif_4: () => ({ variable: 'font-var', className: 'font-cls' }) }));
vi.mock('@/lib/mongodb', () => ({ default: async () => undefined }));
vi.mock('@/models/Clinic', () => ({
  default: { findOne: () => ({ populate: () => ({ lean: async () => state.clinic }) }) },
}));
vi.mock('@/lib/clinic-service', () => ({
  getClinicsPage: async () => state.listing,
  getClinics: async () => state.listing,
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));
vi.mock('@/components/ClinicViewTracker', nothing);
vi.mock('@/components/home/HomeFooter', nothing);
vi.mock('./[slug]/_components/ClinicDock', nothing);
vi.mock('./[slug]/_components/ClinicBody', nothing);
vi.mock('./[slug]/_components/ClinicPanel', () => ({ default: () => null, panelHasContent: () => false }));
vi.mock('./[slug]/_components/ClinicHero', () => ({ default: () => null, ClinicCover: () => null }));
vi.mock('./_components/ClinicCard', nothing);
vi.mock('./_components/ClinicFilters', nothing);

import ClinicProfilePage from './[slug]/page';
import ClinicsDirectoryPage from './page';

const html = (el: unknown) => renderToStaticMarkup(el as ReactElement);

/** Every JSON-LD block of the page, parsed. Throws if one is not valid JSON. */
function jsonLdBlocks(markup: string): any[] {
  const out: any[] = [];
  for (const m of markup.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    out.push(JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&')));
  }
  return out;
}

const clinic = (over: Record<string, unknown> = {}) => ({
  slug: 'shifo',
  type: 'dental_clinic',
  status: 'approved',
  name: { ru: 'Шифо' },
  description: { ru: 'Современная стоматология.' },
  city: 'Душанбе',
  address: 'пр. Рудаки, 10',
  phone: '+992372210000',
  coordinates: { lat: 38.56, lng: 68.78 },
  doctorIds: [null, { name: 'Иванов И.', slug: 'ivanov', specialty: { ru: 'Стоматолог' } }, { name: 'Без слага', _id: 'abc' }],
  rating: { avg: 4.5, count: 3 },
  ...over,
});

const renderProfile = async (lang = 'ru') => html(await ClinicProfilePage({ params: Promise.resolve({ slug: 'shifo', lang }) }));
const renderListing = async (sp: Record<string, string> = {}, lang = 'ru') =>
  html(await ClinicsDirectoryPage({ params: Promise.resolve({ lang }), searchParams: Promise.resolve(sp) }));

beforeEach(() => {
  state.clinic = clinic();
  state.listing = { clinics: [], total: 0 };
});

describe('clinic profile page markup', () => {
  it('embeds one parseable JSON-LD graph with the clinic, the page and the breadcrumb', async () => {
    const blocks = jsonLdBlocks(await renderProfile());
    expect(blocks).toHaveLength(1);
    const types = blocks[0]['@graph'].map((n: any) => n['@type']);
    expect(types).toEqual(['Dentist', 'WebPage', 'BreadcrumbList']);
  });

  it('drops null doctors and links the rest, never to ".../undefined"', async () => {
    const [ld] = jsonLdBlocks(await renderProfile());
    const employees = ld['@graph'][0].employee;
    expect(employees.map((e: any) => e.url)).toEqual(['https://duxtur.org/ru/doctor/ivanov', 'https://duxtur.org/ru/doctor/abc']);
  });

  it('cannot be broken out of by a hostile clinic name', async () => {
    state.clinic = clinic({ name: { ru: 'X</script><img src=x onerror=alert(1)>' } });
    const markup = await renderProfile();
    expect(markup.match(/<script/g)).toHaveLength(1);
    expect(markup).not.toContain('<img');
    expect(jsonLdBlocks(markup)[0]['@graph'][0].name).toBe('X</script><img src=x onerror=alert(1)>');
  });

  it('answers an unknown slug with notFound', async () => {
    state.clinic = null;
    await expect(renderProfile()).rejects.toThrow('NEXT_NOT_FOUND');
  });
});

describe('clinic directory page markup', () => {
  // the aggregate that feeds the directory always returns _id; ClinicCard keys use it
  const cards = (n: number) => Array.from({ length: n }, (_, i) => clinic({ _id: `id${i}`, slug: `c${i}`, name: { ru: `Клиника ${i}` } }));

  it('shows the filter in the H1 and in the list name', async () => {
    state.listing = { clinics: cards(3), total: 3 };
    const markup = await renderListing({ city: 'Душанбе', type: 'dental_clinic' });
    expect(markup).toMatch(/<h1[^>]*>Стоматология — Душанбе<\/h1>/);
    const [list, crumbs] = jsonLdBlocks(markup);
    expect(list['@type']).toBe('ItemList');
    expect(list.name).toBe('Стоматология — Душанбе');
    expect(crumbs.itemListElement).toHaveLength(3);
    expect(crumbs.itemListElement[2].name).toBe('Стоматология — Душанбе');
  });

  it('keeps the call to action as the H1 of the unfiltered directory', async () => {
    state.listing = { clinics: cards(3), total: 3 };
    const markup = await renderListing();
    expect(markup).toMatch(/<h1[^>]*>Найти клинику<\/h1>/);
    expect(jsonLdBlocks(markup)[1].itemListElement).toHaveLength(2);
  });

  it('counts positions across pages and lists url + name only', async () => {
    state.listing = { clinics: cards(2), total: 45 };
    const [list] = jsonLdBlocks(await renderListing({ page: '3' }));
    expect(list.itemListElement).toEqual([
      { '@type': 'ListItem', position: 41, url: 'https://duxtur.org/ru/clinics/c0', name: 'Клиника 0' },
      { '@type': 'ListItem', position: 42, url: 'https://duxtur.org/ru/clinics/c1', name: 'Клиника 1' },
    ]);
  });

  it('survives an empty result', async () => {
    const markup = await renderListing({ city: 'Астана' });
    const [list] = jsonLdBlocks(markup);
    expect(list['@type']).toBe('ItemList');
    expect(list.itemListElement).toBeUndefined();
  });
});
