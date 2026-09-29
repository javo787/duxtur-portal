import { describe, it, expect } from 'vitest';
import { normalizePhone, normalizePhones, stableSlug, nameKey, normalizeRaw, inferCity } from './normalize';
import { decide } from './dedupe';
import { toClinicDoc, fillEmptyPatch } from './writer';
import { parseOverpass } from './adapters/osm';
import { extractFromHtml, robotsAllows, fetchWebsiteClinics } from './adapters/website';
import { geocode } from './geocode';
import type { ExistingClinic, RawClinic } from './types';

const raw = (o: Partial<RawClinic> = {}): RawClinic => ({
  source: 'osm', sourceId: 'node/1', name: 'Клиника «Vedanta»',
  lat: 38.56, lng: 68.79, city: 'Душанбе', phones: [], ...o,
});
const existing = (o: Partial<ExistingClinic> = {}): ExistingClinic => ({
  id: 'a', status: 'pre_imported', nameRu: 'Vedanta', phones: [], city: 'Душанбе', lat: 38.5601, lng: 68.7902, ...o,
});

describe('normalize', () => {
  it('normalizes Tajik phone formats and rejects junk', () => {
    expect(normalizePhone('+992 92 000 0000')).toBe('+992920000000');
    expect(normalizePhone('92 000 0000')).toBe('+992920000000');
    expect(normalizePhone('0 92 000 0000')).toBe('+992920000000');
    expect(normalizePhone('+7 999 123 45 67')).toBeNull();
    expect(normalizePhone('123')).toBeNull();
    expect(normalizePhones('+992 37 221 0000; 92 000 0000, 999')).toEqual(['+992372210000', '+992920000000']);
  });
  it('slug is deterministic per source record', () => {
    const a = stableSlug({ name: 'Клиника «Шифо»', source: 'osm', sourceId: 'node/1' });
    expect(a).toBe(stableSlug({ name: 'Клиника «Шифо»', source: 'osm', sourceId: 'node/1' }));
    expect(a).not.toBe(stableSlug({ name: 'Клиника «Шифо»', source: 'osm', sourceId: 'node/2' }));
    expect(a).toMatch(/^klinika-shifo-[0-9a-f]{6}$/);
  });
  it('nameKey ignores quotes, legal forms and generic words', () => {
    expect(nameKey('ООО Клиника «Vedanta»')).toBe('vedanta');
  });
  it('rejects unusable records and infers city', () => {
    expect(normalizeRaw(raw({ name: 'ab' })).ok).toBe(false);
    expect(normalizeRaw(raw({ lat: 55, lng: 37 })).ok).toBe(false);
    expect(inferCity(40.28, 69.62)).toBe('Худжанд');
    expect(inferCity(39.0, 71.0)).toBeUndefined();
  });
});

describe('decide', () => {
  it('creates when nothing matches', () => {
    expect(decide(raw(), [existing({ nameRu: 'Совсем другая больница', lat: 40.28, lng: 69.6, city: 'Душанбе' })]).action).toBe('create');
  });
  it('is idempotent: same source id updates the same record', () => {
    const d = decide(raw(), [existing({ importSource: 'osm', importSourceId: 'node/1', nameRu: 'renamed' })]);
    expect(d).toMatchObject({ action: 'update', existingId: 'a' });
  });
  it('matches by similar name + nearby location', () => {
    expect(decide(raw(), [existing()]).action).toBe('update');
  });
  it('never touches claimed / approved clinics', () => {
    expect(decide(raw(), [existing({ status: 'approved' })]).action).toBe('skip_duplicate');
  });
  it('matches on shared phone', () => {
    const d = decide(raw({ name: 'Vedanta Medical', phones: ['+992920000000'], lat: undefined, lng: undefined }),
      [existing({ phones: ['+992920000000'], nameRu: 'Веданта' })]);
    expect(d.action).not.toBe('create');
  });
  it('flags several close candidates for review instead of guessing', () => {
    const d = decide(raw(), [existing({ id: 'a' }), existing({ id: 'b' })]);
    expect(d.action).toBe('review');
    expect(d.candidates).toHaveLength(2);
  });
  it('never matches across cities', () => {
    expect(decide(raw(), [existing({ city: 'Худжанд' })]).action).toBe('create');
  });
});

