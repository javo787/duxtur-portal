import type { NextConfig } from 'next';

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
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
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
    ];
  },

  async redirects() {
    return [
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
        permanent: true,
      },
      {
        source: '/authors',
        destination: '/ru/authors',
        permanent: true,
      },
      {
        source: '/doctors',
        destination: '/ru/doctors',
        permanent: true,
      },
      {
        source: '/',
        destination: '/ru',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
