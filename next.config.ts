import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: ["localhost:3000", "*.app.github.dev", "*.github.dev"]
    }
  }
};

export default nextConfig;
