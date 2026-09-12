import { describe, it, expect, vi, beforeEach } from 'vitest';

// Claim-флоу — самое дорогое место для ошибки на медицинской платформе:
// баг здесь означает либо кражу чужого профиля врача/клиники, либо
// молчаливую перезапись уже провалидированных импортированных данных.

vi.mock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn().mockResolvedValue('hashed') }, hash: vi.fn().mockResolvedValue('hashed') }));
vi.mock('@/lib/telegram', () => ({
  notifyAdminNewDoctor: vi.fn(),
  sendMessageToAdmin: vi.fn(),
}));
vi.mock('@/lib/translation-service', () => ({ translateText: vi.fn(async (s: string) => s) }));
vi.mock('@/lib/utils', () => ({
  stripHtml: (s: string) => s,
  generateSlug: (s: string) => s.toLowerCase().replace(/\s+/g, '-'),
}));
vi.mock('@/lib/db-doctor', () => ({
  createDoctor: vi.fn(),
  claimDoctorProfile: vi.fn(),
  findSimilarPreImportedDoctors: vi.fn(),
}));
vi.mock('@/models/User', () => ({ default: { findOne: vi.fn(), create: vi.fn() } }));
vi.mock('@/models/Doctor', () => ({ default: { findOne: vi.fn() } }));
vi.mock('@/models/Clinic', () => ({
  default: { findById: vi.fn(), findByIdAndUpdate: vi.fn(), create: vi.fn() },
}));

const mockSession = vi.hoisted(() => ({
  startTransaction: vi.fn(),
  commitTransaction: vi.fn().mockResolvedValue(undefined),
  abortTransaction: vi.fn().mockResolvedValue(undefined),
  endSession: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('mongoose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('mongoose')>();
  return {
    ...actual,
    default: { ...actual.default, startSession: vi.fn().mockResolvedValue(mockSession) },
  };
});

import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Clinic from '@/models/Clinic';
import { createDoctor, claimDoctorProfile } from '@/lib/db-doctor';
import { registerDoctor } from '@/app/actions/register';
import { registerClinic } from '@/app/actions/clinic';

const mockedUserFindOne = vi.mocked(User.findOne);
const mockedUserCreate = vi.mocked(User.create);
const mockedDoctorFindOne = vi.mocked(Doctor.findOne);
const mockedClaimDoctorProfile = vi.mocked(claimDoctorProfile);
const mockedCreateDoctor = vi.mocked(createDoctor);
const mockedClinicFindById = vi.mocked(Clinic.findById);
const mockedClinicFindByIdAndUpdate = vi.mocked(Clinic.findByIdAndUpdate);
const mockedClinicCreate = vi.mocked(Clinic.create);

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const baseDoctorFields = {
  name: 'Др. Иванов',
  email: 'doc@example.com',
  phone: '+992000000000',
  password: 'password123',
  specialty: 'Кардиолог',
  documentImageUrl: 'https://cdn.example.com/diploma.jpg',
};

describe('registerDoctor — claim-флоу', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUserFindOne.mockResolvedValue(null); // email свободен по умолчанию
    mockedUserCreate.mockResolvedValue({ _id: 'new_user_id' } as any);
  });

  it('отклоняет, если email уже занят', async () => {
    mockedUserFindOne.mockResolvedValue({ _id: 'existing' } as any);
    const result = await registerDoctor(formData(baseDoctorFields));
    expect(result).toEqual({ success: false, error: 'Email уже занят.' });
    expect(mockedUserCreate).not.toHaveBeenCalled();
  });

  it('claim: отклоняет, если профиль не найден или не pre_imported', async () => {
    mockedDoctorFindOne.mockResolvedValue(null); // findOne({_id, status:'pre_imported'}) ничего не вернул
    const result = await registerDoctor(formData({ ...baseDoctorFields, claimDoctorId: 'doc_123' }));
    expect(result).toEqual({ success: false, error: 'Профиль уже занят или не существует.' });
    expect(mockedClaimDoctorProfile).not.toHaveBeenCalled();
  });

  it('claim: при валидном pre_imported профиле вызывает claimDoctorProfile с нужными полями, а НЕ createDoctor', async () => {
    mockedDoctorFindOne.mockResolvedValue({ _id: 'doc_123', importSourceUrl: 'https://ydoc.tj/x' } as any);
    const result = await registerDoctor(formData({ ...baseDoctorFields, claimDoctorId: 'doc_123' }));

    expect(result).toEqual({ success: true });
    expect(mockedClaimDoctorProfile).toHaveBeenCalledWith('doc_123', {
      userId: 'new_user_id',
      phone: baseDoctorFields.phone,
      documentImage: baseDoctorFields.documentImageUrl,
    });
    expect(mockedCreateDoctor).not.toHaveBeenCalled();
  });

  it('без claimDoctorId создаёт нового врача со статусом pending, а НЕ claimDoctorProfile', async () => {
    const result = await registerDoctor(formData(baseDoctorFields));
    expect(result).toEqual({ success: true });
    expect(mockedCreateDoctor).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending', userId: 'new_user_id' })
    );
    expect(mockedClaimDoctorProfile).not.toHaveBeenCalled();
  });
});

