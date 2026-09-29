import { CITY_CENTERS, haversineMeters, inTajikistan } from './normalize';

/**
 * Nominatim geocoder, used only for records that arrive with an address but no
 * coordinates. A wrong pin is worse than no pin, so results are rejected unless
 * they are inside Tajikistan and, when the city is known, within 30 km of it.
 * Nominatim policy: identify yourself, max 1 req/sec, cache results.
 */
export async function geocode(
  address: string,
  city: string | undefined,
  opts: { fetchImpl?: typeof fetch; cache?: Map<string, { lat: number; lng: number } | null> } = {}
): Promise<{ lat: number; lng: number } | null> {
  const f = opts.fetchImpl ?? fetch;
  const cache = opts.cache ?? new Map();
  const key = `${address}|${city ?? ''}`.toLowerCase();
  if (cache.has(key)) return cache.get(key) ?? null;

  const q = [address, city, 'Tajikistan'].filter(Boolean).join(', ');
  let result: { lat: number; lng: number } | null = null;
  try {
    const res = await f(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=tj&q=${encodeURIComponent(q)}`,
      { headers: { 'User-Agent': 'duxtur.org-ingest/1.0 (contact: admin@duxtur.org)' } }
    );
    const data = await res.json();
    if (data?.[0]) {
      const p = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      const center = CITY_CENTERS.find(c => c.name === city);
      const near = !center || haversineMeters(p, center) <= 30_000;
      if (inTajikistan(p.lat, p.lng) && near) result = p;
    }
  } catch { /* leave null */ }

  cache.set(key, result);
  return result;
}
