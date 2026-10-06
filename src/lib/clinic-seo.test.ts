import { describe, expect, it } from 'vitest';
import { getT } from '@/i18n';
import {
  buildClinicDescription,
  buildClinicJsonLd,
  buildClinicListJsonLd,
  buildClinicTitle,
  buildListingMetadataText,
  cityCountry,
  cityLabel,
  cleanJsonLd,
  clinicIndexability,
  clinicSchemaType,
  indexableListingFacets,
  listingIndexable,
  medicalSpecialties,
  normalizeCity,
  ogImageUrl,
  openingHoursSpecification,
  truncateAtWord,
  type ClinicSeoInput,
} from './clinic-seo';
import { safeJsonLd } from './seo';

const ru = getT('ru');
const uz = getT('uz');

const day = (open: string, close: string, isWorking = true) => ({ open, close, isWorking });
const weekdays = {
  mon: day('09:00', '18:00'),
  tue: day('09:00', '18:00'),
  wed: day('09:00', '18:00'),
  thu: day('09:00', '18:00'),
  fri: day('09:00', '18:00'),
  sat: day('10:00', '14:00'),
  sun: day('09:00', '18:00', false),
};

const clinic: ClinicSeoInput = {
  slug: 'shifo',
  type: 'dental_clinic',
  status: 'approved',
  name: { ru: 'Шифо', uz: 'Shifo' },
  description: { ru: 'Современная стоматология в центре города с опытными врачами и собственной лабораторией.' },
  logo: 'https://res.cloudinary.com/x/image/upload/v1/logo.png',
  coverImage: 'https://res.cloudinary.com/x/image/upload/v1/cover.jpg',
  city: 'Душанбе',
  address: 'пр. Рудаки, 10',
  coordinates: { lat: 38.5598123, lng: 68.7870456 },
  phone: '+992372210000',
  website: 'https://shifo.example',
  telegram: 'shifo_tj',
  specialties: ['dentistry', 'Хирургия', 'ultrasound'],
  workingHours: weekdays,
  rating: { avg: 4.66, count: 12 },
};

/** Every string/array/object in the output must carry a value. */
function findEmpty(value: unknown, path = '$'): string[] {
  if (value === '' || value === null || value === undefined) return [path];
  if (Array.isArray(value)) {
    return value.length === 0 ? [path] : value.flatMap((v, i) => findEmpty(v, `${path}[${i}]`));
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries.length === 0 ? [path] : entries.flatMap(([k, v]) => findEmpty(v, `${path}.${k}`));
  }
  return [];
}

type Graph = { '@context': string; '@graph': Record<string, any>[] };
const graphOf = (c: ClinicSeoInput, extra: Partial<Parameters<typeof buildClinicJsonLd>[0]> = {}) =>
  buildClinicJsonLd({ clinic: c, lang: 'ru', t: ru, ...extra }) as Graph;
const clinicNode = (g: Graph) => g['@graph'][0];

describe('cities', () => {
  it('matches stored values to the canonical name regardless of case and stray spaces', () => {
    expect(normalizeCity('  душанбе ')).toBe('Душанбе');
    expect(normalizeCity('Душанбе\u200B')).toBe('Душанбе');
    expect(normalizeCity('Неизвестный')).toBe('Неизвестный');
    expect(normalizeCity(undefined)).toBe('');
  });

  it('localizes the name, falling back to the Russian one', () => {
    expect(cityLabel('Душанбе', 'uz')).toBe('Dushanbe');
    expect(cityLabel('Душанбе', 'kk')).toBe('Душанбе');
    expect(cityLabel('Ташкент', 'tg')).toBe('Тошканд');
    expect(cityLabel('Ташкент', 'ru')).toBe('Ташкент');
  });

  it('knows the country of listed cities and never guesses for others', () => {
    expect(cityCountry('Душанбе')).toBe('TJ');
    expect(cityCountry('самарканд')).toBe('UZ');
    expect(cityCountry('Алматы')).toBe('KZ');
    expect(cityCountry('Бишкек')).toBe('KG');
    expect(cityCountry('Париж')).toBeUndefined();
    expect(cityCountry('')).toBeUndefined();
  });
});

