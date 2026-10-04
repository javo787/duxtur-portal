import type { SVGProps } from 'react';

export interface MultilingualString {
  ru: string;
  uz: string;
  tg: string;
  kk: string;
  ky: string;
}

export interface ClinicBranch {
  _id?: string;
  label?: string;
  address: string;
  city?: string;
  phone?: string;
  coordinates?: { lat?: number; lng?: number };
}

export interface ClinicView {
  name: MultilingualString;
  slug: string;
  type: string;
  status?: string;
  description?: MultilingualString;
  quote?: MultilingualString;
  history?: MultilingualString;
  logo?: string;
  coverImage?: string;
  photos?: string[];
  city?: string;
  address?: string;
  coordinates?: { lat?: number; lng?: number };
  phone?: string;
  phone2?: string;
  whatsapp?: string;
  telegram?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  email?: string;
  workingHours?: Record<string, { open: string; close: string; isWorking: boolean }>;
  specialties?: string[];
  branches?: ClinicBranch[];
  services?: { name: MultilingualString; price: number; currency: string }[];
  rating?: { avg: number; count: number };
}

/** Text in the requested language, falling back to Russian. `lang` says which one was used (for the lang attribute). */
export function pick(obj: Partial<MultilingualString> | undefined, lang: string): { text: string; lang: string } {
  const own = obj?.[lang as keyof MultilingualString];
  if (own) return { text: own, lang };
  return { text: obj?.ru ?? '', lang: 'ru' };
}

export function mapsUrl(p: { lat?: number; lng?: number; address?: string; city?: string }): string | null {
  const q =
    typeof p.lat === 'number' && typeof p.lng === 'number'
      ? `${p.lat},${p.lng}`
      : [p.address, p.city].filter(Boolean).join(', ');
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]!.toUpperCase())
    .join('');
}

/** Shared button looks: one primary, one quiet. 48px minimum touch target. */
export const btnPrimary =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-[0.9375rem] font-semibold text-primary-foreground transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
export const btnQuiet =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 text-[0.9375rem] font-semibold transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

export function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 448 512" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.7 17.8 69.7 27.2 106.2 27.2h.1c122.3 0 222-99.6 222-222 0-59.3-23-115.1-65.1-157.1zM223.9 445.9c-33.1 0-65.7-8.9-94.1-25.7l-6.7-4-69.8 18.3L72 365.9l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-82.7 184.6-184.5 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18s-8.8-2.8-12.4 2.8-14.1 18-17.3 21.6-6.4 4.1-12 1.4c-5.5-2.8-23.4-8.6-44.5-27.4-16.4-14.6-27.5-32.7-30.7-38.2-3.2-5.5-.3-8.5 2.5-11.2 2.5-2.5 5.5-6.4 8.3-9.6 2.8-3.2 3.7-5.5 5.5-9.2 1.8-3.7.9-6.9-.5-9.6-1.4-2.8-12.4-29.9-17-41.1-4.5-10.9-9.1-9.4-12.4-9.6-3.2-.1-6.9-.1-10.6-.1-3.7 0-9.6 1.4-14.6 6.9-5 5.5-19.2 18.8-19.2 45.8s19.7 53 22.5 56.7c2.8 3.7 38.8 59.3 94.1 83.1 13.2 5.7 23.4 9.1 31.4 11.7 13.2 4.2 25.2 3.6 34.8 2.2 10.6-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
    </svg>
  );
}
