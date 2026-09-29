import { similarity } from '../entityMatching';
import { addressKey, haversineMeters, nameKey } from './normalize';
import type { Decision, ExistingClinic, RawClinic } from './types';

const SAME_PLACE_M = 200;
const NEARBY_M = 500;

function distance(raw: RawClinic, ex: ExistingClinic): number | null {
  if (
    typeof raw.lat !== 'number' || typeof raw.lng !== 'number' ||
    typeof ex.lat !== 'number' || typeof ex.lng !== 'number'
  ) return null;
  return haversineMeters({ lat: raw.lat, lng: raw.lng }, { lat: ex.lat, lng: ex.lng });
}

/**
 * Decide what to do with one incoming record against what's already in the DB.
 * Rules, strongest first:
 *  1. same source + sourceId              -> same record
 *  2. shared phone AND (similar name OR close)   -> same
 *  3. similar name AND (close OR same address)   -> same
 *  4. weaker signals                              -> review (never guess)
 * A "same" hit on a non-pre_imported clinic (claimed / approved / pending) is
 * always skipped: scraped data must never overwrite what a clinic owns.
 */
export function decide(raw: RawClinic, existing: ExistingClinic[]): Decision {
  const key = nameKey(raw.name);
  const rawAddr = addressKey(raw.address);
  const rawPhones = new Set(raw.phones ?? []);

  const scored: { ex: ExistingClinic; same: boolean; maybe: boolean; score: number }[] = [];

  for (const ex of existing) {
    if (ex.importSource === raw.source && ex.importSourceId === raw.sourceId) {
      return finish(raw, ex, 'same source record');
    }
    if (ex.city && raw.city && ex.city !== raw.city) continue; // never cross cities

    const score = similarity(key, nameKey(ex.nameRu));
    const dist = distance(raw, ex);
    const samePhone = ex.phones.some(p => rawPhones.has(p));
    const sameAddr = !!rawAddr && rawAddr === addressKey(ex.address);
    const close = dist !== null && dist <= SAME_PLACE_M;
    const nearby = dist !== null && dist <= NEARBY_M;

    const same =
      (samePhone && (score >= 0.5 || close)) ||
      (score >= 0.85 && (close || sameAddr || dist === null)) ||
      (score >= 0.7 && close);
    const maybe = !same && ((score >= 0.6 && (nearby || sameAddr || samePhone)) || samePhone);
    if (same || maybe) scored.push({ ex, same, maybe, score });
  }

  const same = scored.filter(s => s.same).sort((a, b) => b.score - a.score);
  if (same.length === 1) return finish(raw, same[0].ex, 'matched by name/location/phone');
  if (same.length > 1) {
    return {
      action: 'review',
      reason: 'several existing clinics match',
      candidates: same.slice(0, 5).map(s => ({ id: s.ex.id, name: s.ex.nameRu, score: round(s.score) })),
    };
  }
  const maybe = scored.filter(s => s.maybe).sort((a, b) => b.score - a.score);
  if (maybe.length) {
    return {
      action: 'review',
      reason: 'possible duplicate, not confident',
      candidates: maybe.slice(0, 5).map(s => ({ id: s.ex.id, name: s.ex.nameRu, score: round(s.score) })),
    };
  }
  return { action: 'create', reason: 'no match' };
}

function finish(_raw: RawClinic, ex: ExistingClinic, reason: string): Decision {
  if (ex.status === 'pre_imported') return { action: 'update', reason, existingId: ex.id };
  return { action: 'skip_duplicate', reason: `${reason}; existing clinic is ${ex.status}`, existingId: ex.id };
}

const round = (n: number) => Math.round(n * 100) / 100;
