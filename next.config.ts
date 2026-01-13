import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Разрешаем запросы с любых кодеспейсов GitHub
      allowedOrigins: ["localhost:3000", "*.app.github.dev", "*.github.dev"]
    }
  }
};

export default nextConfig;
