import 'server-only';
import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Clinic from '@/models/Clinic';
import Article from '@/models/Article';
import Review from '@/models/Review';
import {
  canActOn, NOT_FOUND, NOT_YOURS, ownsRecord, type Scoped, type Staff, type StaffAction,
} from '@/lib/admin-access';
import { isObjectId } from '@/lib/admin-moderation';

export type ScopedEntity = 'doctor' | 'clinic' | 'article' | 'review';
export type Access = { ok: true; record: Scoped } | { ok: false; error: string };

const BAD_ID = 'Некорректный идентификатор';

/**
 * May this staff member do this to this record? The administrator always may (no database read). A manager is checked
 * against the record in the database, never against anything the browser sent. An article belongs to whoever manages
 * its author; a review to whoever manages the doctor or the clinic it is about.
 */
export async function checkAccess(staff: Staff, action: StaffAction, entity: ScopedEntity, id: string): Promise<Access> {
  if (!isObjectId(id)) return { ok: false, error: BAD_ID };
  if (staff.role === 'portal_admin') return { ok: true, record: {} };

  await dbConnect();
  const denied = (found: boolean): Access => ({ ok: false, error: found ? NOT_YOURS : NOT_FOUND });

  if (entity === 'doctor' || entity === 'clinic') {
    const record = await (entity === 'doctor' ? Doctor : Clinic).findById(id).select('managedBy status').lean<Scoped | null>();
    if (!record) return denied(false);
    return canActOn(staff, action, record) ? { ok: true, record } : denied(true);
  }

  if (entity === 'article') {
    const article = await Article.findById(id).select('authorId').lean<{ authorId?: unknown } | null>();
    if (!article) return denied(false);
    const author = article.authorId ? await Doctor.findById(article.authorId).select('managedBy').lean<Scoped | null>() : null;
    return author && ownsRecord(staff, author.managedBy) ? { ok: true, record: author } : denied(true);
  }

  const review = await Review.findById(id).select('doctorId clinicId').lean<{ doctorId?: unknown; clinicId?: unknown } | null>();
  if (!review) return denied(false);
  const [doctor, clinic] = await Promise.all([
    review.doctorId ? Doctor.findById(review.doctorId).select('managedBy').lean<Scoped | null>() : null,
    review.clinicId ? Clinic.findById(review.clinicId).select('managedBy').lean<Scoped | null>() : null,
  ]);
  const owned = (doctor && ownsRecord(staff, doctor.managedBy)) || (clinic && ownsRecord(staff, clinic.managedBy));
  return owned ? { ok: true, record: {} } : denied(true);
}

/** Ids of the doctors and clinics a manager manages: the scope of their articles and reviews. */
export async function managedIds(staff: Staff): Promise<{ doctorIds: unknown[]; clinicIds: unknown[] }> {
  await dbConnect();
  const [doctors, clinics] = await Promise.all([
    Doctor.find({ managedBy: staff.userId }).select('_id').lean<{ _id: unknown }[]>(),
    Clinic.find({ managedBy: staff.userId }).select('_id').lean<{ _id: unknown }[]>(),
  ]);
  return { doctorIds: doctors.map(d => d._id), clinicIds: clinics.map(c => c._id) };
}
