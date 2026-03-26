import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'cli/index': 'src/cli/index.ts',
    'core/index': 'src/core/index.ts',
    'resolver/index': 'src/resolver/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  minify: false, // Easier debugging during initial development
  target: 'node20',
  external: ['astro', 'fast-glob', 'fs-extra', 'cac'],
  // Ensure we don't bundle client-side code in Node-only packages
  noExternal: ['nanostores', 'clsx', 'tailwind-merge', 'zod'],
});
