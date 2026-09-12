'use client';

import { useCallback, useEffect, useState } from 'react';

const AUTOSAVE_KEY = 'duxtur_clinic_reg_draft';
const AUTOSAVE_INTERVAL = 30_000;
const AUTOSAVE_EXPIRY_DAYS = parseInt(process.env.NEXT_PUBLIC_DRAFT_TTL_DAYS || '7');

/**
 * Черновик формы регистрации клиники автосохраняется в localStorage каждые
 * 30 секунд и живёт AUTOSAVE_EXPIRY_DAYS дней. При монтировании либо
 * восстанавливает сохранённый черновик, либо стартует с initialData.
 *
 * initialData/formData сознательно остаются Record<string, any> — форма
 * читает/пишет поля по динамическому ключу (handleInputChange(field, value)
 * для ~10 разных полей), а не по фиксированной схеме; строгая типизация
 * здесь потребовала бы синхронной переработки всего JSX шагов 1-3, что не
 * входит в объём этого рефакторинга.
 */
export function useAutosaveDraft(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData: Record<string, any>,
  t: (key: string) => string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        try {
          const { data, timestamp } = JSON.parse(saved);
          const ageInDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
          if (ageInDays < AUTOSAVE_EXPIRY_DAYS) {
            return data;
          } else {
            localStorage.removeItem(AUTOSAVE_KEY);
          }
        } catch {}
      }
    }
    return initialData;
  });

  // Тот же черновик уже прочитан выше для formData — здесь просто достаём
  // timestamp тем же способом, без setState внутри эффекта при монтировании.
  const [lastSaved, setLastSaved] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
      try {
        const { timestamp } = JSON.parse(saved);
        return timestamp;
      } catch {}
    }
    return null;
  });

  const autosave = useCallback(() => {
    const timestamp = Date.now();
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ data: formData, timestamp }));
    setLastSaved(timestamp);
  }, [formData]);

  useEffect(() => {
    const timer = setInterval(autosave, AUTOSAVE_INTERVAL);
    return () => clearInterval(timer);
  }, [autosave]);

  const getExpiryWarning = useCallback((savedTime: number) => {
    const ageInDays = (Date.now() - savedTime) / (1000 * 60 * 60 * 24);
    if (ageInDays > AUTOSAVE_EXPIRY_DAYS - 1) return t('clinic.draftExpiresToday') || 'Draft expires today';
    if (ageInDays > AUTOSAVE_EXPIRY_DAYS - 2) return t('clinic.draftExpiresTomorrow') || 'Draft expires tomorrow';
    return null;
  }, [t]);

  const expiryWarning = lastSaved ? getExpiryWarning(lastSaved) : null;

  // Вызывается после успешной регистрации — черновик больше не нужен.
  const clearDraft = () => {
    localStorage.removeItem(AUTOSAVE_KEY);
  };

  // onDiscarded — коллбэк для сброса состояния, которым эта форма не
  // владеет (например, возврат на шаг 1).
  const discardDraft = (onDiscarded?: () => void) => {
    if (confirm(t('common.confirm') || 'Are you sure?')) {
      localStorage.removeItem(AUTOSAVE_KEY);
      setFormData(initialData);
      setLastSaved(null);
      onDiscarded?.();
    }
  };

  return { formData, setFormData, lastSaved, expiryWarning, clearDraft, discardDraft };
}
