import 'server-only';
import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Clinic from '@/models/Clinic';
import Article from '@/models/Article';
import type { Staff } from '@/lib/admin-access';
import { queueQuery } from '@/lib/admin-queue';
import { managedIds } from '@/lib/admin-scope';

/** What waits for the person who is signed in: the numbers shown as badges in the portal navigation. */
export interface PortalCounts {
  doctors: number;
  clinics: number;
  articles: number;
}

/** For an administrator everything that waits; for a manager the applications nobody has taken plus what is theirs. */
export async function getPortalCounts(staff: Staff): Promise<PortalCounts> {
  try {
    await dbConnect();
    const own = staff.role === 'portal_admin' ? null : await managedIds(staff);
    const [doctors, clinics, articles] = await Promise.all([
      Doctor.countDocuments(queueQuery(staff, 'doctors', 'pending', own)),
      Clinic.countDocuments(queueQuery(staff, 'clinics', 'pending', own)),
      Article.countDocuments(queueQuery(staff, 'articles', 'pending', own)),
    ]);
    return { doctors, clinics, articles };
  } catch (error) {
    // A badge is never worth a broken page.
    console.error('getPortalCounts error:', error);
    return { doctors: 0, clinics: 0, articles: 0 };
  }
}
