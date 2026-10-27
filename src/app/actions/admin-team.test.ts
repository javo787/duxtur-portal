import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  requireRole: vi.fn(), dbConnect: vi.fn(), recordAudit: vi.fn(), revalidatePath: vi.fn(),
  user: { findOne: vi.fn(), updateOne: vi.fn(), findOneAndUpdate: vi.fn() },
}));
vi.mock('@/lib/authGuards', () => ({ requireRole: m.requireRole }));
vi.mock('@/lib/mongodb', () => ({ default: m.dbConnect }));
vi.mock('@/lib/audit-log', () => ({ recordAudit: m.recordAudit }));
vi.mock('next/cache', () => ({ revalidatePath: m.revalidatePath }));
vi.mock('@/models/User', () => ({ default: m.user }));

import { addManager, removeManager } from './admin-team';

const ID = '507f1f77bcf86cd799439011';
const ADMIN = { userId: 'admin1', email: 'a@duxtur.org', role: 'portal_admin' };
const lean = (v: unknown) => ({ select: () => ({ lean: async () => v }), lean: async () => v });
const emailForm = (email: string) => { const f = new FormData(); f.set('email', email); return f; };

beforeEach(() => {
  vi.clearAllMocks();
  m.requireRole.mockResolvedValue(ADMIN);
  m.user.findOne.mockReturnValue(lean({ _id: ID, role: 'patient', name: 'Ali' }));
  m.user.findOneAndUpdate.mockReturnValue(lean({ email: 'ali@x.tj' }));
});

describe('only the administrator appoints managers', () => {
  it('both actions ask for the administrator role, so a manager cannot appoint or remove anybody', async () => {
    m.requireRole.mockRejectedValue(new Error('Unauthorized'));
    await expect(addManager(emailForm('ali@x.tj'))).rejects.toThrow('Unauthorized');
    await expect(removeManager(ID)).rejects.toThrow('Unauthorized');
    expect(m.requireRole).toHaveBeenCalledWith('portal_admin');
    expect(m.requireRole).not.toHaveBeenCalledWith('portal_admin', 'portal_manager');
    expect(m.dbConnect).not.toHaveBeenCalled();
  });
});

describe('addManager', () => {
  it('turns an ordinary account into a manager and logs it', async () => {
    expect(await addManager(emailForm('  Ali@X.tj '))).toBeUndefined();
    expect(m.user.findOne).toHaveBeenCalledWith({ email: 'ali@x.tj' });
    // the update repeats the condition, so an account that became a doctor a moment ago is not touched
    expect(m.user.updateOne).toHaveBeenCalledWith({ _id: ID, role: 'patient' }, { $set: { role: 'portal_manager' } });
    expect(m.recordAudit).toHaveBeenCalledWith(expect.objectContaining({
      actor: ADMIN, action: 'team.manager_added', entityType: 'user', entityId: ID, entityLabel: 'ali@x.tj',
    }));
  });

  it('refuses what is not an e-mail, or an account that does not exist, without writing', async () => {
    for (const bad of ['', 'not-an-email', 'a b@x.tj']) {
      expect(await addManager(emailForm(bad))).toEqual({ error: 'Введите e-mail аккаунта' });
    }
    expect(await addManager(undefined)).toEqual({ error: 'Введите e-mail аккаунта' });
    m.user.findOne.mockReturnValue(lean(null));
    expect(await addManager(emailForm('nobody@x.tj'))).toMatchObject({ error: expect.stringContaining('Аккаунта с таким e-mail нет') });
    expect(m.user.updateOne).not.toHaveBeenCalled();
  });

  it('does not change the role of a doctor, a clinic, an administrator, or somebody who already is a manager', async () => {
    for (const role of ['doctor', 'clinic', 'portal_admin']) {
      m.user.findOne.mockReturnValue(lean({ _id: ID, role }));
      expect(await addManager(emailForm('x@x.tj'))).toMatchObject({ error: expect.stringContaining('другая роль') });
    }
    m.user.findOne.mockReturnValue(lean({ _id: ID, role: 'portal_manager' }));
    expect(await addManager(emailForm('x@x.tj'))).toEqual({ error: 'Этот человек уже менеджер' });
    expect(m.user.updateOne).not.toHaveBeenCalled();
    expect(m.recordAudit).not.toHaveBeenCalled();
  });
});

describe('removeManager', () => {
  it('returns a manager to an ordinary account and logs it', async () => {
    expect(await removeManager(ID)).toBeUndefined();
    expect(m.user.findOneAndUpdate).toHaveBeenCalledWith({ _id: ID, role: 'portal_manager' }, { $set: { role: 'patient' } }, expect.anything());
    expect(m.recordAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'team.manager_removed', entityLabel: 'ali@x.tj' }));
  });

  it('only ever touches managers: an administrator or a doctor id changes nothing', async () => {
    m.user.findOneAndUpdate.mockReturnValue(lean(null));
    expect(await removeManager(ID)).toEqual({ error: 'Менеджер не найден' });
    expect(await removeManager('{"$ne":1}')).toEqual({ error: 'Некорректный идентификатор' });
    expect(m.recordAudit).not.toHaveBeenCalled();
  });
});
