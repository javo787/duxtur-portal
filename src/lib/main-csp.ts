/**
 * Content-Security-Policy of the main site (everything except /edu, which has its own in edu-csp).
 *
 * connect-src decides which hosts the browser may call with fetch(). The Render service (business cards, see
 * docs/RENDER_SETUP.md) lives on another origin, so without it here the browser silently blocks the request and the
 * "download card" button falls back to the client-side renderer every time.
 */
const BEFORE_CONNECT = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com https://lh3.googleusercontent.com https://cdn-icons-png.flaticon.com https://*.tile.openstreetmap.org https://*.mapbox.com; media-src 'self' https://res.cloudinary.com; font-src 'self' https://fonts.gstatic.com; ";
const AFTER_CONNECT = " frame-src 'self';";
const CONNECT_BASE = ["'self'", 'https://*.mapbox.com', 'https://api.cloudinary.com'];

export function mainCsp(extraConnectOrigins: readonly string[] = []): string {
  const connect = [...CONNECT_BASE, ...extraConnectOrigins.filter(Boolean)];
  return `${BEFORE_CONNECT}connect-src ${connect.join(' ')};${AFTER_CONNECT}`;
}
