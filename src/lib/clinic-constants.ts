export const ALLOWED_CITIES = [
  'Душанбе', 'Худжанд', 'Куляб', 'Бохтар',
  'Ташкент', 'Самарканд', 'Алматы', 'Бишкек', 'Астана'
];

export const CLINIC_TYPES = [
  { id: 'clinic',            label: 'Клиника',                emoji: '🏥' },
  { id: 'hospital',          label: 'Больница',               emoji: '🏨' },
  { id: 'diagnostic_center', label: 'Диагностический центр',  emoji: '🔬' },
  { id: 'dental_clinic',     label: 'Стоматология',           emoji: '🦷' },
  { id: 'eye_clinic',        label: 'Офтальмология',          emoji: '👁️' },
  { id: 'maternity',         label: 'Родильный дом',          emoji: '👶' },
  { id: 'rehabilitation',    label: 'Реабилитация',           emoji: '🤸' },
  { id: 'polyclinic',        label: 'Поликлиника',            emoji: '🏢' },
] as const;

export type ClinicType = typeof CLINIC_TYPES[number]['id'];

export interface ClinicTypeOption {
  id: ClinicType;
  label: string;
  emoji: string;
}

export interface ClinicRating {
  avg: number;
  count: number;
}

export interface MultilingualName {
  ru: string;
  uz?: string;
  tg?: string;
  kk?: string;
  ky?: string;
}

export interface ClinicDocument {
  _id: string;
  name: MultilingualName;
  slug: string;
  type: ClinicType;
  city: string;
  logo?: string;
  coverImage?: string;
  rating: ClinicRating;
  doctorIds?: string[];
  doctorCount?: number;
  specialties?: string[];
}

export const ALLOWED_CLINIC_TYPES: ClinicType[] = CLINIC_TYPES.map(t => t.id);
