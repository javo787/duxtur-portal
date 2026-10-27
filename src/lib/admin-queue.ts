/**
 * The database filter of every list on the portal dashboard (moderation queue, directory, counters), in one place.
 * Pure (no database, no Next.js), so the rule «a manager sees only their own» is unit-tested once and every list
 * and every badge asks the same function.
 */
import { queueFilter, scopeFilter, type Staff } from '@/lib/admin-access';

export type QueueTab = 'doctors' | 'clinics' | 'articles' | 'reviews';

export interface OwnedIds { doctorIds: unknown[]; clinicIds: unknown[] }

/**
 * The filter of one list. An administrator sees everything. A manager sees the applications nobody has taken yet
 * (and, as everywhere, their own records), and of everything else only what belongs to their doctors and clinics.
 * A manager without ids (nothing of theirs yet) sees nothing rather than everything.
 *
 * Statuses: doctors and clinics use their own (`pending`, `approved`, `banned`, `rejected`); articles `pending` or
 * `published`; reviews `hidden` or `published`.
 */
export function queueQuery(staff: Staff, tab: QueueTab, status: string, own: OwnedIds | null): Record<string, unknown> {
  const mine: OwnedIds | null = staff.role === 'portal_admin' ? null : (own ?? { doctorIds: [], clinicIds: [] });

  if (tab === 'doctors' || tab === 'clinics') {
    return { status, ...(status === 'pending' ? queueFilter(staff) : scopeFilter(staff)) };
  }
  if (tab === 'articles') {
    return { isVerified: status === 'published', ...(mine ? { authorId: { $in: mine.doctorIds } } : {}) };
  }
  return {
    isVerified: status === 'published',
    ...(mine ? { $or: [{ doctorId: { $in: mine.doctorIds } }, { clinicId: { $in: mine.clinicIds } }] } : {}),
  };
}

/** All articles of a manager's doctors (any status), for totals such as the views counter. */
export function articleScope(staff: Staff, own: OwnedIds | null): Record<string, unknown> {
  if (staff.role === 'portal_admin') return {};
  return { authorId: { $in: (own ?? { doctorIds: [] }).doctorIds } };
}

/** All reviews (any visibility) of a manager's doctors and clinics, for the list and the total. */
export function reviewScope(staff: Staff, own: OwnedIds | null): Record<string, unknown> {
  if (staff.role === 'portal_admin') return {};
  const mine = own ?? { doctorIds: [], clinicIds: [] };
  return { $or: [{ doctorId: { $in: mine.doctorIds } }, { clinicId: { $in: mine.clinicIds } }] };
}
