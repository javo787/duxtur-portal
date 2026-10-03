import { CLINIC_TYPES, COMMON_SPECIALTIES } from '../clinic-constants';
import {
  coordsField, emailField, Errors, facebookField, field, handleField, hoursField, imageUrlField, INSTAGRAM_HOST,
  multilingual, phoneField, pickEnum, pickMany, TELEGRAM_HOST, urlField, whatsappField,
  type Day, type DayHours, type Lang,
} from './common';

export const CLINIC_STATUSES = ['pre_imported', 'pending', 'approved', 'rejected', 'banned'] as const;
export type ClinicStatus = (typeof CLINIC_STATUSES)[number];
// Clinics use their own specialty vocabulary (not the doctor categories); the public page translates these ids.
export const SPECIALTY_KEYS: string[] = COMMON_SPECIALTIES.map(x => x.id);
const TYPE_IDS = CLINIC_TYPES.map(t => t.id);

export const MAX_BRANCH_SLOTS = 10;

export interface BranchInput {
  label: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  coordinates: { lat: number; lng: number } | null;
}

export interface ClinicInput {
  name: Record<Lang, string>;
  description: Record<Lang, string>;
  type: string;
  status: ClinicStatus;
  city: string;
  district: string;
  address: string;
  coordinates: { lat: number; lng: number } | null;
  phone: string;
  phone2: string;
  email: string;
  website: string;
  telegram: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  workingHours: Record<Day, DayHours> | null;
  specialties: string[];
  branches: BranchInput[];
  logo: string;
  coverImage: string;
  licenseNumber: string;
  markVerified: boolean;
}

export type ParseResult<T> = { ok: true; data: T } | { ok: false; errors: Errors };

export function parseClinicForm(fd: FormData): ParseResult<ClinicInput> {
  const errors: Errors = [];
  const name = multilingual(fd, 'name');
  if (name.ru.length < 3) errors.push('Название (русский) обязательно, минимум 3 символа');

  const type = pickEnum(field(fd, 'type') || 'clinic', TYPE_IDS, 'Тип', errors);
  const status = pickEnum(field(fd, 'status') || 'pre_imported', CLINIC_STATUSES, 'Статус', errors);

  const data: ClinicInput = {
    name,
    description: multilingual(fd, 'description', true),
    type: type ?? 'clinic',
    status: status ?? 'pre_imported',
    city: field(fd, 'city'),
    district: field(fd, 'district'),
    address: field(fd, 'address'),
    coordinates: coordsField(fd, errors),
    phone: phoneField(fd, 'phone', 'Телефон', errors),
    phone2: phoneField(fd, 'phone2', 'Телефон 2', errors),
    email: emailField(fd, 'email', errors),
    website: urlField(fd, 'website', 'Сайт', errors),
    telegram: handleField(fd, 'telegram', 'Telegram', TELEGRAM_HOST, errors),
    whatsapp: whatsappField(fd, 'whatsapp', errors),
    instagram: handleField(fd, 'instagram', 'Instagram', INSTAGRAM_HOST, errors),
    facebook: facebookField(fd, 'facebook', errors),
    workingHours: hoursField(fd, errors),
    specialties: pickMany(fd, 'specialties', SPECIALTY_KEYS),
    branches: branchesField(fd, errors),
    logo: imageUrlField(fd, 'logo', 'Логотип', errors),
    coverImage: imageUrlField(fd, 'coverImage', 'Обложка', errors),
    licenseNumber: field(fd, 'licenseNumber'),
    markVerified: fd.get('markVerified') === 'on',
  };
  return errors.length ? { ok: false, errors } : { ok: true, data };
}

/**
 * Branch rows are fixed slots in the form (branch_0_*, branch_1_* ...), so no client JS is needed.
 * Completely empty rows are ignored; a row with anything filled in must have an address.
 */
export function branchesField(fd: FormData, errors: Errors): BranchInput[] {
  const out: BranchInput[] = [];
  for (let i = 0; i < MAX_BRANCH_SLOTS; i++) {
    const k = (n: string) => `branch_${i}_${n}`;
    const label = field(fd, k('label'));
    const address = field(fd, k('address'));
    const city = field(fd, k('city'));
    const district = field(fd, k('district'));
    const phoneRaw = field(fd, k('phone'));
    const latRaw = field(fd, k('lat'));
    const lngRaw = field(fd, k('lng'));
    if (![label, address, city, district, phoneRaw, latRaw, lngRaw].some(Boolean)) continue;

    const n = out.length + 1;
    if (!address) errors.push(`Филиал ${n}: укажите адрес`);
    const sub: Errors = [];
    const phone = phoneField(fd, k('phone'), `Филиал ${n}: телефон`, sub);
    const coordinates = coordsField(fieldsAs(fd, i), sub);
    errors.push(...sub.map(e => e.startsWith('Координаты') ? `Филиал ${n}: ${e.toLowerCase()}` : e));
    out.push({ label, address, city, district, phone, coordinates });
  }
  return out;
}

/** coordsField reads plain lat/lng keys; expose a branch slot under those names. */
function fieldsAs(fd: FormData, i: number): FormData {
  const f = new FormData();
  f.set('lat', String(fd.get(`branch_${i}_lat`) ?? ''));
  f.set('lng', String(fd.get(`branch_${i}_lng`) ?? ''));
  return f;
}

/** Which of the 8 "page looks complete" items are filled. Used for the admin list and progress. */
export function clinicCompleteness(c: {
  phone?: string; website?: string; logo?: string; description?: { ru?: string };
  specialties?: string[]; coordinates?: { lat?: number | null }; address?: string;
  hoursFilled?: boolean;
}): { done: number; total: number; missing: string[] } {
  const checks: [string, boolean][] = [
    ['телефон', !!c.phone],
    ['адрес', !!c.address],
    ['координаты', typeof c.coordinates?.lat === 'number'],
    ['сайт', !!c.website],
    ['часы', !!c.hoursFilled],
    ['специальности', !!c.specialties?.length],
    ['описание', !!c.description?.ru],
    ['логотип', !!c.logo],
  ];
  const missing = checks.filter(([, ok]) => !ok).map(([n]) => n);
  return { done: checks.length - missing.length, total: checks.length, missing };
}
