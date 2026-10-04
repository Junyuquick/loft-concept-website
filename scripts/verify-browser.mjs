import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const browser = await chromium.launch();
const results = [];
const check = async (name, fn) => { await fn(); results.push(name); console.log(`ok  ${name}`); };

await check('JS disabled: all projects visible and primary nav reachable at 360px', async () => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/portfolio`);
  assert.equal(await page.locator('[data-grid] .card:visible').count(), 19);
  assert.equal(await page.locator('.filters').isVisible(), false);
  assert.equal(await page.locator('.header__nav a[href="/portfolio"]').isVisible(), true);
  await ctx.close();
});

await check('Reduced motion: content visible immediately and ambient video paused', async () => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const opacity = await page.locator('[data-reveal]').first().evaluate((el) => getComputedStyle(el).opacity);
  assert.equal(opacity, '1');
  assert.equal(await page.locator('.hero video').evaluate((v) => v.paused), true);
  await ctx.close();
});

await check('Menu opens with the keyboard and closes with Escape', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.locator('.header__menu').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('dialog[open]').count(), 1);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog[open]').count(), 0);
  await ctx.close();
});

await check('Contact form: empty submit shows inline errors', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Send enquiry' }).click();
  assert.equal(await page.locator('[data-error]:not(:empty)').count(), 3);
  assert.equal(await page.locator('input[aria-invalid="true"]').count(), 3);
  await ctx.close();
});

await check('Contact form: network failure shows a message and keeps the typed values', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.route('**/formspree.io/**', (route) => route.abort());
  await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' });
  await page.fill('#name', 'Test Visitor');
  await page.fill('#phone', '8533 7311');
  await page.fill('#email', 'test@example.sg');
  await page.getByRole('button', { name: 'Send enquiry' }).click();
  await page.locator('[data-status]', { hasText: /send your enquiry/ }).waitFor();
  assert.equal(await page.inputValue('#name'), 'Test Visitor');
  assert.equal(await page.locator('button[type=submit]').isDisabled(), false);
  await ctx.close();
});

await check('Photos fill their fixed-ratio frames', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  for (const path of ['/', '/portfolio']) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    const gaps = await page.evaluate(() =>
      [...document.querySelectorAll('.card__media, .sector__media, .next__media')]
        .map((frame) => frame.getBoundingClientRect().height - frame.querySelector('img').getBoundingClientRect().height)
        .filter((gap) => Math.abs(gap) > 1),
    );
    assert.equal(gaps.length, 0, `${path}: ${gaps.length} photos do not fill their frame`);
  }
  await ctx.close();
});

await check('No horizontal overflow and screenshots at 360, 768, 1280, 1920', async () => {
  mkdirSync('.tmp/shots', { recursive: true });
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const width of [360, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/portfolio', '/portfolio/jalan-lana', '/contact']) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(overflow <= 0, `${path} overflows by ${overflow}px at ${width}px`);
      await page.screenshot({ path: `.tmp/shots/${width}${path.replace(/\W+/g, '-')}.png`, fullPage: true });
    }
  }
  await ctx.close();
});

await browser.close();
console.log(`verify-browser: ${results.length} checks passed`);
