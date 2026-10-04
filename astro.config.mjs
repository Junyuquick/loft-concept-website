import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { redirects } from './src/integrations/redirects.mjs';

export default defineConfig({
  site: 'https://loftconcept.com.sg',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap({ filter: (page) => !/\/(thank-you|404)$/.test(page) }), redirects()],
});
