import * as Sentry from '@sentry/nextjs';
import { rateLimit } from '@/lib/rate-limit';
import { IdTokenError, verifyFirebaseIdToken } from '@/lib/edu-firebase-id-token';
import { EduSignInResult, signInWithEdu } from '@/lib/portal-edu-account';
import type { PortalSignInUser } from '@/lib/portal-sign-in-policy';
import { describeError, eduLog, envFlags, maskIp, newReqId } from '@/lib/edu-log';

/**
 * The `authorize` step of the "edu" credentials provider (see src/auth.ts).
 *
 * The page on duxtur.org has asked the Duxtur Edu app, running in a hidden frame of this same origin, for the ID token
 * of the person who is signed in there, and calls signIn('edu', { idToken }). Here the token is verified and turned
 * into a portal account. A refusal that the person can do something about is reported with a code (the next-auth client
 * hands it back); anything else is a plain failed sign-in and the reason goes to the log.
 */

export type EduSignInErrorCode = 'invalid_token' | 'rate_limited' | 'doctor_not_approved' | 'role_not_allowed' | 'email_in_use' | 'unsupported' | 'server';

export class EduSignInFailure extends Error {
  constructor(public readonly code: EduSignInErrorCode) {
    super(code);
    this.name = 'EduSignInFailure';
  }
}

export async function authorizeEduSignIn(
  credentials: Partial<Record<string, unknown>> | undefined,
  ip: string
): Promise<PortalSignInUser> {
  const reqId = newReqId();

  try {
    const { success } = await rateLimit(`portal_edu_signin_${ip}`, 20, 60 * 1000);
    if (!success) {
      eduLog('portal-edu', reqId, 'signin:rate-limited', { ip: maskIp(ip) }, 'warn');
      throw new EduSignInFailure('rate_limited');
    }

    const projectId = envFlags().firebaseProjectId;
    if (typeof projectId !== 'string' || !projectId) {
      eduLog('portal-edu', reqId, 'signin:no-project-id', { env: envFlags() }, 'error');
      throw new EduSignInFailure('server');
    }

    let verified;
    try {
      verified = await verifyFirebaseIdToken(credentials?.idToken, { projectId });
    } catch (error) {
      if (error instanceof IdTokenError) {
        eduLog('portal-edu', reqId, 'signin:id-token-refused', { reason: error.reason }, 'warn');
        throw new EduSignInFailure(error.reason === 'keys-unavailable' ? 'server' : 'invalid_token');
      }
      throw error;
    }

    const result: EduSignInResult = await signInWithEdu(verified);
    if (!result.ok) {
      eduLog('portal-edu', reqId, 'signin:refused', { code: result.code, provider: verified.provider }, 'warn');
      throw new EduSignInFailure(result.code);
    }
    eduLog('portal-edu', reqId, result.created ? 'signin:registered' : 'signin:ok', {
      provider: verified.provider,
      uidKind: verified.uid.split('_')[0].slice(0, 3),
      role: result.user.role,
    });
    return result.user;
  } catch (error) {
    if (error instanceof EduSignInFailure) throw error;
    Sentry.captureException(error);
    eduLog('portal-edu', reqId, 'signin:error', describeError(error), 'error');
    throw new EduSignInFailure('server');
  }
}