describe('schema vocabulary', () => {
  it('picks the most specific type', () => {
    expect(clinicSchemaType('dental_clinic')).toBe('Dentist');
    expect(clinicSchemaType('hospital')).toBe('Hospital');
    expect(clinicSchemaType('maternity')).toBe('Hospital');
    expect(clinicSchemaType('eye_clinic')).toBe('MedicalClinic');
    expect(clinicSchemaType(undefined)).toBe('MedicalClinic');
  });

  it('maps specialties by id or legacy label and skips the ones without a faithful value', () => {
    expect(medicalSpecialties(['dentistry', 'Хирургия', 'ultrasound', 'mri', 'ophthalmology', 'cardiology', 'dentistry'])).toEqual([
      'https://schema.org/Dentistry',
      'https://schema.org/Surgical',
      'https://schema.org/Cardiovascular',
    ]);
    expect(medicalSpecialties(undefined)).toEqual([]);
  });
});

describe('clinicIndexability', () => {
  it('always indexes verified clinics', () => {
    expect(clinicIndexability({ status: 'approved' })).toEqual({ index: true, reason: 'verified' });
  });

  it('keeps a bare import out of the index', () => {
    expect(clinicIndexability({ status: 'pre_imported' }).index).toBe(false);
    expect(clinicIndexability({ status: 'pre_imported', description: { ru: 'Короткое.' } }).index).toBe(false);
  });

  it('lets an import in once it has real text of its own, in any language', () => {
    const text = 'А'.repeat(80);
    expect(clinicIndexability({ status: 'pre_imported', description: { tg: text } }).index).toBe(true);
    expect(clinicIndexability({ status: 'pre_imported', description: { ru: 'А'.repeat(79) } }).index).toBe(false);
  });
});

describe('text helpers', () => {
  it('truncates at a word boundary and never splits an emoji', () => {
    const out = truncateAtWord('слово '.repeat(40), 30);
    expect(Array.from(out).length).toBeLessThanOrEqual(30);
    expect(out.endsWith('…')).toBe(true);
    expect(out).not.toMatch(/\s…$/);
    expect(truncateAtWord('короткий', 30)).toBe('короткий');
    expect(() => truncateAtWord('😀'.repeat(50), 11)).not.toThrow();
    expect(truncateAtWord('😀'.repeat(50), 11)).toBe(`${'😀'.repeat(10)}…`);
  });
});

describe('clinic title and description', () => {
  it('puts type and city in the title and leaves the site suffix to the layout template', () => {
    expect(buildClinicTitle(clinic, 'ru', ru)).toBe('Шифо — Стоматология, Душанбе');
    expect(buildClinicTitle(clinic, 'uz', uz)).toBe('Shifo — Stomatologiya, Dushanbe');
    expect(buildClinicTitle(clinic, 'ru', ru)).not.toContain('Duxtur');
  });

  it('drops the type, then the city, before the title gets too long', () => {
    const long = { ...clinic, name: { ru: 'Многопрофильный центр «Здоровье»' } };
    const title = buildClinicTitle(long, 'ru', ru);
    expect(title).toBe('Многопрофильный центр «Здоровье» — Душанбе');
    expect(Array.from(title).length).toBeLessThanOrEqual(47);
    const huge = { ...clinic, name: { ru: 'Н'.repeat(80) } };
    expect(buildClinicTitle(huge, 'ru', ru)).toBe('Н'.repeat(80));
  });

  it('uses the clinic description when there is one', () => {
    const d = buildClinicDescription(clinic, 'ru', ru);
    expect(d.own).toBe(true);
    expect(d.text).toContain('Современная стоматология');
  });

  it('shortens a long description to a snippet-sized length', () => {
    const d = buildClinicDescription({ ...clinic, description: { ru: 'Слово '.repeat(100) } }, 'ru', ru);
    expect(Array.from(d.text).length).toBeLessThanOrEqual(158);
  });

  it('never leaves the description empty: facts are built from translated labels', () => {
    const d = buildClinicDescription({ ...clinic, description: { ru: '', uz: '' } }, 'ru', ru);
    expect(d.own).toBe(false);
    expect(d.text).toContain('Шифо — Стоматология, Душанбе.');
    expect(d.text).toContain('Адрес: пр. Рудаки, 10.');
    expect(d.text).toContain('Телефон: +992372210000.');
    expect(d.text).toContain('Duxtur.org');
    expect(Array.from(d.text).length).toBeLessThanOrEqual(158);
    const bare = buildClinicDescription({ slug: 'x', name: { ru: 'Икс' } }, 'ru', ru);
    expect(bare.text.length).toBeGreaterThan(10);
  });

  it('falls back to the Russian name and description of an untranslated clinic', () => {
    expect(buildClinicTitle({ ...clinic, name: { ru: 'Шифо' } }, 'kk', getT('kk'))).toContain('Шифо');
  });
});

