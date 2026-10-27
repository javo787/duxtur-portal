import { describe, it, expect, vi, beforeEach } from 'vitest';

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock('@/auth', () => ({ auth: authMock }));
vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

let user: Record<string, unknown> | null;
let doctor: Record<string, unknown> | null;
vi.mock('@/models/User', () => ({ default: { findOne: async () => user } }));
vi.mock('@/models/Doctor', () => ({ default: { findOne: async () => doctor } }));

import { getArticleActor } from './article-access';

beforeEach(() => {
  vi.clearAllMocks();
  user = { _id: 'u1', email: 'd@x.tj' };
  doctor = { _id: 'doc1', status: 'approved' };
  authMock.mockResolvedValue({ user: { email: 'd@x.tj', role: 'doctor' } });
});

describe('getArticleActor', () => {
  it('turns away somebody who is not signed in', async () => {
    authMock.mockResolvedValue(null);
    expect(await getArticleActor()).toMatchObject({ kind: 'denied', status: 401 });
  });

  it('lets the super admin through to any article, without looking for a doctor profile', async () => {
    authMock.mockResolvedValue({ user: { email: 'root@x.tj', role: 'portal_admin' } });
    doctor = null;
    expect(await getArticleActor()).toEqual({ kind: 'admin' });
  });

  it('limits an approved doctor to their own articles', async () => {
    expect(await getArticleActor()).toEqual({ kind: 'doctor', doctorId: 'doc1' });
  });

  it('refuses a doctor who is not approved, and an account without a doctor profile', async () => {
    doctor = { _id: 'doc1', status: 'pending' };
    expect(await getArticleActor()).toMatchObject({ kind: 'denied', status: 403 });
    doctor = null;
    expect(await getArticleActor()).toMatchObject({ kind: 'denied', status: 403 });
  });

  it('does not trust a role in the session for anything but the admin shortcut', async () => {
    authMock.mockResolvedValue({ user: { email: 'p@x.tj', role: 'patient' } });
    doctor = null;
    expect((await getArticleActor()).kind).toBe('denied');
  });
});
