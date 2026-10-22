/**
 * Origin of the Study.tj API service of Duxtur Edu (a small Node service, for example on Render).
 * Only an https origin is accepted ("https://study-api.onrender.com"; a path is dropped). Anything else counts as
 * "not configured", so a typo in an environment variable can never put a wrong host into a rewrite or into the CSP.
 */
export function httpsOrigin(value: string | undefined): string {
  if (!value) return '';
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url.origin : '';
  } catch {
    return '';
  }
}
