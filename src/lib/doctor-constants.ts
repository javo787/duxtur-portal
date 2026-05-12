// src/lib/doctor-constants.ts

export const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  cardiology:     { ru: 'Кардиология',    uz: 'Kardiologiya' },
  neurology:      { ru: 'Неврология',     uz: 'Nevrologiya' },
  dentistry:      { ru: 'Стоматология',   uz: 'Stomatologiya' },
  pediatrics:     { ru: 'Педиатрия',      uz: 'Pediatriya' },
  dermatology:    { ru: 'Дерматология',   uz: 'Dermatologiya' },
  ophthalmology:  { ru: 'Офтальмология',  uz: 'Oftalmologiya' },
  surgery:        { ru: 'Хирургия',       uz: 'Jarrohlik' },
  gynecology:     { ru: 'Гинекология',    uz: 'Ginekologiya' },
  general:        { ru: 'Общая медицина', uz: 'Umumiy tibbiyot' },
};

export const CATEGORY_COLORS: Record<string, string> = {
  cardiology:    'bg-rose-50 text-rose-700 border-rose-200',
  neurology:     'bg-violet-50 text-violet-700 border-violet-200',
  dentistry:     'bg-sky-50 text-sky-700 border-sky-200',
  pediatrics:    'bg-amber-50 text-amber-700 border-amber-200',
  dermatology:   'bg-pink-50 text-pink-700 border-pink-200',
  ophthalmology: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  surgery:       'bg-slate-50 text-slate-700 border-slate-200',
  gynecology:    'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  general:       'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const CATEGORY_GRADIENTS: Record<string, { from: string; to: string }> = {
  cardiology:    { from: '#991b1b', to: '#0f2a52' },
  neurology:     { from: '#5b21b6', to: '#0f2a52' },
  dentistry:     { from: '#0369a1', to: '#0f2a52' },
  pediatrics:    { from: '#d97706', to: '#0f2a52' },
  dermatology:   { from: '#be185d', to: '#0f2a52' },
  ophthalmology: { from: '#0891b2', to: '#0f2a52' },
  surgery:       { from: '#334155', to: '#0a1628' },
  gynecology:    { from: '#9d174d', to: '#0f2a52' },
  general:       { from: '#0f766e', to: '#0f2a52' },
};
