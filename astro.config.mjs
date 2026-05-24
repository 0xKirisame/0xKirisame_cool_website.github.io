import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://kirisame.dev',
  integrations: [tailwind(), sitemap()],
  build: {
    assets: '_assets',
  },
});
