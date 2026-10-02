import crypto from 'crypto';

/**
 * Firebase custom tokens for the Duxtur Edu (active_study) Firebase project.
 * Env: FIREBASE_SERVICE_ACCOUNT_JSON = the service-account key JSON (as a single string).
 *
 * The token is signed here with Node's own crypto instead of the firebase-admin SDK. Reason: on Vercel
 * `firebase-admin/auth` failed to load at runtime (ERR_REQUIRE_ESM: jwks-rsa 4 requires the ESM-only jose 6 and
 * needs Node >= 20.19 / 22.12), which made every /check poll answer 500. A custom token is just an RS256 JWT with
 * a fixed shape, so signing it directly removes that dependency chain, the Node-version coupling and the cold-start
 * cost of loading the SDK. Format: https://firebase.google.com/docs/auth/admin/create-custom-tokens
 */

const AUDIENCE = 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit';
const TOKEN_TTL_SECONDS = 3600; // Firebase accepts at most one hour
const MAX_UID_LENGTH = 128;
// Names Firebase reserves: they cannot be used as developer claims.
const RESERVED_CLAIMS = new Set([
  'acr', 'amr', 'at_hash', 'aud', 'auth_time', 'azp', 'cnf', 'c_hash', 'exp', 'firebase', 'iat', 'iss', 'jti', 'nbf', 'nonce', 'sub',
]);

interface ServiceAccount {
  clientEmail: string;
  privateKey: string;
}

function loadServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured');

  let parsed: { client_email?: unknown; private_key?: unknown };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }
  if (typeof parsed.client_email !== 'string' || typeof parsed.private_key !== 'string') {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must contain client_email and private_key (paste the whole key file)');
  }
  // Keys pasted into env vars often carry escaped newlines.
  return { clientEmail: parsed.client_email, privateKey: parsed.private_key.replace(/\\n/g, '\n') };
}

const base64url = (input: string | Buffer) => Buffer.from(input).toString('base64url');

export async function createEduCustomToken(uid: string, claims: Record<string, string | number> = {}): Promise<string> {
  if (typeof uid !== 'string' || uid.length === 0 || uid.length > MAX_UID_LENGTH) {
    throw new Error(`uid must be a non-empty string of at most ${MAX_UID_LENGTH} characters`);
  }
  const reserved = Object.keys(claims).filter(k => RESERVED_CLAIMS.has(k));
  if (reserved.length > 0) throw new Error(`Reserved claim name(s) cannot be used: ${reserved.join(', ')}`);

  const { clientEmail, privateKey } = loadServiceAccount();
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: AUDIENCE,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
    uid,
    ...(Object.keys(claims).length > 0 ? { claims } : {}),
  };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput), privateKey);
  return `${signingInput}.${base64url(signature)}`;
}
