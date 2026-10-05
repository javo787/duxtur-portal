import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import { rateLimit } from '@/lib/rate-limit';
import { createEduCustomToken } from '@/lib/edu-custom-token';
import { eduPreflight, isAllowedOrigin, withEduCors } from '@/lib/edu-cors';
import { getOrCreateEduUid } from '@/lib/edu-account-link';
import { realEmail } from '@/lib/placeholder-email';
import { describeError, eduLog, envFlags, newReqId } from '@/lib/edu-log';

export const dynamic = 'force-dynamic';

type PortalUser = { _id: { toString(): string }; name?: string; email?: string; image?: string; role?: string; eduUid?: string | null };

/** The signed-in portal account of this request, read from the session cookie. */
async function currentPortalUser(): Promise<PortalUser | null> {
  const session = await auth();
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) return null;
  await dbConnect();
  const user = await User.findById(id).select('name email image role eduUid').lean<PortalUser>();
  return user ?? null;
}

export async function OPTIONS(req: NextRequest) {
  return eduPreflight(req);
}

// GET /api/edu-auth/session ->
//   { signedIn: false } | { signedIn: true, name, email, image, eduUid, role, doctor: { status } | null }
// Lets the Edu sign-in page offer "Continue as ...", the Edu profile show what is linked, and the Edu teacher's
// "Articles" page say whether this person may write articles (an approved doctor profile). No token is issued here.
export async function GET(req: NextRequest) {
  const reqId = newReqId();
  const respond = (body: Record<string, unknown>, status = 200) => withEduCors(req, NextResponse.json(body, { status }), reqId);
  try {
    const user = await currentPortalUser();
    if (!user) return respond({ signedIn: false });
    const doctor = await Doctor.findOne({ userId: user._id }).select('status').lean<{ status?: string }>();
    return respond({
      signedIn: true,
      name: user.name || '',
      email: realEmail(user.email),
      image: user.image || '',
      eduUid: user.eduUid ?? null,
      role: user.role || 'patient',
      doctor: doctor?.status ? { status: doctor.status } : null,
    });
  } catch (error) {
    Sentry.captureException(error);
    eduLog('sso', reqId, 'sso:status-failed', { ...describeError(error), env: envFlags() }, 'error');
    return respond({ error: 'Server error', ref: reqId }, 500);
  }
}

// POST /api/edu-auth/session -> { customToken, projectId, eduUid, created }
// Signs the person into Duxtur Edu with the portal account they are already signed into on duxtur.org.
// The Edu uid is the one linked to the account (so an old Telegram or Google profile keeps its groups and results),
// or a new dx_<id> uid saved on first use.
export async function POST(req: NextRequest) {
  const reqId = newReqId();
  const respond = (body: Record<string, unknown>, status = 200) => withEduCors(req, NextResponse.json(body, { status }), reqId);

  if (!isAllowedOrigin(req)) {
    eduLog('sso', reqId, 'sso:origin-refused', { origin: req.headers.get('origin') }, 'warn');
    return respond({ error: 'Forbidden', code: 'bad_origin', ref: reqId }, 403);
  }

  try {
    const ip = (req.headers.get('x-forwarded-for') || 'anonymous').split(',')[0].trim();
    const { success } = await rateLimit(`edu_sso_${ip}`, 20, 60 * 1000);
    if (!success) return respond({ error: 'Too many requests', ref: reqId }, 429);

    const user = await currentPortalUser();
    if (!user) return respond({ error: 'Not signed in on duxtur.org', code: 'not_signed_in', ref: reqId }, 401);

    const link = await getOrCreateEduUid(user._id.toString());
    if (!link) return respond({ error: 'Account not found', code: 'not_found', ref: reqId }, 404);

    const customToken = await createEduCustomToken(link.eduUid, {
      provider: 'duxtur',
      portalUserId: user._id.toString(),
      portalRole: user.role || 'patient',
      // Read by Edu when it creates the profile of a new user (see AuthContext): name and e-mail of the same person.
      tgName: (user.name || realEmail(user.email)).slice(0, 100),
      portalEmail: realEmail(user.email).slice(0, 200),
    });
    eduLog('sso', reqId, 'sso:token-issued', { created: link.created, uidKind: link.eduUid.split('_')[0] });
    return respond({ customToken, projectId: envFlags().firebaseProjectId, eduUid: link.eduUid, created: link.created });
  } catch (error) {
    Sentry.captureException(error);
    eduLog('sso', reqId, 'sso:failed', { ...describeError(error), env: envFlags() }, 'error');
    return respond({ error: 'Server error', ref: reqId }, 500);
  }
}