describe('ogImageUrl', () => {
  it('turns a Cloudinary upload into a 1200x630 JPEG', () => {
    const out = ogImageUrl('https://res.cloudinary.com/x/image/upload/v1/cover.jpg');
    expect(out).toEqual({
      url: 'https://res.cloudinary.com/x/image/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/v1/cover.jpg',
      transformed: true,
    });
  });

  it('passes other hosts through untouched and resolves site-relative paths', () => {
    expect(ogImageUrl('https://cdn.example.com/a.png')).toEqual({ url: 'https://cdn.example.com/a.png', transformed: false });
    expect(ogImageUrl('/og-default.png')?.url).toBe('https://www.duxtur.org/og-default.png');
  });

  it('rejects empty and non-http values', () => {
    expect(ogImageUrl('')).toBeUndefined();
    expect(ogImageUrl(undefined)).toBeUndefined();
    expect(ogImageUrl('javascript:alert(1)')).toBeUndefined();
  });
});

describe('cleanJsonLd', () => {
  it('removes everything a validator would flag, but keeps 0 and false', () => {
    expect(
      cleanJsonLd({ a: '', b: '  ', c: null, d: undefined, e: [], f: {}, g: [''], h: NaN, i: 0, j: false, k: ' x ' }),
    ).toEqual({ i: 0, j: false, k: 'x' });
  });

  it('drops an object left with nothing but its @type, and keeps pure references', () => {
    expect(cleanJsonLd({ address: { '@type': 'PostalAddress', streetAddress: '' }, name: 'A' })).toEqual({ name: 'A' });
    expect(cleanJsonLd({ about: { '@id': 'https://x#1' } })).toEqual({ about: { '@id': 'https://x#1' } });
  });
});

describe('openingHoursSpecification', () => {
  it('merges days that share the same hours', () => {
    expect(openingHoursSpecification(weekdays)).toEqual([
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '10:00', closes: '14:00' },
    ]);
  });

  it('skips days off and malformed times, and returns nothing when there is nothing', () => {
    expect(openingHoursSpecification({ mon: day('9:00', '18:00'), tue: day('xx', '18:00'), wed: day('09:00', '18:00', false) })).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday'], opens: '09:00', closes: '18:00' },
    ]);
    expect(openingHoursSpecification({ mon: day('25:00', '18:00') })).toBeUndefined();
    expect(openingHoursSpecification(undefined)).toBeUndefined();
  });
});

