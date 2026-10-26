import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

const doctorModel = vi.hoisted(() => ({ findOne: vi.fn(), create: vi.fn() }));
vi.mock('@/models/Doctor', () => ({ default: doctorModel }));

import { ensureEditorialAuthor, EDITORIAL_NAME } from './editorial-author';

const found = (value: unknown) => ({ select: () => ({ lean: async () => value }) });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ensureEditorialAuthor', () => {
  it('reuses the editorial profile of this administrator', async () => {
    doctorModel.findOne.mockReturnValue(found({ _id: 'ed1' }));
    expect(await ensureEditorialAuthor('u1')).toEqual({ _id: 'ed1' });
    expect(doctorModel.findOne).toHaveBeenCalledWith({ userId: 'u1', isEditorial: true });
    expect(doctorModel.create).not.toHaveBeenCalled();
  });

  it('creates it on first use as a hidden profile: pre_imported and editorial, never a listed doctor', async () => {
    doctorModel.findOne.mockReturnValue(found(null));
    doctorModel.create.mockResolvedValue({ _id: 'new1' });
    expect(await ensureEditorialAuthor('u1')).toEqual({ _id: 'new1' });
    expect(doctorModel.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'u1', name: EDITORIAL_NAME, isEditorial: true, status: 'pre_imported',
    }));
  });
});
