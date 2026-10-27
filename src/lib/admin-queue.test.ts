import { describe, it, expect } from 'vitest';
import { articleScope, queueQuery, reviewScope } from './admin-queue';
import type { Staff } from './admin-access';

const admin: Staff = { userId: 'a1', email: 'a@x.tj', role: 'portal_admin' };
const manager: Staff = { userId: 'm1', email: 'm@x.tj', role: 'portal_manager' };
const own = { doctorIds: ['d1', 'd2'], clinicIds: ['c1'] };

describe('queueQuery: administrator', () => {
  it('sees every status of doctors and clinics, every article and every review', () => {
    expect(queueQuery(admin, 'doctors', 'pending', null)).toEqual({ status: 'pending' });
    expect(queueQuery(admin, 'clinics', 'approved', null)).toEqual({ status: 'approved' });
    expect(queueQuery(admin, 'articles', 'pending', null)).toEqual({ isVerified: false });
    expect(queueQuery(admin, 'articles', 'published', null)).toEqual({ isVerified: true });
    expect(queueQuery(admin, 'reviews', 'hidden', null)).toEqual({ isVerified: false });
    expect(queueQuery(admin, 'reviews', 'published', null)).toEqual({ isVerified: true });
  });
});

describe('queueQuery: manager', () => {
  it('sees the applications nobody has taken together with their own, but only their own of any other status', () => {
    const queue = { $or: [{ managedBy: null }, { managedBy: 'm1' }] };
    expect(queueQuery(manager, 'doctors', 'pending', own)).toEqual({ status: 'pending', ...queue });
    expect(queueQuery(manager, 'clinics', 'pending', own)).toEqual({ status: 'pending', ...queue });
    for (const status of ['approved', 'banned', 'rejected']) {
      expect(queueQuery(manager, 'doctors', status, own)).toEqual({ status, managedBy: 'm1' });
    }
    expect(queueQuery(manager, 'clinics', 'approved', own)).toEqual({ status: 'approved', managedBy: 'm1' });
  });

  it('sees only articles of their doctors and reviews of their doctors and clinics', () => {
    expect(queueQuery(manager, 'articles', 'pending', own)).toEqual({ isVerified: false, authorId: { $in: ['d1', 'd2'] } });
    expect(queueQuery(manager, 'reviews', 'published', own)).toEqual({
      isVerified: true, $or: [{ doctorId: { $in: ['d1', 'd2'] } }, { clinicId: { $in: ['c1'] } }],
    });
  });

  it('a manager who has nothing yet sees no articles and no reviews, never all of them', () => {
    expect(queueQuery(manager, 'articles', 'pending', null)).toEqual({ isVerified: false, authorId: { $in: [] } });
    expect(queueQuery(manager, 'reviews', 'hidden', null)).toEqual({
      isVerified: false, $or: [{ doctorId: { $in: [] } }, { clinicId: { $in: [] } }],
    });
  });
});

describe('articleScope', () => {
  it('is everything for the administrator and the articles of their doctors for a manager', () => {
    expect(articleScope(admin, null)).toEqual({});
    expect(articleScope(manager, own)).toEqual({ authorId: { $in: ['d1', 'd2'] } });
    expect(articleScope(manager, null)).toEqual({ authorId: { $in: [] } });
  });
});

describe('reviewScope', () => {
  it('is every review for the administrator and the reviews of their doctors and clinics for a manager', () => {
    expect(reviewScope(admin, null)).toEqual({});
    expect(reviewScope(manager, own)).toEqual({ $or: [{ doctorId: { $in: ['d1', 'd2'] } }, { clinicId: { $in: ['c1'] } }] });
    expect(reviewScope(manager, null)).toEqual({ $or: [{ doctorId: { $in: [] } }, { clinicId: { $in: [] } }] });
  });
});
