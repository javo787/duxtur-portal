/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  
  // Image Optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compression and Optimization
  compress: true,
  productionBrowserSourceMaps: false,

  // Headers for Security and Performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Redirects for SEO
  async redirects() {
    return [];
  },

  // Environment Variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://duxtur-portal.vercel.app',
  },

  // Webpack Configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react-vendor',
          priority: 20,
          reuseExistingChunk: true,
        },
        leaflet: {
          test: /[\\/]node_modules[\\/]leaflet[\\/]/,
          name: 'leaflet-vendor',
          priority: 15,
          reuseExistingChunk: true,
        },
        ui: {
          test: /[\\/]node_modules[\\/](@radix-ui|framer-motion)[\\/]/,
          name: 'ui-vendor',
          priority: 10,
          reuseExistingChunk: true,
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;
