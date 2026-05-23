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

export const ALLOWED_CLINIC_TYPES: ClinicType[] = CLINIC_TYPES.map(t => t.id) as any;
