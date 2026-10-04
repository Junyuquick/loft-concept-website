import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseLegacyProject } from './lib/parse-legacy-project.mjs';
import { processImage } from './lib/process-image.mjs';
import { imageName } from './lib/project-map.mjs';

const PROJECTS = 'legacy/projects';
let written = 0, skipped = 0;

for (const fileName of readdirSync(PROJECTS).filter((f) => f.endsWith('.html')).sort()) {
  const project = parseLegacyProject(readFileSync(join(PROJECTS, fileName), 'utf8'), fileName);
  const outDir = join('src/assets/projects', project.slug);
  mkdirSync(outDir, { recursive: true });
  for (const [i, { folder, file }] of project.images.entries()) {
    const out = join(outDir, imageName(i, file));
    if (existsSync(out)) { skipped++; continue; }
    const src = join('legacy/assets/images', folder, file);
    if (!existsSync(src)) throw new Error(`Missing source image: ${src} (referenced by ${fileName})`);
    writeFileSync(out, await processImage(readFileSync(src)));
    written++;
  }
}
console.log(`images written: ${written}, skipped: ${skipped}`);
