import { normalizePhone } from './ingest/normalize';
import { normalizeFacebookUrl } from './social';

const IG_HOST = /^https?:\/\/(www\.)?instagram\.com\//i;
const TG_HOST = /^https?:\/\/(www\.)?(t\.me|telegram\.me)\//i;

function bareHandle(value: string, host: RegExp): string | null {
  const h = value.trim().replace(host, '').replace(/^@/, '').replace(/[/?#].*$/, '');
  return /^[A-Za-z0-9._]{2,64}$/.test(h) ? h : null;
}

/**
 * Normalizes the contact fields of a clinic owner's update IN PLACE, only for keys that are present.
 * Stored formats: phones +992…, handles bare (no @, no URL), WhatsApp digits, website and Facebook https URLs.
 * An empty string clears the field. Returns an error message for the first malformed value, otherwise null.
 */
export function normalizeClinicContacts(data: Record<string, unknown>): string | null {
  const str = (k: string) => (typeof data[k] === 'string' ? (data[k] as string).trim() : undefined);

  for (const k of ['phone', 'phone2'] as const) {
    const v = str(k);
    if (v === undefined) continue;
    if (v === '') { data[k] = ''; continue; }
    const n = normalizePhone(v);
    if (!n) return `Некорректный номер телефона: «${v}» (нужен формат +992 XX XXX XXXX)`;
    data[k] = n;
  }

  const website = str('website');
  if (website !== undefined) {
    if (website === '') data.website = '';
    else {
      try {
        const u = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
        if (!u.hostname.includes('.')) throw new Error('host');
        data.website = u.toString();
      } catch {
        return `Некорректная ссылка на сайт: «${website}»`;
      }
    }
  }

  for (const [k, host, label] of [['instagram', IG_HOST, 'Instagram'], ['telegram', TG_HOST, 'Telegram']] as const) {
    const v = str(k);
    if (v === undefined) continue;
    if (v === '') { data[k] = ''; continue; }
    const h = bareHandle(v, host);
    if (!h) return `Некорректное имя профиля ${label}: «${v}»`;
    data[k] = h;
  }

  const wa = str('whatsapp');
  if (wa !== undefined) {
    if (wa === '') data.whatsapp = '';
    else {
      const digits = wa.replace(/\D/g, '');
      if (digits.length < 9 || digits.length > 15) return `Некорректный номер WhatsApp: «${wa}»`;
      data.whatsapp = digits;
    }
  }

  const fb = str('facebook');
  if (fb !== undefined) {
    if (fb === '') data.facebook = '';
    else {
      const url = normalizeFacebookUrl(fb);
      if (!url) return `Некорректная ссылка Facebook: «${fb}» (нужна ссылка вида facebook.com/название)`;
      data.facebook = url;
    }
  }
  return null;
}
