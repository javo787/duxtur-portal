import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import type { VerifiedIdToken } from '@/lib/edu-firebase-id-token';
import { PortalSignInUser, SIGN_IN_FIELDS, SignInRefusal, UserDoc, mayEnter, toSignInUser } from '@/lib/portal-sign-in-policy';
import { TELEGRAM_EDU_PREFIX, signInWithTelegram } from '@/lib/portal-telegram-account';

/**
 * Sign-in to duxtur.org for a person who is already signed in to Duxtur Edu in this browser.
 *
 * The proof is the Firebase ID token of the Edu session (verified by the caller, see edu-firebase-id-token.ts): Google
 * says which Edu uid the person holds. The uid is the only thing trusted. Which portal account it opens:
 *
 *  1. uid "tg_<id>": a Telegram person. The same rules as signing in with Telegram on the portal (their account, or the
 *     one linked to this Edu uid, or a new one), so both doors lead to one account;
 *  2. a portal account that holds this Edu uid (it was linked from a signed-in portal session, or generated for it);
 *  3. nobody holds the uid and the person signed in to Edu with Google: a new portal account with their verified
 *     Google address, the way Google sign-in on the portal makes one. If that address already has an account the
 *     person must sign in to it once and link Edu there: an address alone never merges two accounts.
 */

export type EduSignInResult =
  | { ok: true; user: PortalSignInUser; created: boolean }
  | SignInRefusal
  | { ok: false; code: 'email_in_use' | 'unsupported' };

const TELEGRAM_UID = new RegExp(`^${TELEGRAM_EDU_PREFIX}(\\d{1,15})$`);

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 11000;
}

export async function signInWithEdu(token: VerifiedIdToken): Promise<EduSignInResult> {
  await dbConnect();

  const telegram = TELEGRAM_UID.exec(token.uid);
  if (telegram) {
    return signInWithTelegram({ id: Number(telegram[1]), firstName: (token.tgName || '').slice(0, 64) || 'Telegram' });
  }

  const linked = await User.findOne({ eduUid: token.uid }).select(SIGN_IN_FIELDS).lean<UserDoc | null>();
  if (linked) {
    const refused = await mayEnter(linked);
    if (refused) return refused;
    return { ok: true, user: toSignInUser(linked), created: false };
  }

  // Only a real identity provider vouches for an address; a custom token (a generated uid) is not a person to register.
  if (token.provider !== 'google.com' || !token.email || token.emailVerified !== true) {
    return { ok: false, code: 'unsupported' };
  }

  if (await User.exists({ email: token.email })) return { ok: false, code: 'email_in_use' };

  try {
    const created = await User.create({
      email: token.email,
      password: '',
      role: 'patient',
      name: (token.name || '').slice(0, 100),
      image: token.picture || '',
      provider: 'google',
      eduUid: token.uid,
    });
    return { ok: true, user: toSignInUser(created as UserDoc), created: true };
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    // Two sign-ins at once: whoever got there first made the account, it is this person's if it holds their Edu uid.
    const existing = await User.findOne({ eduUid: token.uid }).select(SIGN_IN_FIELDS).lean<UserDoc | null>();
    if (existing) {
      const refused = await mayEnter(existing);
      return refused ?? { ok: true, user: toSignInUser(existing), created: false };
    }
    return { ok: false, code: 'email_in_use' };
  }
}
