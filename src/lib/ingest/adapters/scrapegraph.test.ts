import { describe, it, expect } from 'vitest';
import {
  SGAI_EXTRACT_URL,
  parseClinicItems,
  toRawClinic,
  mapSpecialties,
  inferType,
  extractWithScrapeGraph,
  collectListing,
  isAllowedImageUrl,
  redactSignedUrl,
  SOURCE_CONFIG,
  type ClinicItem,
} from './scrapegraph';

// ---------- helpers ----------
interface Call { url: string; init?: RequestInit }
function fakeFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const f = (async (url: unknown, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return handler(String(url), init);
  }) as typeof fetch;
  return { f, calls };
}
const jsonRes = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const noSleep = async () => {};
const apiCalls = (calls: Call[]) => calls.filter(c => c.url === SGAI_EXTRACT_URL);

const PAGE = 'https://ydoc.tj/dushanbe/top/medcentr/';

// ---------- parseClinicItems ----------
describe('parseClinicItems', () => {
  it('reads {clinics:[]}, {items:[]}, a bare array and a single {clinic:{}}', () => {
    const row = { name: 'Клиника «Vedanta»', address: 'ул. Мехнат 10' };
    expect(parseClinicItems({ clinics: [row] }, PAGE)).toHaveLength(1);
    expect(parseClinicItems({ items: [row] }, PAGE)).toHaveLength(1);
    expect(parseClinicItems([row], PAGE)).toHaveLength(1);
    expect(parseClinicItems({ clinic: row }, PAGE)).toHaveLength(1);
    expect(parseClinicItems(null, PAGE)).toEqual([]);
    expect(parseClinicItems({ clinics: 'oops' }, PAGE)).toEqual([]);
  });

  it('resolves relative profile/logo URLs against the page it came from', () => {
    const [item] = parseClinicItems(
      { clinics: [{ name: 'Vita', profileUrl: '/dushanbe/lpu/vita/', logoUrl: '/media/vita.png' }] },
      PAGE
    );
    expect(item.profileUrl).toBe('https://ydoc.tj/dushanbe/lpu/vita/');
    expect(item.logoUrl).toBe('https://ydoc.tj/media/vita.png');
  });

  it('drops rows without a usable name', () => {
    const out = parseClinicItems({ clinics: [{ name: '  ' }, { address: 'x' }, { name: 'Ok Clinic' }] }, PAGE);
    expect(out.map(i => i.name)).toEqual(['Ok Clinic']);
  });

  it('never carries ratings, review counts or prose from the source', () => {
    const [item] = parseClinicItems(
      {
        clinics: [{
          name: 'Vita', rating: 4.9, reviewCount: 120, reviews: ['great'],
          description: 'Мы лучшая клиника города...', about: 'text', doctorCount: 40,
        }],
      },
      PAGE
    );
    const keys = Object.keys(item);
    for (const banned of ['rating', 'reviewCount', 'reviews', 'description', 'about', 'doctorCount']) {
      expect(keys).not.toContain(banned);
    }
  });

  it('rejects non-https and script URLs', () => {
    const [item] = parseClinicItems(
      {
        clinics: [{
          name: 'Vita', profileUrl: 'javascript:alert(1)', logoUrl: 'http://ydoc.tj/media/a.png',
          photoUrls: ['data:image/png;base64,AAAA', 'https://ydoc.tj/media/b.jpg'],
        }],
      },
      PAGE
    );
    expect(item.profileUrl).toBeUndefined();
    expect(item.logoUrl).toBeUndefined();
    expect(item.photoUrls).toEqual(['https://ydoc.tj/media/b.jpg']);
  });

  it('accepts phones as a string or an array', () => {
    const [a] = parseClinicItems({ clinics: [{ name: 'A1', phones: ['+992 98 724 05 05', '(37) 227-18-14'] }] }, PAGE);
    const [b] = parseClinicItems({ clinics: [{ name: 'B1', phone: '+992987240505' }] }, PAGE);
    expect(a.phones).toEqual(['+992 98 724 05 05', '(37) 227-18-14']);
    expect(b.phones).toEqual(['+992987240505']);
  });
});

