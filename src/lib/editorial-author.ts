import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';

/**
 * The byline for articles written by the super admin.
 *
 * Articles need an author that is a Doctor document (`Article.authorId`). The super admin is not a doctor, so they get
 * one editorial profile, "Редакция Duxtur", created the first time they publish. It is kept as `pre_imported` and
 * flagged `isEditorial`: public doctor lists only show `approved` doctors, and a `pre_imported` profile nobody claimed
 * has no public page. Claiming it is blocked as well (see `claimDoctorProfile`).
 */

export const EDITORIAL_NAME = 'Редакция Duxtur';
export const EDITORIAL_IMAGE = 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png';

const EDITORIAL_SPECIALTY = {
  ru: 'Медицинская редакция',
  uz: 'Tibbiy tahririyat',
  tg: 'Идораи тиббӣ',
  ky: 'Медициналык редакция',
  kk: 'Медициналық редакция',
};

/** The editorial profile of this administrator; created on first use. */
export async function ensureEditorialAuthor(userId: unknown): Promise<{ _id: unknown }> {
  await dbConnect();
  const found = await Doctor.findOne({ userId, isEditorial: true }).select('_id').lean<{ _id: unknown }>();
  if (found) return found;

  const created = await Doctor.create({
    userId,
    name: EDITORIAL_NAME,
    isEditorial: true,
    status: 'pre_imported',
    specialty: EDITORIAL_SPECIALTY,
    image: EDITORIAL_IMAGE,
  });
  return { _id: created._id };
}
