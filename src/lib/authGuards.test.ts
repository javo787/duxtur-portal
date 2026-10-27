import { describe, it, expect, vi, beforeEach } from 'vitest';

// requireRole() — единственная линия защиты для Server Actions (см. commit
// "security: enforce role checks in Server Actions"). Server Actions это
// публичные POST-эндпоинты без защиты со стороны middleware, так что баг
// именно здесь — это baг уровня "кто угодно может забанить клинику".

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

import { auth } from '@/auth';
import { requireRole } from '@/lib/authGuards';

const mockedAuth = vi.mocked(auth);

function sessionWith(role?: string, email: string | null = 'doc@example.com') {
  return {
    user: {
      id: 'user_1',
      email,
      role,
    },
  } as any;
}

describe('requireRole', () => {
  beforeEach(() => {
    mockedAuth.mockReset();
  });

  it('бросает ошибку, если сессии нет вообще', async () => {
    mockedAuth.mockResolvedValue(null as any);
    await expect(requireRole('portal_admin')).rejects.toThrow('Unauthorized');
  });

  it('бросает ошибку, если у сессии нет роли', async () => {
    mockedAuth.mockResolvedValue(sessionWith(undefined));
    await expect(requireRole('portal_admin')).rejects.toThrow('Unauthorized');
  });

  it('бросает ошибку, если роль не входит в разрешённые', async () => {
    mockedAuth.mockResolvedValue(sessionWith('patient'));
    await expect(requireRole('portal_admin')).rejects.toThrow('Unauthorized');
    await expect(requireRole('doctor', 'clinic')).rejects.toThrow('Unauthorized');
  });

  it('бросает ошибку, если у сессии нет email (даже с верной ролью)', async () => {
    mockedAuth.mockResolvedValue(sessionWith('portal_admin', null));
    await expect(requireRole('portal_admin')).rejects.toThrow('Unauthorized');
  });

  it('пропускает и возвращает {userId, email, role}, если роль разрешена', async () => {
    mockedAuth.mockResolvedValue(sessionWith('portal_admin'));
    await expect(requireRole('portal_admin')).resolves.toEqual({
      userId: 'user_1',
      email: 'doc@example.com',
      role: 'portal_admin',
    });
  });

  it('пропускает, если роль совпадает с одной из НЕСКОЛЬКИХ разрешённых', async () => {
    mockedAuth.mockResolvedValue(sessionWith('doctor'));
    await expect(requireRole('portal_admin', 'doctor')).resolves.toMatchObject({
      role: 'doctor',
    });
  });

  it('не пропускает чужую роль, даже если она валидна для ДРУГОГО действия', async () => {
    // Регрессия ровно на тот баг, который был в admin.ts: doctor не должен
    // проходить requireRole('portal_admin'), даже будучи залогинен.
    mockedAuth.mockResolvedValue(sessionWith('doctor'));
    await expect(requireRole('portal_admin')).rejects.toThrow('Unauthorized');
  });
});

// ── Команда портала: администратор и менеджер ───────────────────────────────
// Роль в токене живёт до 30 дней. Для менеджера она сверяется с базой каждый раз,
// иначе снятая роль продолжала бы работать до следующего входа.
const dbMocks = vi.hoisted(() => ({ dbConnect: vi.fn(), findById: vi.fn() }));
vi.mock('@/lib/mongodb', () => ({ default: dbMocks.dbConnect }));
vi.mock('@/models/User', () => ({ default: { findById: dbMocks.findById } }));

import { getStaff, requireStaff } from '@/lib/authGuards';

describe('getStaff / requireStaff', () => {
  const roleInDb = (role: string | undefined) =>
    dbMocks.findById.mockReturnValue({ select: () => ({ lean: async () => (role ? { role } : null) }) });

  beforeEach(() => {
    mockedAuth.mockReset();
    dbMocks.dbConnect.mockReset();
    dbMocks.findById.mockReset();
  });

  it('пускает администратора по сессии, не обращаясь к базе', async () => {
    mockedAuth.mockResolvedValue(sessionWith('portal_admin'));
    await expect(requireStaff()).resolves.toEqual({ userId: 'user_1', email: 'doc@example.com', role: 'portal_admin' });
    expect(dbMocks.findById).not.toHaveBeenCalled();
  });

  it('пускает менеджера, только если в базе у него по-прежнему роль менеджера', async () => {
    mockedAuth.mockResolvedValue(sessionWith('portal_manager'));
    roleInDb('portal_manager');
    await expect(requireStaff()).resolves.toEqual({ userId: 'user_1', email: 'doc@example.com', role: 'portal_manager' });
  });

  it('снятая роль менеджера перестаёт работать сразу, хотя в токене она ещё есть', async () => {
    mockedAuth.mockResolvedValue(sessionWith('portal_manager'));
    for (const now of ['patient', 'doctor', undefined]) {
      roleInDb(now);
      await expect(requireStaff()).rejects.toThrow('Unauthorized');
      expect(await getStaff()).toBeNull();
    }
  });

  it('не пускает врача, клинику, пациента, пустую сессию и сессию без email', async () => {
    for (const role of ['doctor', 'clinic', 'patient', undefined]) {
      mockedAuth.mockResolvedValue(sessionWith(role));
      await expect(requireStaff()).rejects.toThrow('Unauthorized');
    }
    mockedAuth.mockResolvedValue(null as any);
    await expect(requireStaff()).rejects.toThrow('Unauthorized');
    mockedAuth.mockResolvedValue(sessionWith('portal_manager', null));
    await expect(requireStaff()).rejects.toThrow('Unauthorized');
  });
});
