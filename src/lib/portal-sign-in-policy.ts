import Doctor from '@/models/Doctor';

/**
 * Who may enter duxtur.org without a password, and what the session is told about them.
 * Shared by the sign-in routes whose proof is somebody else's check (a Telegram confirmation in the bot, a Duxtur Edu
 * sign-in): neither can open an administrator account, and neither opens a doctor account that has not been approved.
 */

export interface PortalSignInUser {
  id: string;
  email: string;
  role: string;
  name: string;
  image: string;
}

export type UserDoc = { _id: { toString(): string }; email?: string; role?: string; name?: string; image?: string };

export const SIGN_IN_FIELDS = 'email role name image';

export type SignInRefusal = { ok: false; code: 'role_not_allowed' | 'doctor_not_approved' };

export const toSignInUser = (doc: UserDoc): PortalSignInUser => ({
  id: doc._id.toString(),
  email: doc.email ?? '',
  role: doc.role ?? 'patient',
  name: doc.name ?? '',
  image: doc.image ?? '',
});

/**
 * A portal administrator signs in with a password or Google: administrator power does not hang on a chat
 * confirmation. A doctor account that has not been approved is refused for the same reason the password sign-in
 * refuses it.
 */
export async function mayEnter(doc: UserDoc): Promise<SignInRefusal | null> {
  if (doc.role === 'portal_admin') return { ok: false, code: 'role_not_allowed' };
  if (doc.role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: doc._id }).select('status').lean<{ status?: string } | null>();
    if (doctor?.status !== 'approved') return { ok: false, code: 'doctor_not_approved' };
  }
  return null;
}