// ---------- toRawClinic ----------
describe('toRawClinic', () => {
  const item = (o: Partial<ClinicItem> = {}): ClinicItem => ({
    name: 'Клиника «Vedanta»', phones: [], photoUrls: [], specialties: [], ...o,
  });
  const ctx = { source: 'ydoc' as const, city: 'Душанбе', pageUrl: PAGE };

  it('sourceId comes from the profile path, ignoring host prefix, query and trailing slash', () => {
    const a = toRawClinic(item({ profileUrl: 'https://ydoc.tj/dushanbe/lpu/vedanta/?utm_source=x' }), ctx)!;
    const b = toRawClinic(item({ profileUrl: 'https://www.ydoc.tj/dushanbe/lpu/vedanta' }), ctx)!;
    const c = toRawClinic(item({ profileUrl: 'https://ydoc.tj/dushanbe/lpu/vita/' }), ctx)!;
    expect(a.sourceId).toBe('/dushanbe/lpu/vedanta');
    expect(b.sourceId).toBe('/dushanbe/lpu/vedanta');
    expect(c.sourceId).toBe('/dushanbe/lpu/vita');
  });

  it('falls back to a stable name-based id when there is no profile URL', () => {
    const a = toRawClinic(item({ address: 'ул. Мехнат 10' }), ctx)!;
    const b = toRawClinic(item({ address: 'ул. Мехнат 10' }), ctx)!;
    const other = toRawClinic(item({ name: 'Клиника «Жасмин»', address: 'ул. Мехнат 10' }), ctx)!;
    expect(a.sourceId).toMatch(/^name:[0-9a-f]{12}$/);
    expect(a.sourceId).toBe(b.sourceId);
    expect(a.sourceId).not.toBe(other.sourceId);
  });

  it('fills source, city, normalized phones and image/specialty hints', () => {
    const r = toRawClinic(
      item({
        profileUrl: 'https://ydoc.tj/dushanbe/lpu/vedanta/',
        phones: ['+992 98 724 05 05', 'junk', '98 724 05 05'],
        logoUrl: 'https://ydoc.tj/media/v.png',
        photoUrls: ['https://ydoc.tj/media/1.jpg'],
        specialties: ['Кардиология', 'Хирургия'],
        website: 'vedanta.tj',
      }),
      ctx
    )!;
    expect(r.source).toBe('ydoc');
    expect(r.city).toBe('Душанбе');
    expect(r.sourceUrl).toBe('https://ydoc.tj/dushanbe/lpu/vedanta/');
    expect(r.phones).toEqual(['+992987240505']);
    expect(r.logoUrl).toBe('https://ydoc.tj/media/v.png');
    expect(r.photoUrls).toEqual(['https://ydoc.tj/media/1.jpg']);
    expect(r.specialties).toEqual(['cardiology', 'surgery']);
    expect(r.website).toBe('vedanta.tj');
  });

  it('returns null without a name', () => {
    expect(toRawClinic(item({ name: '' }), ctx)).toBeNull();
  });
});

describe('inferType', () => {
  it.each([
    ['Стоматология «Дамир»', 'dental_clinic'],
    ['Городская больница №5', 'hospital'],
    ['Роддом №2', 'maternity'],
    ['Поликлиника №8', 'polyclinic'],
    ['Диагностический центр «Нур»', 'diagnostic_center'],
    ['Клиника «Vedanta»', 'clinic'],
  ])('%s -> %s', (name, want) => {
    expect(inferType(name)).toBe(want);
  });
});

// ---------- mapSpecialties ----------
describe('mapSpecialties', () => {
  it('maps Russian labels to canonical ids, dedupes and keeps first-seen order', () => {
    expect(mapSpecialties(['Кардиолог', 'Невропатолог', 'кардиология', 'УЗИ', 'Травматология и ортопедия']))
      .toEqual(['cardiology', 'neurology', 'ultrasound', 'orthopedics']);
  });
  it('drops labels it does not recognise instead of inventing a specialty', () => {
    expect(mapSpecialties(['Астрология', ''])).toEqual([]);
  });
  it('matches ЛОР as a whole word only ("колоректальная" contains "лор")', () => {
    expect(mapSpecialties(['ЛОР'])).toEqual(['ent']);
    expect(mapSpecialties(['Колоректальная хирургия'])).toEqual(['surgery']);
  });
});

