import { fileURLToPath, URL } from 'url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@/shared': fileURLToPath(new URL('./src/components/shared', import.meta.url)),
      '@/ui': fileURLToPath(new URL('./src/components/ui', import.meta.url)),
      '@/types': fileURLToPath(new URL('./src/types', import.meta.url)),
      '@/hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
      '@/context': fileURLToPath(new URL('./src/context', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: [
        'src/utils/**',
        'src/components/**',
        'src/context/**',
        'src/hooks/**',
        'src/routes/**/components/**',
      ],
      exclude: ['src/**/*.d.ts', 'src/**/index.ts', 'src/test/**'],
      thresholds: {
        lines: 60,
        functions: 55,
        branches: 55,
        statements: 60,
      },
      reporter: ['text', 'lcov'],
    },
  },
});
