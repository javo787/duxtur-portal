import { describe, it, expect } from 'vitest';
import { parseClinicForm, clinicCompleteness } from './clinic-form';
import { parseDoctorForm } from './doctor-form';
import { buildPublicId, validateImageFile } from '../cloudinary-upload';

const fd = (o: Record<string, string | string[]>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) (Array.isArray(v) ? v : [v]).forEach(x => f.append(k, x));
  return f;
};
const ok = <T>(r: { ok: boolean; data?: T; errors?: string[] }) => {
  if (!r.ok) throw new Error('expected ok, got: ' + r.errors?.join(' | '));
  return r.data as T;
};

describe('parseClinicForm', () => {
  it('normalizes a well-formed clinic', () => {
    const d = ok(parseClinicForm(fd({
      name_ru: '  Клиника «Нур»  ', type: 'dental_clinic', status: 'approved', city: 'Душанбе',
      phone: '92 000 0000', email: 'INFO@Nur.tj', website: 'nur.tj', instagram: 'https://instagram.com/nur_clinic/',
      telegram: '@nur_clinic', whatsapp: '+992 98 774 6263', lat: '38,5598', lng: '68.787',
      specialties: ['dentistry', 'not-a-key'],
      mon_working: 'on', mon_open: '08:00', mon_close: '18:00',
    })));
    expect(d.name.ru).toBe('Клиника «Нур»');
    expect(d).toMatchObject({
      phone: '+992920000000', email: 'info@nur.tj', website: 'https://nur.tj/', instagram: 'nur_clinic',
      telegram: 'nur_clinic', whatsapp: '992987746263', specialties: ['dentistry'], type: 'dental_clinic',
    });
    expect(d.coordinates).toEqual({ lat: 38.5598, lng: 68.787 });
    expect(d.workingHours?.mon).toEqual({ open: '08:00', close: '18:00', isWorking: true });
    expect(d.workingHours?.sun.isWorking).toBe(false);
  });

  it('accepts only the clinic specialty vocabulary', () => {
    const d = ok(parseClinicForm(fd({ name_ru: 'Клиника Тест', specialties: ['ultrasound', 'tests', 'endocrinology', 'alchemy'] })));
    expect(d.specialties).toEqual(['ultrasound', 'tests', 'endocrinology']);
  });

  it('leaves optional blocks empty instead of inventing values', () => {
    const d = ok(parseClinicForm(fd({ name_ru: 'Клиника Тест' })));
    expect(d.coordinates).toBeNull();
    expect(d.workingHours).toBeNull();
    expect(d).toMatchObject({ phone: '', website: '', specialties: [], status: 'pre_imported', type: 'clinic' });
  });

  it('collects every error at once', () => {
    const r = parseClinicForm(fd({
      name_ru: 'ab', type: 'spa', status: 'hacked', phone: '123', email: 'nope', website: 'not a url',
      lat: '95', lng: '10', mon_working: 'on', mon_open: '19:00', mon_close: '08:00',
    }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.length).toBeGreaterThanOrEqual(8);
  });

  it('requires both coordinates or neither', () => {
    expect(parseClinicForm(fd({ name_ru: 'Клиника Тест', lat: '38.5' })).ok).toBe(false);
  });

  it('only accepts https image URLs', () => {
    expect(parseClinicForm(fd({ name_ru: 'Клиника Тест', logo: 'http://x.tj/a.png' })).ok).toBe(false);
    expect(parseClinicForm(fd({ name_ru: 'Клиника Тест', logo: 'javascript:alert(1)' })).ok).toBe(false);
    expect(parseClinicForm(fd({ name_ru: 'Клиника Тест', logo: 'https://res.cloudinary.com/x/a.png' })).ok).toBe(true);
  });
});

describe('branches', () => {
  it('parses filled branch slots and ignores empty ones', () => {
    const d = ok(parseClinicForm(fd({
      name_ru: 'Клиника Vita',
      branch_0_address: 'ул. Рудаки, 11', branch_0_city: 'Душанбе', branch_0_label: 'Филиал на Рудаки',
      branch_0_phone: '92 000 0000', branch_0_lat: '38,57', branch_0_lng: '68.78',
      branch_1_address: '', branch_2_address: 'ул. Айни 1',
    })));
    expect(d.branches).toHaveLength(2);
    expect(d.branches[0]).toEqual({
      label: 'Филиал на Рудаки', address: 'ул. Рудаки, 11', city: 'Душанбе', district: '',
      phone: '+992920000000', coordinates: { lat: 38.57, lng: 68.78 },
    });
    expect(d.branches[1]).toMatchObject({ address: 'ул. Айни 1', phone: '', coordinates: null });
  });
  it('requires an address when anything else in the row is filled', () => {
    const r = parseClinicForm(fd({ name_ru: 'Клиника Vita', branch_0_label: 'Филиал', branch_0_phone: '92 000 0000' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(' ')).toMatch(/Филиал 1: укажите адрес/);
  });
  it('validates branch phone and coordinates', () => {
    const r = parseClinicForm(fd({ name_ru: 'Клиника Vita', branch_0_address: 'ул. Рудаки, 11', branch_0_phone: '123', branch_0_lat: '38.5' }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.join(' | ')).toMatch(/Филиал 1: телефон/);
      expect(r.errors.join(' | ')).toMatch(/Филиал 1: координаты/);
    }
  });
  it('a clinic without branches gets an empty list', () => {
    expect(ok(parseClinicForm(fd({ name_ru: 'Клиника Тест' }))).branches).toEqual([]);
  });
});

describe('clinicCompleteness', () => {
  it('lists what is still missing', () => {
    const r = clinicCompleteness({ phone: '+992900000000', coordinates: { lat: 38.5 }, specialties: ['surgery'] });
    expect(r.done).toBe(3);
    expect(r.total).toBe(8);
    expect(r.missing).toEqual(['адрес', 'сайт', 'часы', 'описание', 'логотип']);
  });
});

describe('parseDoctorForm', () => {
  it('parses a doctor and allows a pre_imported doctor without phone', () => {
    const d = ok(parseDoctorForm(fd({
      name: 'Иванов Иван', specialty_ru: 'Хирург', status: 'pre_imported', experience: '12', price: '150',
      languages: 'ру, тадж ; англ', consultationTypes: ['in_person', 'bogus'], clinicId: 'a'.repeat(24),
    })));
    expect(d).toMatchObject({ phone: '', experience: 12, price: 150, consultationTypes: ['in_person'], clinicId: 'a'.repeat(24) });
    expect(d.languages).toEqual(['ру', 'тадж', 'англ']);
  });
  it('rejects bad input', () => {
    const r = parseDoctorForm(fd({ name: 'x', experience: '200', clinicId: 'zzz' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.length).toBeGreaterThanOrEqual(4);
  });
});

describe('cloudinary helpers', () => {
  it('builds deterministic, safe public ids', () => {
    expect(buildPublicId('clinics', 'Vedanta-ab12cd', 'logo')).toBe('duxtur/clinics/vedanta-ab12cd/logo');
    expect(buildPublicId('clinics', '../../evil', 'cover')).toBe('duxtur/clinics/evil/cover');
    expect(() => buildPublicId('clinics', '///', 'logo')).toThrow();
  });
  it('validates image files', () => {
    expect(validateImageFile({ size: 1000, type: 'image/png' })).toBeNull();
    expect(validateImageFile({ size: 1000, type: 'image/svg+xml' })).toMatch(/JPG/);
    expect(validateImageFile({ size: 6 * 1024 * 1024, type: 'image/jpeg' })).toMatch(/5 МБ/);
    expect(validateImageFile({ size: 0, type: 'image/jpeg' })).toMatch(/Пустой/);
  });
});
