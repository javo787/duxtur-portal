import crypto from 'crypto';

/**
 * Verifies a Firebase ID token issued to a Duxtur Edu user (the Firebase project of active_study).
 *
 * Why not firebase-admin: see edu-custom-token.ts (its auth entry point does not load on Vercel). An ID token is
 * an RS256 JWT signed by Google; its public keys are published as X.509 certificates, so Node's own crypto is
 * enough. Format: https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
 *
 * The uid is taken ONLY from a token that passed every check below, never from anything the client sends alongside.
 */

const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const MAX_UID_LENGTH = 128;
const CLOCK_SKEW_SECONDS = 60;
const DEFAULT_KEY_TTL_MS = 60 * 60 * 1000;
const MAX_TOKEN_LENGTH = 8192;

export type IdTokenFailure =
  | 'malformed'
  | 'bad-algorithm'
  | 'unknown-key'
  | 'bad-signature'
  | 'wrong-project'
  | 'expired'
  | 'not-yet-valid'
  | 'bad-subject'
  | 'keys-unavailable';

export class IdTokenError extends Error {
  constructor(public readonly reason: IdTokenFailure) {
    super(`Invalid Firebase ID token: ${reason}`);
    this.name = 'IdTokenError';
  }
}

export interface VerifiedIdToken {
  uid: string;
  /** "telegram" for Edu's custom-token sign-in, "duxtur", otherwise Firebase's own provider (google.com...). */
  provider: string | null;
  authTime: number;
}

/** Looks up the public key for a key id. Resolves null when Google does not publish that id. */
export type KeyLoader = (kid: string) => Promise<crypto.KeyObject | null>;

interface KeyCache {
  keys: Map<string, crypto.KeyObject>;
  expiresAt: number;
}

let cache: KeyCache | null = null;

/** For tests. */
export function resetKeyCache() {
  cache = null;
  refreshing = null;
}

async function loadGoogleKeys(fetchImpl: typeof fetch): Promise<KeyCache> {
  const res = await fetchImpl(CERTS_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Google certificate endpoint answered ${res.status}`);
  const maxAge = /max-age=(\d+)/.exec(res.headers.get('cache-control') ?? '')?.[1];
  const certs = (await res.json()) as Record<string, string>;
  const keys = new Map<string, crypto.KeyObject>();
  for (const [kid, pem] of Object.entries(certs)) {
    keys.set(kid, new crypto.X509Certificate(pem).publicKey);
  }
  return { keys, expiresAt: Date.now() + (maxAge ? Number(maxAge) * 1000 : DEFAULT_KEY_TTL_MS) };
}

let refreshing: Promise<KeyCache> | null = null;

/**
 * Default key source: Google's published certificates, cached for as long as Google says (max-age matches the keys'
 * validity, new keys are published well before they sign anything). The cache is refreshed only when stale, so a
 * flood of tokens with made-up key ids cannot turn into a flood of requests to Google.
 */
export function googleKeyLoader(fetchImpl: typeof fetch = fetch): KeyLoader {
  return async kid => {
    if (!cache || cache.expiresAt <= Date.now()) {
      refreshing ??= loadGoogleKeys(fetchImpl).finally(() => {
        refreshing = null;
      });
      cache = await refreshing;
    }
    return cache.keys.get(kid) ?? null;
  };
}

function decodeJson(part: string): Record<string, unknown> {
  try {
    const value = JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  } catch {
    // fall through
  }
  throw new IdTokenError('malformed');
}

export interface VerifyOptions {
  projectId: string;
  getKey?: KeyLoader;
  /** Seconds since the epoch; injectable for tests. */
  now?: () => number;
}

export async function verifyFirebaseIdToken(token: unknown, options: VerifyOptions): Promise<VerifiedIdToken> {
  if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH) throw new IdTokenError('malformed');
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some(p => p.length === 0)) throw new IdTokenError('malformed');
  const [rawHeader, rawPayload, rawSignature] = parts;

  const header = decodeJson(rawHeader);
  const payload = decodeJson(rawPayload);

  if (header.alg !== 'RS256') throw new IdTokenError('bad-algorithm');
  if (typeof header.kid !== 'string' || header.kid.length === 0) throw new IdTokenError('unknown-key');

  let key: crypto.KeyObject | null;
  try {
    key = await (options.getKey ?? googleKeyLoader())(header.kid);
  } catch {
    throw new IdTokenError('keys-unavailable');
  }
  if (!key) throw new IdTokenError('unknown-key');

  const signatureOk = crypto.verify(
    'RSA-SHA256',
    Buffer.from(`${rawHeader}.${rawPayload}`),
    key,
    Buffer.from(rawSignature, 'base64url')
  );
  if (!signatureOk) throw new IdTokenError('bad-signature');

  const now = (options.now ?? (() => Math.floor(Date.now() / 1000)))();
  if (payload.aud !== options.projectId || payload.iss !== `https://securetoken.google.com/${options.projectId}`) {
    throw new IdTokenError('wrong-project');
  }
  if (typeof payload.exp !== 'number' || payload.exp <= now) throw new IdTokenError('expired');
  if (typeof payload.iat !== 'number' || payload.iat > now + CLOCK_SKEW_SECONDS) throw new IdTokenError('not-yet-valid');
  if (typeof payload.auth_time !== 'number' || payload.auth_time > now + CLOCK_SKEW_SECONDS) throw new IdTokenError('not-yet-valid');

  const sub = payload.sub;
  if (typeof sub !== 'string' || sub.length === 0 || sub.length > MAX_UID_LENGTH) throw new IdTokenError('bad-subject');
  if (payload.user_id !== undefined && payload.user_id !== sub) throw new IdTokenError('bad-subject');

  const firebase = payload.firebase as { sign_in_provider?: unknown } | undefined;
  const provider = typeof firebase?.sign_in_provider === 'string' ? firebase.sign_in_provider : null;
  return { uid: sub, provider, authTime: payload.auth_time };
}
