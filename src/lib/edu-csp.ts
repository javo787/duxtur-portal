/**
 * Content-Security-Policy for /edu (the proxied active_study app).
 * It needs Firebase (Auth + Firestore) and Google sign-in, which the portal-wide CSP blocks.
 * 'unsafe-inline' scripts are required by the Next.js static export bootstrap.
 */
const EDU_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://apis.google.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com",
  "frame-src 'self' https://*.firebaseapp.com https://*.web.app https://accounts.google.com https://content.googleapis.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
];

/**
 * `connectOrigin`: an extra origin the Edu app may call with fetch (the Study.tj API service when the browser calls it
 * directly instead of through the /edu/api/study rewrite). Empty = the policy below, unchanged.
 */
export function eduCsp(connectOrigin = ''): string {
  const directives = connectOrigin
    ? EDU_DIRECTIVES.map((d) => (d.startsWith('connect-src ') ? `${d} ${connectOrigin}` : d))
    : EDU_DIRECTIVES;
  return [...directives, "frame-ancestors 'none'"].join('; ');
}

export const EDU_CSP = eduCsp();

/**
 * The one Edu page that duxtur.org itself puts in a hidden frame, to learn who is signed in to Edu in this browser
 * (/edu/auth-bridge, see the Edu app). Only pages of this same origin may frame it; every other Edu page stays unframeable.
 */
export const EDU_BRIDGE_CSP = [...EDU_DIRECTIVES, "frame-ancestors 'self'"].join('; ');
