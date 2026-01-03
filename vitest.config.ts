import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['node_modules', 'dist', '.replit', 'server'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules',
        'dist',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.config.ts',
      ],
    },
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/shared': path.resolve(__dirname, './shared'),
    },
  },
});
