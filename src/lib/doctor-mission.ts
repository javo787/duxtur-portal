// src/lib/doctor-mission.ts
import { getT } from '@/i18n';
import { CATEGORY_LABELS } from '@/lib/doctor-constants';

/**
 * Профессиональное описание миссии врача по специальности —
 * используется, когда врач не заполнил собственное био.
 * TODO: в идеале каждый врач формулирует миссию сам.
 */
export function getMission(specialty: string, lang: string): string {
  const t = getT(lang);
  const missions: Record<string, string> = {
    'кардиология': t('doctor.missionCardiology'),
    'неврология': t('doctor.missionNeurology'),
    'стоматология': t('doctor.missionDentistry'),
    'педиатрия': t('doctor.missionPediatrics'),
    'дерматология': t('doctor.missionDermatology'),
    'офтальмология': t('doctor.missionOphthalmology'),
    'хирургия': t('doctor.missionSurgery'),
    'гинекология': t('doctor.missionGynecology'),
  };
  return missions[specialty.toLowerCase()] || t('doctor.genericMission');
}

/** Определяет ключ категории (для CATEGORY_GRADIENTS и т.д.) по названию специальности. */
export function getCategoryKey(specialtyLabel: string, lang: string): string {
  for (const [key, labels] of Object.entries(CATEGORY_LABELS)) {
    if (labels[lang] === specialtyLabel || labels.ru === specialtyLabel) {
      return key;
    }
  }
  return 'general';
}
