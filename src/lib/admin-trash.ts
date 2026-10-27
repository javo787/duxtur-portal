import 'server-only';
import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Clinic from '@/models/Clinic';
import Article from '@/models/Article';
import User from '@/models/User';
import Review from '@/models/Review';
import TrashItem from '@/models/TrashItem';
import { isObjectId, trashExpiry, type AuditEntityType } from '@/lib/admin-moderation';
import { recordAudit } from '@/lib/audit-log';
import { canUseTrashItem, isStaffRole, NOT_YOURS } from '@/lib/admin-access';
import { reviewChanged } from '@/lib/review-service';

/**
 * Deleting through the admin never destroys data at once: a snapshot goes to the trash first (30 days, then MongoDB
 * removes it by itself), and the original is deleted only after that snapshot is safely written. If the snapshot
 * cannot be written, nothing is deleted. Related records are cleaned the same way for every entry point
 * (moderation page and content editor), so a deleted clinic never leaves doctors pointing at it and a deleted
 * doctor never stays in a clinic's list.
 */

export interface AdminActor { userId: string; email: string; role?: string }
export type TrashResult = { ok: true } | { ok: false; error: string };

type Doc = Record<string, unknown> & { _id?: unknown };

const fail = (error: string): TrashResult => ({ ok: false, error });
const ADMIN_ACCOUNT = 'К записи привязан аккаунт администратора: удалять его нельзя';
const SNAPSHOT_FAILED = 'Не удалось сохранить копию в корзину, ничего не удалено';

async function putInTrash(
  entityType: AuditEntityType, entityId: string, label: string, payload: Record<string, unknown>, actor: AdminActor
): Promise<boolean> {
  try {
    await TrashItem.create({
      entityType, entityId, label, payload,
      deletedById: actor.userId, deletedByEmail: actor.email, expiresAt: trashExpiry(),
    });
    return true;
  } catch (error) {
    console.error('Trash snapshot failed:', error);
    return false;
  }
}

const audit = (actor: AdminActor, action: Parameters<typeof recordAudit>[0]['action'], type: AuditEntityType, id: string, label: string, meta?: Record<string, unknown>) =>
  recordAudit({ actor, action, entityType: type, entityId: id, entityLabel: label, meta });

// ─── Delete (move to trash) ─────────────────────────────────────────────────────────────────────────────────────────

export async function trashDoctor(id: string, actor: AdminActor): Promise<TrashResult> {
  if (!isObjectId(id)) return fail('Некорректный идентификатор');
  await dbConnect();
  const doctor = await Doctor.findById(id).lean<Doc | null>();
  if (!doctor) return fail('Врач не найден');

  const user = doctor.userId ? await User.findById(doctor.userId).lean<Doc | null>() : null;
  if (user?.role === 'portal_admin') return fail(ADMIN_ACCOUNT);

  const [articles, clinics] = await Promise.all([
    Article.find({ authorId: id }).lean<Doc[]>(),
    Clinic.find({ doctorIds: id }).select('_id').lean<Doc[]>(),
  ]);
  const label = String(doctor.name ?? '');
  const saved = await putInTrash('doctor', id, label,
    { doctor, user, articles, clinicIds: clinics.map(c => c._id) }, actor);
  if (!saved) return fail(SNAPSHOT_FAILED);

  await Article.deleteMany({ authorId: id });
  await Clinic.updateMany({ doctorIds: id }, { $pull: { doctorIds: id } });
  if (user) await User.deleteOne({ _id: user._id });
  await Doctor.deleteOne({ _id: id });
  await audit(actor, 'doctor.trashed', 'doctor', id, label, { articles: articles.length, hadAccount: !!user });
  return { ok: true };
}

export async function trashClinic(id: string, actor: AdminActor): Promise<TrashResult> {
  if (!isObjectId(id)) return fail('Некорректный идентификатор');
  await dbConnect();
  const clinic = await Clinic.findById(id).lean<Doc | null>();
  if (!clinic) return fail('Клиника не найдена');

  const user = clinic.userId ? await User.findById(clinic.userId).lean<Doc | null>() : null;
  if (user?.role === 'portal_admin') return fail(ADMIN_ACCOUNT);

  const doctors = await Doctor.find({ clinicId: id }).select('_id').lean<Doc[]>();
  const name = clinic.name as { ru?: string } | undefined;
  const label = String(name?.ru ?? '');
  const saved = await putInTrash('clinic', id, label,
    { clinic, user, doctorIds: doctors.map(d => d._id) }, actor);
  if (!saved) return fail(SNAPSHOT_FAILED);

  await Doctor.updateMany({ clinicId: id }, { $set: { clinicId: null } });
  if (user) await User.deleteOne({ _id: user._id });
  await Clinic.deleteOne({ _id: id });
  await audit(actor, 'clinic.trashed', 'clinic', id, label, { doctorsUnlinked: doctors.length, hadAccount: !!user });
  return { ok: true };
}

export async function trashArticle(id: string, actor: AdminActor): Promise<TrashResult> {
  if (!isObjectId(id)) return fail('Некорректный идентификатор');
  await dbConnect();
  const article = await Article.findById(id).lean<Doc | null>();
  if (!article) return fail('Статья не найдена');

  const title = article.title as { ru?: string; uz?: string; tg?: string } | undefined;
  const label = String(title?.ru || title?.uz || title?.tg || article.slug || '');
  if (!(await putInTrash('article', id, label, { article }, actor))) return fail(SNAPSHOT_FAILED);

  await Article.deleteOne({ _id: id });
  await audit(actor, 'article.trashed', 'article', id, label);
  return { ok: true };
}

