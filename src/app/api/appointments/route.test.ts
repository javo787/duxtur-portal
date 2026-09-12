import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Критичный путь: создание записи на приём. Ошибка здесь — это либо
// двойная запись на один и тот же слот, либо запись к неподтверждённому
// (непроверенному) врачу, либо утечка чужих данных. Мокаем DB/auth/resend,
// проверяем именно бизнес-правила, а не саму Mongoose/MongoDB.

vi.mock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn() }));
vi.mock('@/lib/telegram', () => ({
  notifyAdminNewDoctor: vi.fn(),
  notifyDoctorNewAppointment: vi.fn(),
}));
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({}) },
  })),
}));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

vi.mock('@/models/Doctor', () => ({ default: { findById: vi.fn() } }));
vi.mock('@/models/Appointment', () => ({
  default: { findOne: vi.fn(), create: vi.fn() },
}));

import { auth } from '@/auth';
import { rateLimit } from '@/lib/rate-limit';
import Doctor from '@/models/Doctor';
import Appointment from '@/models/Appointment';
import { POST } from '@/app/api/appointments/route';

const mockedAuth = vi.mocked(auth);
const mockedRateLimit = vi.mocked(rateLimit);
const mockedDoctorFindById = vi.mocked(Doctor.findById);
const mockedAppointmentFindOne = vi.mocked(Appointment.findOne);
const mockedAppointmentCreate = vi.mocked(Appointment.create);

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/appointments', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  doctorId: 'doc_1',
  patientName: 'Иван Иванов',
  patientPhone: '+992000000000',
  patientEmail: 'patient@example.com',
  date: '2026-10-01',
  timeSlot: '10:00',
  type: 'in_person',
};

describe('POST /api/appointments', () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedRateLimit.mockReset();
    mockedDoctorFindById.mockReset();
    mockedAppointmentFindOne.mockReset();
    mockedAppointmentCreate.mockReset();

    // Разумные дефолты "всё ок" — каждый тест переопределяет то, что проверяет.
    mockedRateLimit.mockResolvedValue({ success: true, count: 1 });
    mockedAuth.mockResolvedValue({ user: { id: 'patient_1', email: 'patient@example.com' } } as any);
  });

  it('отклоняет с 429, если превышен rate limit', async () => {
    mockedRateLimit.mockResolvedValue({ success: false, count: 6 });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(429);
    expect(mockedAuth).not.toHaveBeenCalled();
  });

  it('отклоняет с 401 неаутентифицированный запрос', async () => {
    mockedAuth.mockResolvedValue(null as any);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
  });

  it('отклоняет с 404, если врач не найден', async () => {
    mockedDoctorFindById.mockResolvedValue(null);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(404);
  });

  it('отклоняет с 404, если врач найден, но НЕ approved', async () => {
    mockedDoctorFindById.mockResolvedValue({ _id: 'doc_1', name: 'Др. Тест', status: 'pending' } as any);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(404);
    expect(mockedAppointmentCreate).not.toHaveBeenCalled();
  });

  it('отклоняет с 400, если слот уже занят (двойная запись)', async () => {
    mockedDoctorFindById.mockResolvedValue({ _id: 'doc_1', name: 'Др. Тест', status: 'approved' } as any);
    mockedAppointmentFindOne.mockResolvedValue({ _id: 'existing_appt' } as any);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
    expect(mockedAppointmentCreate).not.toHaveBeenCalled();
    // Отменённые записи не должны блокировать слот повторно:
    expect(mockedAppointmentFindOne).toHaveBeenCalledWith(
      expect.objectContaining({ status: { $ne: 'cancelled' } })
    );
  });

  it('создаёт запись со свободным слотом и привязывает patientId из сессии, а не из тела запроса', async () => {
    mockedDoctorFindById.mockResolvedValue({ _id: 'doc_1', name: 'Др. Тест', status: 'approved' } as any);
    mockedAppointmentFindOne.mockResolvedValue(null);
    mockedAppointmentCreate.mockResolvedValue({ _id: 'new_appt', ...validBody } as any);

    const res = await POST(makeRequest({ ...validBody, patientId: 'someone_elses_id' }));

    expect(res.status).toBe(200);
    expect(mockedAppointmentCreate).toHaveBeenCalledWith(
      expect.objectContaining({ patientId: 'patient_1', doctorId: 'doc_1' })
    );
  });
});
