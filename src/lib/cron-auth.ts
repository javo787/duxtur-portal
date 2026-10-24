import { timingSafeEqual } from 'node:crypto';

/**
 * `Authorization: Bearer $CRON_SECRET`, compared in constant time. Fails closed: without a configured
 * secret nobody is authorized. Same rule as /api/cron/indexnow.
 *
 * The secret is a required argument on purpose: a default of process.env.CRON_SECRET would silently turn an
 * explicit `undefined` ("no secret configured") into whatever the environment holds.
 */
export function isCronAuthorized(authorizationHeader: string | null, secret: string | undefined): boolean {
  if (!secret) return false;
  const given = Buffer.from(authorizationHeader ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