describe('buildClinicJsonLd', () => {
  it('describes the clinic in one @graph with the right type, ids and links', () => {
    const g = graphOf(clinic, { doctors: [{ name: 'Иванов И.', slug: 'ivanov', specialty: { ru: 'Стоматолог' } }] });
    const [node, page, crumbs] = g['@graph'];
    expect(g['@context']).toBe('https://schema.org');
    expect(node['@type']).toBe('Dentist');
    expect(node['@id']).toBe('https://www.duxtur.org/ru/clinics/shifo#clinic');
    expect(node.url).toBe('https://www.duxtur.org/ru/clinics/shifo');
    expect(node.name).toBe('Шифо');
    expect(page['@type']).toBe('WebPage');
    expect(page.mainEntity).toEqual({ '@id': node['@id'] });
    expect(page.breadcrumb).toEqual({ '@id': crumbs['@id'] });
    expect(crumbs['@type']).toBe('BreadcrumbList');
    expect(crumbs).not.toHaveProperty('@context');
    expect(crumbs.itemListElement).toHaveLength(3);
  });

  it('nests no breadcrumb inside the clinic and invents no price range', () => {
    const node = clinicNode(graphOf(clinic));
    expect(node).not.toHaveProperty('breadcrumb');
    expect(node).not.toHaveProperty('priceRange');
  });

  it('contains no empty values anywhere, even for a nearly empty clinic', () => {
    expect(findEmpty(graphOf(clinic))).toEqual([]);
    const bare = graphOf({ slug: 'x', name: { ru: 'Икс' }, status: 'approved', logo: '', coverImage: '', phone: '', website: '' });
    expect(findEmpty(bare)).toEqual([]);
    const node = clinicNode(bare);
    expect(node).not.toHaveProperty('address');
    expect(node).not.toHaveProperty('sameAs');
    expect(node).not.toHaveProperty('image');
    expect(node).not.toHaveProperty('employee');
  });

  it('writes address, geo with five decimals, map link and contacts', () => {
    const node = clinicNode(graphOf(clinic));
    expect(node.address).toEqual({
      '@type': 'PostalAddress',
      streetAddress: 'пр. Рудаки, 10',
      addressLocality: 'Душанбе',
      addressCountry: 'TJ',
    });
    expect(node.geo).toEqual({ '@type': 'GeoCoordinates', latitude: 38.55981, longitude: 68.78705 });
    expect(node.hasMap).toBe('https://www.google.com/maps/search/?api=1&query=38.5598123,68.7870456');
    expect(node.telephone).toBe('+992372210000');
    expect(node.sameAs).toEqual(['https://shifo.example/', 'https://t.me/shifo_tj']);
    expect(node.image).toEqual([
      'https://res.cloudinary.com/x/image/upload/v1/cover.jpg',
      'https://res.cloudinary.com/x/image/upload/v1/logo.png',
    ]);
  });

  it('reads the GeoJSON pin when lat/lng are missing, and ignores a missing or zeroed pin', () => {
    const fromGeoJson = clinicNode(graphOf({ ...clinic, coordinates: { coordinates: [68.78, 38.55] } }));
    expect(fromGeoJson.geo).toMatchObject({ latitude: 38.55, longitude: 68.78 });
    expect(clinicNode(graphOf({ ...clinic, coordinates: { lat: 0, lng: 0 } }))).not.toHaveProperty('geo');
    expect(clinicNode(graphOf({ ...clinic, coordinates: undefined }))).not.toHaveProperty('geo');
    expect(clinicNode(graphOf({ ...clinic, coordinates: { lat: 95, lng: 10 } }))).not.toHaveProperty('geo');
  });

  it('lists hours as OpeningHoursSpecification, never an empty openingHours array', () => {
    const node = clinicNode(graphOf(clinic));
    expect(node.openingHoursSpecification).toHaveLength(2);
    expect(node).not.toHaveProperty('openingHours');
  });

  it('does not publish the placeholder hours of an unclaimed import', () => {
    const placeholder = Object.fromEntries(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(d => [d, day('08:00', '18:00')]));
    const node = clinicNode(graphOf({ ...clinic, status: 'pre_imported', workingHours: placeholder as never }));
    expect(node).not.toHaveProperty('openingHoursSpecification');
  });

  it('adds a rating only for verified clinics with real reviews', () => {
    expect(clinicNode(graphOf(clinic)).aggregateRating).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 4.7,
      reviewCount: 12,
      bestRating: 5,
      worstRating: 1,
    });
    expect(clinicNode(graphOf({ ...clinic, rating: { avg: 0, count: 0 } }))).not.toHaveProperty('aggregateRating');
    expect(clinicNode(graphOf({ ...clinic, status: 'pre_imported' }))).not.toHaveProperty('aggregateRating');
    expect(clinicNode(graphOf({ ...clinic, rating: { avg: 7, count: 3 } }))).not.toHaveProperty('aggregateRating');
  });

  it('maps specialties to schema.org values and leaves out the unmappable ones', () => {
    expect(clinicNode(graphOf(clinic)).medicalSpecialty).toEqual(['https://schema.org/Dentistry', 'https://schema.org/Surgical']);
  });

  it('links doctors by slug and falls back to the id, instead of ".../doctor/undefined"', () => {
    const node = clinicNode(
      graphOf(clinic, {
        doctors: [
          { name: 'Иванов И.', slug: 'ivanov', specialty: { ru: 'Стоматолог' } },
          { name: 'Без слага', _id: '64b0c0ffee0000000000abcd', specialty: 'Хирург' },
          { name: 'Без ссылки' },
        ],
      }),
    );
    expect(node.employee).toEqual([
      { '@type': 'Person', name: 'Иванов И.', jobTitle: 'Стоматолог', url: 'https://www.duxtur.org/ru/doctor/ivanov' },
      { '@type': 'Person', name: 'Без слага', jobTitle: 'Хирург', url: 'https://www.duxtur.org/ru/doctor/64b0c0ffee0000000000abcd' },
      { '@type': 'Person', name: 'Без ссылки' },
    ]);
  });

  it('describes branches as separate entities linked to the main clinic', () => {
    const g = graphOf({
      ...clinic,
      branches: [{ label: 'Филиал на Сино', address: 'ул. Сино, 5', phone: '+992372220000', coordinates: { lat: 38.57, lng: 68.8 } }],
    });
    const branch = g['@graph'][1];
    expect(branch['@id']).toBe('https://www.duxtur.org/ru/clinics/shifo#branch-1');
    expect(branch.branchOf).toEqual({ '@id': 'https://www.duxtur.org/ru/clinics/shifo#clinic' });
    expect(branch.name).toBe('Шифо — Филиал на Сино');
    expect(branch.address.addressLocality).toBe('Душанбе');
    expect(branch.geo.latitude).toBe(38.57);
  });

  it('uses the page language for url, name and inLanguage', () => {
    const g = buildClinicJsonLd({ clinic, lang: 'uz', t: uz }) as Graph;
    expect(clinicNode(g).url).toBe('https://www.duxtur.org/uz/clinics/shifo');
    expect(clinicNode(g).name).toBe('Shifo');
    expect(g['@graph'].find(n => n['@type'] === 'WebPage')?.inLanguage).toBe('uz');
  });

  it('survives a hostile clinic name once serialized with safeJsonLd', () => {
    const evil = { ...clinic, name: { ru: 'X</script><script>alert(1)</script>' } };
    const html = safeJsonLd(graphOf(evil));
    expect(html).not.toContain('</script>');
    expect(JSON.parse(html)['@graph'][0].name).toBe('X</script><script>alert(1)</script>');
  });
});

