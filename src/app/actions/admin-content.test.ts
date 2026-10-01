import { describe, it, expect, vi, beforeEach } from 'vitest';

const { requireRole, dbConnect, uploadImage } = vi.hoisted(() => ({
  requireRole: vi.fn(),
  dbConnect: vi.fn(),
  uploadImage: vi.fn(),
}));
vi.mock('@/lib/authGuards', () => ({ requireRole }));
vi.mock('@/lib/mongodb', () => ({ default: dbConnect }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); },
}));
vi.mock('@/lib/cloudinary-upload', async () => ({
  ...(await vi.importActual<typeof import('@/lib/cloudinary-upload')>('@/lib/cloudinary-upload')),
  uploadImage,
}));

const lean = (v: unknown) => ({ lean: async () => v, select: () => ({ lean: async () => v }) });
const clinicModel = vi.hoisted(() => ({
  findById: vi.fn(), findOne: vi.fn(), exists: vi.fn(), create: vi.fn(),
  updateOne: vi.fn(), deleteOne: vi.fn(), updateMany: vi.fn(),
}));
const doctorModel = vi.hoisted(() => ({
  findById: vi.fn(), create: vi.fn(), updateOne: vi.fn(), deleteOne: vi.fn(), updateMany: vi.fn(),
}));
vi.mock('@/models/Clinic', () => ({ default: clinicModel }));
vi.mock('@/models/Doctor', () => ({ default: doctorModel }));

import { saveClinic, deleteManagedClinic, saveDoctor, deleteManagedDoctor } from './admin-content';

