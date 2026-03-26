import { defineConfig } from 'tsup';

const sharedConfig = {
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'node20' as const,
  external: ['astro', 'fast-glob', 'fs-extra', 'cac'],
  noExternal: ['nanostores', 'clsx', 'tailwind-merge', 'zod'],
};

export default defineConfig([
  {
    ...sharedConfig,
    entry: {
      index: 'src/index.ts',
      'core/index': 'src/core/index.ts',
      'resolver/index': 'src/resolver/index.ts',
    },
    format: ['esm', 'cjs'],
  },
  {
    ...sharedConfig,
    entry: {
      'cli/index': 'src/cli/index.ts',
    },
    format: ['esm'],
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
