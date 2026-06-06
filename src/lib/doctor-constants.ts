// src/lib/doctor-constants.ts

// Типизация для строгой проверки при редактировании
export interface CategoryConfig {
  labels: Record<string, string>;          // локализованные названия
  colorClasses: string;                    // tailwind-классы (bg, text, border)
  gradient: { from: string; to: string };  // цвета для градиентных фонов
  icon: string;                            // emoji-иконка
}

// Единый источник всех данных о специальностях
export const CATEGORIES = {
  cardiology: {
    labels: { ru: 'Кардиология', uz: 'Kardiologiya', en: 'Cardiology' },
    colorClasses: 'bg-rose-50 text-rose-700 border-rose-200',
    gradient: { from: '#991b1b', to: '#0f2a52' },
    icon: '❤️',
  },
  neurology: {
    labels: { ru: 'Неврология', uz: 'Nevrologiya', en: 'Neurology' },
    colorClasses: 'bg-violet-50 text-violet-700 border-violet-200',
    gradient: { from: '#5b21b6', to: '#0f2a52' },
    icon: '🧠',
  },
  dentistry: {
    labels: { ru: 'Стоматология', uz: 'Stomatologiya', en: 'Dentistry' },
    colorClasses: 'bg-sky-50 text-sky-700 border-sky-200',
    gradient: { from: '#0369a1', to: '#0f2a52' },
    icon: '🦷',
  },
  pediatrics: {
    labels: { ru: 'Педиатрия', uz: 'Pediatriya', en: 'Pediatrics' },
    colorClasses: 'bg-amber-50 text-amber-700 border-amber-200',
    gradient: { from: '#d97706', to: '#0f2a52' },
    icon: '👶',
  },
  dermatology: {
    labels: { ru: 'Дерматология', uz: 'Dermatologiya', en: 'Dermatology' },
    colorClasses: 'bg-pink-50 text-pink-700 border-pink-200',
    gradient: { from: '#be185d', to: '#0f2a52' },
    icon: '🩺',
  },
  ophthalmology: {
    labels: { ru: 'Офтальмология', uz: 'Oftalmologiya', en: 'Ophthalmology' },
    colorClasses: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    gradient: { from: '#0891b2', to: '#0f2a52' },
    icon: '👁️',
  },
  surgery: {
    labels: { ru: 'Хирургия', uz: 'Jarrohlik', en: 'Surgery' },
    colorClasses: 'bg-slate-50 text-slate-700 border-slate-200',
    gradient: { from: '#334155', to: '#0a1628' },
    icon: '⚕️',
  },
  gynecology: {
    labels: { ru: 'Гинекология', uz: 'Ginekologiya', en: 'Gynecology' },
    colorClasses: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    gradient: { from: '#9d174d', to: '#0f2a52' },
    icon: '🌸',
  },
  general: {
    labels: { ru: 'Общая медицина', uz: 'Umumiy tibbiyot', en: 'General Medicine' },
    colorClasses: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    gradient: { from: '#0f766e', to: '#0f2a52' },
    icon: '🏥',
  },
} as const satisfies Record<string, CategoryConfig>;

// Производные константы для обратной совместимости с существующим кодом

// 1. Старый формат CATEGORY_LABELS (ru, uz)
export const CATEGORY_LABELS: Record<string, Record<string, string>> = {};
for (const [key, cfg] of Object.entries(CATEGORIES)) {
  CATEGORY_LABELS[key] = cfg.labels;
}

// 2. Строковые классы Tailwind (как было раньше)
export const CATEGORY_COLORS: Record<string, string> = {};
for (const [key, cfg] of Object.entries(CATEGORIES)) {
  CATEGORY_COLORS[key] = cfg.colorClasses;
}

// 3. Градиенты (отдельно)
export const CATEGORY_GRADIENTS: Record<string, { from: string; to: string }> = {};
for (const [key, cfg] of Object.entries(CATEGORIES)) {
  CATEGORY_GRADIENTS[key] = cfg.gradient;
}

// 4. Иконки
export const SPECIALTY_ICONS: Record<string, string> = {};
for (const [key, cfg] of Object.entries(CATEGORIES)) {
  SPECIALTY_ICONS[key] = cfg.icon;
}

// 5. Для компонента DoctorCard, где нужны отдельные bg, text, border
export const SPECIALTY_COLORS: Record<string, { bg: string; text: string; border: string }> = {};
for (const [key, cfg] of Object.entries(CATEGORIES)) {
  const [bg, text, border] = cfg.colorClasses.split(' ');
  SPECIALTY_COLORS[key] = { bg, text, border };
}
