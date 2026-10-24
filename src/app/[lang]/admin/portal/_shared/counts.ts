import 'server-only';
import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Clinic from '@/models/Clinic';
import Article from '@/models/Article';

/** What waits for the super admin: the numbers shown as badges in the portal navigation. */
export interface PortalCounts {
  doctors: number;
  clinics: number;
  articles: number;
}

export async function getPortalCounts(): Promise<PortalCounts> {
  try {
    await dbConnect();
    const [doctors, clinics, articles] = await Promise.all([
      Doctor.countDocuments({ status: 'pending' }),
      Clinic.countDocuments({ status: 'pending' }),
      Article.countDocuments({ isVerified: false }),
    ]);
    return { doctors, clinics, articles };
  } catch (error) {
    // A badge is never worth a broken page.
    console.error('getPortalCounts error:', error);
    return { doctors: 0, clinics: 0, articles: 0 };
  }
}
