import { describe, it, expect } from 'vitest';
import { buildClinicQuery } from './clinic-query';
import { sanitizeSearchParams } from './validation';

describe('specialty filter', () => {
  it('matches both the id and the legacy Russian label stored by older records', () => {
    expect(buildClinicQuery({ specialty: 'surgery' }).specialties).toEqual({ $in: ['surgery', 'Хирургия'] });
    expect(buildClinicQuery({ specialty: 'Хирургия' }).specialties).toEqual({ $in: ['surgery', 'Хирургия'] });
  });
  it('knows the new specialties', () => {
    expect(buildClinicQuery({ specialty: 'endocrinology' }).specialties).toEqual({ $in: ['endocrinology', 'Эндокринология'] });
  });
  it('passes unknown values through so they match nothing instead of everything', () => {
    expect(buildClinicQuery({ specialty: 'alchemy' }).specialties).toEqual({ $in: ['alchemy'] });
  });
  it('old links with a Russian label continue with the id', () => {
    expect(sanitizeSearchParams({ specialty: 'Хирургия' }).specialty).toBe('surgery');
    expect(sanitizeSearchParams({ specialty: 'surgery' }).specialty).toBe('surgery');
  });
  it('still lists only approved and imported clinics', () => {
    expect(buildClinicQuery({}).status).toEqual({ $in: ['approved', 'pre_imported'] });
  });
});
