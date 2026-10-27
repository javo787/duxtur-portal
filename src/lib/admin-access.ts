/**
 * Who may do what in the portal admin. Two staff roles:
 *  - portal_admin: everything, on every record.
 *  - portal_manager: works only with the records they added or approved (`managedBy` is their id), plus the queue of
 *    applications nobody has taken yet; a manager takes an application by approving or rejecting it.
 * Pure rules, no database and no Next.js: the server actions and pages ask these functions, and they are unit-tested.
 */

export const STAFF_ROLES = ['portal_admin', 'portal_manager'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];
export const isStaffRole = (value: unknown): value is StaffRole => (STAFF_ROLES as readonly unknown[]).includes(value);

export interface Staff { userId: string; email: string; role: StaffRole }

export type StaffAction = 'approve' | 'reject' | 'edit' | 'ban' | 'delete';

/** The part of a doctor or a clinic the rules look at. */
export interface Scoped { managedBy?: unknown; status?: string }

const idOf = (value: unknown): string => (value === null || value === undefined ? '' : String(value));

export function ownsRecord(staff: Pick<Staff, 'userId'>, managedBy: unknown): boolean {
  const owner = idOf(managedBy);
  return owner !== '' && owner === staff.userId;
}

/** An application waiting for moderation that no manager has taken yet. */
export const isUntakenApplication = (record: Scoped): boolean => record.status === 'pending' && idOf(record.managedBy) === '';

export function canActOn(staff: Staff, action: StaffAction, record: Scoped): boolean {
  if (staff.role === 'portal_admin') return true;
  if (staff.role !== 'portal_manager') return false;
  if (ownsRecord(staff, record.managedBy)) return true;
  return (action === 'approve' || action === 'reject') && isUntakenApplication(record);
}

/** What to write on the record so a manager who just approved or rejected it owns it from now on (nothing for an admin). */
export function claimUpdate(staff: Staff, record: Scoped): { managedBy?: string } {
  if (staff.role !== 'portal_manager' || ownsRecord(staff, record.managedBy)) return {};
  return { managedBy: staff.userId };
}

/** Records a person may see in lists: everything for an admin, their own for a manager. */
export function scopeFilter(staff: Staff): Record<string, unknown> {
  return staff.role === 'portal_admin' ? {} : { managedBy: staff.userId };
}

/** The moderation queue: for a manager their own records and the applications nobody has taken. */
export function queueFilter(staff: Staff): Record<string, unknown> {
  return staff.role === 'portal_admin' ? {} : { $or: [{ managedBy: null }, { managedBy: staff.userId }] };
}

/** A manager sees and restores only what they deleted themselves. */
export function canUseTrashItem(staff: Pick<Staff, 'role' | 'userId'>, deletedById: unknown): boolean {
  return staff.role === 'portal_admin' || (staff.role === 'portal_manager' && idOf(deletedById) === staff.userId);
}

export const NOT_YOURS = 'Эта запись не ваша: ею управляет тот, кто её добавил или одобрил, или администратор';
export const NOT_FOUND = 'Запись не найдена';
