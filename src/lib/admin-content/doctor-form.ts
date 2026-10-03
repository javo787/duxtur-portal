import {
  coordsField, Errors, facebookField, field, handleField, imageUrlField, INSTAGRAM_HOST, multilingual, numberField,
  phoneField, pickEnum, pickMany, TELEGRAM_HOST, whatsappField, type Lang,
} from './common';
import type { ParseResult } from './clinic-form';
import { instagramUrl, telegramUrl, whatsappUrl } from '../clinic-display';

export const DOCTOR_STATUSES = ['pre_imported', 'pending', 'approved', 'rejected', 'banned'] as const;
export type DoctorStatus = (typeof DOCTOR_STATUSES)[number];
export const CONSULTATION_TYPES = ['in_person', 'online', 'home_visit'] as const;

export interface DoctorInput {
  name: string;
  specialty: Record<Lang, string>;
  workplace: Record<Lang, string>;
  bio: Record<Lang, string>;
  status: DoctorStatus;
  phone: string;
  city: string;
  district: string;
  address: string;
  coordinates: { lat: number; lng: number } | null;
  clinicName: string;
  clinicId: string | null;
  experience: number;
  price: number;
  languages: string[];
  consultationTypes: string[];
  acceptsNewPatients: boolean;
  workingHours: string;
  licenseNumber: string;
  image: string;
  instagram: string;
  telegram: string;
  whatsapp: string;
  facebook: string;
}

const toUrl = (value: string, build: (v: string) => string) => (value ? build(value) : '');

export function parseDoctorForm(fd: FormData): ParseResult<DoctorInput> {
  const errors: Errors = [];
  const name = field(fd, 'name');
  if (name.length < 3) errors.push('Имя врача обязательно, минимум 3 символа');

  const specialty = multilingual(fd, 'specialty');
  if (!specialty.ru) errors.push('Специальность (русский) обязательна');

  const status = pickEnum(field(fd, 'status') || 'pre_imported', DOCTOR_STATUSES, 'Статус', errors);

  const clinicIdRaw = field(fd, 'clinicId');
  if (clinicIdRaw && !/^[a-f0-9]{24}$/i.test(clinicIdRaw)) errors.push('Клиника: некорректный идентификатор');

  const languages = field(fd, 'languages')
    .split(/[,;]/)
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 10);

  const data: DoctorInput = {
    name,
    specialty,
    workplace: multilingual(fd, 'workplace'),
    bio: multilingual(fd, 'bio', true),
    status: status ?? 'pre_imported',
    phone: phoneField(fd, 'phone', 'Телефон', errors),
    city: field(fd, 'city'),
    district: field(fd, 'district'),
    address: field(fd, 'address'),
    coordinates: coordsField(fd, errors),
    clinicName: field(fd, 'clinicName'),
    clinicId: clinicIdRaw && /^[a-f0-9]{24}$/i.test(clinicIdRaw) ? clinicIdRaw : null,
    experience: numberField(fd, 'experience', 'Стаж (лет)', 0, 70, errors),
    price: numberField(fd, 'price', 'Цена приёма', 0, 1_000_000, errors),
    languages,
    consultationTypes: pickMany(fd, 'consultationTypes', CONSULTATION_TYPES),
    acceptsNewPatients: fd.get('acceptsNewPatients') === 'on',
    workingHours: field(fd, 'workingHours'),
    licenseNumber: field(fd, 'licenseNumber'),
    image: imageUrlField(fd, 'image', 'Фото', errors),
    // Doctor profiles store full URLs: the public doctor page uses these values directly as links.
    instagram: toUrl(handleField(fd, 'instagram', 'Instagram', INSTAGRAM_HOST, errors), instagramUrl),
    telegram: toUrl(handleField(fd, 'telegram', 'Telegram', TELEGRAM_HOST, errors), telegramUrl),
    whatsapp: toUrl(whatsappField(fd, 'whatsapp', errors), whatsappUrl),
    facebook: facebookField(fd, 'facebook', errors),
  };
  return errors.length ? { ok: false, errors } : { ok: true, data };
}
