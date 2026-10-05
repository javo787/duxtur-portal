import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { rateLimit } from '@/lib/rate-limit';
import { eduPreflight, isAllowedOrigin, withEduCors } from '@/lib/edu-cors';
import { IdTokenError, verifyFirebaseIdToken } from '@/lib/edu-firebase-id-token';
import { linkEduUid, unlinkEduUid } from '@/lib/edu-account-link';
import { describeError, eduLog, envFlags, newReqId } from '@/lib/edu-log';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  return eduPreflight(req);
}

const CONFLICT_MESSAGES = {
  edu_uid_taken: 'This Duxtur Edu account is already linked to another duxtur.org account.',
  portal_already_linked: 'This duxtur.org account already has a Duxtur Edu account. Unlink it first.',
  invalid_uid: 'This Duxtur Edu account cannot be linked.',
  cannot_unlink: 'This Duxtur Edu profile was created from the duxtur.org account and can only be reached through it, so it cannot be unlinked.',
  not_found: 'Account not found.',
} as const;

/**
 * POST /api/edu-auth/link { idToken }
 * Links the Edu account that owns `idToken` (a Firebase ID token from the Edu app) to the portal account of the
 * session cookie. Both halves must be proved in the same request: the person is signed in on duxtur.org AND holds
 * the Edu account. Linking never happens because an e-mail matches.
 */
export async function POST(req: NextRequest) {
  const reqId = newReqId();
  const respond = (body: Record<string, unknown>, status = 200) => withEduCors(req, NextResponse.json(body, { status }), reqId);

  if (!isAllowedOrigin(req)) {
    eduLog('link', reqId, 'link:origin-refused', { origin: req.headers.get('origin') }, 'warn');
    return respond({ error: 'Forbidden', code: 'bad_origin', ref: reqId }, 403);
  }

  try {
    const ip = (req.headers.get('x-forwarded-for') || 'anonymous').split(',')[0].trim();
    const { success } = await rateLimit(`edu_link_${ip}`, 10, 60 * 1000);
    if (!success) return respond({ error: 'Too many requests', ref: reqId }, 429);

    const session = await auth();
    const portalUserId = (session?.user as { id?: string } | undefined)?.id;
    if (!portalUserId) return respond({ error: 'Not signed in on duxtur.org', code: 'not_signed_in', ref: reqId }, 401);

    let body: { idToken?: unknown };
    try {
      body = await req.json();
    } catch {
      return respond({ error: 'Bad request', ref: reqId }, 400);
    }

    const projectId = envFlags().firebaseProjectId;
    if (typeof projectId !== 'string' || !projectId) {
      eduLog('link', reqId, 'link:no-project-id', { env: envFlags() }, 'error');
      return respond({ error: 'Server error', ref: reqId }, 500);
    }

    let verified;
    try {
      verified = await verifyFirebaseIdToken(body.idToken, { projectId });
    } catch (error) {
      if (error instanceof IdTokenError) {
        eduLog('link', reqId, 'link:id-token-refused', { reason: error.reason }, 'warn');
        return respond({ error: 'Your Duxtur Edu sign-in could not be verified. Sign in to Edu again.', code: 'invalid_id_token', ref: reqId }, error.reason === 'keys-unavailable' ? 503 : 401);
      }
      throw error;
    }

    const result = await linkEduUid(portalUserId, verified.uid);
    if (!result.ok) {
      eduLog('link', reqId, 'link:refused', { code: result.code, provider: verified.provider }, 'warn');
      return respond({ error: CONFLICT_MESSAGES[result.code], code: result.code, ref: reqId }, result.code === 'not_found' ? 404 : 409);
    }

    eduLog('link', reqId, 'link:linked', { alreadyLinked: result.alreadyLinked, provider: verified.provider, uidKind: result.eduUid.split('_')[0] });
    return respond({ linked: true, eduUid: result.eduUid, alreadyLinked: result.alreadyLinked });
  } catch (error) {
    Sentry.captureException(error);
    eduLog('link', reqId, 'link:failed', { ...describeError(error), env: envFlags() }, 'error');
    return respond({ error: 'Server error', ref: reqId }, 500);
  }
}

/**
 * DELETE /api/edu-auth/link
 * Detaches the Edu account from the signed-in portal account. The Edu profile (groups, results) stays where it is;
 * it just stops being reachable through "Sign in with duxtur.org".
 */
export async function DELETE(req: NextRequest) {
  const reqId = newReqId();
  const respond = (body: Record<string, unknown>, status = 200) => withEduCors(req, NextResponse.json(body, { status }), reqId);

  if (!isAllowedOrigin(req)) {
    eduLog('link', reqId, 'unlink:origin-refused', { origin: req.headers.get('origin') }, 'warn');
    return respond({ error: 'Forbidden', code: 'bad_origin', ref: reqId }, 403);
  }

  try {
    const session = await auth();
    const portalUserId = (session?.user as { id?: string } | undefined)?.id;
    if (!portalUserId) return respond({ error: 'Not signed in on duxtur.org', code: 'not_signed_in', ref: reqId }, 401);

    const result = await unlinkEduUid(portalUserId);
    if (!result.ok) {
      eduLog('link', reqId, 'unlink:refused', { code: result.code }, 'warn');
      return respond({ error: CONFLICT_MESSAGES[result.code], code: result.code, ref: reqId }, 409);
    }
    eduLog('link', reqId, 'link:unlinked', { hadLink: result.previous !== null, uidKind: result.previous?.split('_')[0] ?? null });
    return respond({ unlinked: result.previous !== null });
  } catch (error) {
    Sentry.captureException(error);
    eduLog('link', reqId, 'unlink:failed', { ...describeError(error), env: envFlags() }, 'error');
    return respond({ error: 'Server error', ref: reqId }, 500);
  }
}