const baseClinicFields = {
  name: 'Клиника Здоровье',
  email: 'clinic@example.com',
  phone: '+992000000001',
  password: 'password123',
  type: 'private',
  ownerName: 'Owner',
  city: 'Худжанд',
  address: 'ул. Ленина 1',
  licenseDocument: 'https://cdn.example.com/license.jpg',
};

describe('registerClinic — claim-флоу и транзакция', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUserFindOne.mockReturnValue({ session: vi.fn().mockResolvedValue(null) } as any);
    mockedUserCreate.mockResolvedValue([{ _id: 'new_user_id' }] as any);
    mockSession.startTransaction.mockClear();
    mockSession.commitTransaction.mockClear();
    mockSession.abortTransaction.mockClear();
  });

  it('откатывает транзакцию, если email уже занят', async () => {
    mockedUserFindOne.mockReturnValue({ session: vi.fn().mockResolvedValue({ _id: 'existing' }) } as any);
    const result = await registerClinic(baseClinicFields);
    expect(result).toEqual({ success: false, error: 'Email уже занят.' });
    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.commitTransaction).not.toHaveBeenCalled();
  });

  it('claim: откатывает транзакцию, если клиника не найдена или не pre_imported', async () => {
    mockedClinicFindById.mockReturnValue({ session: vi.fn().mockResolvedValue(null) } as any);
    const result = await registerClinic({ ...baseClinicFields, claimClinicId: 'clinic_123' });
    expect(result).toEqual({ success: false, error: 'Клиника не найдена или уже занята.' });
    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockedClinicFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('claim: не перезаписывает уже заполненные при импорте поля (phone/address/logo/email)', async () => {
    mockedClinicFindById.mockReturnValue({
      session: vi.fn().mockResolvedValue({
        _id: 'clinic_123',
        status: 'pre_imported',
        phone: '+992111111111', // уже есть из импорта — форма прислала другой номер
        address: '',            // пусто — форма должна его заполнить
        logo: '',
        email: '',
      }),
    } as any);

    await registerClinic({ ...baseClinicFields, claimClinicId: 'clinic_123' });

    const updatePayload = mockedClinicFindByIdAndUpdate.mock.calls[0][1] as any;
    expect(updatePayload.$set.phone).toBeUndefined(); // существующий телефон не тронут
    expect(updatePayload.$set.address).toBe(baseClinicFields.address); // пустое — заполнено
    expect(updatePayload.$set.status).toBe('pending');
    expect(mockSession.commitTransaction).toHaveBeenCalled();
  });

  it('без claimClinicId создаёт новую клинику со статусом pending', async () => {
    mockedClinicCreate.mockResolvedValue([{ _id: 'brand_new_clinic' }] as any);
    const result = await registerClinic(baseClinicFields);
    expect(result).toEqual({ success: true, clinicId: 'brand_new_clinic' });
    expect(mockedClinicFindByIdAndUpdate).not.toHaveBeenCalled();
    expect(mockSession.commitTransaction).toHaveBeenCalled();
  });
});
