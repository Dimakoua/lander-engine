import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom', // Use jsdom for browser APIs like window, document, etc.
    globals: true, // Allow globals like describe, it, expect
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
    },
  },
});
