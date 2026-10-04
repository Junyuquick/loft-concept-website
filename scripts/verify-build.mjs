import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { resolveInternal } from './lib/resolve-internal.mjs';

const DIST = 'dist';
const failures = [];
const fail = (msg) => failures.push(msg);

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const pages = walk(DIST).filter((f) => f.endsWith('.html'));
const titles = new Map();

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const name = file.replace(`${DIST}/`, '');
  const is404 = name === '404.html';

  if (!/<html lang="en"/.test(html)) fail(`${name}: missing <html lang="en">`);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  if (!title) fail(`${name}: missing <title>`);
  else if (titles.has(title)) fail(`${name}: duplicate title "${title}" (also ${titles.get(title)})`);
  else titles.set(title, name);
  if (!/<meta name="description" content="[^"]{20,}"/.test(html)) fail(`${name}: missing or short meta description`);
  if (!is404 && !/<link rel="canonical" href="https:\/\/loftconcept\.com\.sg/.test(html)) fail(`${name}: missing canonical`);
  if (/<link rel="canonical" href="[^"]*\.html"/.test(html)) fail(`${name}: canonical points at a .html URL that redirects`);
  if ((html.match(/<h1[\s>]/g) ?? []).length !== 1) fail(`${name}: expected exactly one <h1>`);
  for (const tag of html.match(/<img\b[^>]*>/g) ?? []) if (!/\salt=/.test(tag)) fail(`${name}: <img> without alt: ${tag.slice(0, 80)}`);
  if (/<dl[^>]*>\s*<\/dl>/.test(html)) fail(`${name}: empty <dl>`);
  if ((name === 'thank-you.html' || is404) && !/<meta name="robots" content="noindex"/.test(html)) fail(`${name}: should be noindex`);

  for (const [, href] of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) {
    if (resolveInternal(DIST, href) === false) fail(`${name}: broken internal link ${href}`);
  }

  if (name.startsWith('portfolio/')) {
    const hasGallery = /class="[^"]*\bgallery\b/.test(html);
    if (name === 'portfolio/mimosa.html') {
      if (!/<video\b/.test(html)) fail('portfolio/mimosa.html: expected a <video> hero');
      if (hasGallery) fail('portfolio/mimosa.html: video-only project must not render an empty gallery');
    } else if (!hasGallery) fail(`${name}: expected a gallery`);
  }
}

// Every URL in the old sitemap must resolve, directly or by redirect.
const redirectFroms = new Set(readFileSync(join(DIST, '_redirects'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split(' ')[0]));
const legacy = [...readFileSync('scripts/legacy-sitemap.xml', 'utf8').matchAll(/<loc>https:\/\/loftconcept\.com\.sg([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
for (const path of legacy) {
  if (resolveInternal(DIST, path) !== true && !redirectFroms.has(path)) fail(`legacy URL not covered: ${path}`);
}
for (const path of ['/thankyou', '/thankyou.html', '/index.html', '/sitemap.xml']) {
  if (!redirectFroms.has(path)) fail(`redirect missing: ${path}`);
}

console.log(`${pages.length} pages, ${legacy.length} legacy URLs checked`);
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('verify-build: OK');
