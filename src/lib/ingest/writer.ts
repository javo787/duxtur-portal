import { stableSlug } from './normalize';
import type { ClinicType, Lang, RawClinic } from './types';

const LANGS: Lang[] = ['ru', 'tg', 'uz', 'kk', 'ky'];

function multilingual(raw: RawClinic) {
  const out: Record<Lang, string> = { ru: raw.name, tg: '', uz: '', kk: '', ky: '' };
  // Only what the source itself provides. Never machine-translate names:
  // the UI already falls back to `name.ru` when a language is empty.
  for (const l of LANGS) if (raw.nameLocal?.[l]) out[l] = raw.nameLocal[l]!;
  return out;
}

/** Full document for a brand-new pre_imported clinic. No rating fields at all. */
export function toClinicDoc(raw: RawClinic, now = new Date()) {
  const hasCoords = typeof raw.lat === 'number' && typeof raw.lng === 'number';
  return {
    name: multilingual(raw),
    slug: stableSlug(raw),
    type: (raw.type ?? 'clinic') as ClinicType,
    status: 'pre_imported',
    dataSource: 'scraped',
    importSource: raw.source,
    importSourceId: raw.sourceId,
    importSourceUrl: raw.sourceUrl ?? '',
    importedAt: now,
    city: raw.city ?? '',
    address: raw.address ?? '',
    phone: raw.phones?.[0] ?? '',
    phone2: raw.phones?.[1] ?? '',
    website: raw.website ?? '',
    email: raw.email ?? '',
    ...(hasCoords
      ? {
          coordinates: {
            lat: raw.lat,
            lng: raw.lng,
            type: 'Point' as const,
            coordinates: [raw.lng!, raw.lat!],
          },
        }
      : {}),
  };
}

interface ExistingDoc {
  name?: Partial<Record<Lang, string>>;
  coordinates?: { lat?: number };
  city?: string;
  address?: string;
  phone?: string;
  phone2?: string;
  website?: string;
  email?: string;
  importSourceId?: string;
}

/**
 * $set patch for an existing pre_imported clinic: fills EMPTY fields only,
 * so a re-run can enrich a record but never overwrite manual edits.
 */
export function fillEmptyPatch(existing: ExistingDoc, raw: RawClinic): Record<string, unknown> {
  const doc = toClinicDoc(raw);
  const patch: Record<string, unknown> = {};
  const empty = (v: unknown) => v === undefined || v === null || v === '';

  for (const f of ['city', 'address', 'phone', 'phone2', 'website', 'email'] as const) {
    if (empty(existing[f]) && !empty(doc[f])) patch[f] = doc[f];
  }
  for (const l of LANGS) {
    if (empty(existing.name?.[l]) && !empty(doc.name[l])) patch[`name.${l}`] = doc.name[l];
  }
  if (empty(existing.coordinates?.lat) && 'coordinates' in doc) patch.coordinates = doc.coordinates;
  if (empty(existing.importSourceId)) {
    patch.importSource = doc.importSource;
    patch.importSourceId = doc.importSourceId;
    patch.importSourceUrl = doc.importSourceUrl;
  }
  return patch;
}
