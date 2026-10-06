import { describe, it, expect, vi, beforeEach } from 'vitest';

const { publishDraftsOf, callEduBot } = vi.hoisted(() => ({ publishDraftsOf: vi.fn(), callEduBot: vi.fn() }));
vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('@/lib/author-articles', () => ({ publishDraftsOf }));
vi.mock('@/lib/edu-telegram-bot', () => ({ callEduBot }));

let doctor: Record<string, unknown> | null;
let user: Record<string, unknown> | null;
const userUpdates: { filter: unknown; update: unknown }[] = [];
const lean = (v: unknown) => ({ select: () => ({ lean: async () => v }) });

vi.mock('@/models/Doctor', () => ({ default: { findById: () => lean(doctor) } }));
vi.mock('@/models/User', () => ({
  default: {
    findById: () => lean(user),
    updateOne: async (filter: unknown, update: unknown) => void userUpdates.push({ filter, update }),
  },
}));

import { afterDoctorApproved } from './author-approval';

beforeEach(() => {
  vi.clearAllMocks();
  userUpdates.length = 0;
  doctor = { _id: 'doc1', userId: 'u1', status: 'approved' };
  user = { telegramId: 555 };
  publishDraftsOf.mockResolvedValue([]);
});

describe('afterDoctorApproved', () => {
  it('turns a patient account into a doctor account, but never touches any other role', async () => {
    await afterDoctorApproved('doc1');
    expect(userUpdates).toEqual([{ filter: { _id: 'u1', role: 'patient' }, update: { $set: { role: 'doctor' } } }]);
  });

  it('publishes the waiting articles and tells a Telegram person how many', async () => {
    publishDraftsOf.mockResolvedValue(['a', 'b']);
    expect(await afterDoctorApproved('doc1')).toEqual({ published: 2 });
    expect(publishDraftsOf).toHaveBeenCalledWith('u1', 'doc1');
    expect(callEduBot).toHaveBeenCalledWith('sendMessage', { chat_id: 555, text: expect.stringContaining('Опубликовано статей: 2') });
  });

  it('still tells a Telegram person when nothing was waiting', async () => {
    await afterDoctorApproved('doc1');
    expect(callEduBot).toHaveBeenCalledWith('sendMessage', { chat_id: 555, text: expect.stringContaining('публикуются сразу') });
  });

  it('writes no message to a person without Telegram', async () => {
    user = {};
    await afterDoctorApproved('doc1');
    expect(callEduBot).not.toHaveBeenCalled();
  });

  it('does nothing unless the doctor really is approved and has an account', async () => {
    doctor = { _id: 'doc1', userId: 'u1', status: 'pending' };
    expect(await afterDoctorApproved('doc1')).toEqual({ published: 0 });
    doctor = { _id: 'doc1', status: 'approved' };
    expect(await afterDoctorApproved('doc1')).toEqual({ published: 0 });
    doctor = null;
    expect(await afterDoctorApproved('doc1')).toEqual({ published: 0 });
    expect(publishDraftsOf).not.toHaveBeenCalled();
    expect(userUpdates).toEqual([]);
  });
});
