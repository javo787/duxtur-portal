import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Doctor from '@/models/Doctor';
import Clinic from '@/models/Clinic';
import Article from '@/models/Article';
import User from '@/models/User';
import { PublicReview, ReviewInput, averageRating, displayName, toPublicReview } from '@/lib/reviews';
import { notifyAdminNewReview } from '@/lib/telegram';
import { i18n } from '@/i18n-config';

/**
 * Writing and reading reviews of doctors, clinics and articles (the rules without a database are in reviews.ts).
 *
 *  - only a signed-in account writes; the caller has already checked the session and passes the user id;
 *  - one review per person and subject, and nobody reviews their own profile, clinic or article;
 *  - a review is published at once; the administrator sees who wrote it and can hide or delete it (actions/admin.ts);
 *  - what comes out is PublicReview: the name or masked name the author chose, never the account.
 */

export type ReviewTarget =
  | { kind: 'doctor'; id: string }
  | { kind: 'clinic'; slug: string }
  | { kind: 'article'; id: string };

type Owned = { userId?: unknown } | null;

type Ids = { doctorId?: unknown; clinicId?: unknown; articleId?: unknown };

/** What a review of this subject is stored with, whom the subject belongs to, and what to call it in messages. */
interface Resolved {
  ownerUserId: string | null;
  ids: Ids;
  label: string;
}

async function resolveTarget(target: ReviewTarget): Promise<Resolved | null> {
  if (target.kind === 'clinic') {
    const clinic = await Clinic.findOne({ slug: target.slug }).select('userId name').lean<{ _id: unknown; userId?: unknown; name?: { ru?: string } } | null>();
    if (!clinic) return null;
    return {
      ownerUserId: clinic.userId ? String(clinic.userId) : null,
      ids: { clinicId: clinic._id },
      label: clinic.name?.ru || target.slug,
    };
  }

  if (!mongoose.isValidObjectId(target.id)) return null;

  if (target.kind === 'doctor') {
    const doctor = await Doctor.findById(target.id).select('userId clinicId name').lean<({ _id: unknown; clinicId?: unknown; name?: string } & NonNullable<Owned>) | null>();
    if (!doctor) return null;
    return {
      ownerUserId: doctor.userId ? String(doctor.userId) : null,
      // a review of a doctor also counts for the doctor's clinic
      ids: { doctorId: doctor._id, ...(doctor.clinicId ? { clinicId: doctor.clinicId } : {}) },
      label: doctor.name || '',
    };
  }

  const article = await Article.findById(target.id).select('authorId isVerified title').lean<{ _id: unknown; authorId?: unknown; isVerified?: boolean; title?: { ru?: string } } | null>();
  // An article nobody can read yet cannot be reviewed.
  if (!article || article.isVerified !== true) return null;
  const author = article.authorId
    ? await Doctor.findById(article.authorId).select('userId').lean<Owned>()
    : null;
  return {
    ownerUserId: author?.userId ? String(author.userId) : null,
    ids: { articleId: article._id },
    label: article.title?.ru || '',
  };
}

export type CreateReviewResult =
  | { ok: true; id: string }
  | { ok: false; code: 'no_user' | 'not_found' | 'own' | 'duplicate' };

/** "Has this person reviewed this already?": the subject of the review, and nothing else, so a clinic review is not mixed up with reviews of its doctors. */
function subjectFilter(target: ReviewTarget, ids: Ids): Record<string, unknown> {
  if (target.kind === 'doctor') return { doctorId: ids.doctorId };
  if (target.kind === 'article') return { articleId: ids.articleId };
  return { clinicId: ids.clinicId, doctorId: { $exists: false }, articleId: { $exists: false } };
}

export async function createReview(target: ReviewTarget, userId: string, input: ReviewInput): Promise<CreateReviewResult> {
  await dbConnect();

  if (!mongoose.isValidObjectId(userId)) return { ok: false, code: 'no_user' };
  const user = await User.findById(userId).select('name email').lean<{ name?: string; email?: string } | null>();
  if (!user) return { ok: false, code: 'no_user' };

  const resolved = await resolveTarget(target);
  if (!resolved) return { ok: false, code: 'not_found' };
  if (resolved.ownerUserId === userId) return { ok: false, code: 'own' };

  const authorName = displayName(user.name, input.isAnonymous);

  // One query that either finds the earlier review (and changes nothing) or writes this one: two taps at the same
  // moment cannot make two reviews. Validation is done by parseReviewInput, as updates skip schema validators.
  const result = await Review.updateOne(
    { patientId: userId, ...subjectFilter(target, resolved.ids) },
    {
      $setOnInsert: {
        // the doctor's clinic too (a clinic review has only its clinic, which is already in the filter)
        ...(target.kind === 'doctor' && resolved.ids.clinicId ? { clinicId: resolved.ids.clinicId } : {}),
        rating: input.rating,
        text: input.text,
        isAnonymous: input.isAnonymous,
        authorName,
        // published at once; the administrator hides or deletes what should not stay
        isVerified: true,
      },
    },
    { upsert: true },
  );
  if (!(result.upsertedCount > 0)) return { ok: false, code: 'duplicate' };

  // The review is saved: whatever goes wrong below must not turn into "could not send" for the person.
  try {
    await reviewChanged(resolved.ids);
  } catch (error) {
    console.error('Review stats error:', error);
  }
  await notifyAdminNewReview({
    kind: target.kind,
    subject: resolved.label,
    rating: input.rating,
    text: input.text,
    shownAs: authorName,
    account: [user.name, user.email].filter(Boolean).join(', '),
  });

  return { ok: true, id: String(result.upsertedId) };
}

