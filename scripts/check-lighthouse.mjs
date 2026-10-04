import { readFileSync } from 'node:fs';

const MIN = { performance: 0.9, accessibility: 0.95, seo: 0.95 };
const MAX_BYTES = 1.5 * 1024 * 1024;
let failed = false;

for (const name of ['home', 'portfolio', 'project']) {
  const lh = JSON.parse(readFileSync(`.tmp/lh-${name}.json`, 'utf8'));
  for (const [cat, min] of Object.entries(MIN)) {
    const score = lh.categories[cat].score;
    const ok = score >= min;
    if (!ok) failed = true;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} ${cat}: ${score}`);
  }
  const rows = lh.audits['network-requests'].details.items;
  const bytes = rows.filter((r) => r.resourceType !== 'Media').reduce((sum, r) => sum + (r.transferSize ?? 0), 0);
  const ok = bytes <= MAX_BYTES;
  if (!ok) failed = true;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} non-media transfer: ${(bytes / 1024).toFixed(0)} KB`);
}
process.exit(failed ? 1 : 0);
