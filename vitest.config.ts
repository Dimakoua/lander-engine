import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node', // Default to node environment
    environmentMatchglobs: [
      ['src/core/**/*.test.ts', 'jsdom'],
    ],
    globals: true, // Allow globals like describe, it, expect
    server: {
      deps: {
        inline: [
          'html-encoding-sniffer',
          '@exodus/bytes',
        ],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@/cli': path.resolve(__dirname, './src/cli'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/resolver': path.resolve(__dirname, './src/resolver'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
});
