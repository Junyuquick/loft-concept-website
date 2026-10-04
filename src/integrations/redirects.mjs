import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRedirects, legacyProjectSlugs, renderApache, renderCloudflare } from '../lib/redirects.mjs';

export function redirects() {
  return {
    name: 'loft-redirects',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const slugs = readdirSync('./src/content/projects')
          .filter((f) => f.endsWith('.md'))
          .map((f) => f.replace(/\.md$/, ''));
        const list = buildRedirects(slugs, legacyProjectSlugs(readFileSync('./scripts/legacy-sitemap.xml', 'utf8')));
        const out = fileURLToPath(dir);
        writeFileSync(join(out, '_redirects'), renderCloudflare(list));
        writeFileSync(join(out, '.htaccess'), renderApache(list));
      },
    },
  };
}
