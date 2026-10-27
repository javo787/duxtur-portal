import { describe, it, expect } from 'vitest';
import {
  canActOn, canUseTrashItem, claimUpdate, isStaffRole, isUntakenApplication, ownsRecord, queueFilter, scopeFilter,
  type Staff, type StaffAction,
} from './admin-access';

const admin: Staff = { userId: 'a1', email: 'a@x.tj', role: 'portal_admin' };
const manager: Staff = { userId: 'm1', email: 'm@x.tj', role: 'portal_manager' };
const other = 'm2';
const ACTIONS: StaffAction[] = ['approve', 'reject', 'edit', 'ban', 'delete'];

describe('roles', () => {
  it('knows only the two staff roles', () => {
    expect(isStaffRole('portal_admin')).toBe(true);
    expect(isStaffRole('portal_manager')).toBe(true);
    for (const r of ['doctor', 'clinic', 'patient', 'admin', 'manager', '', undefined, null]) expect(isStaffRole(r)).toBe(false);
  });
});

describe('ownsRecord', () => {
  it('compares ids as text, so an ObjectId works too', () => {
    expect(ownsRecord(manager, 'm1')).toBe(true);
    expect(ownsRecord(manager, { toString: () => 'm1' })).toBe(true);
    expect(ownsRecord(manager, other)).toBe(false);
  });
  it('nobody owns an unowned record', () => {
    for (const none of [undefined, null, '']) expect(ownsRecord(manager, none)).toBe(false);
  });
});

describe('canActOn', () => {
  it('the administrator may do everything to everything', () => {
    for (const a of ACTIONS) {
      expect(canActOn(admin, a, { managedBy: other, status: 'approved' })).toBe(true);
      expect(canActOn(admin, a, {})).toBe(true);
    }
  });

  it('a manager may do everything to a record they own, in any status', () => {
    for (const status of ['pending', 'approved', 'rejected', 'banned', 'pre_imported']) {
      for (const a of ACTIONS) expect(canActOn(manager, a, { managedBy: 'm1', status })).toBe(true);
    }
  });

  it('a manager may take up an application nobody has taken, by approving or rejecting it', () => {
    expect(canActOn(manager, 'approve', { status: 'pending' })).toBe(true);
    expect(canActOn(manager, 'reject', { status: 'pending', managedBy: null })).toBe(true);
  });

  it('but may not edit, ban or delete it before it is theirs', () => {
    for (const a of ['edit', 'ban', 'delete'] as const) expect(canActOn(manager, a, { status: 'pending' })).toBe(false);
  });

  it('a manager may not touch what another manager or the administrator handles', () => {
    for (const a of ACTIONS) {
      expect(canActOn(manager, a, { managedBy: other, status: 'pending' })).toBe(false);
      expect(canActOn(manager, a, { managedBy: other, status: 'approved' })).toBe(false);
    }
  });

  it('a manager may not touch records nobody manages unless they are applications in the queue', () => {
    for (const status of ['approved', 'banned', 'rejected', 'pre_imported', undefined]) {
      for (const a of ACTIONS) expect(canActOn(manager, a, { status })).toBe(false);
    }
  });

  it('any other role has no staff rights at all', () => {
    for (const role of ['doctor', 'patient', 'clinic', undefined]) {
      for (const a of ACTIONS) expect(canActOn({ ...manager, role: role as never }, a, { managedBy: 'm1', status: 'pending' })).toBe(false);
    }
  });
});

describe('claimUpdate', () => {
  it('a manager takes ownership of what they approve or reject from the queue', () => {
    expect(claimUpdate(manager, { status: 'pending' })).toEqual({ managedBy: 'm1' });
  });
  it('nothing changes for the owner or for the administrator', () => {
    expect(claimUpdate(manager, { managedBy: 'm1' })).toEqual({});
    expect(claimUpdate(admin, { status: 'pending' })).toEqual({});
  });
});

describe('isUntakenApplication', () => {
  it('is a pending record without an owner', () => {
    expect(isUntakenApplication({ status: 'pending' })).toBe(true);
    expect(isUntakenApplication({ status: 'pending', managedBy: 'm2' })).toBe(false);
    expect(isUntakenApplication({ status: 'approved' })).toBe(false);
  });
});

describe('list filters', () => {
  it('the administrator sees everything', () => {
    expect(scopeFilter(admin)).toEqual({});
    expect(queueFilter(admin)).toEqual({});
  });
  it('a manager sees their own records, and in the queue also what is not taken', () => {
    expect(scopeFilter(manager)).toEqual({ managedBy: 'm1' });
    expect(queueFilter(manager)).toEqual({ $or: [{ managedBy: null }, { managedBy: 'm1' }] });
  });
});

describe('trash', () => {
  it('a manager uses only what they deleted themselves', () => {
    expect(canUseTrashItem(manager, 'm1')).toBe(true);
    expect(canUseTrashItem(manager, other)).toBe(false);
    expect(canUseTrashItem(manager, '')).toBe(false);
    expect(canUseTrashItem(admin, other)).toBe(true);
  });
});
