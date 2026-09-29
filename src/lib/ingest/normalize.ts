import { createHash } from 'crypto';
import type { RawClinic } from './types';

// Same invisible-character class the Clinic model's pre('validate') hook strips.
const INVISIBLE =
  /[\u0000-\u001F\u007F-\u009F\u00AD\u0600-\u0604\u070F\u17B4\u17B5\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF]/g;

export function cleanText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(INVISIBLE, ' ').replace(/\s+/g, ' ').trim();
}

/** Tajikistan numbers -> "+992XXXXXXXXX". Returns null when it can't be trusted. */
export function normalizePhone(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  let digits = input.replace(/[^\d+]/g, '');
  const hadPlus = digits.startsWith('+');
  digits = digits.replace(/\+/g, '');
  if (!digits) return null;
  if (digits.startsWith('00992')) digits = digits.slice(2);
  if (digits.startsWith('992') && digits.length === 12) return '+' + digits;
  if (!hadPlus && digits.length === 9) return '+992' + digits; // local mobile/landline
  if (!hadPlus && digits.length === 10 && digits.startsWith('0')) return '+992' + digits.slice(1);
  return null; // foreign or malformed: don't guess
}

export function normalizePhones(input: unknown): string[] {
  const parts = typeof input === 'string' ? input.split(/[;,\/]|\s{2,}/) : [];
  const out = new Set<string>();
  for (const p of parts) {
    const n = normalizePhone(p);
    if (n) out.add(n);
  }
  return [...out];
}

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  ӣ: 'i', ӯ: 'u', ҳ: 'h', қ: 'q', ғ: 'g', ҷ: 'j', ң: 'n', ү: 'u', ұ: 'u', ө: 'o', ә: 'a', і: 'i',
};

export function transliterate(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map(c => TRANSLIT[c] ?? c)
    .join('');
}

/** Deterministic slug: same source record => same slug on every run. */
export function stableSlug(raw: Pick<RawClinic, 'name' | 'source' | 'sourceId'>): string {
  const base = transliterate(cleanText(raw.name))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/g, '');
  const hash = createHash('sha1').update(`${raw.source}:${raw.sourceId}`).digest('hex').slice(0, 6);
  return `${base || 'clinic'}-${hash}`;
}

// JS `\b` only knows ASCII word characters, so it silently fails on Cyrillic.
// Use explicit Unicode-aware boundaries instead.
function wordsRegex(words: string[]): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${words.join('|')})(?![\\p{L}\\p{N}])\\.?`, 'giu');
}

const LEGAL_FORMS = wordsRegex(['ооо', 'одо', 'оао', 'зао', 'чп', 'гуз', 'ггуз', 'гу', 'мчж', 'ҷсп', 'llc', 'ltd']);
const GENERIC_WORDS = wordsRegex([
  'клиника', 'клиники', 'медицинский', 'медицинская', 'центр', 'больница', 'поликлиника',
  'стоматология', 'стоматологическая', 'clinic', 'medical', 'center', 'centre', 'hospital', 'dental',
]);
const ADDRESS_WORDS = wordsRegex(['ул', 'улица', 'просп', 'проспект', 'пр', 'д', 'дом', 'street', 'st']);

/** Key used only for matching, never stored. */
export function nameKey(name: string): string {
  const base = cleanText(name).toLowerCase().replace(/[«»"'`“”„()]/g, ' ');
  const stripped = base.replace(LEGAL_FORMS, ' ').replace(GENERIC_WORDS, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  return stripped || base.replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function addressKey(address?: string): string {
  return cleanText(address ?? '')
    .toLowerCase()
    .replace(ADDRESS_WORDS, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function inTajikistan(lat?: number, lng?: number): boolean {
  return (
    typeof lat === 'number' && typeof lng === 'number' &&
    lat >= 36.6 && lat <= 41.1 && lng >= 67.3 && lng <= 75.2
  );
}

// City names follow the convention already used in the DB (Russian).
export const CITY_CENTERS: { name: string; lat: number; lng: number }[] = [
  { name: 'Душанбе', lat: 38.5598, lng: 68.787 },
  { name: 'Худжанд', lat: 40.2826, lng: 69.622 },
  { name: 'Бохтар', lat: 37.8364, lng: 68.7803 },
  { name: 'Куляб', lat: 37.9146, lng: 69.7846 },
  { name: 'Истаравшан', lat: 39.9095, lng: 69.0047 },
  { name: 'Пенджикент', lat: 39.4956, lng: 67.6092 },
  { name: 'Хорог', lat: 37.4897, lng: 71.5531 },
  { name: 'Турсунзаде', lat: 38.5113, lng: 68.2306 },
  { name: 'Вахдат', lat: 38.5583, lng: 69.0136 },
  { name: 'Канибадам', lat: 40.29, lng: 70.43 },
  { name: 'Исфара', lat: 40.125, lng: 70.625 },
  { name: 'Гиссар', lat: 38.525, lng: 68.55 },
];

export function inferCity(lat?: number, lng?: number, maxKm = 15): string | undefined {
  if (!inTajikistan(lat, lng)) return undefined;
  let best: { name: string; d: number } | undefined;
  for (const c of CITY_CENTERS) {
    const d = haversineMeters({ lat: lat!, lng: lng! }, c);
    if (!best || d < best.d) best = { name: c.name, d };
  }
  return best && best.d <= maxKm * 1000 ? best.name : undefined;
}

/** Clean a raw record. Returns null (with a reason) when it isn't importable. */
export function normalizeRaw(raw: RawClinic): { ok: true; value: RawClinic } | { ok: false; reason: string } {
  const name = cleanText(raw.name);
  if (name.length < 3) return { ok: false, reason: 'name too short or missing' };
  if (!raw.sourceId) return { ok: false, reason: 'missing sourceId' };

  const hasCoords = typeof raw.lat === 'number' && typeof raw.lng === 'number';
  if (hasCoords && !inTajikistan(raw.lat, raw.lng)) return { ok: false, reason: 'coordinates outside Tajikistan' };

  const website = cleanText(raw.website ?? '');
  const nameLocal: RawClinic['nameLocal'] = {};
  for (const [k, v] of Object.entries(raw.nameLocal ?? {})) {
    const c = cleanText(v);
    if (c) nameLocal[k as keyof typeof nameLocal] = c;
  }

  return {
    ok: true,
    value: {
      ...raw,
      name,
      nameLocal,
      address: cleanText(raw.address ?? '') || undefined,
      city: cleanText(raw.city ?? '') || (hasCoords ? inferCity(raw.lat, raw.lng) : undefined),
      phones: [...new Set((raw.phones ?? []).map(p => normalizePhone(p)).filter((p): p is string => !!p))],
      website: /^https?:\/\//i.test(website) ? website : website ? `https://${website}` : undefined,
      email: cleanText(raw.email ?? '').toLowerCase() || undefined,
    },
  };
}
