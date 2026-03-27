import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import compressor from '{{ASTRO_COMPRESSOR_PATH}}';

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(),
    react({
      experimentalReactChildren: true,
    }),
    compressor()
  ],
  output: 'static',
  build: {
    format: 'directory'
  }
});
