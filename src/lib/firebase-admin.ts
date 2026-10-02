import type { App } from 'firebase-admin/app';

/**
 * Firebase Admin for the Duxtur Edu (active_study) Firebase project.
 * Env: FIREBASE_SERVICE_ACCOUNT_JSON = the service-account key JSON (as a single string).
 *
 * firebase-admin is imported lazily, inside the functions: a load-time failure of that package (unsupported
 * Node version, bundling problem) must not take the whole /check route down with an empty 500 on every poll.
 * It surfaces here instead, as a normal error that the route logs with its real message.
 */
async function getAdminApp(): Promise<App> {
  const { cert, getApps, initializeApp } = await import('firebase-admin/app');

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
  const app = await getAdminApp();
  const { getAuth } = await import('firebase-admin/auth');
  return getAuth(app).createCustomToken(uid, claims);
}
