import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

/**
 * Firebase Admin for the Duxtur Edu (active_study) Firebase project.
 * Env: FIREBASE_SERVICE_ACCOUNT_JSON = the service-account key JSON (as a single string).
 */
function getAdminApp(): App {
  const existing = getApps().find(a => a.name === 'edu');
  if (existing) return existing;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured');

  const parsed = JSON.parse(raw);
  // Keys pasted into env vars often carry escaped newlines.
  if (typeof parsed.private_key === 'string') {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }
  return initializeApp({ credential: cert(parsed) }, 'edu');
}

export async function createEduCustomToken(uid: string, claims: Record<string, string | number>): Promise<string> {
  return getAuth(getAdminApp()).createCustomToken(uid, claims);
}
