import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://remakehub.org',
  output: 'static',
  adapter: vercel(),
});
