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

export interface WorkingHoursDay {
  open: string;
  close: string;
  isWorking: boolean;
}

export interface ClinicWorkingHours {
  mon?: WorkingHoursDay;
  tue?: WorkingHoursDay;
  wed?: WorkingHoursDay;
  thu?: WorkingHoursDay;
  fri?: WorkingHoursDay;
  sat?: WorkingHoursDay;
  sun?: WorkingHoursDay;
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
  address?: string;
  district?: string;
  phone?: string;
  workingHours?: ClinicWorkingHours;
}

export const ALLOWED_CLINIC_TYPES: ClinicType[] = CLINIC_TYPES.map(t => t.id);

export const COMMON_SPECIALTIES = [
  { id: 'cardiology',    label: 'Кардиология',    emoji: '❤️' },
  { id: 'neurology',     label: 'Неврология',     emoji: '🧠' },
  { id: 'dentistry',     label: 'Стоматология',   emoji: '🦷' },
  { id: 'pediatrics',    label: 'Педиатрия',      emoji: '👶' },
  { id: 'dermatology',   label: 'Дерматология',   emoji: '✨' },
  { id: 'ophthalmology', label: 'Офтальмология',  emoji: '👁️' },
  { id: 'surgery',       label: 'Хирургия',       emoji: '🔪' },
  { id: 'gynecology',    label: 'Гинекология',    emoji: '🤰' },
  { id: 'ultrasound',    label: 'УЗИ',            emoji: '🌊' },
  { id: 'mri',           label: 'МРТ',            emoji: '🧲' },
  { id: 'tests',         label: 'Анализы',        emoji: '🧪' },
  { id: 'general',       label: 'Общая медицина', emoji: '🩺' },
  { id: 'endocrinology', label: 'Эндокринология', emoji: '🦋' },
  { id: 'urology',       label: 'Урология',       emoji: '💧' },
  { id: 'orthopedics',   label: 'Травматология и ортопедия', emoji: '🦴' },
  { id: 'gastroenterology', label: 'Гастроэнтерология', emoji: '🍽️' },
  { id: 'ent',           label: 'Оториноларингология (ЛОР)', emoji: '👂' },
  { id: 'oncology',      label: 'Онкология',      emoji: '🎗️' },
  { id: 'genetics',      label: 'Генетика',       emoji: '🧬' },
  { id: 'physiotherapy', label: 'Физиотерапия',   emoji: '💆' }
];
