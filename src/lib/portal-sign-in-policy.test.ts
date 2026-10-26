import { describe, it, expect, vi } from 'vitest';

const findOne = vi.hoisted(() => vi.fn());
vi.mock('@/models/Doctor', () => ({ default: { findOne } }));

import { mayEnter } from './portal-sign-in-policy';

const doc = (role: string) => ({ _id: { toString: () => 'u1' }, role });
const doctorStatus = (status?: string) => findOne.mockReturnValue({ select: () => ({ lean: async () => (status ? { status } : null) }) });

describe('mayEnter (sign-in proved by a Telegram or Duxtur Edu confirmation)', () => {
  it('never opens an administrator or a manager account: staff power needs a password or Google', async () => {
    expect(await mayEnter(doc('portal_admin'))).toEqual({ ok: false, code: 'role_not_allowed' });
    expect(await mayEnter(doc('portal_manager'))).toEqual({ ok: false, code: 'role_not_allowed' });
  });

  it('opens a patient and a clinic account', async () => {
    expect(await mayEnter(doc('patient'))).toBeNull();
    expect(await mayEnter(doc('clinic'))).toBeNull();
  });

  it('opens a doctor account only when the doctor is approved', async () => {
    doctorStatus('approved');
    expect(await mayEnter(doc('doctor'))).toBeNull();
    doctorStatus('pending');
    expect(await mayEnter(doc('doctor'))).toEqual({ ok: false, code: 'doctor_not_approved' });
    doctorStatus(undefined);
    expect(await mayEnter(doc('doctor'))).toEqual({ ok: false, code: 'doctor_not_approved' });
  });
});
