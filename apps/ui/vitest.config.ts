import path from 'node:path';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  plugins: [viteReact()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '#': path.resolve(import.meta.dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/router.tsx',
        'src/routeTree.gen.ts',
        'src/components/ui/**',
        'src/components/react-bits/**',
        'src/lib/auth-client.ts',
        'src/lib/query-client.ts',
      ],
      thresholds: {
        perFile: true,
        lines: 90,
        functions: 90,
      },
    },
  },
});
