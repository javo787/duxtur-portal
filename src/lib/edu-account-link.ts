import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

/**
 * One person, one account: the portal User is the account, a Duxtur Edu (Firebase) uid is attached to it as `eduUid`.
 *
 * Rules that keep two people from ever being merged into one:
 * - the link is made only from a signed-in portal session AND a verified Firebase ID token (see the link route),
 *   never because an e-mail or a name happens to match;
 * - one Edu uid belongs to at most one portal user and the other way round;
 * - a uid in the portal-generated "dx_<portalUserId>" form belongs to exactly that portal user.
 */

/** Prefix of the Edu uid that is generated for a portal user who has no Edu account yet. */
export const GENERATED_UID_PREFIX = 'dx_';

export const generatedEduUid = (portalUserId: string) => `${GENERATED_UID_PREFIX}${portalUserId}`;

const MAX_UID_LENGTH = 128;

export type LinkResult =
  | { ok: true; eduUid: string; alreadyLinked: boolean }
  | { ok: false; code: 'not_found' | 'invalid_uid' | 'edu_uid_taken' | 'portal_already_linked' };

const withoutEduUid = { $or: [{ eduUid: { $exists: false } }, { eduUid: null }] };

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 11000;
}

/** The Edu uid of this portal user, generating and saving one on first use. */
export async function getOrCreateEduUid(portalUserId: string): Promise<{ eduUid: string; created: boolean } | null> {
  await dbConnect();
  const user = await User.findById(portalUserId).select('eduUid').lean<{ eduUid?: string | null }>();
  if (!user) return null;
  if (user.eduUid) return { eduUid: user.eduUid, created: false };

  const candidate = generatedEduUid(portalUserId);
  const updated = await User.findOneAndUpdate(
    { _id: portalUserId, ...withoutEduUid },
    { $set: { eduUid: candidate } },
    { new: true }
  ).select('eduUid').lean<{ eduUid?: string | null }>();
  if (updated?.eduUid === candidate) return { eduUid: candidate, created: true };

  // Somebody else (a parallel request, or a link made a moment ago) set it first: use theirs.
  const reread = await User.findById(portalUserId).select('eduUid').lean<{ eduUid?: string | null }>();
  return reread?.eduUid ? { eduUid: reread.eduUid, created: false } : null;
}

/** Attaches an Edu uid that the caller has just proved to own. */
export async function linkEduUid(portalUserId: string, eduUid: string): Promise<LinkResult> {
  if (typeof eduUid !== 'string' || eduUid.length === 0 || eduUid.length > MAX_UID_LENGTH) {
    return { ok: false, code: 'invalid_uid' };
  }
  if (eduUid.startsWith(GENERATED_UID_PREFIX) && eduUid !== generatedEduUid(portalUserId)) {
    return { ok: false, code: 'invalid_uid' };
  }

  await dbConnect();
  const user = await User.findById(portalUserId).select('eduUid').lean<{ eduUid?: string | null }>();
  if (!user) return { ok: false, code: 'not_found' };
  if (user.eduUid === eduUid) return { ok: true, eduUid, alreadyLinked: true };
  if (user.eduUid) return { ok: false, code: 'portal_already_linked' };

  const owner = await User.findOne({ eduUid }).select('_id').lean();
  if (owner) return { ok: false, code: 'edu_uid_taken' };

  try {
    const updated = await User.findOneAndUpdate(
      { _id: portalUserId, ...withoutEduUid },
      { $set: { eduUid } },
      { new: true }
    ).select('_id').lean();
    if (!updated) return { ok: false, code: 'portal_already_linked' };
  } catch (error) {
    if (isDuplicateKey(error)) return { ok: false, code: 'edu_uid_taken' };
    throw error;
  }
  return { ok: true, eduUid, alreadyLinked: false };
}

export type UnlinkResult =
  | { ok: true; previous: string | null }
  | { ok: false; code: 'cannot_unlink' };

/**
 * Detaches the Edu uid. The Edu profile itself (groups, results) is not touched: it simply stops being reachable
 * through this portal account. `previous` is the uid that was detached, or null if there was none.
 *
 * A generated dx_ uid cannot be detached: that Edu profile was created from the portal account and the portal is
 * its only way in, so unlinking would strand it with its groups and results.
 */
export async function unlinkEduUid(portalUserId: string): Promise<UnlinkResult> {
  await dbConnect();
  const user = await User.findById(portalUserId).select('eduUid').lean<{ eduUid?: string | null }>();
  if (user?.eduUid?.startsWith(GENERATED_UID_PREFIX)) return { ok: false, code: 'cannot_unlink' };

  const before = await User.findOneAndUpdate(
    { _id: portalUserId, eduUid: { $exists: true, $ne: null, $not: { $regex: `^${GENERATED_UID_PREFIX}` } } },
    { $unset: { eduUid: '' } },
    { new: false }
  ).select('eduUid').lean<{ eduUid?: string | null }>();
  return { ok: true, previous: before?.eduUid ?? null };
}
