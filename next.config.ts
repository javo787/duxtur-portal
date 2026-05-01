import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: ['localhost:3000', '*.app.github.dev', '*.github.dev'],
    },
  },

  // Разрешаем внешние домены для <img>
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn-icons-png.flaticon.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Security + SEO HTTP headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff'        },
          { key: 'X-Frame-Options',           value: 'DENY'           },
          { key: 'X-XSS-Protection',          value: '1; mode=block'  },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Кешируем статику агрессивно
        source: '/(.*)\\.(ico|png|jpg|jpeg|webp|avif|svg|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // Редиректы — убираем trailing slash
  async redirects() {
    return [
      {
        source: '/blog',
        destination: '/ru/blog',
        permanent: false,
      },
      {
        source: '/authors',
        destination: '/ru/authors',
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

export default nextConfig;
