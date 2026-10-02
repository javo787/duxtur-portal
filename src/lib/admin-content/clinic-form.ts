import { CLINIC_TYPES, COMMON_SPECIALTIES } from '../clinic-constants';
import {
  coordsField, emailField, Errors, field, handleField, hoursField, imageUrlField, INSTAGRAM_HOST,
  multilingual, phoneField, pickEnum, pickMany, TELEGRAM_HOST, urlField, whatsappField,
  type Day, type DayHours, type Lang,
} from './common';

export const CLINIC_STATUSES = ['pre_imported', 'pending', 'approved', 'rejected', 'banned'] as const;
export type ClinicStatus = (typeof CLINIC_STATUSES)[number];
// Clinics use their own specialty vocabulary (not the doctor categories); the public page translates these ids.
export const SPECIALTY_KEYS: string[] = COMMON_SPECIALTIES.map(x => x.id);
const TYPE_IDS = CLINIC_TYPES.map(t => t.id);

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
  workingHours: Record<Day, DayHours> | null;
  specialties: string[];
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
    workingHours: hoursField(fd, errors),
    specialties: pickMany(fd, 'specialties', SPECIALTY_KEYS),
    logo: imageUrlField(fd, 'logo', 'Логотип', errors),
    coverImage: imageUrlField(fd, 'coverImage', 'Обложка', errors),
    licenseNumber: field(fd, 'licenseNumber'),
    markVerified: fd.get('markVerified') === 'on',
  };
  return errors.length ? { ok: false, errors } : { ok: true, data };
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
