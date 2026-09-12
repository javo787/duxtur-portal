import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Next.js подменяет 'server-only' на no-op на уровне бандлера для
      // серверного кода — сам пакет при обычном require() всегда бросает
      // исключение. Повторяем то же поведение для vitest.
      'server-only': path.resolve(import.meta.dirname, './test/mocks/server-only.ts'),
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
