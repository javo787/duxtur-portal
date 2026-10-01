import type { ClinicWorkingHours } from './clinic-constants';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/**
 * The Clinic schema fills working hours with 08:00-18:00 on all 7 days by default.
 * For a pre_imported clinic that pattern is a placeholder, not data: show hours
 * only if they were actually filled in (i.e. differ from the default pattern).
 * Approved/claimed clinics are always shown as-is.
 */
export function hasRealWorkingHours(clinic: { status?: string; workingHours?: ClinicWorkingHours | null }): boolean {
  if (clinic.status !== 'pre_imported') return true;
  const wh = clinic.workingHours;
  if (!wh || typeof wh !== 'object') return false;
  return DAYS.some(d => {
    const day = wh[d];
    return !!day && !(day.open === '08:00' && day.close === '18:00' && day.isWorking === true);
  });
}