export const REVIEWS_PAGE_SIZE = 10;

/** Approved reviews of one subject, newest first, as visitors see them. */
export async function listPublicReviews(
  filter: Record<string, unknown>,
  { page = 1, limit = REVIEWS_PAGE_SIZE, withDoctorName = false }: { page?: number; limit?: number; withDoctorName?: boolean } = {},
): Promise<PublicReview[]> {
  await dbConnect();
  const safeLimit = Math.min(Math.max(Math.trunc(limit) || REVIEWS_PAGE_SIZE, 1), 20);
  const safePage = Math.max(Math.trunc(page) || 1, 1);

  let query = Review.find({ ...filter, isVerified: true })
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * safeLimit)
    .limit(safeLimit);
  if (withDoctorName) query = query.populate({ path: 'doctorId', model: Doctor, select: 'name' });

  const docs = await query.lean();
  return (docs as Parameters<typeof toPublicReview>[0][]).map(toPublicReview);
}

/**
 * Stars of an article: the votes it collected before reviews needed an account (Article.ratings) plus the published
 * reviews. Both count, so an article does not lose its history.
 */
export async function articleRatingSummary(article: { _id: unknown; ratings?: number[] }): Promise<{ avg: number; count: number }> {
  await dbConnect();
  const legacy = article.ratings ?? [];
  const rows = await Review.find({ articleId: article._id, isVerified: true }).select('rating').lean<{ rating: number }[]>();
  const sum = legacy.reduce((total, stars) => total + stars, 0) + rows.reduce((total, row) => total + row.rating, 0);
  const count = legacy.length + rows.length;
  return { avg: averageRating(sum, count), count };
}

/**
 * The numbers shown for a doctor and a clinic come from their published reviews. Call after one is added, hidden,
 * shown again or deleted. A review of a doctor counts for the doctor's clinic too.
 */
export async function refreshReviewStats(ids: { doctorId?: unknown; clinicId?: unknown }): Promise<void> {
  await dbConnect();
  let clinicId = ids.clinicId;

  if (ids.doctorId) {
    const rows = await Review.find({ doctorId: ids.doctorId, isVerified: true }).select('rating').lean<{ rating: number }[]>();
    const sum = rows.reduce((total, row) => total + row.rating, 0);
    await Doctor.findByIdAndUpdate(ids.doctorId, { reviewCount: rows.length, reviewSum: sum, reviewAvg: averageRating(sum, rows.length) });
    if (!clinicId) {
      const doctor = await Doctor.findById(ids.doctorId).select('clinicId').lean<{ clinicId?: unknown } | null>();
      clinicId = doctor?.clinicId;
    }
  }

  if (clinicId) {
    const { recalculateClinicRating } = await import('@/app/actions/clinic');
    await recalculateClinicRating(String(clinicId));
  }
}

/** Something changed in the published reviews of these subjects: new numbers, and fresh pages in every language. */
export async function reviewChanged(review: Ids): Promise<void> {
  await refreshReviewStats(review);
  await revalidateReviewPages(review);
}

/** Let every language version of the pages these reviews are on show the change. */
export async function revalidateReviewPages(review: Ids): Promise<void> {
  try {
    const { revalidatePath } = await import('next/cache');
    const paths: string[] = [];
    if (review.doctorId) {
      const doctor = await Doctor.findById(review.doctorId).select('slug').lean<{ slug?: string } | null>();
      if (doctor?.slug) paths.push(...i18n.locales.map(lang => `/${lang}/doctor/${doctor.slug}`));
    }
    if (review.clinicId) {
      const clinic = await Clinic.findById(review.clinicId).select('slug').lean<{ slug?: string } | null>();
      if (clinic?.slug) paths.push(...i18n.locales.map(lang => `/${lang}/clinics/${clinic.slug}`));
    }
    if (review.articleId) {
      const article = await Article.findById(review.articleId).select('slug').lean<{ slug?: string } | null>();
      if (article?.slug) paths.push(...i18n.locales.map(lang => `/${lang}/blog/${article.slug}`));
    }
    for (const path of paths) revalidatePath(path);
  } catch (error) {
    console.error('Review revalidation error:', error);
  }
}
