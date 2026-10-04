import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseLegacyProject } from './lib/parse-legacy-project.mjs';
import { imageName } from './lib/project-map.mjs';

const PROJECTS = 'legacy/projects';
const OUT = 'src/content/projects';
mkdirSync(OUT, { recursive: true });

const portfolio = readFileSync('legacy/portfolio.html', 'utf8');
const cardOrder = [...portfolio.matchAll(/href="projects\/project-([^"]+)"/g)].map((m) => m[1]);
const cardImage = new Map(
  [...portfolio.matchAll(/href="projects\/project-([^"]+)">\s*<img class="card-img" src="assets\/images\/[^/]+\/([^"]+)"/g)].map((m) => [m[1], m[2]]),
);

const COMMERCIAL = new Set(['horse-city']);
const PROPERTY_TYPE = { 'jalan-lana': 'landed', 'leedon-green': 'condo', 'mount-sinai-road': 'landed', 'ceylon-road': 'condo', 'horse-city': 'commercial' };
const FEATURED = new Set(['mount-sinai-road', 'sennett-road', 'leedon-green', 'ceylon-road']);
const rel = (slug, name) => `../../assets/projects/${slug}/${name}`;
const q = JSON.stringify;

for (const fileName of readdirSync(PROJECTS).filter((f) => f.endsWith('.html')).sort()) {
  const p = parseLegacyProject(readFileSync(join(PROJECTS, fileName), 'utf8'), fileName);
  const order = cardOrder.indexOf(p.slug);
  if (order < 0) throw new Error(`${p.slug} is not listed on legacy/portfolio.html`);

  let cover, hero, gallery;
  if (p.video) {
    cover = hero = rel(p.slug, 'poster.jpg');
    gallery = [];
  } else {
    const names = p.images.map(({ file }, i) => ({ file, name: imageName(i, file) }));
    const coverFile = cardImage.get(p.slug);
    const coverEntry = names.find((n) => n.file === coverFile);
    if (!coverEntry) throw new Error(`${p.slug}: cover ${coverFile} not found in gallery`);
    cover = rel(p.slug, coverEntry.name);
    hero = rel(p.slug, names[0].name);
    gallery = names.slice(1).map((n) => rel(p.slug, n.name));
  }

  const lines = [
    '---',
    `title: ${q(p.title)}`,
    `sector: ${COMMERCIAL.has(p.slug) ? 'commercial' : 'residential'}`,
    ...(PROPERTY_TYPE[p.slug] ? [`propertyType: ${PROPERTY_TYPE[p.slug]}`] : []),
    `summary: ${q(p.summary)}`,
    `cover: ${q(cover)}`,
    `hero: ${q(hero)}`,
    `gallery:`,
    ...(gallery.length ? gallery.map((g) => `  - ${q(g)}`) : []),
    ...(gallery.length ? [] : ['  []']),
    ...(p.video ? [`video: "/videos/mimosa-tour.mp4"`] : []),
    `featured: ${FEATURED.has(p.slug)}`,
    `order: ${order}`,
    '---',
    '',
  ];
  writeFileSync(join(OUT, `${p.slug}.md`), lines.join('\n'));
}
console.log(`wrote ${readdirSync(OUT).length} project files`);
