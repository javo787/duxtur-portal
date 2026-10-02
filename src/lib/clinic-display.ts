import { COMMON_SPECIALTIES } from './clinic-constants';

/**
 * Imported clinics are identified by status. The `dataSource` field only exists on newer
 * records, so older imports (no dataSource) were never flagged as unverified or claimable.
 */
export function isUnverifiedImport(clinic: { status?: string }): boolean {
  return clinic.status === 'pre_imported';
}

/**
 * Clinic specialties are stored as ids ('surgery') by newer code and as Russian labels
 * ('Хирургия') by older code. Returns the id when it is a known specialty, otherwise null.
 */
export function specialtyId(value: string): string | null {
  const v = value.trim();
  const hit = COMMON_SPECIALTIES.find(s => s.id === v || s.label.toLowerCase() === v.toLowerCase());
  return hit ? hit.id : null;
}

/** Social handles are stored bare (no @, no URL); build the public links. */
export const telegramUrl = (handle: string) => `https://t.me/${handle.replace(/^@/, '')}`;
export const instagramUrl = (handle: string) => `https://instagram.com/${handle.replace(/^@/, '')}`;
export const whatsappUrl = (digits: string) => `https://wa.me/${digits.replace(/\D/g, '')}`;

/** Display form of a website: host without protocol and "www.". */
export function websiteHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** Only http(s) links are rendered as clickable (guards against javascript: URLs in stored data). */
export function safeHttpUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * The listing filter used to send the Russian label ("Хирургия"), while clinics saved from the
 * owner dashboard and the admin editor store ids ("surgery"). Normalize a URL param to the id.
 * Unknown values are returned unchanged so they simply match nothing.
 */
export function normalizeSpecialtyParam(param?: string): string | undefined {
  if (!param) return undefined;
  return specialtyId(param) ?? param;
}

/** Values to match in `specialties`: both the id and the legacy Russian label. */
export function specialtyMatchValues(param: string): string[] {
  const id = specialtyId(param);
  if (!id) return [param];
  const label = COMMON_SPECIALTIES.find(s => s.id === id)?.label;
  return label ? [id, label] : [id];
}
