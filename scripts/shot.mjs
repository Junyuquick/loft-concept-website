import { chromium } from 'playwright';

const [path = '/', width = '1280', out = `.tmp/shot-${Date.now()}.png`] = process.argv.slice(2);
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: Number(width), height: 900 }, reducedMotion: 'reduce' });
const page = await context.newPage();
await page.goto(`${process.env.BASE_URL ?? 'http://localhost:4321'}${path}`, { waitUntil: 'networkidle' });
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(out);