describe('writer', () => {
  it('builds a pre_imported doc with no rating fields and no invented translations', () => {
    const doc: any = toClinicDoc(raw({ phones: ['+992920000000'], nameLocal: { tg: 'Веданта' } }));
    expect(doc.status).toBe('pre_imported');
    expect(doc).not.toHaveProperty('rating');
    expect(doc.name).toMatchObject({ ru: 'Клиника «Vedanta»', tg: 'Веданта', uz: '' });
    expect(doc.coordinates.coordinates).toEqual([68.79, 38.56]);
    expect(doc.phone).toBe('+992920000000');
  });
  it('fill-empty patch never overwrites existing values', () => {
    const patch = fillEmptyPatch({ phone: '+992111111111', address: '', name: { ru: 'x' } },
      raw({ phones: ['+992920000000'], address: 'ул. Мехнат 10' }));
    expect(patch).not.toHaveProperty('phone');
    expect(patch.address).toBe('ул. Мехнат 10');
  });
});

describe('osm adapter', () => {
  it('parses elements, skips unnamed, uses centers for ways', () => {
    const out = parseOverpass({ elements: [
      { type: 'node', id: 1, lat: 38.56, lon: 68.79, tags: { amenity: 'dentist', name: 'Дент', phone: '+992 92 000 0000', 'addr:street': 'Рудаки', 'addr:housenumber': '5' } },
      { type: 'way', id: 2, center: { lat: 40.28, lon: 69.62 }, tags: { amenity: 'hospital', 'name:ru': 'Больница №1', 'name:tg': 'Беморхона' } },
      { type: 'node', id: 3, lat: 38.5, lon: 68.7, tags: { amenity: 'clinic' } },
    ] });
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ sourceId: 'node/1', type: 'dental_clinic', address: 'Рудаки, 5', phones: ['+992920000000'], city: 'Душанбе' });
    expect(out[1]).toMatchObject({ sourceId: 'way/2', type: 'hospital', city: 'Худжанд', nameLocal: { tg: 'Беморхона' } });
  });
});

describe('website adapter', () => {
  const html = `<html><head><script type="application/ld+json">
    {"@context":"https://schema.org","@type":"MedicalClinic","name":"Клиника Нур","telephone":"+992 37 221 0000",
     "address":{"@type":"PostalAddress","streetAddress":"ул. Айни 14","addressLocality":"Душанбе"},
     "geo":{"latitude":38.57,"longitude":68.78},"description":"LONG MARKETING TEXT"}
  </script></head><body><a href="tel:+992920000000">call</a></body></html>`;
  it('extracts facts from JSON-LD and never copies description prose', () => {
    const r = extractFromHtml(html, 'https://nur.tj/contacts')!;
    expect(r).toMatchObject({ name: 'Клиника Нур', city: 'Душанбе', address: 'ул. Айни 14', lat: 38.57, sourceId: 'nur.tj', website: 'https://nur.tj/' });
    expect(r.phones).toEqual(['+992372210000', '+992920000000']);
    expect(JSON.stringify(r)).not.toContain('MARKETING');
  });
  it('returns null when the page has no clinic data', () => {
    expect(extractFromHtml('<html><body>hi</body></html>', 'https://x.tj/')).toBeNull();
  });
  it('honours robots.txt', async () => {
    const f = (async () => new Response('User-agent: *\nDisallow: /private')) as unknown as typeof fetch;
    expect(await robotsAllows('https://a.tj/private/x', f)).toBe(false);
    expect(await robotsAllows('https://b.tj/open', f)).toBe(true);
    const res = await fetchWebsiteClinics(['https://a.tj/private/x'], { fetchImpl: f, delayMs: 0 });
    expect(res[0].skipped).toMatch(/robots/);
  });
});

describe('geocode', () => {
  const mk = (lat: string, lon: string) =>
    (async () => new Response(JSON.stringify([{ lat, lon }]))) as unknown as typeof fetch;
  it('accepts a result near the city and rejects far-away / foreign ones', async () => {
    expect(await geocode('ул. Айни 14', 'Душанбе', { fetchImpl: mk('38.57', '68.78') })).toEqual({ lat: 38.57, lng: 68.78 });
    expect(await geocode('ул. Айни 14', 'Душанбе', { fetchImpl: mk('40.28', '69.62') })).toBeNull();
    expect(await geocode('x', undefined, { fetchImpl: mk('55.7', '37.6') })).toBeNull();
  });
});
