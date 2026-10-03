import type { NextConfig } from 'next';
import { withSentryConfig } from "@sentry/nextjs";
import { EDU_CSP } from "./src/lib/edu-csp";
import { eduLocaleRedirects } from "./src/lib/edu-routes";

// Origin that serves the static Duxtur Edu build at its ROOT (e.g. a Firebase Hosting site).
// When unset, /edu is simply not mounted.
const EDU_APP_ORIGIN = (process.env.EDU_APP_ORIGIN || '').replace(/\/$/, '');

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: ['localhost:3000', '*.app.github.dev', '*.github.dev'],
    },
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn-icons-png.flaticon.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  async headers() {
    return [
      {
        // Everything except /edu, which has its own CSP below
        source: '/((?!edu/|edu$).*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=self',
          },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com https://lh3.googleusercontent.com https://cdn-icons-png.flaticon.com https://*.tile.openstreetmap.org https://*.mapbox.com; media-src 'self' https://res.cloudinary.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.mapbox.com https://api.cloudinary.com; frame-src 'self';",
          },
        ],
      },
      {
        source: '/edu/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Content-Security-Policy', value: EDU_CSP },
        ],
      },
      {
        source: '/(.*)\\.(ico|png|jpg|jpeg|webp|avif|svg|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:lang/blog/:slug',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=21600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/:lang/doctor/:slug',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=21600, stale-while-revalidate=86400' },
        ],
      },
    ];
  },

  async rewrites() {
    if (!EDU_APP_ORIGIN) return [];
    return {
      beforeFiles: [
        { source: '/edu', destination: `${EDU_APP_ORIGIN}/` },
        { source: '/edu/:path*', destination: `${EDU_APP_ORIGIN}/:path*` },
      ],
    };
  },

  async redirects() {
    return [
      // /ru/edu, /tg/edu/... -> /edu (Edu is mounted once, without a locale prefix)
      ...eduLocaleRedirects,
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'duxtur-portal.vercel.app',
          },
        ],
        destination: 'https://duxtur.org/:path*',
        permanent: true,
      },
      {
        source: '/blog',
        destination: '/ru/blog',
        permanent: false, // 307 redirect so Google doesn't consolidate all languages to /ru
      },
      {
        source: '/authors',
        destination: '/ru/authors',
        permanent: false,
      },
      {
        source: '/doctors',
        destination: '/ru/doctors',
        permanent: false,
      },
      {
        source: '/',
        destination: '/ru',
        permanent: false,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "duxtur",
  project: "duxtur-portal",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your Sentry bill.
  tunnelRoute: "/monitoring",

  // Note: client-side source maps are already deleted after upload by default
  // (sourcemaps.deleteSourcemapsAfterUpload, default: true), so no separate
  // "hide source maps" option is needed in current SDK versions.

  webpack: {
    // Automatically annotate React components to show their full name in breadcrumbs and session replay
    reactComponentAnnotation: {
      enabled: true,
    },

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    treeshake: {
      removeDebugLogging: true,
    },

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/instrument-vcrons/
    automaticVercelMonitors: true,
  },
});
