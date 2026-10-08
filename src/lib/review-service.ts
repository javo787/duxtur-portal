import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Doctor from '@/models/Doctor';
import Clinic from '@/models/Clinic';
import Article from '@/models/Article';
import User from '@/models/User';
import { PublicReview, ReviewInput, averageRating, maskName, toPublicReview } from '@/lib/reviews';
import { i18n } from '@/i18n-config';

/**
 * Writing and reading reviews of doctors, clinics and articles (the rules without a database are in reviews.ts).
 *
 *  - only a signed-in account writes; the caller has already checked the session and passes the user id;
 *  - one review per person and subject, and nobody reviews their own profile, clinic or article;
 *  - every review waits for the admin (isVerified) before it is shown, as reviews of doctors always did;
 *  - what comes out is PublicReview: the masked name, never the account.
 */

export type ReviewTarget =
  | { kind: 'doctor'; id: string }
  | { kind: 'clinic'; slug: string }
  | { kind: 'article'; id: string };

export type CreateReviewResult =
  | { ok: true }
  | { ok: false; code: 'no_user' | 'not_found' | 'own' | 'duplicate' };

type Owned = { userId?: unknown } | null;

/** What a review of this subject is stored with, whom the subject belongs to, and how to find an earlier review. */
interface Resolved {
  ownerUserId: string | null;
  /** Fields identifying the subject; also the "have they already reviewed this?" filter. */
  subject: Record<string, unknown>;
  /** Fields stored with the review beyond the subject. */
  extra: Record<string, unknown>;
}

async function resolveTarget(target: ReviewTarget): Promise<Resolved | null> {
  if (target.kind === 'clinic') {
    const clinic = await Clinic.findOne({ slug: target.slug }).select('userId').lean<{ _id: unknown; userId?: unknown } | null>();
    if (!clinic) return null;
    return {
      ownerUserId: clinic.userId ? String(clinic.userId) : null,
      // A review of the clinic itself has neither a doctor nor an article.
      subject: { clinicId: clinic._id, doctorId: { $exists: false }, articleId: { $exists: false } },
      extra: {},
    };
  }

  if (!mongoose.isValidObjectId(target.id)) return null;

  if (target.kind === 'doctor') {
    const doctor = await Doctor.findById(target.id).select('userId clinicId').lean<({ _id: unknown; clinicId?: unknown } & NonNullable<Owned>) | null>();
    if (!doctor) return null;
    return {
      ownerUserId: doctor.userId ? String(doctor.userId) : null,
      subject: { doctorId: doctor._id },
      extra: doctor.clinicId ? { clinicId: doctor.clinicId } : {},
    };
  }

  const article = await Article.findById(target.id).select('authorId isVerified').lean<{ _id: unknown; authorId?: unknown; isVerified?: boolean } | null>();
  // An article nobody can read yet cannot be reviewed.
  if (!article || article.isVerified !== true) return null;
  const author = article.authorId
    ? await Doctor.findById(article.authorId).select('userId').lean<Owned>()
    : null;
  return {
    ownerUserId: author?.userId ? String(author.userId) : null,
    subject: { articleId: article._id },
    extra: {},
  };
}

export async function createReview(target: ReviewTarget, userId: string, input: ReviewInput): Promise<CreateReviewResult> {
  await dbConnect();

  if (!mongoose.isValidObjectId(userId)) return { ok: false, code: 'no_user' };
  const user = await User.findById(userId).select('name').lean<{ name?: string } | null>();
  if (!user) return { ok: false, code: 'no_user' };

  const resolved = await resolveTarget(target);
  if (!resolved) return { ok: false, code: 'not_found' };
  if (resolved.ownerUserId === userId) return { ok: false, code: 'own' };

  // One query that either finds the earlier review (and changes nothing) or writes this one: two taps at the same
  // moment cannot make two reviews. Validation is done by parseReviewInput, as updates skip schema validators.
  const result = await Review.updateOne(
    { patientId: userId, ...resolved.subject },
    {
      $setOnInsert: {
        ...resolved.extra,
        rating: input.rating,
        text: input.text,
        isAnonymous: input.isAnonymous,
        authorName: maskName(user.name),
        isVerified: false,
      },
    },
    { upsert: true },
  );
  return result.upsertedCount > 0 ? { ok: true } : { ok: false, code: 'duplicate' };
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
 * Stars of an article: the votes it collected before reviews needed an account (Article.ratings) plus the approved
 * reviews. Both count, so an article does not lose its history.
 */
export async function articleRatingSummary(article: { _id: unknown; ratings?: number[] }): Promise<{ avg: number; count: number }> {
  await dbConnect();
  const legacy = article.ratings ?? [];
  const [row] = await Review.aggregate<{ sum: number; count: number }>([
    { $match: { articleId: new mongoose.Types.ObjectId(String(article._id)), isVerified: true } },
    { $group: { _id: null, sum: { $sum: '$rating' }, count: { $sum: 1 } } },
  ]);
  const sum = legacy.reduce((total, stars) => total + stars, 0) + (row?.sum ?? 0);
  const count = legacy.length + (row?.count ?? 0);
  return { avg: averageRating(sum, count), count };
}

/** After a review is approved or removed: let every language version of the page it is on show the change. */
export async function revalidateReviewPages(review: { doctorId?: unknown; clinicId?: unknown; articleId?: unknown }): Promise<void> {
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