// ---------- extractWithScrapeGraph ----------
describe('extractWithScrapeGraph', () => {
  const schema = { type: 'object', properties: { clinics: { type: 'array' } } };

  it('POSTs url+prompt+schema to the v2 extract endpoint with the SGAI-APIKEY header and returns .json', async () => {
    const { f, calls } = fakeFetch(() => jsonRes({ id: 'x', json: { clinics: [{ name: 'A1' }] } }));
    const out = await extractWithScrapeGraph({
      apiKey: 'sgai-secret', url: PAGE, prompt: 'p', schema, fetchImpl: f, sleepImpl: noSleep,
    });
    expect(out).toEqual({ clinics: [{ name: 'A1' }] });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://v2-api.scrapegraphai.com/api/extract');
    expect(calls[0].init?.method).toBe('POST');
    expect((calls[0].init?.headers as Record<string, string>)['SGAI-APIKEY']).toBe('sgai-secret');
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({ url: PAGE, prompt: 'p', schema });
  });

  it('retries 429/503 with growing backoff, then succeeds', async () => {
    const seq = [jsonRes({}, 503), jsonRes({}, 429), jsonRes({ json: { clinics: [] } })];
    const { f, calls } = fakeFetch(() => seq.shift()!);
    const sleeps: number[] = [];
    const out = await extractWithScrapeGraph({
      apiKey: 'k', url: PAGE, prompt: 'p', schema, fetchImpl: f, sleepImpl: async ms => { sleeps.push(ms); },
    });
    expect(out).toEqual({ clinics: [] });
    expect(calls).toHaveLength(3);
    expect(sleeps).toHaveLength(2);
    expect(sleeps[1]).toBeGreaterThan(sleeps[0]);
  });

  it('does NOT retry a bad key (401/403): one call, clear error, no credits burned', async () => {
    for (const status of [401, 403]) {
      const { f, calls } = fakeFetch(() => jsonRes({ error: 'nope' }, status));
      await expect(
        extractWithScrapeGraph({ apiKey: 'bad', url: PAGE, prompt: 'p', schema, fetchImpl: f, sleepImpl: noSleep })
      ).rejects.toThrow(new RegExp(`${status}[\\s\\S]*SGAI_API_KEY`));
      expect(calls).toHaveLength(1);
    }
  });

  it('does NOT retry a 400 validation error', async () => {
    const { f, calls } = fakeFetch(() => jsonRes({ error: 'bad body' }, 400));
    await expect(
      extractWithScrapeGraph({ apiKey: 'k', url: PAGE, prompt: 'p', schema, fetchImpl: f, sleepImpl: noSleep })
    ).rejects.toThrow(/400/);
    expect(calls).toHaveLength(1);
  });

  it('stops after maxRetries and reports the last status', async () => {
    const { f, calls } = fakeFetch(() => jsonRes({}, 503));
    await expect(
      extractWithScrapeGraph({ apiKey: 'k', url: PAGE, prompt: 'p', schema, fetchImpl: f, sleepImpl: noSleep, maxRetries: 2 })
    ).rejects.toThrow(/503/);
    expect(calls).toHaveLength(3); // first try + 2 retries, never a 4th
  });

  it('falls back to legacy {result: ...} responses', async () => {
    const { f } = fakeFetch(() => jsonRes({ result: [{ name: 'A1' }] }));
    const out = await extractWithScrapeGraph({ apiKey: 'k', url: PAGE, prompt: 'p', schema, fetchImpl: f, sleepImpl: noSleep });
    expect(out).toEqual([{ name: 'A1' }]);
  });
});

