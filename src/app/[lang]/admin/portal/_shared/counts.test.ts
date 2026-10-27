import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  dbConnect: vi.fn(), managedIds: vi.fn(),
  doctor: { countDocuments: vi.fn() }, clinic: { countDocuments: vi.fn() }, article: { countDocuments: vi.fn() },
}));
vi.mock('@/lib/mongodb', () => ({ default: m.dbConnect }));
vi.mock('@/lib/admin-scope', () => ({ managedIds: m.managedIds }));
vi.mock('@/models/Doctor', () => ({ default: m.doctor }));
vi.mock('@/models/Clinic', () => ({ default: m.clinic }));
vi.mock('@/models/Article', () => ({ default: m.article }));

import { getPortalCounts } from './counts';

const admin = { userId: 'a1', email: 'a@x.tj', role: 'portal_admin' as const };
const manager = { userId: 'm1', email: 'm@x.tj', role: 'portal_manager' as const };

beforeEach(() => {
  vi.clearAllMocks();
  m.doctor.countDocuments.mockResolvedValue(3);
  m.clinic.countDocuments.mockResolvedValue(2);
  m.article.countDocuments.mockResolvedValue(5);
  m.managedIds.mockResolvedValue({ doctorIds: ['d1'], clinicIds: ['c1'] });
});

describe('getPortalCounts', () => {
  it('counts everything that waits for the administrator', async () => {
    expect(await getPortalCounts(admin)).toEqual({ doctors: 3, clinics: 2, articles: 5 });
    expect(m.doctor.countDocuments).toHaveBeenCalledWith({ status: 'pending' });
    expect(m.clinic.countDocuments).toHaveBeenCalledWith({ status: 'pending' });
    expect(m.article.countDocuments).toHaveBeenCalledWith({ isVerified: false });
    expect(m.managedIds).not.toHaveBeenCalled();
  });

  it('counts for a manager only the queue and what is theirs, never the whole portal', async () => {
    await getPortalCounts(manager);
    const queue = { $or: [{ managedBy: null }, { managedBy: 'm1' }] };
    expect(m.doctor.countDocuments).toHaveBeenCalledWith({ status: 'pending', ...queue });
    expect(m.clinic.countDocuments).toHaveBeenCalledWith({ status: 'pending', ...queue });
    expect(m.article.countDocuments).toHaveBeenCalledWith({ isVerified: false, authorId: { $in: ['d1'] } });
  });

  it('shows zeros instead of breaking the page when the database fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    m.doctor.countDocuments.mockRejectedValue(new Error('down'));
    expect(await getPortalCounts(admin)).toEqual({ doctors: 0, clinics: 0, articles: 0 });
  });
});
