/**
 * Content-Security-Policy for /edu (the proxied active_study app).
 * It needs Firebase (Auth + Firestore) and Google sign-in, which the portal-wide CSP blocks.
 * 'unsafe-inline' scripts are required by the Next.js static export bootstrap.
 */
export const EDU_CSP = [
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
  "frame-ancestors 'none'",
].join('; ');