// ---------- collectListing ----------
describe('collectListing', () => {
  const pageOf = (names: string[]) => ({
    json: { clinics: names.map(n => ({ name: n, profileUrl: `/dushanbe/lpu/${n.toLowerCase()}/` })) },
  });
  function makeFetch(pages: Record<string, string[]>) {
    return fakeFetch((url, init) => {
      if (url.endsWith('/robots.txt')) return new Response('User-agent: *\nAllow: /');
      const target = JSON.parse(String(init?.body)).url as string;
      const page = new URL(target).searchParams.get('page') ?? '1';
      return jsonRes(pageOf(pages[page] ?? []));
    });
  }

  it('walks ?page=N until a page comes back empty and merges the rows', async () => {
    const { f, calls } = makeFetch({ '1': ['Aaa', 'Bbb'], '2': ['Ccc'] });
    const res = await collectListing({
      listingUrl: PAGE, apiKey: 'k', maxPages: 10, delayMs: 0, fetchImpl: f, sleepImpl: noSleep,
    });
    expect(res.items.map(i => i.name)).toEqual(['Aaa', 'Bbb', 'Ccc']);
    expect(res.stoppedBecause).toBe('empty_page');
    const targets = apiCalls(calls).map(c => JSON.parse(String(c.init?.body)).url);
    expect(targets).toEqual([PAGE, `${PAGE}?page=2`, `${PAGE}?page=3`]);
  });

  it('stops when a page repeats rows it already returned (sites that serve the last page forever)', async () => {
    const { f, calls } = makeFetch({ '1': ['Aaa', 'Bbb'], '2': ['Bbb', 'Aaa'], '3': ['Aaa'] });
    const res = await collectListing({
      listingUrl: PAGE, apiKey: 'k', maxPages: 10, delayMs: 0, fetchImpl: f, sleepImpl: noSleep,
    });
    expect(res.items).toHaveLength(2);
    expect(res.stoppedBecause).toBe('no_new_items');
    expect(apiCalls(calls)).toHaveLength(2);
  });

  it('never exceeds maxPages', async () => {
    const { f, calls } = makeFetch({ '1': ['A1x'], '2': ['B2x'], '3': ['C3x'], '4': ['D4x'] });
    const res = await collectListing({
      listingUrl: PAGE, apiKey: 'k', maxPages: 2, delayMs: 0, fetchImpl: f, sleepImpl: noSleep,
    });
    expect(res.stoppedBecause).toBe('max_pages');
    expect(apiCalls(calls)).toHaveLength(2);
  });

  it('sends nothing to ScrapeGraph when robots.txt disallows the page', async () => {
    const { f, calls } = fakeFetch(url =>
      url.endsWith('/robots.txt') ? new Response('User-agent: *\nDisallow: /dushanbe/') : jsonRes(pageOf(['Aaa']))
    );
    const res = await collectListing({
      listingUrl: PAGE, apiKey: 'k', maxPages: 3, delayMs: 0, fetchImpl: f, sleepImpl: noSleep,
    });
    expect(res.items).toEqual([]);
    expect(res.stoppedBecause).toBe('robots');
    expect(apiCalls(calls)).toHaveLength(0);
  });

  it('serves a repeat run from the cache without any API call', async () => {
    const store = new Map<string, unknown>();
    const cache = { get: (k: string) => store.get(k), set: (k: string, v: unknown) => { store.set(k, v); } };
    const first = makeFetch({ '1': ['Aaa'] });
    await collectListing({ listingUrl: PAGE, apiKey: 'k', maxPages: 5, delayMs: 0, fetchImpl: first.f, sleepImpl: noSleep, cache });
    expect(apiCalls(first.calls).length).toBeGreaterThan(0);

    const second = makeFetch({ '1': ['SHOULD-NOT-BE-READ'] });
    const res = await collectListing({ listingUrl: PAGE, apiKey: 'k', maxPages: 5, delayMs: 0, fetchImpl: second.f, sleepImpl: noSleep, cache });
    expect(apiCalls(second.calls)).toHaveLength(0);
    expect(res.items.map(i => i.name)).toEqual(['Aaa']);
  });

  it('keeps what it already has when a later page fails, and reports the error', async () => {
    let n = 0;
    const { f } = fakeFetch(url => {
      if (url.endsWith('/robots.txt')) return new Response('User-agent: *\nAllow: /');
      n++;
      return n === 1 ? jsonRes(pageOf(['Aaa'])) : jsonRes({ error: 'x' }, 400);
    });
    const res = await collectListing({
      listingUrl: PAGE, apiKey: 'k', maxPages: 5, delayMs: 0, fetchImpl: f, sleepImpl: noSleep,
    });
    expect(res.items.map(i => i.name)).toEqual(['Aaa']);
    expect(res.stoppedBecause).toBe('error');
    expect(res.errors[0]).toMatch(/page 2/);
  });
});

