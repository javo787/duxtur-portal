import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import { TelegramProfile, displayName } from '@/lib/edu-telegram-login';
import { placeholderEmail } from '@/lib/placeholder-email';

/**
 * Sign in and registration of duxtur.org with Telegram.
 *
 * The proof is the one Duxtur Edu already relies on: the person pressed "confirm" in the bot, so Telegram told us
 * which Telegram user id they control. That id is the only thing trusted here (never a name or a username).
 *
 * Which portal account a Telegram id opens, in this order:
 *  1. the account that has this Telegram id;
 *  2. the account whose Edu uid is tg_<id>: its owner linked the Edu Telegram account with a Firebase token that only
 *     this same Telegram person could have, so it is the same person and the Telegram id is attached to it;
 *  3. otherwise a new patient account is created, already holding the Edu uid tg_<id> (when nobody holds it), so the
 *     person's existing Duxtur Edu groups and results are the ones "Continue as ..." opens.
 *
 * Telegram gives no e-mail, so a new account gets a placeholder address (see placeholder-email.ts).
 */

export const TELEGRAM_EDU_PREFIX = 'tg_';

export const telegramEduUid = (telegramId: number) => `${TELEGRAM_EDU_PREFIX}${telegramId}`;

export interface PortalSignInUser {
  id: string;
  email: string;
  role: string;
  name: string;
  image: string;
}

export type TelegramSignInResult =
  | { ok: true; user: PortalSignInUser; created: boolean }
  | { ok: false; code: 'role_not_allowed' | 'doctor_not_approved' };

type UserDoc = { _id: { toString(): string }; email?: string; role?: string; name?: string; image?: string };

const FIELDS = 'email role name image';
const withoutTelegramId = { $or: [{ telegramId: { $exists: false } }, { telegramId: null }] };
const withoutEduUid = { $or: [{ eduUid: { $exists: false } }, { eduUid: null }] };

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 11000;
}

const toSignInUser = (doc: UserDoc): PortalSignInUser => ({
  id: doc._id.toString(),
  email: doc.email ?? '',
  role: doc.role ?? 'patient',
  name: doc.name ?? '',
  image: doc.image ?? '',
});

/**
 * Who may sign in with Telegram. A portal administrator signs in with a password or Google: administrator power
 * does not hang on a chat confirmation. A doctor account that has not been approved is refused for the same reason
 * the password sign-in refuses it.
 */
async function mayEnter(doc: UserDoc): Promise<TelegramSignInResult | null> {
  if (doc.role === 'portal_admin') return { ok: false, code: 'role_not_allowed' };
  if (doc.role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: doc._id }).select('status').lean<{ status?: string } | null>();
    if (doctor?.status !== 'approved') return { ok: false, code: 'doctor_not_approved' };
  }
  return null;
}

export async function signInWithTelegram(tg: TelegramProfile): Promise<TelegramSignInResult> {
  await dbConnect();

  let doc = await User.findOne({ telegramId: tg.id }).select(FIELDS).lean<UserDoc | null>();
  let created = false;

  if (!doc) {
    try {
      doc = await User.findOneAndUpdate(
        { eduUid: telegramEduUid(tg.id), ...withoutTelegramId },
        { $set: { telegramId: tg.id } },
        { returnDocument: 'after' }
      )
        .select(FIELDS)
        .lean<UserDoc | null>();
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      doc = await User.findOne({ telegramId: tg.id }).select(FIELDS).lean<UserDoc | null>();
    }
  }

  if (!doc) {
    doc = await createTelegramUser(tg);
    created = true;
  }

  const refused = await mayEnter(doc);
  if (refused) return refused;
  return { ok: true, user: toSignInUser(doc), created };
}

async function createTelegramUser(tg: TelegramProfile): Promise<UserDoc> {
  const eduUidTaken = await User.exists({ eduUid: telegramEduUid(tg.id) });
  const base = {
    password: '',
    role: 'patient',
    name: displayName(tg).slice(0, 100),
    image: '',
    provider: 'telegram',
    telegramId: tg.id,
  };
  try {
    const user = await User.create({
      ...base,
      email: placeholderEmail(tg.id),
      ...(eduUidTaken ? {} : { eduUid: telegramEduUid(tg.id) }),
    });
    return user;
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    // Two first sign-ins at once (or somebody took the Edu uid a moment ago): the one that got there first wins.
    const existing = await User.findOne({ telegramId: tg.id }).select(FIELDS).lean<UserDoc | null>();
    if (existing) return existing;
    return User.create({ ...base, email: placeholderEmail(tg.id) });
  }
}

export type AttachTelegramResult =
  | { ok: true; alreadyLinked: boolean; eduUid: string | null }
  | { ok: false; code: 'not_found' | 'telegram_taken' | 'already_has_telegram' };

/**
 * Connects the Telegram user that has just confirmed in the bot to the signed-in portal account, so that account can
 * also be opened with Telegram. The caller has proved BOTH sides in one browser: the portal session, and the bot
 * confirmation of a login that this very user started (see the link route).
 */
export async function attachTelegram(userId: string, tg: TelegramProfile): Promise<AttachTelegramResult> {
  await dbConnect();
  const user = await User.findById(userId).select('telegramId eduUid').lean<{ telegramId?: number | null; eduUid?: string | null } | null>();
  if (!user) return { ok: false, code: 'not_found' };
  if (user.telegramId === tg.id) return { ok: true, alreadyLinked: true, eduUid: user.eduUid ?? null };
  if (user.telegramId) return { ok: false, code: 'already_has_telegram' };

  const owner = await User.findOne({ telegramId: tg.id }).select('_id').lean();
  if (owner) return { ok: false, code: 'telegram_taken' };

  try {
    const updated = await User.findOneAndUpdate(
      { _id: userId, ...withoutTelegramId },
      { $set: { telegramId: tg.id } },
      { returnDocument: 'after' }
    )
      .select('_id')
      .lean();
    if (!updated) return { ok: false, code: 'already_has_telegram' };
  } catch (error) {
    if (isDuplicateKey(error)) return { ok: false, code: 'telegram_taken' };
    throw error;
  }

  // This account has no Duxtur Edu account yet: the person's Edu Telegram account becomes it, if nobody holds it.
  let eduUid = user.eduUid ?? null;
  if (!eduUid) {
    try {
      const linked = await User.findOneAndUpdate(
        { _id: userId, ...withoutEduUid },
        { $set: { eduUid: telegramEduUid(tg.id) } },
        { returnDocument: 'after' }
      )
        .select('eduUid')
        .lean<{ eduUid?: string | null } | null>();
      eduUid = linked?.eduUid ?? null;
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
    }
  }
  return { ok: true, alreadyLinked: false, eduUid };
}
