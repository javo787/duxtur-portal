import { inferCity, normalizePhones } from '../normalize';
import type { ClinicType, RawClinic } from '../types';

/**
 * OpenStreetMap adapter (Overpass API).
 * Licence: ODbL. Anything imported from here must be attributed
 * ("© OpenStreetMap contributors") somewhere the user can see it.
 */

export const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export function buildOverpassQuery(iso = 'TJ'): string {
  return `[out:json][timeout:120];
area["ISO3166-1"="${iso}"][admin_level=2]->.a;
(
  nwr["amenity"~"^(hospital|clinic|doctors|dentist)$"](area.a);
  nwr["healthcare"~"^(hospital|clinic|doctor|dentist|centre)$"](area.a);
);
out center tags;`;
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function mapType(t: Record<string, string>): ClinicType {
  const a = t.amenity, h = t.healthcare;
  if (a === 'hospital' || h === 'hospital') return 'hospital';
  if (a === 'dentist' || h === 'dentist') return 'dental_clinic';
  return 'clinic';
}

export function parseOverpass(json: { elements?: OverpassElement[] }): RawClinic[] {
  const out: RawClinic[] = [];
  for (const el of json.elements ?? []) {
    const t = el.tags ?? {};
    const name = t['name:ru'] || t.name || t['name:tg'] || t['name:en'];
    if (!name) continue; // an unnamed pin is not a listing
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;

    const street = t['addr:street'];
    const house = t['addr:housenumber'];
    const address = [street, house].filter(Boolean).join(', ');

    out.push({
      source: 'osm',
      sourceId: `${el.type}/${el.id}`,
      sourceUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
      name,
      nameLocal: { ru: t['name:ru'], tg: t['name:tg'], uz: t['name:uz'], kk: t['name:kk'], ky: t['name:ky'] },
      type: mapType(t),
      address: address || undefined,
      city: t['addr:city'] || inferCity(lat, lng),
      lat,
      lng,
      phones: normalizePhones(t.phone || t['contact:phone'] || ''),
      website: t.website || t['contact:website'],
      email: t.email || t['contact:email'],
    });
  }
  return out;
}

export async function fetchOsmClinics(
  opts: { fetchImpl?: typeof fetch; retries?: number } = {}
): Promise<RawClinic[]> {
  const f = opts.fetchImpl ?? fetch;
  const retries = opts.retries ?? 3;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await f(OVERPASS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'duxtur.org-ingest/1.0 (contact: admin@duxtur.org)',
        },
        body: 'data=' + encodeURIComponent(buildOverpassQuery()),
      });
      if (res.status === 429 || res.status === 504) throw new Error(`Overpass busy (${res.status})`);
      if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
      const json = await res.json();
      if (json.remark && /error|timed out/i.test(json.remark)) throw new Error(`Overpass: ${json.remark}`);
      return parseOverpass(json);
    } catch (e) {
      lastErr = e;
      if (attempt < retries) await new Promise(r => setTimeout(r, 5000 * (attempt + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
