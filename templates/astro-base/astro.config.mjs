import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import compressor from '{{ASTRO_COMPRESSOR_PATH}}';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  },
  vite: {
    resolve: {
      alias: {
        '@assets': path.resolve(__dirname, './src/assets')
      }
    }
  }
});
