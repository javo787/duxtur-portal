import { describe, it, expect } from 'vitest';
import { hasRealWorkingHours } from './clinic-hours';

const def = { open: '08:00', close: '18:00', isWorking: true };
const allDefault = { mon: def, tue: def, wed: def, thu: def, fri: def, sat: def, sun: def };

describe('hasRealWorkingHours', () => {
  it('hides the schema-default pattern for pre_imported clinics', () => {
    expect(hasRealWorkingHours({ status: 'pre_imported', workingHours: allDefault })).toBe(false);
    expect(hasRealWorkingHours({ status: 'pre_imported' })).toBe(false);
  });
  it('shows hours that were actually filled in', () => {
    expect(hasRealWorkingHours({ status: 'pre_imported', workingHours: { ...allDefault, sat: { open: '08:00', close: '17:00', isWorking: true } } })).toBe(true);
    expect(hasRealWorkingHours({ status: 'pre_imported', workingHours: { ...allDefault, sun: { open: '08:00', close: '18:00', isWorking: false } } })).toBe(true);
  });
  it('always shows hours for approved clinics', () => {
    expect(hasRealWorkingHours({ status: 'approved', workingHours: allDefault })).toBe(true);
  });
});