describe('directory pages', () => {
  const base = { page: 1 };

  it('builds distinct, nominative titles for each filter combination', () => {
    const t = (filters: Parameters<typeof buildListingMetadataText>[0]['filters'], total = 5) =>
      buildListingMetadataText({ filters, total, lang: 'ru', t: ru });
    expect(t(base).title).toBe('Клиники: адрес, телефон, отзывы');
    expect(t({ ...base, city: 'Душанбе' }).title).toBe('Клиники — Душанбе: адрес, телефон, отзывы');
    expect(t({ ...base, city: 'Душанбе', type: 'dental_clinic' }).title).toBe('Стоматология — Душанбе: адрес, телефон, отзывы');
    expect(t({ ...base, specialty: 'cardiology' }).heading).toBe('Клиники — Кардиология');
    expect(t({ ...base, city: 'Душанбе', page: 3 }).title).toContain('(3)');
  });

  it('drops the tagline rather than letting the title run long', () => {
    const { title } = buildListingMetadataText({
      filters: { ...base, city: 'Самарканд', type: 'diagnostic_center' },
      total: 4,
      lang: 'ru',
      t: ru,
    });
    expect(title).toBe('Диагностический центр — Самарканд');
    expect(Array.from(title).length).toBeLessThanOrEqual(47);
  });

  it('still produces a title for an unusually long filter combination', () => {
    const { title } = buildListingMetadataText({
      filters: { ...base, city: 'Самарканд', type: 'diagnostic_center', specialty: 'gastroenterology' },
      total: 4,
      lang: 'ru',
      t: ru,
    });
    expect(title).toBe('Диагностический центр — Гастроэнтерология — Самарканд');
  });

  it('localizes the city and the labels', () => {
    const { title } = buildListingMetadataText({ filters: { ...base, city: 'Душанбе', type: 'dental_clinic' }, total: 5, lang: 'uz', t: uz });
    // the tagline would not fit in 47 characters, so only the heading is left
    expect(title).toBe('Stomatologiya — Dushanbe');
  });

  it('writes a description about clinics, with the count and the directory blurb', () => {
    const { description } = buildListingMetadataText({ filters: { ...base, city: 'Душанбе' }, total: 12, lang: 'ru', t: ru });
    expect(description.startsWith('Клиники — Душанбе. Найдено: 12 клиник.')).toBe(true);
    expect(description).toContain('Каталог клиник');
    expect(Array.from(description).length).toBeLessThanOrEqual(158);
    expect(description).not.toContain('Статьи');
  });

  it('omits the count when nothing was found', () => {
    const { description } = buildListingMetadataText({ filters: { ...base, city: 'Астана' }, total: 0, lang: 'ru', t: ru });
    expect(description).not.toContain('Найдено');
  });

  it('indexes the base listing, large facets and nothing thin, empty or searched', () => {
    expect(listingIndexable({}, 40)).toBe(true);
    expect(listingIndexable({}, 1)).toBe(true);
    expect(listingIndexable({ city: 'Душанбе' }, 3)).toBe(true);
    expect(listingIndexable({ city: 'Душанбе' }, 2)).toBe(false);
    expect(listingIndexable({ city: 'Душанбе', type: 'hospital' }, 1)).toBe(false);
    expect(listingIndexable({}, 0)).toBe(false);
    expect(listingIndexable({ q: 'шифо' }, 25)).toBe(false);
  });

  it('keeps counting list positions across pages and links to the profile pages', () => {
    const ld = buildClinicListJsonLd({
      clinics: [
        { slug: 'a', name: { ru: 'А', uz: 'A' } },
        { slug: 'b', name: { ru: 'Б' } },
      ],
      lang: 'uz',
      name: 'Klinikalar',
      filters: { city: 'Душанбе', page: 2 },
      offset: 20,
    }) as Record<string, any>;
    expect(ld['@type']).toBe('ItemList');
    expect(ld.url).toBe('https://www.duxtur.org/uz/clinics?city=%D0%94%D1%83%D1%88%D0%B0%D0%BD%D0%B1%D0%B5&page=2');
    expect(ld.itemListElement).toEqual([
      { '@type': 'ListItem', position: 21, url: 'https://www.duxtur.org/uz/clinics/a', name: 'A' },
      { '@type': 'ListItem', position: 22, url: 'https://www.duxtur.org/uz/clinics/b', name: 'Б' },
    ]);
  });
});