export async function trashReview(id: string, actor: AdminActor): Promise<TrashResult> {
  if (!isObjectId(id)) return fail('Некорректный идентификатор');
  await dbConnect();
  const review = await Review.findById(id).lean<Doc | null>();
  if (!review) return fail('Отзыв не найден');

  const label = String(review.text ?? '').slice(0, 80);
  if (!(await putInTrash('review', id, label, { review }, actor))) return fail(SNAPSHOT_FAILED);

  await Review.deleteOne({ _id: id });
  // A hidden review was not in the numbers or on the pages, so there is nothing to refresh
  if (review.isVerified) await reviewChanged(review as Parameters<typeof reviewChanged>[0]);
  await audit(actor, 'review.trashed', 'review', id, label, { rating: typeof review.rating === 'number' ? review.rating : null });
  return { ok: true };
}

/** An administrator uses everything, a manager only what they deleted themselves, anybody else nothing. */
const mayUse = (actor: AdminActor, item: Doc) =>
  isStaffRole(actor.role) && canUseTrashItem({ role: actor.role, userId: actor.userId }, item.deletedById);

// ─── Restore and purge ──────────────────────────────────────────────────────────────────────────────────────────────

/** Puts the snapshot back with its original _id. A document that is already there is left untouched, so a restore that stopped halfway can simply be run again. */
async function insertIfMissing(
  model: { collection: { updateOne: (filter: object, update: object, options: object) => Promise<unknown> } },
  doc: unknown
): Promise<void> {
  const { _id, ...rest } = (doc ?? {}) as Doc;
  if (!_id || Object.keys(rest).length === 0) return;
  await model.collection.updateOne({ _id }, { $setOnInsert: rest }, { upsert: true });
}

const isDuplicateKey = (error: unknown) => (error as { code?: number } | null)?.code === 11000;
const DUPLICATE = 'Не удалось восстановить: e-mail или адрес страницы уже занят новой записью. Освободите его или удалите запись из корзины.';

export async function restoreTrashItem(trashId: string, actor: AdminActor): Promise<TrashResult> {
  if (!isObjectId(trashId)) return fail('Некорректный идентификатор');
  await dbConnect();
  const item = await TrashItem.findById(trashId).lean<Doc | null>();
  if (!item) return fail('Записи уже нет в корзине: срок хранения истёк или её восстановили');
  if (!mayUse(actor, item)) return fail(NOT_YOURS);

  const p = (item.payload ?? {}) as Doc;
  try {
    switch (item.entityType) {
      case 'doctor': {
        await insertIfMissing(User, p.user);
        await insertIfMissing(Doctor, p.doctor);
        for (const article of (p.articles as unknown[] | undefined) ?? []) await insertIfMissing(Article, article);
        const doctorId = (p.doctor as Doc | undefined)?._id;
        const clinicIds = (p.clinicIds as unknown[] | undefined) ?? [];
        if (doctorId && clinicIds.length) await Clinic.updateMany({ _id: { $in: clinicIds } }, { $addToSet: { doctorIds: doctorId } });
        break;
      }
      case 'clinic': {
        await insertIfMissing(User, p.user);
        await insertIfMissing(Clinic, p.clinic);
        const clinicId = (p.clinic as Doc | undefined)?._id;
        const doctorIds = (p.doctorIds as unknown[] | undefined) ?? [];
        // only doctors that are still without a clinic are linked back: never override a newer choice
        if (clinicId && doctorIds.length) await Doctor.updateMany({ _id: { $in: doctorIds }, clinicId: null }, { $set: { clinicId } });
        break;
      }
      case 'article':
        await insertIfMissing(Article, p.article);
        break;
      case 'review':
        await insertIfMissing(Review, p.review);
        if ((p.review as Doc | undefined)?.isVerified) await reviewChanged(p.review as Parameters<typeof reviewChanged>[0]);
        break;
      default:
        return fail('Неизвестный тип записи в корзине');
    }
  } catch (error) {
    console.error('Trash restore failed:', error);
    return fail(isDuplicateKey(error) ? DUPLICATE : 'Не удалось восстановить запись. Попробуйте ещё раз: частично восстановленное повторно не задвоится.');
  }

  await TrashItem.deleteOne({ _id: item._id });
  await audit(actor, 'trash.restored', item.entityType as AuditEntityType, String(item.entityId), String(item.label ?? ''));
  return { ok: true };
}

/** Deletes a trash item for good right away (the database would do it anyway after 30 days). */
export async function purgeTrashItem(trashId: string, actor: AdminActor): Promise<TrashResult> {
  if (!isObjectId(trashId)) return fail('Некорректный идентификатор');
  await dbConnect();
  const item = await TrashItem.findById(trashId).lean<Doc | null>();
  if (!item) return fail('Записи уже нет в корзине');
  if (!mayUse(actor, item)) return fail(NOT_YOURS);
  await TrashItem.deleteOne({ _id: item._id });
  await audit(actor, 'trash.purged', item.entityType as AuditEntityType, String(item.entityId), String(item.label ?? ''));
  return { ok: true };
}
