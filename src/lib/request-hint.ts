/**
 * A short, human description of who asked for a Telegram login: "Chrome, Android · Dushanbe, TJ".
 *
 * The confirm-in-Telegram flow has one known weak spot: a stranger can start a login on their own device and send the
 * bot link to someone, hoping they press "confirm". The bot message shows this line, so the person can see that the
 * request came from a browser and a city that are not theirs. It is a hint for a human, never a security decision.
 */

const MAX_LENGTH = 80;

function browser(ua: string): string {
  if (/Edg(e|A|iOS)?\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/YaBrowser/.test(ua)) return 'Yandex Browser';
  if (/SamsungBrowser/.test(ua)) return 'Samsung Internet';
  if (/Firefox\/|FxiOS/.test(ua)) return 'Firefox';
  if (/Chrome\/|CriOS/.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  return '';
}

function system(ua: string): string {
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X|Macintosh/.test(ua)) return 'macOS';
  if (/CrOS/.test(ua)) return 'ChromeOS';
  if (/Linux/.test(ua)) return 'Linux';
  return '';
}

/** Vercel sends the city percent-encoded; anything odd is dropped rather than shown. */
function decodeCity(raw: string | null): string {
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return '';
  }
}

/** Letters, digits and basic punctuation only: the text goes into a Telegram message. */
function clean(text: string): string {
  return text.replace(/[^\p{L}\p{N} ,.\-'()]/gu, '').replace(/\s+/g, ' ').trim();
}

export function describeRequest(headers: Pick<Headers, 'get'>): string {
  const ua = headers.get('user-agent') ?? '';
  const device = [browser(ua), system(ua)].filter(Boolean).join(', ');
  const city = clean(decodeCity(headers.get('x-vercel-ip-city')));
  const country = clean(headers.get('x-vercel-ip-country') ?? '').slice(0, 2).toUpperCase();
  const place = [city, country].filter(Boolean).join(', ');
  return [device, place].filter(Boolean).join(' · ').slice(0, MAX_LENGTH);
}