const form = (o: Record<string, string | File> = {}) => {
  const f = new FormData();
  f.set('lang', 'ru');
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const redirectOf = async (p: Promise<unknown>) => {
  try { await p; } catch (e) { return (e as Error).message; }
  return 'no redirect';
};

beforeEach(() => {
  vi.clearAllMocks();
  requireRole.mockResolvedValue({ userId: 'admin1', email: 'a@x.tj', role: 'portal_admin' });
  clinicModel.findOne.mockReturnValue(lean(null));
  clinicModel.findById.mockReturnValue(lean({ _id: 'c1', slug: 'vedanta-ab12cd' }));
  doctorModel.findById.mockReturnValue(lean({ _id: 'd1', slug: 'dr-a-1' }));
});

describe('authorization', () => {
  it('every action rejects a non-admin before touching the database', async () => {
    requireRole.mockRejectedValue(new Error('Unauthorized'));
    const f = form({ name_ru: 'Клиника Тест', name: 'Иван Иванов', specialty_ru: 'Хирург' });
    await expect(saveClinic('new', f)).rejects.toThrow('Unauthorized');
    await expect(saveClinic('c1', f)).rejects.toThrow('Unauthorized');
    await expect(deleteManagedClinic('c1', f)).rejects.toThrow('Unauthorized');
    await expect(saveDoctor('new', f)).rejects.toThrow('Unauthorized');
    await expect(deleteManagedDoctor('d1', f)).rejects.toThrow('Unauthorized');
    expect(requireRole).toHaveBeenCalledWith('portal_admin');
    expect(dbConnect).not.toHaveBeenCalled();
    expect(clinicModel.create).not.toHaveBeenCalled();
    expect(clinicModel.updateOne).not.toHaveBeenCalled();
    expect(doctorModel.create).not.toHaveBeenCalled();
  });
});

describe('saveClinic', () => {
  it('returns validation errors to the form without writing', async () => {
    const r = await redirectOf(saveClinic('new', form({ name_ru: 'ab', phone: '123' })));
    expect(r).toMatch(/^REDIRECT:\/ru\/admin\/portal\/clinics\/new\?error=/);
    expect(dbConnect).not.toHaveBeenCalled();
  });

  it('blocks creating a duplicate by name and city', async () => {
    clinicModel.findOne.mockReturnValue(lean({ _id: 'existing' }));
    const r = await redirectOf(saveClinic('new', form({ name_ru: 'Клиника Нур', city: 'Душанбе' })));
    expect(decodeURIComponent(r)).toMatch(/уже есть/);
    expect(clinicModel.create).not.toHaveBeenCalled();
  });

  it('creates a clinic from scratch with GeoJSON coordinates and manual provenance', async () => {
    const r = await redirectOf(saveClinic('new', form({
      name_ru: 'Клиника Нур', city: 'Душанбе', status: 'approved', phone: '92 000 0000', lat: '38.56', lng: '68.79',
    })));
    expect(r).toBe('REDIRECT:/ru/admin/portal/clinics?saved=1');
    const doc = clinicModel.create.mock.calls[0][0];
    expect(doc).toMatchObject({
      importSource: 'manual', dataSource: 'admin_verified', status: 'approved', phone: '+992920000000',
      coordinates: { lat: 38.56, lng: 68.79, type: 'Point', coordinates: [68.79, 38.56] },
    });
    expect(doc.slug).toMatch(/^klinika-nur-[0-9a-f]{6}$/);
  });

  it('edits an existing (scraped) clinic, keeps its slug, clears coordinates when emptied', async () => {
    const r = await redirectOf(saveClinic('c1', form({ name_ru: 'Клиника «Vedanta»', status: 'pre_imported', website: 'vedanta.tj' })));
    expect(r).toBe('REDIRECT:/ru/admin/portal/clinics?saved=1');
    const [filter, update] = clinicModel.updateOne.mock.calls[0];
    expect(filter).toEqual({ _id: 'c1' });
    expect(update.$set).toMatchObject({ website: 'https://vedanta.tj/', status: 'pre_imported' });
    expect(update.$set).not.toHaveProperty('slug');
    expect(update.$unset).toEqual({ coordinates: '' });
  });

  it('rejects a bad image file before saving, and uploads a good one to a deterministic id', async () => {
    const svg = new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' });
    const r1 = await redirectOf(saveClinic('c1', form({ name_ru: 'Клиника Тест', logoFile: svg })));
    expect(decodeURIComponent(r1)).toMatch(/JPG, PNG, WebP/);
    expect(clinicModel.updateOne).not.toHaveBeenCalled();

    uploadImage.mockResolvedValue('https://res.cloudinary.com/dprydst2c/image/upload/v1/duxtur/clinics/vedanta-ab12cd/logo.png');
    const png = new File([new Uint8Array(10)], 'logo.png', { type: 'image/png' });
    await redirectOf(saveClinic('c1', form({ name_ru: 'Клиника Тест', logoFile: png })));
    expect(uploadImage.mock.calls[0][1]).toBe('duxtur/clinics/vedanta-ab12cd/logo');
    expect(clinicModel.updateOne.mock.calls[0][1].$set.logo).toContain('res.cloudinary.com');
  });
});

describe('deleteManagedClinic', () => {
  it('refuses to delete a clinic that has an owner account', async () => {
    clinicModel.findById.mockReturnValue(lean({ userId: 'u1' }));
    const r = await redirectOf(deleteManagedClinic('c1', form()));
    expect(decodeURIComponent(r)).toMatch(/аккаунт владельца/);
    expect(clinicModel.deleteOne).not.toHaveBeenCalled();
  });
  it('deletes an ownerless clinic and unlinks its doctors', async () => {
    clinicModel.findById.mockReturnValue(lean({}));
    const r = await redirectOf(deleteManagedClinic('c1', form()));
    expect(r).toBe('REDIRECT:/ru/admin/portal/clinics?deleted=1');
    expect(doctorModel.updateMany).toHaveBeenCalledWith({ clinicId: 'c1' }, { $set: { clinicId: null } });
    expect(clinicModel.deleteOne).toHaveBeenCalledWith({ _id: 'c1' });
  });
});

describe('doctors', () => {
  it('creates a pre_imported doctor without a phone or account', async () => {
    const r = await redirectOf(saveDoctor('new', form({ name: 'Иванов Иван', specialty_ru: 'Хирург', status: 'pre_imported' })));
    expect(r).toBe('REDIRECT:/ru/admin/portal/doctors?saved=1');
    expect(doctorModel.create.mock.calls[0][0]).toMatchObject({ name: 'Иванов Иван', status: 'pre_imported', consultationTypes: ['in_person'] });
  });
  it('requires a phone for non-imported statuses', async () => {
    const r = await redirectOf(saveDoctor('new', form({ name: 'Иванов Иван', specialty_ru: 'Хирург', status: 'approved' })));
    expect(decodeURIComponent(r)).toMatch(/нужен телефон/);
    expect(doctorModel.create).not.toHaveBeenCalled();
  });
  it('refuses to delete a doctor with an account', async () => {
    doctorModel.findById.mockReturnValue(lean({ userId: 'u1' }));
    const r = await redirectOf(deleteManagedDoctor('d1', form()));
    expect(decodeURIComponent(r)).toMatch(/есть аккаунт/);
    expect(doctorModel.deleteOne).not.toHaveBeenCalled();
  });
});
