import { describe, it, expect, vi, beforeEach } from 'vitest';

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath }));

import { revalidateClinicPage, revalidateClinicPages, revalidateDoctorPages } from './revalidate';
import { i18n } from '@/i18n-config';

beforeEach(() => vi.clearAllMocks());

describe('revalidateDoctorPages', () => {
  it('drops the profiles, the authors list and the home page with route-pattern calls', () => {
    revalidateDoctorPages();
    expect(revalidatePath.mock.calls).toEqual([
      ['/[lang]/doctor/[id]', 'page'],
      ['/[lang]/authors', 'page'],
      ['/[lang]', 'page'],
    ]);
  });
});

describe('revalidateClinicPages', () => {
  it('drops every clinic page with one route-pattern call', () => {
    revalidateClinicPages();
    expect(revalidatePath.mock.calls).toEqual([['/[lang]/clinics/[slug]', 'page']]);
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
