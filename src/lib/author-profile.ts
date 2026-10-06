/**
 * What a person must have on file before an article of theirs can go to the portal, and where they stand.
 *
 * The required set is exactly what the doctor registration form asks for (name, specialty, phone, diploma): a person
 * who has all four is a complete application and the team can verify them. Nobody is asked for more than that, and a
 * doctor who is already approved is never asked again (the team verified them when they registered).
 */

export const REQUIRED_AUTHOR_FIELDS = ['name', 'specialty', 'phone', 'documentImage'] as const;
export type AuthorField = (typeof REQUIRED_AUTHOR_FIELDS)[number];

/**
 * - new: no doctor profile yet (a Telegram or Google account that has just come to write);
 * - pending: the profile was sent for verification and waits for the team;
 * - approved: a verified doctor, articles are published at once;
 * - blocked: the profile was rejected or banned, nothing can be published.
 */
export type AuthorStanding = 'new' | 'pending' | 'approved' | 'blocked';

export interface DoctorProfileLike {
  status?: string;
  name?: string;
  phone?: string;
  specialty?: Record<string, string | undefined> | null;
  documentImage?: string;
}

export interface AuthorState {
  standing: AuthorStanding;
  /** Required fields that are still empty. Always empty for an approved doctor. */
  missing: AuthorField[];
  /** Approved: the article becomes public as soon as it is saved. */
  canPublishNow: boolean;
  /** Nothing is missing, so the profile can be (or already was) sent for verification. */
  canSubmit: boolean;
}

/** A byline needs a real name: at least two words of at least two letters ("Alisher Karimov"), not "Ali" or "👨‍⚕️". */
export function isFullName(name: unknown): boolean {
  if (typeof name !== 'string') return false;
  const words = name.trim().split(/\s+/).filter(word => word.replace(/[^\p{L}]/gu, '').length >= 2);
  return words.length >= 2;
}

/** Digits of a phone number, enough to be dialled (7 to 15 digits, E.164). */
export function isPhone(phone: unknown): boolean {
  if (typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

const anyLanguage = (field: DoctorProfileLike['specialty']): string =>
  field ? Object.values(field).find(v => typeof v === 'string' && v.trim()) ?? '' : '';

/**
 * @param accountName the name on the account, used while there is no doctor profile (the form is prefilled with it).
 */
export function evaluateAuthor(accountName: string, doctor: DoctorProfileLike | null): AuthorState {
  if (doctor && (doctor.status === 'approved')) {
    return { standing: 'approved', missing: [], canPublishNow: true, canSubmit: true };
  }
  if (doctor && (doctor.status === 'rejected' || doctor.status === 'banned')) {
    return { standing: 'blocked', missing: [], canPublishNow: false, canSubmit: false };
  }

  const missing: AuthorField[] = [];
  if (!isFullName(doctor?.name || accountName)) missing.push('name');
  if (!anyLanguage(doctor?.specialty)) missing.push('specialty');
  if (!isPhone(doctor?.phone)) missing.push('phone');
  if (!doctor?.documentImage) missing.push('documentImage');

  return {
    standing: doctor ? 'pending' : 'new',
    missing,
    canPublishNow: false,
    canSubmit: missing.length === 0,
  };
}