describe('indexableListingFacets', () => {
  const c = (city: string, type: string, specialties: string[] = [], updatedAt?: string) => ({ city, type, specialties, updatedAt });

  const clinics = [
    c('Душанбе', 'dental_clinic', ['dentistry'], '2026-01-01'),
    c('душанбе ', 'dental_clinic', ['Стоматология'], '2026-03-01'),
    c('Душанбе', 'dental_clinic', ['dentistry', 'surgery'], '2026-02-01'),
    c('Душанбе', 'hospital', ['cardiology']),
    c('Худжанд', 'hospital', ['cardiology']),
    c('Париж', 'clinic', ['cardiology']),
  ];

  const find = (f: { city?: string; type?: string; specialty?: string }) =>
    indexableListingFacets(clinics).find(x => x.city === f.city && x.type === f.type && x.specialty === f.specialty);

  it('keeps only facets with enough clinics', () => {
    expect(find({ city: 'Душанбе' })?.count).toBe(4);
    expect(find({ type: 'dental_clinic' })?.count).toBe(3);
    expect(find({ city: 'Душанбе', type: 'dental_clinic' })?.count).toBe(3);
    expect(find({ type: 'hospital' })).toBeUndefined(); // 2 clinics
    expect(find({ city: 'Худжанд' })).toBeUndefined(); // 1 clinic
    expect(find({ city: 'Душанбе', type: 'hospital' })).toBeUndefined();
  });

  it('counts a legacy specialty label and its id as the same specialty, once per clinic', () => {
    expect(find({ specialty: 'dentistry' })?.count).toBe(3);
    expect(find({ city: 'Душанбе', specialty: 'dentistry' })?.count).toBe(3);
    expect(find({ specialty: 'surgery' })).toBeUndefined();
  });

  it('ignores cities and types that the directory filter would reject', () => {
    expect(indexableListingFacets(clinics).some(f => f.city === 'Париж')).toBe(false);
    expect(indexableListingFacets([c('Душанбе', 'spa'), c('Душанбе', 'spa'), c('Душанбе', 'spa')]).every(f => f.type === undefined)).toBe(true);
  });

  it('reports the newest update inside each facet', () => {
    expect(find({ city: 'Душанбе', type: 'dental_clinic' })?.lastModified?.toISOString().slice(0, 10)).toBe('2026-03-01');
    expect(find({ city: 'Душанбе' })?.lastModified?.toISOString().slice(0, 10)).toBe('2026-03-01');
  });

  it('lists the biggest facets first, in a stable order', () => {
    const counts = indexableListingFacets(clinics).map(f => f.count);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
    expect(indexableListingFacets(clinics)).toEqual(indexableListingFacets([...clinics].reverse()));
  });

  it('copes with empty input and clinics without a city or specialties', () => {
    expect(indexableListingFacets([])).toEqual([]);
    expect(indexableListingFacets([{ type: 'clinic' }, { type: 'clinic' }, { type: 'clinic' }] as never)).toEqual([
      expect.objectContaining({ type: 'clinic', count: 3 }),
    ]);
  });
});