// ---------- isAllowedImageUrl ----------
describe('isAllowedImageUrl', () => {
  const hosts = ['ydoc.tj', 'vedanta.tj'];
  it('allows https on an allowed host or its subdomain', () => {
    expect(isAllowedImageUrl('https://ydoc.tj/media/a.png', hosts)).toBe(true);
    expect(isAllowedImageUrl('https://cdn.ydoc.tj/a.png', hosts)).toBe(true);
    expect(isAllowedImageUrl('https://www.vedanta.tj/a.png', hosts)).toBe(true);
  });
  it.each([
    'http://ydoc.tj/a.png',
    'https://ydoc.tj.evil.com/a.png',
    'https://evilydoc.tj/a.png',
    'https://other.tj/a.png',
    'data:image/png;base64,AAAA',
    'https://localhost/a.png',
    'https://127.0.0.1/a.png',
    'https://10.0.0.5/a.png',
    'https://192.168.1.2/a.png',
    'not a url',
  ])('rejects %s', url => {
    expect(isAllowedImageUrl(url, hosts)).toBe(false);
  });
});

// ---------- short-lived signed image URLs (samt.tj serves logos from presigned S3 links, 300 s) ----------
const SIGNED =
  'https://s3.regru.cloud/samt/icons/healthfacility/75/logo.png' +
  '?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=KEY%2F20261006%2Fus-east-1%2Fs3%2Faws4_request' +
  '&X-Amz-Date=20261006T130625Z&X-Amz-Expires=300&X-Amz-SignedHeaders=host&X-Amz-Signature=abc123';

describe('signed image URLs', () => {
  it('redactSignedUrl drops the query of a presigned URL but leaves plain URLs alone', () => {
    expect(redactSignedUrl(SIGNED)).toBe('https://s3.regru.cloud/samt/icons/healthfacility/75/logo.png');
    expect(redactSignedUrl('https://ydoc.tj/media/a.png?v=3')).toBe('https://ydoc.tj/media/a.png?v=3');
    expect(redactSignedUrl(undefined)).toBeUndefined();
  });

  it('the samt config accepts its S3 logo host and still refuses unknown buckets', () => {
    expect(isAllowedImageUrl(SIGNED, SOURCE_CONFIG.samt.imageHosts)).toBe(true);
    expect(isAllowedImageUrl('https://s3.other-cloud.example/x.png', SOURCE_CONFIG.samt.imageHosts)).toBe(false);
  });

  it('collectListing returns a signed logo live but never writes it to the cache (it expires in 5 minutes)', async () => {
    const store = new Map<string, unknown>();
    const cache = { get: (k: string) => store.get(k), set: (k: string, v: unknown) => { store.set(k, v); } };
    const { f } = fakeFetch((url, init) => {
      if (url.endsWith('/robots.txt')) return new Response('User-agent: *\nAllow: /');
      const page = new URL(JSON.parse(String(init?.body)).url).searchParams.get('page') ?? '1';
      return jsonRes(
        page === '1'
          ? { json: { clinics: [{ name: 'Биомед', profileUrl: 'https://samt.tj/clinics/75', logoUrl: SIGNED }] } }
          : { json: { clinics: [] } }
      );
    });
    const res = await collectListing({
      listingUrl: 'https://samt.tj/clinics?city=1&hf_type=4', apiKey: 'k', maxPages: 3,
      delayMs: 0, fetchImpl: f, sleepImpl: noSleep, cache,
    });
    expect(res.items[0].logoUrl).toBe(SIGNED);
    expect(JSON.stringify([...store.values()])).not.toContain('X-Amz-Signature');
    expect(JSON.stringify([...store.values()])).toContain('Биомед');
  });
});
