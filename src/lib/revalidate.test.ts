import { describe, it, expect, vi, beforeEach } from 'vitest';

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath }));

import { revalidateClinicPage, revalidateDoctorPages } from './revalidate';
import { i18n } from '@/i18n-config';

beforeEach(() => vi.clearAllMocks());

describe('revalidateDoctorPages', () => {
  it('drops every doctor profile in every language with one route-pattern call', () => {
    revalidateDoctorPages();
    expect(revalidatePath).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith('/[lang]/doctor/[id]', 'page');
  });
});

describe('revalidateClinicPage', () => {
  it('refreshes the clinic page in each supported language and only those', () => {
    revalidateClinicPage('city-clinic');
    expect(revalidatePath.mock.calls.map(c => c[0]).sort()).toEqual(
      i18n.locales.map(l => `/${l}/clinics/city-clinic`).sort(),
    );
    // "tj" was a typo for Tajik, whose route prefix is "tg"
    expect(revalidatePath).not.toHaveBeenCalledWith('/tj/clinics/city-clinic');
    expect(revalidatePath).toHaveBeenCalledWith('/tg/clinics/city-clinic');
  });
});
