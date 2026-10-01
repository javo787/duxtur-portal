import { cleanText, normalizePhone } from '../ingest/normalize';

export const LANGS = ['ru', 'tg', 'uz', 'kk', 'ky'] as const;
export type Lang = (typeof LANGS)[number];
export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Day = (typeof DAYS)[number];
export type Errors = string[];

export function field(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? cleanText(v) : '';
}

/** Multi-line text: keep line breaks, drop control/invisible characters. */
export function longField(fd: FormData, key: string, max = 4000): string {
  const v = fd.get(key);
  if (typeof v !== 'string') return '';
  return v
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u00AD\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF]/g, '')
    .trim()
    .slice(0, max);
}

export function multilingual(fd: FormData, prefix: string, long = false): Record<Lang, string> {
  const out = {} as Record<Lang, string>;
  for (const l of LANGS) out[l] = long ? longField(fd, `${prefix}_${l}`) : field(fd, `${prefix}_${l}`);
  return out;
}

export function phoneField(fd: FormData, key: string, label: string, errors: Errors): string {
  const raw = field(fd, key);
  if (!raw) return '';
  const n = normalizePhone(raw);
  if (!n) errors.push(`${label}: не удалось распознать номер «${raw}» (нужен формат +992 XX XXX XXXX)`);
  return n ?? '';
}

export function urlField(fd: FormData, key: string, label: string, errors: Errors): string {
  const raw = field(fd, key);
  if (!raw) return '';
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withProto);
    if (!u.hostname.includes('.')) throw new Error('host');
    return u.toString();
  } catch {
    errors.push(`${label}: некорректная ссылка «${raw}»`);
    return '';
  }
}

export function emailField(fd: FormData, key: string, errors: Errors): string {
  const raw = field(fd, key).toLowerCase();
  if (!raw) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw)) {
    errors.push(`Email: некорректный адрес «${raw}»`);
    return '';
  }
  return raw;
}

/** Accepts "@name", "name" or a full profile URL; stores the bare handle (what the UI expects). */
export function handleField(fd: FormData, key: string, label: string, host: RegExp, errors: Errors): string {
  let raw = field(fd, key);
  if (!raw) return '';
  raw = raw.replace(host, '').replace(/^@/, '').replace(/[/?#].*$/, '');
  if (!/^[A-Za-z0-9._]{2,64}$/.test(raw)) {
    errors.push(`${label}: некорректное имя профиля «${field(fd, key)}»`);
    return '';
  }
  return raw;
}
export const INSTAGRAM_HOST = /^https?:\/\/(www\.)?instagram\.com\//i;
export const TELEGRAM_HOST = /^https?:\/\/(www\.)?(t\.me|telegram\.me)\//i;

/** WhatsApp is stored as digits only (the UI builds wa.me/<digits>). */
export function whatsappField(fd: FormData, key: string, errors: Errors): string {
  const raw = field(fd, key);
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) {
    errors.push(`WhatsApp: некорректный номер «${raw}»`);
    return '';
  }
  return digits;
}

export function coordsField(
  fd: FormData,
  errors: Errors
): { lat: number; lng: number } | null {
  const latRaw = field(fd, 'lat').replace(',', '.');
  const lngRaw = field(fd, 'lng').replace(',', '.');
  if (!latRaw && !lngRaw) return null;
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!latRaw || !lngRaw || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    errors.push('Координаты: укажите и широту, и долготу числами');
    return null;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    errors.push('Координаты: широта от -90 до 90, долгота от -180 до 180');
    return null;
  }
  return { lat, lng };
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export type DayHours = { open: string; close: string; isWorking: boolean };

/** Reads <day>_open / <day>_close / <day>_working. Returns null when the whole block is left empty. */
export function hoursField(fd: FormData, errors: Errors): Record<Day, DayHours> | null {
  const out = {} as Record<Day, DayHours>;
  let anything = false;
  for (const d of DAYS) {
    const open = field(fd, `${d}_open`);
    const close = field(fd, `${d}_close`);
    const working = fd.get(`${d}_working`) === 'on';
    if (open || close || working) anything = true;
    if (working) {
      if (!HHMM.test(open) || !HHMM.test(close)) {
        errors.push(`Часы работы (${d}): укажите время в формате ЧЧ:ММ`);
      } else if (open >= close) {
        errors.push(`Часы работы (${d}): время закрытия должно быть позже открытия`);
      }
    }
    out[d] = { open: open || '08:00', close: close || '18:00', isWorking: working };
  }
  return anything ? out : null;
}

export function pickEnum<T extends string>(value: string, allowed: readonly T[], label: string, errors: Errors): T | null {
  if (!(allowed as readonly string[]).includes(value)) {
    errors.push(`${label}: недопустимое значение «${value}»`);
    return null;
  }
  return value as T;
}

export function pickMany(fd: FormData, key: string, allowed: readonly string[]): string[] {
  return [...new Set(fd.getAll(key).filter((v): v is string => typeof v === 'string' && allowed.includes(v)))];
}

export function numberField(fd: FormData, key: string, label: string, min: number, max: number, errors: Errors): number {
  const raw = field(fd, key).replace(',', '.');
  if (!raw) return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) {
    errors.push(`${label}: число от ${min} до ${max}`);
    return 0;
  }
  return n;
}

/** Image fields hold either an empty string or an https URL (Cloudinary in practice). */
export function imageUrlField(fd: FormData, key: string, label: string, errors: Errors): string {
  const raw = field(fd, key);
  if (!raw) return '';
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') throw new Error('proto');
    return u.toString();
  } catch {
    errors.push(`${label}: нужна ссылка https://…`);
    return '';
  }
}
