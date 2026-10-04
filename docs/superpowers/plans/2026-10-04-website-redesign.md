# Loft Concept Website Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Loft Concept site as a quiet-luxury, portfolio-led Astro site that follows the Brand Guide, ships optimized media, and keeps every legacy URL working.

**Architecture:** A static Astro site. Pages and components replace 25 copy-pasted HTML files. The 19 projects live in one content collection and render through one template. A build-time pipeline resizes the 316MB of originals and re-encodes video. One redirect map emits both `_redirects` (Cloudflare Pages / Netlify) and `.htaccess` (Apache). Pure logic (contrast, filters, redirects, form validation, legacy parsing) is unit-tested with Vitest. Build output is checked by scripts, a Playwright browser pass, and Lighthouse.

**Tech Stack:** Astro (static output, content collections, `astro:assets`, `ClientRouter`), `@astrojs/sitemap`, sharp, Vitest, Playwright, Lighthouse, Figtree (`@fontsource-variable/figtree`) as the interim sans, TeX Gyre Pagella Italic (self-hosted), ffmpeg and potrace for media and logo work.

**Spec:** `docs/superpowers/specs/2026-10-04-website-redesign-design.md`

## Global Constraints

- Palette is exactly `#FFFFFF`, `#F5F0E6`, `#B6A591`, `#564739` (Brand Guide), plus the derived `--ink: #2B241D` for large headings. No orange. No other accent. No decorative gradients; the only gradients are the hero legibility veil and the link-underline technique.
- `#B6A591` (stone) is never used for text on bone or white (contrast about 2.1:1). On umber it is allowed only for text of 24px or larger.
- Titles and body use `--font-sans` (Noah target, Figtree interim, one-line swap). `TeX Gyre Pagella` Italic is used only for accents (`.accent`): pull quotes, one phrase per headline, labels.
- Sentence case everywhere. Banned copy words: elevate, seamless, unleash, game-changer, delve, tapestry. No exclamation marks in UI copy. No "Oops".
- Fixed facts to preserve exactly: founded 2010; "interior design and construction under one roof"; HDB, condominium, landed and commercial; phone `+65 8533 7311`; email `loftconceptsg@gmail.com`; Facebook `https://www.facebook.com/loftconceptsg`; Instagram `https://www.instagram.com/loftconcept.sg/`; Formspree endpoint `https://formspree.io/f/mwvzlegk`.
- Clean URLs without `.html`. `trailingSlash: 'never'`, `build.format: 'file'`. Project pages live at `/portfolio/<slug>`.
- Motion uses only `transform` and `opacity`. Every motion rule is gated by `prefers-reduced-motion: no-preference`. Content must be fully visible with JS disabled.
- Targets: Lighthouse mobile Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95, non-media transfer ≤ 1.5MB on home, portfolio and one project page.
- Images are written to `src/assets/projects/<slug>/` with a 2400px long edge maximum. Original files in `legacy/` are never modified.
- Every commit message ends with the trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- **Needs the owner's explicit OK before running:** `brew install` of system tools, any deploy, any DNS change, any real form submission, deleting `legacy/`.

## Review Focus

Failure modes the spec implies but a happy-path build would not exercise, most likely first. Each has a test named in the owning task.

1. **Video-only or sparse projects.** Mimosa has no photos and some projects have 3 images. Pages must render with no empty gallery and no empty facts block. (Task 11, `verify-build.mjs` checks)
2. **JavaScript disabled or failing.** All 19 projects visible on `/portfolio`, primary links reachable at 360px, and reveal content visible. (Task 15, `verify-browser.mjs`)
3. **Form failure.** A network error must show a plain message and keep what the visitor typed, and empty or malformed input must show inline errors. (Task 13 unit test, Task 15 browser test)
4. **Legacy URL variants.** `/projects/project-x/`, `/page.html`, and `/thankyou` must all land on the new pages, and every URL in the old sitemap must resolve. (Task 6 unit test, Task 15 `verify-build.mjs`)
5. **Phone photos with EXIF rotation.** A portrait image taken sideways must come out upright after resizing. (Task 4 unit test)

---

## File structure

```
astro.config.mjs  package.json  tsconfig.json  vitest.config.ts  .gitignore
legacy/                              old site, kept until cutover (Task 16)
public/
  fonts/texgyrepagella-italic.woff2
  logo.svg  favicon-32.png  apple-touch-icon.png  og-default.jpg  robots.txt
  videos/hero.mp4  hero.webm  hero-poster.jpg  mimosa-tour.mp4
scripts/
  lib/parse-legacy-project.mjs(+test)  lib/project-map.mjs(+test)  lib/process-image.mjs(+test)
  lib/resolve-internal.mjs(+test)
  vectorize-logo.mjs  make-favicons.mjs  prepare-images.mjs  prepare-video.sh  migrate-projects.mjs
  verify-build.mjs  verify-browser.mjs  check-lighthouse.mjs  shot.mjs
src/
  content.config.ts
  content/projects/*.md  content/testimonials/*.md
  assets/projects/<slug>/*.jpg
  integrations/redirects.mjs
  lib/ tokens.ts  contrast.ts  site.ts  process.ts  filter.ts  redirects.mjs  enquiry.ts  schema.ts (+ *.test.ts)
  scripts/ motion.ts
  styles/ tokens.css  base.css
  layouts/Base.astro
  components/ Header.astro  Footer.astro  Photo.astro  ProjectCard.astro  Process.astro
              PullQuote.astro  BookingCTA.astro  LiteYouTube.astro
  pages/ index  portfolio/index  portfolio/[slug]  about  testimonials  contact  thank-you  404  privacy
```

---

### Task 1: Branch, legacy move, Astro scaffold

**Files:**
- Move: all old site files into `legacy/`
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `src/pages/index.astro`

**Interfaces:**
- Produces: working `npm run build`, `npm test`, `npm run check`; the `legacy/` folder that later scripts read.

- [ ] **Step 1: Create the branch and move the old site**

```bash
cd "/Users/junyuquick/Documents/Coding Projects/Loft Concept/Website"
git checkout -b redesign
mkdir legacy
git mv index.html about.html portfolio.html contact.html testimonials.html thankyou.html sitemap.xml .htaccess favicon-16x16.png assets assets.zip projects projects.zip legacy/
ls legacy | head -20
```

Expected: `legacy/` lists the html files, `assets`, `projects`, `sitemap.xml`.

- [ ] **Step 2: Create `package.json` and install**

```bash
cat > package.json <<'EOF'
{
  "name": "loft-concept-website",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run",
    "verify:build": "node scripts/verify-build.mjs",
    "verify:browser": "node scripts/verify-browser.mjs",
    "verify:lighthouse": "node scripts/check-lighthouse.mjs"
  }
}
EOF
npm install astro @astrojs/sitemap @fontsource-variable/figtree sharp
npm install -D vitest typescript @astrojs/check playwright
npx playwright install chromium
npx astro --version
```

Expected: an Astro version prints. Note it. If a later step's import (`astro/zod`, `astro/loaders`) fails on this version, check the version's docs with `npx ctx7@latest docs /withastro/docs "content collections schema z import"` and adjust the import (older versions export `z` from `astro:content`).

- [ ] **Step 3: Write config files**

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://loftconcept.com.sg',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap({ filter: (page) => !/\/(thank-you|404)$/.test(page) })],
});
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "src/**/*", "astro.config.mjs"],
  "exclude": ["dist", "legacy", "scripts"]
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'] },
});
```

`.gitignore`:
```
node_modules
dist
.astro
.tmp
.DS_Store
```

`src/pages/index.astro`:
```astro
---
---
<html lang="en"><head><meta charset="utf-8" /><title>Loft Concept</title></head><body><h1>Loft Concept</h1></body></html>
```

- [ ] **Step 4: Verify the scaffold builds**

Run: `npm run build && test -f dist/index.html && echo BUILD_OK`
Expected: `BUILD_OK`.

Run: `npx vitest run --passWithNoTests`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: move legacy site aside and scaffold Astro" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Design tokens, type, global styles, contrast test

**Files:**
- Create: `src/lib/tokens.ts`, `src/lib/contrast.ts`, `src/lib/contrast.test.ts`, `src/styles/tokens.css`, `src/styles/base.css`, `public/fonts/texgyrepagella-italic.woff2`

**Interfaces:**
- Produces: `tokens` (`{ white, bone, stone, umber, ink }` as `#RRGGBB` strings), `contrastRatio(fg: string, bg: string): number`; CSS custom properties `--white --bone --stone --umber --ink --font-sans --font-accent --step--1…--step-5 --s-1…--s-7 --gutter --max --header-h --ease-out --ease-spring --r-img --r-ctl --z-grain --z-header --z-menu --z-skip`; global classes `.container .section .eyebrow .btn .btn--ghost .btn--invert .btn--sm .link .accent .photo .skip-link`; `[data-reveal]` and `[data-reveal='image']` reveal styles gated by `(scripting: enabled) and (prefers-reduced-motion: no-preference)` (the `.is-in` class completes them).

- [ ] **Step 1: Write the failing test**

`src/lib/contrast.test.ts`:
```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';
import { tokens } from './tokens';

describe('brand contrast', () => {
  it('umber on bone passes AA for body text', () => {
    expect(contrastRatio(tokens.umber, tokens.bone)).toBeGreaterThanOrEqual(7);
  });
  it('ink on bone passes AAA for headings', () => {
    expect(contrastRatio(tokens.ink, tokens.bone)).toBeGreaterThanOrEqual(12);
  });
  it('white on umber passes AAA for button and footer text', () => {
    expect(contrastRatio(tokens.white, tokens.umber)).toBeGreaterThanOrEqual(7);
  });
  it('stone on umber passes only for large text', () => {
    expect(contrastRatio(tokens.stone, tokens.umber)).toBeGreaterThanOrEqual(3);
  });
  it('stone on bone is decorative only', () => {
    expect(contrastRatio(tokens.stone, tokens.bone)).toBeLessThan(3);
  });
  it('tokens.css declares every token with the same value', () => {
    const css = readFileSync('src/styles/tokens.css', 'utf8').toLowerCase();
    for (const [name, hex] of Object.entries(tokens)) {
      expect(css).toContain(`--${name}: ${hex.toLowerCase()}`);
    }
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/lib/contrast.test.ts`
Expected: FAIL, cannot resolve `./contrast`.

- [ ] **Step 3: Implement tokens and contrast**

`src/lib/tokens.ts`:
```ts
export const tokens = {
  white: '#FFFFFF',
  bone: '#F5F0E6',
  stone: '#B6A591',
  umber: '#564739',
  ink: '#2B241D',
} as const;
```

`src/lib/contrast.ts`:
```ts
function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(fg: string, bg: string): number {
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}
```

`src/styles/tokens.css`:
```css
:root {
  --white: #ffffff;
  --bone: #f5f0e6;
  --stone: #b6a591;
  --umber: #564739;
  --ink: #2b241d;

  /* Swap point: put 'Noah' first here once a web license is in hand. */
  --font-sans: 'Figtree Variable', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-accent: 'TeX Gyre Pagella', 'Palatino Linotype', Palatino, 'Book Antiqua', serif;

  --step--1: clamp(0.8rem, 0.78rem + 0.1vw, 0.875rem);
  --step-0: clamp(1rem, 0.96rem + 0.2vw, 1.125rem);
  --step-1: clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);
  --step-2: clamp(1.6rem, 1.4rem + 1vw, 2.25rem);
  --step-3: clamp(2.1rem, 1.7rem + 2vw, 3.5rem);
  --step-4: clamp(2.8rem, 2rem + 4vw, 5.5rem);
  --step-5: clamp(3.4rem, 2.2rem + 6vw, 8rem);

  --s-1: 0.5rem;
  --s-2: 1rem;
  --s-3: 1.5rem;
  --s-4: 2.5rem;
  --s-5: 4rem;
  --s-6: 6rem;
  --s-7: clamp(5rem, 4rem + 6vw, 10rem);

  --gutter: clamp(20px, 5vw, 80px);
  --max: 1440px;
  --header-h: 72px;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --r-img: 2px;
  --r-ctl: 6px;

  --z-grain: 40;
  --z-header: 50;
  --z-menu: 60;
  --z-skip: 100;
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run src/lib/contrast.test.ts`
Expected: 6 passed.

- [ ] **Step 5: Write `base.css`**

`src/styles/base.css`:
```css
@font-face {
  font-family: 'TeX Gyre Pagella';
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/texgyrepagella-italic.woff2') format('woff2');
}

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }

body {
  margin: 0;
  background: var(--bone);
  color: var(--umber);
  font-family: var(--font-sans);
  font-size: var(--step-0);
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
body:has(dialog[open]) { overflow: hidden; }

/* Fixed grain overlay: keeps flat surfaces from feeling sterile. */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: var(--z-grain);
  pointer-events: none;
  opacity: 0.03;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .34 0 0 0 0 .28 0 0 0 0 .22 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

h1, h2, h3, h4 {
  margin: 0;
  color: var(--ink);
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.05;
  text-wrap: balance;
}
h1 { font-size: var(--step-4); }
h2 { font-size: var(--step-3); }
h3 { font-size: var(--step-1); letter-spacing: -0.01em; line-height: 1.2; }
p { margin: 0; max-width: 65ch; text-wrap: pretty; }
img, video, picture { display: block; max-width: 100%; }
a { color: inherit; }
[id] { scroll-margin-top: calc(var(--header-h) + 16px); }
:focus-visible { outline: 2px solid var(--umber); outline-offset: 3px; border-radius: 2px; }

.skip-link {
  position: absolute;
  left: var(--gutter);
  top: -100px;
  z-index: var(--z-skip);
  padding: 0.75rem 1.25rem;
  background: var(--umber);
  color: var(--white);
  border-radius: var(--r-ctl);
}
.skip-link:focus { top: 12px; }

.container { width: 100%; max-width: var(--max); margin-inline: auto; padding-inline: var(--gutter); }
.section { padding-block: var(--s-7); }
.eyebrow {
  font-size: var(--step--1);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 500;
  margin-bottom: var(--s-3);
}
.accent { font-family: var(--font-accent); font-style: italic; font-weight: 400; letter-spacing: 0; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.6em;
  padding: 0.95em 1.6em;
  background: var(--umber);
  color: var(--white);
  border: 1px solid var(--umber);
  border-radius: var(--r-ctl);
  font: 500 var(--step--1) / 1 var(--font-sans);
  letter-spacing: 0.04em;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.25s var(--ease-out), color 0.25s var(--ease-out), border-color 0.25s var(--ease-out), transform 0.2s var(--ease-spring);
}
.btn:hover { background: var(--ink); border-color: var(--ink); }
.btn:active { transform: scale(0.98); }
.btn:disabled { opacity: 0.6; cursor: progress; }
.btn--ghost { background: transparent; color: var(--umber); }
.btn--ghost:hover { background: var(--umber); color: var(--white); border-color: var(--umber); }
.btn--invert { background: var(--bone); color: var(--umber); border-color: var(--bone); }
.btn--invert:hover { background: var(--white); color: var(--ink); border-color: var(--white); }
.btn--sm { padding: 0.75em 1.2em; }

.link {
  text-decoration: none;
  background: linear-gradient(currentColor, currentColor) 0 100% / 0 1px no-repeat;
  transition: background-size 0.4s var(--ease-out);
}
.link:hover, .link:focus-visible, .link[aria-current='page'] { background-size: 100% 1px; }

.photo { width: 100%; height: 100%; object-fit: cover; }

@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
  [data-reveal] {
    opacity: 0;
    transform: translateY(18px);
    transition: opacity 0.9s var(--ease-out), transform 0.9s var(--ease-out);
    transition-delay: calc(var(--i, 0) * 90ms);
  }
  [data-reveal='image'] { transform: scale(1.04); transition-duration: 1.4s; }
  [data-reveal].is-in { opacity: 1; transform: none; }
}
```

- [ ] **Step 6: Self-host Pagella Italic**

```bash
mkdir -p public/fonts .tmp
curl -L -o .tmp/pagella-italic.otf https://mirrors.ctan.org/fonts/tex-gyre/opentype/texgyrepagella-italic.otf
python3 -m pip install --user fonttools brotli
python3 -m fontTools.subset .tmp/pagella-italic.otf \
  --unicodes="U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2026" \
  --flavor=woff2 --output-file=public/fonts/texgyrepagella-italic.woff2
ls -la public/fonts/texgyrepagella-italic.woff2
```

Expected: the woff2 exists and is under 60KB. If the CTAN download fails, stop and report it, since the accent face is part of the brand.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add brand tokens, base styles, and contrast tests" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Logo (SVG) and favicons

**Files:**
- Create: `scripts/vectorize-logo.mjs`, `scripts/make-favicons.mjs`, `public/logo.svg`, `public/favicon-32.png`, `public/apple-touch-icon.png`

**Interfaces:**
- Produces: `/logo.svg` (viewBox `0 0 2048 616`, aspect 3.32:1, transparent right side), `/favicon-32.png`, `/apple-touch-icon.png`.

If the owner supplies a vector logo (spec Q3), copy it to `public/logo.svg` and skip Steps 2-4, keeping the aspect ratio in mind for the header (Task 7 sets `width`/`height` from the viewBox).

- [ ] **Step 1: Install tools (ask the owner first)**

```bash
brew install potrace ffmpeg
which potrace ffmpeg
```

- [ ] **Step 2: Write the vectorizer**

The logo is two layers: light letters on a stone block, and dark grey text. Each is traced separately from thresholded masks.

`scripts/vectorize-logo.mjs`:
```js
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const SRC = 'legacy/assets/images/logo/loft-concept-logo.jpeg';
mkdirSync('.tmp', { recursive: true });

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const px = (x, y) => { const i = (y * W + x) * 3; return [data[i], data[i + 1], data[i + 2]]; };
const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

const stone = px(4, 4);
let blockW = 0;
while (blockW < W && lum(px(blockW, 4)) < 230) blockW++;

const isLight = (x, y) => x < blockW && lum(px(x, y)) > 205;
const isDark = (x, y) => lum(px(x, y)) < 130;

function meanColor(test) {
  let n = 0; const sum = [0, 0, 0];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (test(x, y)) { const p = px(x, y); sum[0] += p[0]; sum[1] += p[1]; sum[2] += p[2]; n++; }
  return sum.map((v) => v / n);
}

function trace(name, test) {
  const buf = Buffer.alloc(W * H, 255);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (test(x, y)) buf[y * W + x] = 0;
  const pgm = `.tmp/${name}.pgm`, svg = `.tmp/${name}.svg`;
  writeFileSync(pgm, Buffer.concat([Buffer.from(`P5\n${W} ${H}\n255\n`), buf]));
  execFileSync('potrace', ['--svg', '--turdsize', '4', '--opttolerance', '0.4', '-o', svg, pgm]);
  return readFileSync(svg, 'utf8').match(/<g[\s\S]*<\/g>/)[0];
}

const recolor = (markup, color) => markup.replace(/fill="#000000"/, `fill="${color}"`);
const light = recolor(trace('light', isLight), hex(meanColor(isLight)));
const dark = recolor(trace('dark', isDark), hex(meanColor(isDark)));

const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Loft Concept, Architectural + Interior">
<rect width="${blockW}" height="${H}" fill="${hex(stone)}"/>
${light}
${dark}
</svg>
`;
writeFileSync('public/logo.svg', out);
console.log(`public/logo.svg ${out.length} bytes, block width ${blockW}px of ${W}`);
```

- [ ] **Step 3: Run it**

Run: `node scripts/vectorize-logo.mjs`
Expected: prints `public/logo.svg <bytes> bytes, block width ~1342px of 2048`. Size should be under 60000 bytes. If larger, raise `--turdsize` to 8.

- [ ] **Step 4: Check it visually**

```bash
cat > .tmp/logo-check.html <<'EOF'
<body style="margin:0;background:#F5F0E6;padding:40px"><img src="../public/logo.svg" width="600"></body>
EOF
node -e "
import('playwright').then(async ({chromium})=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:760,height:300}});await p.goto('file://'+process.cwd()+'/.tmp/logo-check.html');await p.screenshot({path:'.tmp/logo-check.png'});await b.close();});"
```

Open `.tmp/logo-check.png` with the Read tool. Expected: "LOFT" with "CONCEPT" overlapping the O, on a stone block, with "Architectural +" in light letters and "Interior" in dark grey on bone. Compare against `legacy/assets/images/logo/loft-concept-logo.jpeg`. If letters are ragged or missing, adjust the thresholds (205 and 130) and re-run.

- [ ] **Step 5: Favicons**

`scripts/make-favicons.mjs`:
```js
import sharp from 'sharp';

const SRC = 'legacy/assets/images/logo/loft-concept-logo.jpeg';
const [r, g, b] = await sharp(SRC).extract({ left: 4, top: 4, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
const stone = { r, g, b, alpha: 1 };

// The "L" occupies roughly x 58-270, y 63-388 of the original; crop above the "Architectural" line.
const letter = await sharp(SRC).extract({ left: 0, top: 0, width: 330, height: 440 }).png().toBuffer();
for (const [file, size] of [['public/favicon-32.png', 32], ['public/apple-touch-icon.png', 180]]) {
  await sharp(letter).resize(size, size, { fit: 'contain', background: stone }).png().toFile(file);
  console.log(file);
}
```

Run: `node scripts/make-favicons.mjs`
Expected: both files printed. Open `public/apple-touch-icon.png` with Read and confirm it shows a clean light "L" on stone with no neighbouring glyph fragments. If a fragment of the "O" shows, reduce `width` to 320.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: vector logo and favicons from the original mark" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Image and video pipeline

**Files:**
- Create: `scripts/lib/process-image.mjs`, `scripts/lib/process-image.test.mjs`, `scripts/lib/parse-legacy-project.mjs`, `scripts/lib/parse-legacy-project.test.mjs`, `scripts/lib/project-map.mjs`, `scripts/lib/project-map.test.mjs`, `scripts/prepare-images.mjs`, `scripts/prepare-video.sh`
- Create (generated): `src/assets/projects/<slug>/*.jpg`, `public/videos/*`, `public/og-default.jpg`

**Interfaces:**
- Produces: `processImage(input: Buffer, opts?: { maxEdge?: number; quality?: number }): Promise<Buffer>`; `parseLegacyProject(html: string, fileName: string): { slug: string; title: string; summary: string; images: { folder: string; file: string }[]; video: string | null }`; `imageName(index: number, file: string): string` (for example `imageName(0, 'IMG_5072.JPG')` is `'01-img-5072.jpg'`).
- Consumes: nothing from earlier tasks except `legacy/`.

- [ ] **Step 1: Write the failing tests**

`scripts/lib/process-image.test.mjs`:
```js
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { processImage } from './process-image.mjs';

const jpeg = (w, h, orientation) =>
  sharp({ create: { width: w, height: h, channels: 3, background: '#888888' } })
    .jpeg()
    .withMetadata(orientation ? { orientation } : {})
    .toBuffer();

describe('processImage', () => {
  it('downsizes the long edge to 2400 without enlarging smaller images', async () => {
    const big = await sharp(await processImage(await jpeg(4000, 1000))).metadata();
    expect([big.width, big.height]).toEqual([2400, 600]);
    const small = await sharp(await processImage(await jpeg(800, 600))).metadata();
    expect([small.width, small.height]).toEqual([800, 600]);
  });

  it('applies EXIF rotation so portrait phone photos come out upright', async () => {
    const out = await sharp(await processImage(await jpeg(200, 100, 6))).metadata();
    expect([out.width, out.height]).toEqual([100, 200]);
  });
});
```

`scripts/lib/project-map.test.mjs`:
```js
import { describe, expect, it } from 'vitest';
import { imageName } from './project-map.mjs';

describe('imageName', () => {
  it('numbers, lowercases and normalises to .jpg', () => {
    expect(imageName(0, 'IMG_5072.JPG')).toBe('01-img-5072.jpg');
    expect(imageName(11, '20151026_147BedokRoad_448.jpg')).toBe('12-20151026-147bedokroad-448.jpg');
  });
});
```

`scripts/lib/parse-legacy-project.test.mjs`:
```js
import { describe, expect, it } from 'vitest';
import { parseLegacyProject } from './parse-legacy-project.mjs';

const lornie = `
<h1 class="project-title">Lornie Road</h1>
<p class="project-desc">A landed home best seen after dark. Warm light &amp; timber.</p>
<img src="../assets/images/logo/loft-concept-logo.jpeg" alt="Loft Concept">
<img src="../assets/images/188-lornie-road/IMG-5072.JPG" alt="Lornie Road" loading="lazy">
<img src="../assets/images/188-lornie-road/PIX1.jpg" alt="Lornie Road" loading="lazy">`;

describe('parseLegacyProject', () => {
  it('extracts title, summary and ordered images, skipping the logo', () => {
    const p = parseLegacyProject(lornie, 'project-lornie-road.html');
    expect(p.slug).toBe('lornie-road');
    expect(p.title).toBe('Lornie Road');
    expect(p.summary).toBe('A landed home best seen after dark. Warm light & timber.');
    expect(p.images).toEqual([
      { folder: '188-lornie-road', file: 'IMG-5072.JPG' },
      { folder: '188-lornie-road', file: 'PIX1.jpg' },
    ]);
    expect(p.video).toBeNull();
  });

  it('disambiguates duplicate titles with a roman numeral', () => {
    const html = lornie.replace('Lornie Road</h1>', 'Ernani Street</h1>');
    expect(parseLegacyProject(html, 'project-ernani-street-ii.html').title).toBe('Ernani Street II');
    expect(parseLegacyProject(html, 'project-ernani-street.html').title).toBe('Ernani Street');
  });

  it('reads the Mimosa tour video', () => {
    const html = `${lornie.split('<img')[0]}<source src="../assets/images/mimosa/mimosa-tour.mp4" type="video/mp4">`;
    expect(parseLegacyProject(html, 'project-mimosa.html').video).toBe('mimosa-tour.mp4');
  });

  it('fails loudly on an unrecognised page', () => {
    expect(() => parseLegacyProject('<html></html>', 'project-x.html')).toThrow(/Unrecognised/);
  });
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npx vitest run scripts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`scripts/lib/process-image.mjs`:
```js
import sharp from 'sharp';

export async function processImage(input, { maxEdge = 2400, quality = 82 } = {}) {
  return sharp(input)
    .rotate()
    .resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
}
```

`scripts/lib/project-map.mjs`:
```js
export function imageName(index, file) {
  const base = file.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${String(index + 1).padStart(2, '0')}-${base}.jpg`;
}
```

`scripts/lib/parse-legacy-project.mjs`:
```js
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ');
const strip = (s) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

export function parseLegacyProject(html, fileName) {
  const slug = fileName.replace(/^project-/, '').replace(/\.html$/, '');
  const h1 = html.match(/<h1[^>]*class="project-title"[^>]*>([\s\S]*?)<\/h1>/);
  const desc = html.match(/<p[^>]*class="project-desc"[^>]*>([\s\S]*?)<\/p>/);
  if (!h1 || !desc) throw new Error(`Unrecognised legacy project page: ${fileName}`);

  let title = strip(h1[1]);
  if (slug.endsWith('-ii') && !/\sII$/.test(title)) title += ' II';

  const images = [...html.matchAll(/<img[^>]+src="\.\.\/assets\/images\/([^/"]+)\/([^"]+)"/g)]
    .filter(([, folder]) => folder !== 'logo')
    .map(([, folder, file]) => ({ folder, file }));
  const video = html.match(/<source src="\.\.\/assets\/images\/mimosa\/([^"]+\.mp4)"/);

  return { slug, title, summary: strip(desc[1]), images, video: video ? video[1] : null };
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run scripts`
Expected: all pass.

- [ ] **Step 5: Write and run the image batch script**

`scripts/prepare-images.mjs`:
```js
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
```

Run: `node scripts/prepare-images.mjs && du -sh src/assets/projects`
Expected: `images written: ~130` and a total well under 150MB. Re-running prints `written: 0`. If a source file is missing, fix the referenced path in the error (case-sensitivity on non-macOS filesystems) rather than skipping it.

- [ ] **Step 6: Video**

`scripts/prepare-video.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail
mkdir -p public/videos src/assets/projects/mimosa
SRC=legacy/assets/videos/Hero.mov
CRF="${1:-28}"

ffmpeg -y -i "$SRC" -an -vf "scale='min(1920,iw)':-2,fps=30" -c:v libx264 -crf "$CRF" -preset slow -pix_fmt yuv420p -movflags +faststart public/videos/hero.mp4
ffmpeg -y -i "$SRC" -an -vf "scale='min(1920,iw)':-2,fps=30" -c:v libvpx-vp9 -crf $((CRF + 8)) -b:v 0 public/videos/hero.webm
ffmpeg -y -ss 1 -i "$SRC" -frames:v 1 -vf "scale='min(1920,iw)':-2" -q:v 3 public/videos/hero-poster.jpg

cp legacy/assets/images/mimosa/mimosa-tour.mp4 public/videos/mimosa-tour.mp4
ffmpeg -y -ss 2 -i legacy/assets/images/mimosa/mimosa-tour.mp4 -frames:v 1 -q:v 3 src/assets/projects/mimosa/poster.jpg

ls -la public/videos
```

Run: `bash scripts/prepare-video.sh`
Expected: `hero.mp4` and `hero.webm` each at or below 3MB. If larger, re-run with `bash scripts/prepare-video.sh 32`, then `34`. Open `public/videos/hero-poster.jpg` with Read to confirm it is a clean frame.

- [ ] **Step 7: Default Open Graph image**

```bash
node -e "
import('sharp').then(async ({default: sharp})=>{await sharp('public/videos/hero-poster.jpg').resize(1200,630,{fit:'cover'}).jpeg({quality:80}).toFile('public/og-default.jpg');});"
ls -la public/og-default.jpg
```

Expected: file exists, under 200KB.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: image and video optimization pipeline" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Content collections and project migration

**Files:**
- Create: `src/content.config.ts`, `scripts/migrate-projects.mjs`, `src/content/projects/*.md` (generated, 19), `src/content/testimonials/*.md` (4)

**Interfaces:**
- Consumes: `parseLegacyProject`, `imageName` (Task 4); the generated images.
- Produces: collections `projects` and `testimonials`. Project entry `id` equals the slug. Project `data` fields: `title`, `sector` (`'residential' | 'commercial'`), `propertyType?` (`'hdb' | 'condo' | 'landed' | 'commercial'`), `location?`, `area?`, `year?`, `scope?`, `summary`, `cover: ImageMetadata`, `coverAlt?`, `coverPosition` (default `'50% 50%'`), `hero: ImageMetadata`, `heroAlt?`, `gallery: ImageMetadata[]`, `video?: string`, `featured: boolean`, `order: number`. Testimonial `data`: `quote`, `author`, `projectSlug?`, `projectLabel`, `order`.

- [ ] **Step 1: Write the schema**

`src/content.config.ts`:
```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      sector: z.enum(['residential', 'commercial']),
      propertyType: z.enum(['hdb', 'condo', 'landed', 'commercial']).optional(),
      location: z.string().optional(),
      area: z.string().optional(),
      year: z.number().int().optional(),
      scope: z.string().optional(),
      summary: z.string().min(20),
      cover: image(),
      coverAlt: z.string().optional(),
      coverPosition: z.string().default('50% 50%'),
      hero: image(),
      heroAlt: z.string().optional(),
      gallery: z.array(image()).default([]),
      video: z.string().optional(),
      featured: z.boolean().default(false),
      order: z.number().int(),
    }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/testimonials' }),
  schema: z.object({
    quote: z.string(),
    author: z.string(),
    projectSlug: z.string().optional(),
    projectLabel: z.string(),
    order: z.number().int(),
  }),
});

export const collections = { projects, testimonials };
```

- [ ] **Step 2: Write the migration script**

Cover is the image used on the legacy portfolio card, hero is the first gallery image, and the gallery is everything except the hero. These are defaults the owner re-curates in Task 16.

`scripts/migrate-projects.mjs`:
```js
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
const FEATURED = new Set(['jalan-lana', 'sennett-road', 'leedon-green', 'ceylon-road']);
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
```

The empty-gallery branch writes `gallery:\n  []`, which is valid YAML for an empty array.

- [ ] **Step 3: Run it**

Run: `node scripts/migrate-projects.mjs && ls src/content/projects | wc -l && cat src/content/projects/mimosa.md src/content/projects/lornie-road.md`
Expected: `wrote 19 project files`; Mimosa has `video:` and `gallery:\n  []`; Lornie has 6 gallery entries.

- [ ] **Step 4: Write the testimonials (verbatim from the legacy page)**

Create the four files below. Quotes are copied exactly from `legacy/testimonials.html`.

`src/content/testimonials/wei-liang-priya.md`:
```markdown
---
quote: "We were initially overwhelmed — it was our first home and we had no idea where to start. The team at Loft Concept made the whole process feel effortless. They really listened to how we live day to day and translated that into a space that just feels right. Every corner of our house at Jalan Lana has been thought through, and we couldn't be happier."
author: "Wei Liang & Priya"
projectSlug: "jalan-lana"
projectLabel: "Jalan Lana · Semi-detached"
order: 1
---
```

`src/content/testimonials/michelle-jason-l.md`:
```markdown
---
quote: "Moving into Leedon Green, we wanted something luxurious but still warm and liveable. Loft Concept nailed it. They had a clear vision from the very first consultation and kept us in the loop throughout. The attention to detail in the carpentry alone was worth every penny. Our friends who visit always ask for the designer's contact."
author: "Michelle & Jason L."
projectSlug: "leedon-green"
projectLabel: "Leedon Green · Condominium"
order: 2
---
```

`src/content/testimonials/david-clara-k.md`:
```markdown
---
quote: "We had very specific ideas but struggled to piece them together into something cohesive. The Loft Concept team brought clarity to our vision and helped us make decisions we didn't know we were capable of. The renovation at Mount Sinai came in on time and within budget, which honestly exceeded our expectations. We'd absolutely engage them again."
author: "David & Clara K."
projectSlug: "mount-sinai-road"
projectLabel: "Mount Sinai Road · Landed property"
order: 3
---
```

`src/content/testimonials/rachel-t.md`:
```markdown
---
quote: "Our Ceylon Road unit had a lot of potential but needed a complete rethink. From layout to lighting to material selection, Loft Concept guided us through every decision without making it feel stressful. The final result is a home that genuinely reflects us — elegant, functional, and full of character. We can't imagine having done this with anyone else."
author: "Rachel T."
projectSlug: "ceylon-road"
projectLabel: "Ceylon Road · Condominium"
order: 4
---
```

- [ ] **Step 5: Validate the collections**

Run: `npx astro sync && npm run check`
Expected: 0 errors. A schema error names the file and field. The common one is an image path that does not exist, which means a mismatch between `imageName` and the generated files, so fix the script and re-run both Task 4 Step 5 and this task.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: content collections and migrated projects" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Redirect map and generators

**Files:**
- Create: `src/lib/redirects.mjs`, `src/lib/redirects.test.ts`, `src/integrations/redirects.mjs`
- Modify: `astro.config.mjs`

**Interfaces:**
- Produces: `buildRedirects(slugs: string[]): { from: string; to: string; status: 301 }[]`, `renderCloudflare(list): string`, `renderApache(list): string`; build output `dist/_redirects` and `dist/.htaccess`.

- [ ] **Step 1: Write the failing test**

`src/lib/redirects.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { buildRedirects, renderApache, renderCloudflare } from './redirects.mjs';

const list = buildRedirects(['jalan-lana', 'mimosa']);

describe('buildRedirects', () => {
  it('maps legacy project URLs, with and without .html', () => {
    expect(list).toContainEqual({ from: '/projects/project-jalan-lana', to: '/portfolio/jalan-lana', status: 301 });
    expect(list).toContainEqual({ from: '/projects/project-jalan-lana.html', to: '/portfolio/jalan-lana', status: 301 });
  });
  it('maps pages, index, thankyou and sitemap', () => {
    const froms = list.map((r) => r.from);
    expect(froms).toEqual(expect.arrayContaining(['/about.html', '/portfolio.html', '/testimonials.html', '/contact.html', '/index', '/index.html', '/thankyou', '/thankyou.html', '/sitemap', '/sitemap.xml']));
  });
  it('has exactly 14 rules for 2 projects', () => {
    expect(list).toHaveLength(14);
  });
});

describe('renderCloudflare', () => {
  const out = renderCloudflare(list);
  it('emits a line per rule and a trailing-slash variant', () => {
    expect(out).toContain('/projects/project-jalan-lana /portfolio/jalan-lana 301');
    expect(out).toContain('/projects/project-jalan-lana/ /portfolio/jalan-lana 301');
    expect(out).toContain('/thankyou /thank-you 301');
  });
});

describe('renderApache', () => {
  const out = renderApache(list);
  it('uses anchored RedirectMatch so /sitemap does not swallow /sitemap-index.xml', () => {
    expect(out).toContain('RedirectMatch 301 ^/sitemap/?$ /sitemap-index.xml');
    expect(out).toContain('RedirectMatch 301 ^/projects/project-jalan-lana\\.html/?$ /portfolio/jalan-lana');
  });
  it('keeps clean-URL serving and the 404 page', () => {
    expect(out).toContain('RewriteRule ^(.+?)/?$ $1.html [L]');
    expect(out).toContain('ErrorDocument 404 /404.html');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/lib/redirects.test.ts`
Expected: FAIL, cannot resolve `./redirects.mjs`.

- [ ] **Step 3: Implement**

`src/lib/redirects.mjs`:
```js
export function buildRedirects(slugs) {
  const list = [];
  const add = (from, to) => list.push({ from, to, status: 301 });
  for (const slug of slugs) {
    add(`/projects/project-${slug}`, `/portfolio/${slug}`);
    add(`/projects/project-${slug}.html`, `/portfolio/${slug}`);
  }
  for (const page of ['about', 'portfolio', 'testimonials', 'contact']) add(`/${page}.html`, `/${page}`);
  add('/index', '/');
  add('/index.html', '/');
  add('/thankyou', '/thank-you');
  add('/thankyou.html', '/thank-you');
  add('/sitemap', '/sitemap-index.xml');
  add('/sitemap.xml', '/sitemap-index.xml');
  return list;
}

export function renderCloudflare(list) {
  const lines = ['# Generated by src/integrations/redirects.mjs. Do not edit.'];
  for (const r of list) {
    lines.push(`${r.from} ${r.to} ${r.status}`);
    lines.push(`${r.from}/ ${r.to} ${r.status}`);
  }
  return lines.join('\n') + '\n';
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function renderApache(list) {
  const lines = [
    '# Generated by src/integrations/redirects.mjs. Do not edit.',
    'Options -MultiViews',
    'ErrorDocument 404 /404.html',
    'RewriteEngine On',
    '',
  ];
  for (const r of list) lines.push(`RedirectMatch ${r.status} ^${escapeRegex(r.from)}/?$ ${r.to}`);
  lines.push(
    '',
    '# Redirect /page.html to /page',
    'RewriteCond %{THE_REQUEST} \\s/+(.+?)\\.html[\\s?] [NC]',
    'RewriteRule ^ /%1 [R=301,L,NE]',
    '',
    '# Serve /page from page.html',
    'RewriteCond %{REQUEST_FILENAME} !-d',
    'RewriteCond %{REQUEST_FILENAME} !-f',
    'RewriteCond %{REQUEST_FILENAME}.html -f',
    'RewriteRule ^(.+?)/?$ $1.html [L]',
  );
  return lines.join('\n') + '\n';
}
```

`src/integrations/redirects.mjs`:
```js
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRedirects, renderApache, renderCloudflare } from '../lib/redirects.mjs';

export function redirects() {
  return {
    name: 'loft-redirects',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const slugs = readdirSync('./src/content/projects')
          .filter((f) => f.endsWith('.md'))
          .map((f) => f.replace(/\.md$/, ''));
        const list = buildRedirects(slugs);
        const out = fileURLToPath(dir);
        writeFileSync(join(out, '_redirects'), renderCloudflare(list));
        writeFileSync(join(out, '.htaccess'), renderApache(list));
      },
    },
  };
}
```

Modify `astro.config.mjs`: add `import { redirects } from './src/integrations/redirects.mjs';` and change `integrations` to `[sitemap({ filter: (page) => !/\/(thank-you|404)$/.test(page) }), redirects()]`.

- [ ] **Step 4: Run the tests and a build**

Run: `npx vitest run src/lib/redirects.test.ts`
Expected: all pass.

Run: `npm run build && wc -l dist/_redirects dist/.htaccess && grep -c project- dist/_redirects`
Expected: `_redirects` has 97 lines (1 header line plus 48 rules, each written twice for the trailing-slash variant) and `.htaccess` has the 48 `RedirectMatch` lines. `grep -c project- dist/_redirects` prints 76 (19 projects × 2 URL forms × 2 slash variants).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: generate legacy redirects for Cloudflare and Apache" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Site data, base layout, header, menu, footer

**Files:**
- Create: `src/lib/site.ts`, `src/layouts/Base.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `scripts/shot.mjs`
- Modify: `src/pages/index.astro` (temporary page to check chrome)

**Interfaces:**
- Produces: `site` (`name, url, email, phone, phoneHref, whatsapp, facebook, instagram, formAction, founded, nav: {href,label}[], cta: {href,label}`); `<Base title description image? noindex? schema?>` where `title` is the page title and the layout appends ` | Loft Concept`; the Header contains a modal `<dialog id="menu">` closed on link click and on `astro:before-swap`; a `.header__nav` fallback shown by `<noscript>` at narrow widths.

- [ ] **Step 1: Site data**

`src/lib/site.ts`:
```ts
export const site = {
  name: 'Loft Concept',
  url: 'https://loftconcept.com.sg',
  founded: 2010,
  email: 'loftconceptsg@gmail.com',
  phone: '+65 8533 7311',
  phoneHref: 'tel:+6585337311',
  whatsapp: `https://wa.me/6585337311?text=${encodeURIComponent("Hi, I'm interested in renovating or building my property.")}`,
  facebook: 'https://www.facebook.com/loftconceptsg',
  instagram: 'https://www.instagram.com/loftconcept.sg/',
  formAction: 'https://formspree.io/f/mwvzlegk',
  nav: [
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/about', label: 'About' },
    { href: '/testimonials', label: 'Testimonials' },
  ],
  cta: { href: '/contact', label: 'Book a consultation' },
} as const;
```

- [ ] **Step 2: Base layout**

`src/layouts/Base.astro`:
```astro
---
import '@fontsource-variable/figtree';
import '../styles/tokens.css';
import '../styles/base.css';
import { ClientRouter } from 'astro:transitions';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import { site } from '../lib/site';

interface Props {
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
  schema?: Record<string, unknown>;
}
const { title, description, image = '/og-default.jpg', noindex = false, schema } = Astro.props;
const fullTitle = `${title} | ${site.name}`;
const canonical = new URL(Astro.url.pathname, Astro.site).href;
const ogImage = new URL(image, Astro.site).href;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    {noindex && <meta name="robots" content="noindex" />}
    <meta property="og:site_name" content={site.name} />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={ogImage} />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta name="theme-color" content="#F5F0E6" />
    <link rel="preload" href="/fonts/texgyrepagella-italic.woff2" as="font" type="font/woff2" crossorigin />
    <ClientRouter />
    {schema && <script type="application/ld+json" set:html={JSON.stringify(schema)} />}
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <Header />
    <main id="main"><slot /></main>
    <Footer />
    <script>
      import '../scripts/motion.ts';
    </script>
  </body>
</html>
```

- [ ] **Step 3: Header with menu dialog**

`src/components/Header.astro`:
```astro
---
import { site } from '../lib/site';

const path = Astro.url.pathname.replace(/\/$/, '') || '/';
const current = (href: string) => (path === href || path.startsWith(`${href}/`) ? 'page' : undefined);
const menuLinks = [{ href: '/', label: 'Home' }, ...site.nav, site.cta];
---
<header class="header">
  <a class="header__logo" href="/" aria-label="Loft Concept, home">
    <img src="/logo.svg" width="120" height="36" alt="Loft Concept, Architectural + Interior" />
  </a>
  <nav class="header__nav" aria-label="Primary">
    {site.nav.map((item) => <a class="link" href={item.href} aria-current={current(item.href)}>{item.label}</a>)}
    <a class="btn btn--sm" href={site.cta.href}>{site.cta.label}</a>
  </nav>
  <button class="header__menu btn btn--ghost btn--sm" type="button" aria-haspopup="dialog" data-menu-open>Menu</button>
  <noscript>
    <style>.header{height:auto;flex-wrap:wrap;padding-block:12px}.header__menu{display:none}.header__nav{display:flex!important;flex-wrap:wrap;gap:12px 24px}</style>
  </noscript>
</header>

<dialog class="menu" id="menu" aria-label="Site menu">
  <div class="menu__bar">
    <span class="accent">Menu</span>
    <button class="btn btn--ghost btn--sm" type="button" data-menu-close>Close</button>
  </div>
  <nav class="menu__nav" aria-label="Mobile">
    {menuLinks.map((item, i) => <a href={item.href} style={`--i:${i}`}>{item.label}</a>)}
  </nav>
  <div class="menu__foot">
    <a class="link" href={site.phoneHref}>{site.phone}</a>
    <a class="link" href={`mailto:${site.email}`}>{site.email}</a>
  </div>
</dialog>

<style>
  .header {
    position: sticky;
    top: 0;
    z-index: var(--z-header);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s-3);
    height: var(--header-h);
    padding-inline: var(--gutter);
    background: color-mix(in srgb, var(--bone) 92%, transparent);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid color-mix(in srgb, var(--stone) 40%, transparent);
  }
  .header__logo img { height: 36px; width: auto; }
  .header__nav { display: none; align-items: center; gap: var(--s-4); font-size: var(--step--1); letter-spacing: 0.02em; }
  @media (min-width: 900px) {
    .header__nav { display: flex; }
    .header__menu { display: none; }
  }

  .menu {
    width: 100%; max-width: none; height: 100dvh; max-height: none; margin: 0; border: 0;
    padding: var(--s-3) var(--gutter);
    background: var(--bone); color: var(--umber);
    z-index: var(--z-menu);
  }
  .menu::backdrop { background: transparent; }
  .menu[open] { display: flex; flex-direction: column; }
  .menu__bar { display: flex; justify-content: space-between; align-items: center; min-height: calc(var(--header-h) - var(--s-3)); }
  .menu__nav { display: grid; gap: var(--s-2); margin-block: auto; }
  .menu__nav a { font-size: var(--step-4); font-weight: 500; letter-spacing: -0.02em; text-decoration: none; color: var(--ink); line-height: 1.1; }
  .menu__foot { display: grid; gap: 0.25rem; font-size: var(--step--1); }
  @media (prefers-reduced-motion: no-preference) {
    .menu[open] { animation: menu-in 0.5s var(--ease-out); }
    .menu[open] .menu__nav a { animation: menu-link 0.7s var(--ease-out) backwards; animation-delay: calc(var(--i) * 70ms + 120ms); }
  }
  @keyframes menu-in { from { opacity: 0; } }
  @keyframes menu-link { from { opacity: 0; transform: translateY(14px); } }
</style>

<script>
  const menu = () => document.getElementById('menu') as HTMLDialogElement | null;
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-menu-open]')) menu()?.showModal();
    else if (target.closest('[data-menu-close]') || target.closest('.menu a') || target === menu()) menu()?.close();
  });
  document.addEventListener('astro:before-swap', () => menu()?.close());
</script>
```

- [ ] **Step 4: Footer**

`src/components/Footer.astro`:
```astro
---
import { site } from '../lib/site';
const year = new Date().getFullYear();
---
<footer class="footer">
  <div class="container footer__grid">
    <div class="footer__brand">
      <p class="accent footer__line">Every space, a story told.</p>
      <p class="footer__small">Interior design and construction in Singapore, since {site.founded}.</p>
    </div>
    <nav class="footer__col" aria-label="Footer">
      <a class="link" href="/">Home</a>
      {site.nav.map((item) => <a class="link" href={item.href}>{item.label}</a>)}
      <a class="link" href={site.cta.href}>{site.cta.label}</a>
    </nav>
    <div class="footer__col">
      <a class="link" href={site.phoneHref}>{site.phone}</a>
      <a class="link" href={`mailto:${site.email}`}>{site.email}</a>
      <a class="link" href={site.whatsapp} target="_blank" rel="noopener">WhatsApp</a>
      <a class="link" href={site.instagram} target="_blank" rel="noopener">Instagram</a>
      <a class="link" href={site.facebook} target="_blank" rel="noopener">Facebook</a>
    </div>
  </div>
  <div class="container footer__bottom">
    <span>© {year} Loft Concept Interior + Architecture</span>
    <a class="link" href="/privacy">Privacy</a>
  </div>
</footer>

<style>
  .footer { background: var(--umber); color: var(--white); padding-block: var(--s-6) var(--s-3); }
  .footer__grid { display: grid; gap: var(--s-5); grid-template-columns: 1fr; }
  @media (min-width: 900px) { .footer__grid { grid-template-columns: 1.4fr 1fr 1fr; } }
  .footer__line { font-size: var(--step-3); line-height: 1.1; color: var(--white); }
  .footer__small { margin-top: var(--s-2); color: rgb(255 255 255 / 0.82); max-width: 36ch; }
  .footer__col { display: grid; gap: 0.5rem; align-content: start; font-size: var(--step--1); letter-spacing: 0.02em; }
  .footer__bottom { display: flex; justify-content: space-between; gap: var(--s-2); margin-top: var(--s-6); padding-top: var(--s-3); border-top: 1px solid rgb(255 255 255 / 0.2); font-size: var(--step--1); color: rgb(255 255 255 / 0.82); }
</style>
```

- [ ] **Step 5: Temporary home and screenshot helper**

Replace `src/pages/index.astro` with:
```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Interior design and construction in Singapore" description="Loft Concept is a Singapore interior design and construction practice, delivering homes and commercial spaces since 2010.">
  <section class="container section"><h1>Spaces designed <span class="accent">to last a lifetime.</span></h1></section>
</Base>
```

`scripts/shot.mjs`:
```js
import { chromium } from 'playwright';

const [path = '/', width = '1280', out = `.tmp/shot-${Date.now()}.png`] = process.argv.slice(2);
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: Number(width), height: 900 }, reducedMotion: 'reduce' });
const page = await context.newPage();
await page.goto(`${process.env.BASE_URL ?? 'http://localhost:4321'}${path}`, { waitUntil: 'networkidle' });
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(out);
```

- [ ] **Step 6: Verify**

```bash
npm run check
npm run dev -- --port 4321 &
sleep 4
node scripts/shot.mjs / 1280 .tmp/chrome-desktop.png
node scripts/shot.mjs / 390 .tmp/chrome-mobile.png
```

Open both PNGs with Read. Expected: bone background, wordmark logo left, three nav links plus a umber "Book a consultation" button on desktop; "Menu" button and no nav on mobile; umber footer with the Pagella italic line. Then in a browser (Playwright) tap Menu at 390px and confirm the overlay opens and Esc closes it (verified formally in Task 15). Stop the dev server (`kill %1`).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: base layout, header with menu dialog, footer" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Motion

**Files:**
- Create: `src/scripts/motion.ts`

**Interfaces:**
- Consumes: `[data-reveal]` CSS from Task 2; Base imports this module.
- Produces: elements with `data-reveal` get `.is-in` when scrolled into view; videos with `data-ambient` are paused under reduced motion. Pages opt in with `data-reveal` and `style="--i:N"` for stagger.

- [ ] **Step 1: Implement**

`src/scripts/motion.ts`:
```ts
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function initReveal() {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)');
  if (reduced() || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
  );
  targets.forEach((el) => observer.observe(el));
}

function initVideos() {
  if (!reduced()) return;
  document.querySelectorAll<HTMLVideoElement>('video[data-ambient]').forEach((video) => {
    video.pause();
    video.removeAttribute('autoplay');
  });
}

document.addEventListener('astro:page-load', () => {
  initReveal();
  initVideos();
});
```

- [ ] **Step 2: Verify the build bundles it**

Run: `npm run build && grep -l "IntersectionObserver" dist/_astro/*.js | head -1`
Expected: one bundled file name prints.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: reveal and reduced-motion handling" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Shared components and Home

**Files:**
- Create: `src/components/Photo.astro`, `src/components/ProjectCard.astro`, `src/components/Process.astro`, `src/components/PullQuote.astro`, `src/components/BookingCTA.astro`, `src/lib/process.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `site`, `Base`, collections.
- Produces: `<Photo image alt sizes position? eager?>`; `<ProjectCard project tile? sizes? eager?>` (renders `<article class="card" data-tile data-sector>` linking to `/portfolio/<id>`); `<Process />`; `<PullQuote quote author label />`; `<BookingCTA heading? />`; `processSteps: { title: string; body: string }[]`.

- [ ] **Step 1: Photo**

`src/components/Photo.astro`:
```astro
---
import { Picture } from 'astro:assets';

interface Props {
  image: ImageMetadata;
  alt: string;
  sizes: string;
  position?: string;
  eager?: boolean;
}
const { image, alt, sizes, position = '50% 50%', eager = false } = Astro.props;
const widths = [480, 800, 1200, 1600, 2400].filter((w) => w <= image.width);
---
<Picture
  src={image}
  alt={alt}
  widths={widths.length ? widths : [image.width]}
  sizes={sizes}
  formats={['avif', 'webp']}
  loading={eager ? 'eager' : 'lazy'}
  decoding="async"
  fetchpriority={eager ? 'high' : 'auto'}
  class="photo"
  style={`object-position:${position}`}
/>
```

- [ ] **Step 2: ProjectCard**

`src/components/ProjectCard.astro`:
```astro
---
import type { CollectionEntry } from 'astro:content';
import Photo from './Photo.astro';

interface Props {
  project: CollectionEntry<'projects'>;
  tile?: number;
  sizes?: string;
  eager?: boolean;
}
const { project, tile = 0, sizes = '(min-width: 900px) 58vw, 100vw', eager = false } = Astro.props;
const { data, id } = project;
const sector = data.sector === 'commercial' ? 'Commercial' : 'Residential';
const alt = data.coverAlt ?? `${data.title}, ${data.sector} interior by Loft Concept`;
---
<article class="card" data-tile={tile} data-sector={data.sector} data-reveal>
  <a class="card__link" href={`/portfolio/${id}`}>
    <div class="card__media"><Photo image={data.cover} alt={alt} sizes={sizes} position={data.coverPosition} eager={eager} /></div>
    <div class="card__meta">
      <h3>{data.title}</h3>
      <span class="accent">{sector}</span>
    </div>
  </a>
</article>

<style>
  .card__link { display: block; text-decoration: none; }
  .card__media { overflow: hidden; border-radius: var(--r-img); aspect-ratio: 5 / 4; background: color-mix(in srgb, var(--stone) 35%, var(--bone)); }
  .card[data-tile='0'] .card__media, .card[data-tile='3'] .card__media { aspect-ratio: 3 / 2; }
  .card[data-tile='1'] .card__media, .card[data-tile='2'] .card__media { aspect-ratio: 4 / 5; }
  .card__media :global(.photo) { transition: transform 1.1s var(--ease-out); }
  .card__link:hover .card__media :global(.photo) { transform: scale(1.02); }
  .card__meta { display: flex; justify-content: space-between; align-items: baseline; gap: var(--s-2); padding-top: var(--s-2); }
  .card__meta h3 { font-weight: 500; }
  @media (max-width: 899px) { .card[data-tile] .card__media { aspect-ratio: 5 / 4; } }
</style>
```

- [ ] **Step 4: Process data and component**

`src/lib/process.ts`:
```ts
export const processSteps = [
  { title: 'Getting in touch', body: 'One of our designers contacts you using the details you gave us.' },
  { title: 'First consultation', body: 'We learn how you live and what you need, then draw a detailed space plan that works for every member of your household.' },
  { title: 'Design and planning', body: 'We prepare a moodboard around your preferred style. If you have none in mind, we propose a few design concepts to react to.' },
  { title: 'Second consultation', body: 'We walk you through a detailed quotation, item by item, and explain how each one relates to the design.' },
  { title: 'Work and scheduling', body: 'Once everything is confirmed, we coordinate the work schedule with our trusted industry partners.' },
  { title: 'Work commences', body: 'Renovation begins to the agreed schedule, and we keep you updated at every step.' },
] as const;
```

`src/components/Process.astro`:
```astro
---
import { processSteps } from '../lib/process';
---
<section class="section process" id="process">
  <div class="container process__grid">
    <div class="process__intro">
      <p class="eyebrow">How we work</p>
      <h2>One team, <span class="accent">from first sketch to final handover.</span></h2>
    </div>
    <ol class="process__list">
      {processSteps.map((step, i) => (
        <li class="process__step" data-reveal style={`--i:${i % 3}`}>
          <span class="process__num accent">{String(i + 1).padStart(2, '0')}</span>
          <div>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  </div>
</section>

<style>
  .process__grid { display: grid; gap: var(--s-5); }
  @media (min-width: 900px) {
    .process__grid { grid-template-columns: 5fr 7fr; gap: var(--s-6); }
    .process__intro { position: sticky; top: calc(var(--header-h) + var(--s-4)); align-self: start; }
  }
  .process__list { list-style: none; margin: 0; padding: 0; }
  .process__step { display: grid; grid-template-columns: 3.5rem 1fr; gap: var(--s-2); padding-block: var(--s-3); border-top: 1px solid color-mix(in srgb, var(--stone) 60%, transparent); }
  .process__step:last-child { border-bottom: 1px solid color-mix(in srgb, var(--stone) 60%, transparent); }
  .process__num { font-size: var(--step-2); line-height: 1; }
  .process__step p { margin-top: 0.4rem; }
</style>
```

- [ ] **Step 5: PullQuote and BookingCTA**

`src/components/PullQuote.astro`:
```astro
---
interface Props { quote: string; author: string; label: string }
const { quote, author, label } = Astro.props;
---
<figure class="pull" data-reveal>
  <blockquote class="accent">“{quote}”</blockquote>
  <figcaption><strong>{author}</strong> · {label}</figcaption>
</figure>

<style>
  .pull { margin: 0; max-width: 62rem; }
  blockquote { margin: 0; font-size: var(--step-3); line-height: 1.2; color: var(--ink); text-wrap: balance; }
  figcaption { margin-top: var(--s-3); font-size: var(--step--1); letter-spacing: 0.04em; }
</style>
```

`src/components/BookingCTA.astro`:
```astro
---
import { site } from '../lib/site';
interface Props { heading?: string }
const { heading = 'Let’s talk about your space.' } = Astro.props;
---
<section class="section cta">
  <div class="container cta__inner" data-reveal>
    <h2>{heading}</h2>
    <p>Tell us about your home or commercial space. One of our designers will be in touch to arrange a first consultation.</p>
    <div class="cta__actions">
      <a class="btn" href={site.cta.href}>{site.cta.label}</a>
      <a class="link" href={site.whatsapp} target="_blank" rel="noopener">Or message us on WhatsApp</a>
    </div>
  </div>
</section>

<style>
  .cta__inner { display: grid; gap: var(--s-3); justify-items: start; }
  .cta h2 { font-size: var(--step-4); max-width: 16ch; }
  .cta__actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-3); margin-top: var(--s-2); }
</style>
```

- [ ] **Step 6: Home page**

Replace `src/pages/index.astro`:
```astro
---
import { getCollection, getEntry } from 'astro:content';
import Base from '../layouts/Base.astro';
import Photo from '../components/Photo.astro';
import ProjectCard from '../components/ProjectCard.astro';
import Process from '../components/Process.astro';
import PullQuote from '../components/PullQuote.astro';
import BookingCTA from '../components/BookingCTA.astro';

const featured = (await getCollection('projects', (p) => p.data.featured)).sort((a, b) => a.data.order - b.data.order).slice(0, 4);
const residential = await getEntry('projects', 'jalan-lana');
const commercial = await getEntry('projects', 'horse-city');
const quote = await getEntry('testimonials', 'wei-liang-priya');
if (!residential || !commercial || !quote) throw new Error('Home page is missing a required content entry');

const excerpt = 'They really listened to how we live day to day and translated that into a space that just feels right.';
---
<Base
  title="Interior design and construction in Singapore"
  description="Loft Concept is a Singapore interior design and construction practice. One team takes your HDB, condominium, landed or commercial space from first sketch to final handover. Since 2010."
>
  <section class="hero">
    <div class="hero__media">
      <video data-ambient autoplay muted loop playsinline preload="metadata" poster="/videos/hero-poster.jpg" aria-hidden="true">
        <source src="/videos/hero.webm" type="video/webm" />
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>
    </div>
    <div class="hero__veil"></div>
    <div class="container hero__copy">
      <p class="eyebrow">Interior design + construction · Singapore · Since 2010</p>
      <h1>Spaces designed <span class="accent">to last a lifetime.</span></h1>
      <a class="btn btn--invert" href="/contact">Book a consultation</a>
    </div>
  </section>

  <section class="section statement">
    <div class="container statement__grid">
      <p class="eyebrow">Design and build</p>
      <div data-reveal>
        <h2>Most design firms stop at the interior. <span class="accent">We carry on to the build.</span></h2>
        <p class="statement__body">Loft Concept pairs interior design with full-scale construction, so one accountable team takes your home from the first sketch to the final handover. HDB, condominium, landed or commercial, we bring both the vision and the capability to build it, backed by more than fifteen years of work since 2010.</p>
        <a class="link" href="/about">About the studio</a>
      </div>
    </div>
  </section>

  <section class="section work">
    <div class="container">
      <div class="work__head">
        <h2>Selected work</h2>
        <a class="link" href="/portfolio">All projects</a>
      </div>
      <div class="work__grid">
        {featured.map((project, i) => <ProjectCard project={project} tile={i} eager={i === 0} />)}
      </div>
    </div>
  </section>

  <section class="section sectors">
    <div class="container sectors__grid">
      <a class="sector sector--lg" href="/portfolio?sector=residential" data-reveal>
        <div class="sector__media"><Photo image={residential.data.hero} alt={residential.data.heroAlt ?? 'A residential interior by Loft Concept'} sizes="(min-width: 900px) 58vw, 100vw" position={residential.data.coverPosition} /></div>
        <h3>Residential</h3>
        <p>HDB, condominium and landed homes.</p>
      </a>
      <a class="sector sector--sm" href="/portfolio?sector=commercial" data-reveal style="--i:1">
        <div class="sector__media"><Photo image={commercial.data.hero} alt={commercial.data.heroAlt ?? 'A commercial interior by Loft Concept'} sizes="(min-width: 900px) 40vw, 100vw" position={commercial.data.coverPosition} /></div>
        <h3>Commercial</h3>
        <p>Spaces built around a business.</p>
      </a>
    </div>
  </section>

  <Process />

  <section class="section">
    <div class="container">
      <PullQuote quote={excerpt} author={quote.data.author} label={quote.data.projectLabel} />
      <p class="more"><a class="link" href="/testimonials">More from our clients</a></p>
    </div>
  </section>

  <BookingCTA />
</Base>

<style>
  .hero { position: relative; min-height: calc(100dvh - var(--header-h)); display: grid; align-items: end; color: var(--white); overflow: hidden; }
  .hero__media, .hero__veil { position: absolute; inset: 0; }
  .hero__media video { width: 100%; height: 100%; object-fit: cover; }
  .hero__veil { background: linear-gradient(to top, rgb(43 36 29 / 0.7), rgb(43 36 29 / 0.15) 60%); }
  .hero__copy { position: relative; display: grid; gap: var(--s-3); justify-items: start; padding-bottom: var(--s-5); }
  .hero h1 { color: var(--white); font-size: var(--step-5); max-width: 12ch; }
  .hero .eyebrow { margin: 0; color: rgb(255 255 255 / 0.9); }
  @media (prefers-reduced-motion: no-preference) {
    @supports (animation-timeline: scroll()) {
      .hero__media video { animation: hero-drift linear both; animation-timeline: scroll(root); animation-range: 0 100vh; }
    }
  }
  @keyframes hero-drift { to { transform: translateY(6%) scale(1.04); } }

  .statement__grid { display: grid; gap: var(--s-3); }
  @media (min-width: 900px) { .statement__grid { grid-template-columns: 3fr 9fr; } }
  .statement h2 { max-width: 20ch; }
  .statement__body { margin-block: var(--s-4) var(--s-3); }

  .work__head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: var(--s-5); }
  .work__grid { display: grid; gap: var(--s-5) var(--s-3); }
  @media (min-width: 900px) {
    .work__grid { grid-template-columns: repeat(12, 1fr); gap: var(--s-6) var(--s-3); align-items: start; }
    .work__grid :global(.card[data-tile='0']) { grid-column: 1 / span 7; }
    .work__grid :global(.card[data-tile='1']) { grid-column: 8 / span 5; }
    .work__grid :global(.card[data-tile='2']) { grid-column: 1 / span 5; }
    .work__grid :global(.card[data-tile='3']) { grid-column: 6 / span 7; margin-top: var(--s-5); }
  }

  .sectors__grid { display: grid; gap: var(--s-5) var(--s-3); }
  @media (min-width: 900px) {
    .sectors__grid { grid-template-columns: 7fr 5fr; align-items: end; }
    .sector--sm { margin-bottom: var(--s-5); }
  }
  .sector { display: block; text-decoration: none; }
  .sector__media { overflow: hidden; border-radius: var(--r-img); aspect-ratio: 4 / 5; margin-bottom: var(--s-2); }
  .sector--lg .sector__media { aspect-ratio: 3 / 2; }
  .sector__media :global(.photo) { transition: transform 1.1s var(--ease-out); }
  .sector:hover .sector__media :global(.photo) { transform: scale(1.02); }
  .more { margin-top: var(--s-4); }
</style>
```

- [ ] **Step 7: Verify**

```bash
npm run check && npm run build
npm run preview -- --port 4321 &
sleep 3
node scripts/shot.mjs / 1280 .tmp/home-1280.png
node scripts/shot.mjs / 390 .tmp/home-390.png
```

Open both with Read. Expected: full-bleed hero with white headline over the veil; asymmetric 4-up selected work (large, tall, tall, large); Residential large and Commercial smaller and offset; process list with sticky heading; one pull quote; closing call to action; umber footer. Fix any overflow or clipped text. Stop the server (`kill %1`).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: home page and shared components" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Portfolio index with sector filter

**Files:**
- Create: `src/lib/filter.ts`, `src/lib/filter.test.ts`, `src/pages/portfolio/index.astro`

**Interfaces:**
- Produces: `type SectorFilter = 'all' | 'residential' | 'commercial'`, `parseSector(search: string): SectorFilter`, `matchesSector(sector: string, filter: SectorFilter): boolean`.
- Consumes: `ProjectCard` and its `data-tile`, `data-sector` attributes (Task 9).

- [ ] **Step 1: Write the failing test**

`src/lib/filter.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { matchesSector, parseSector } from './filter';

describe('parseSector', () => {
  it('defaults to all', () => {
    expect(parseSector('')).toBe('all');
    expect(parseSector('?sector=')).toBe('all');
    expect(parseSector('?sector=bogus')).toBe('all');
  });
  it('reads valid sectors', () => {
    expect(parseSector('?sector=commercial')).toBe('commercial');
    expect(parseSector('?utm=x&sector=residential')).toBe('residential');
  });
});

describe('matchesSector', () => {
  it('matches everything for all', () => {
    expect(matchesSector('commercial', 'all')).toBe(true);
  });
  it('matches only the chosen sector', () => {
    expect(matchesSector('commercial', 'commercial')).toBe(true);
    expect(matchesSector('residential', 'commercial')).toBe(false);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/lib/filter.test.ts`
Expected: FAIL, cannot resolve `./filter`.

- [ ] **Step 3: Implement**

`src/lib/filter.ts`:
```ts
export type SectorFilter = 'all' | 'residential' | 'commercial';
const SECTORS: string[] = ['all', 'residential', 'commercial'];

export function parseSector(search: string): SectorFilter {
  const value = new URLSearchParams(search).get('sector') ?? '';
  return SECTORS.includes(value) ? (value as SectorFilter) : 'all';
}

export function matchesSector(sector: string, filter: SectorFilter): boolean {
  return filter === 'all' || sector === filter;
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run src/lib/filter.test.ts`
Expected: all pass.

- [ ] **Step 5: Page**

The chips are hidden unless scripting is enabled, so there are no dead controls without JS. Property-type filtering is deferred because only 5 of 19 projects have a type (see spec amendment in Task 16).

`src/pages/portfolio/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import ProjectCard from '../../components/ProjectCard.astro';
import BookingCTA from '../../components/BookingCTA.astro';

const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
const chips = [
  { value: 'all', label: 'All' },
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
];
---
<Base
  title="Portfolio"
  description="Interior design and construction projects by Loft Concept across Singapore: HDB flats, condominiums, landed homes and commercial spaces."
>
  <section class="container intro">
    <p class="eyebrow">Portfolio</p>
    <h1>Homes and spaces we have designed <span class="accent">and built.</span></h1>
  </section>

  <div class="container filters" role="group" aria-label="Filter projects by sector">
    {chips.map((chip) => <button type="button" class="chip" data-filter={chip.value} aria-pressed={chip.value === 'all'}>{chip.label}</button>)}
  </div>

  <div class="container">
    <div class="grid" data-grid>
      {projects.map((project, i) => <ProjectCard project={project} tile={i % 4} eager={i < 2} />)}
    </div>
    <p class="empty" data-empty hidden>No projects in this category yet.</p>
  </div>

  <BookingCTA />
</Base>

<style>
  .intro { padding-block: var(--s-6) var(--s-4); }
  .intro h1 { max-width: 16ch; }
  .filters { display: none; gap: var(--s-1); padding-bottom: var(--s-5); }
  @media (scripting: enabled) { .filters { display: flex; } }
  .chip {
    padding: 0.55em 1.1em; border: 1px solid var(--umber); border-radius: 999px; background: transparent;
    color: var(--umber); font: 500 var(--step--1) / 1 var(--font-sans); letter-spacing: 0.04em; cursor: pointer;
    transition: background 0.25s var(--ease-out), color 0.25s var(--ease-out), transform 0.2s var(--ease-spring);
  }
  .chip:hover { background: color-mix(in srgb, var(--umber) 10%, transparent); }
  .chip:active { transform: scale(0.98); }
  .chip[aria-pressed='true'] { background: var(--umber); color: var(--white); }

  .grid { display: grid; gap: var(--s-5) var(--s-3); padding-bottom: var(--s-6); }
  @media (min-width: 900px) {
    .grid { grid-template-columns: repeat(12, 1fr); gap: var(--s-6) var(--s-3); align-items: start; }
    .grid :global(.card[data-tile='0']) { grid-column: 1 / span 7; }
    .grid :global(.card[data-tile='1']) { grid-column: 8 / span 5; }
    .grid :global(.card[data-tile='2']) { grid-column: 1 / span 5; }
    .grid :global(.card[data-tile='3']) { grid-column: 6 / span 7; margin-top: var(--s-5); }
  }
  .empty { padding-block: var(--s-6); }
</style>

<script>
  import { matchesSector, parseSector, type SectorFilter } from '../../lib/filter';

  function apply(filter: SectorFilter) {
    const cards = [...document.querySelectorAll<HTMLElement>('[data-grid] .card')];
    let tile = 0;
    let shown = 0;
    for (const card of cards) {
      const visible = matchesSector(card.dataset.sector ?? '', filter);
      card.hidden = !visible;
      if (visible) { card.dataset.tile = String(tile++ % 4); shown++; }
    }
    document.querySelectorAll<HTMLElement>('[data-filter]').forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.filter === filter)));
    const empty = document.querySelector<HTMLElement>('[data-empty]');
    if (empty) empty.hidden = shown > 0;
  }

  document.addEventListener('astro:page-load', () => {
    if (document.querySelector('[data-grid]')) apply(parseSector(location.search));
  });
  document.addEventListener('click', (event) => {
    const chip = (event.target as HTMLElement).closest<HTMLElement>('[data-filter]');
    if (!chip) return;
    const filter = chip.dataset.filter as SectorFilter;
    history.replaceState(null, '', filter === 'all' ? location.pathname : `?sector=${filter}`);
    apply(filter);
  });
</script>
```

- [ ] **Step 6: Verify**

```bash
npm run check && npm run build && npm run preview -- --port 4321 &
sleep 3
node scripts/shot.mjs /portfolio 1280 .tmp/portfolio-1280.png
node scripts/shot.mjs "/portfolio?sector=commercial" 1280 .tmp/portfolio-commercial.png
```

Open both with Read. Expected: asymmetric grid with all 19 cards; the commercial view shows one card (Horse City). Stop the server.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: portfolio index with sector filter" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Project page template

**Files:**
- Create: `src/pages/portfolio/[slug].astro`

**Interfaces:**
- Consumes: `Photo`, `ProjectCard`, `BookingCTA`, project collection (Task 5).
- Produces: `/portfolio/<slug>` pages. Gallery container has class `gallery` (absent for video-only projects). The facts `<dl>` always includes a Sector row, so it is never empty. Mimosa renders `<video>` as the hero.

- [ ] **Step 1: Write the page**

`src/pages/portfolio/[slug].astro`:
```astro
---
import { getCollection } from 'astro:content';
import { getImage } from 'astro:assets';
import Base from '../../layouts/Base.astro';
import Photo from '../../components/Photo.astro';
import BookingCTA from '../../components/BookingCTA.astro';

export async function getStaticPaths() {
  const all = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
  return all.map((project, i) => ({
    params: { slug: project.id },
    props: { project, next: all[(i + 1) % all.length] },
  }));
}

const { project, next } = Astro.props;
const { data } = project;
const typeLabels = { hdb: 'HDB', condo: 'Condominium', landed: 'Landed property', commercial: 'Commercial' } as const;
const sector = data.sector === 'commercial' ? 'Commercial' : 'Residential';
const heroAlt = data.heroAlt ?? `${data.title}, ${data.sector} interior by Loft Concept`;

const facts: [string, string][] = [['Sector', sector]];
if (data.propertyType) facts.push(['Property', typeLabels[data.propertyType]]);
if (data.location) facts.push(['Location', data.location]);
if (data.area) facts.push(['Area', data.area]);
if (data.scope) facts.push(['Scope', data.scope]);
if (data.year) facts.push(['Year', String(data.year)]);

const shapes = data.gallery.length <= 3 ? data.gallery.map(() => 'wide') : data.gallery.map((_, i) => ['wide', 'half', 'half', 'inset'][i % 4]);
const sizesFor = { wide: '100vw', half: '(min-width: 900px) 50vw, 100vw', inset: '(min-width: 900px) 66vw, 100vw' } as Record<string, string>;

const og = await getImage({ src: data.hero, width: 1200, height: 630, fit: 'cover', format: 'jpg' });
const poster = data.video ? (await getImage({ src: data.hero, width: 1600, format: 'jpg' })).src : undefined;
const schema = {
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: `${data.title} by Loft Concept`,
  description: data.summary,
  creator: { '@type': 'Organization', name: 'Loft Concept', url: 'https://loftconcept.com.sg' },
  image: { '@type': 'ImageObject', url: new URL(og.src, Astro.site).href, width: 1200, height: 630 },
};
---
<Base title={data.title} description={data.summary} image={og.src} schema={schema}>
  <section class="hero">
    {data.video
      ? <video data-ambient autoplay muted loop playsinline controls poster={poster} src={data.video} aria-label={`${data.title} walkthrough`}></video>
      : <Photo image={data.hero} alt={heroAlt} sizes="100vw" position={data.coverPosition} eager />}
  </section>

  <section class="section head">
    <div class="container head__grid">
      <div>
        <p class="eyebrow">{sector}</p>
        <h1>{data.title}</h1>
      </div>
      <div class="head__text">
        <p class="head__summary">{data.summary}</p>
        <dl class="facts">
          {facts.map(([label, value]) => <div><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
      </div>
    </div>
  </section>

  {data.gallery.length > 0 && (
    <section class="container gallery">
      {data.gallery.map((image, i) => (
        <figure class={`gallery__item gallery__item--${shapes[i]}`} data-reveal='image'>
          <Photo image={image} alt={`${data.title}, view ${i + 2}`} sizes={sizesFor[shapes[i]]} />
        </figure>
      ))}
    </section>
  )}

  <section class="section next">
    <div class="container">
      <p class="eyebrow">Next project</p>
      <a class="next__link" href={`/portfolio/${next.id}`}>
        <h2>{next.data.title}</h2>
        <div class="next__media"><Photo image={next.data.cover} alt={next.data.coverAlt ?? `${next.data.title}, ${next.data.sector} interior by Loft Concept`} sizes="(min-width: 900px) 40vw, 100vw" position={next.data.coverPosition} /></div>
      </a>
      <p class="back"><a class="link" href="/portfolio">Back to portfolio</a></p>
    </div>
  </section>

  <BookingCTA />
</Base>

<style>
  .hero { height: min(80dvh, 56rem); min-height: 22rem; background: color-mix(in srgb, var(--stone) 35%, var(--bone)); }
  .hero :global(.photo), .hero video { width: 100%; height: 100%; object-fit: cover; }
  .head { padding-block: var(--s-6); }
  .head__grid { display: grid; gap: var(--s-4); }
  @media (min-width: 900px) { .head__grid { grid-template-columns: 5fr 7fr; gap: var(--s-6); } }
  .head h1 { font-size: var(--step-4); }
  .head__summary { font-size: var(--step-1); line-height: 1.5; color: var(--ink); max-width: 38ch; }
  .facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: var(--s-3); margin: var(--s-4) 0 0; }
  .facts dt { font-size: var(--step--1); letter-spacing: 0.14em; text-transform: uppercase; font-weight: 500; }
  .facts dd { margin: 0.25rem 0 0; color: var(--ink); }

  .gallery { display: grid; gap: var(--s-3); padding-bottom: var(--s-6); }
  .gallery__item { margin: 0; overflow: hidden; border-radius: var(--r-img); }
  .gallery__item :global(.photo) { height: auto; }
  @media (min-width: 900px) {
    .gallery { grid-template-columns: repeat(12, 1fr); gap: var(--s-5) var(--s-3); align-items: start; }
    .gallery__item--wide { grid-column: 1 / -1; }
    .gallery__item--half { grid-column: span 6; }
    .gallery__item--half:nth-child(4n + 3) { margin-top: var(--s-5); }
    .gallery__item--inset { grid-column: 3 / span 8; }
  }

  .next { border-top: 1px solid color-mix(in srgb, var(--stone) 60%, transparent); }
  .next__link { display: grid; gap: var(--s-3); text-decoration: none; }
  @media (min-width: 900px) { .next__link { grid-template-columns: 1fr 1fr; align-items: end; } }
  .next h2 { font-size: var(--step-4); }
  .next__media { overflow: hidden; border-radius: var(--r-img); aspect-ratio: 3 / 2; }
  .next__media :global(.photo) { transition: transform 1.1s var(--ease-out); }
  .next__link:hover .next__media :global(.photo) { transform: scale(1.02); }
  .back { margin-top: var(--s-4); }
</style>
```

Note on the Mimosa video: `data.video` is `/videos/mimosa-tour.mp4` (a public file), so it is used directly as `src`.

- [ ] **Step 2: Build and verify structure for the two edge cases**

```bash
npm run check && npm run build
test -f dist/portfolio/mimosa.html && grep -c "<video" dist/portfolio/mimosa.html
grep -c 'class="[^"]*gallery' dist/portfolio/mimosa.html || true
grep -c 'class="[^"]*gallery' dist/portfolio/jalan-pari-dedap.html
ls dist/portfolio | wc -l
```

Expected: Mimosa has `<video` (1 or more) and `0` gallery matches; Jalan Pari Dedap (2 images, so a 1-item gallery) has at least 1; 19 project files plus `index.html` = 20 entries. These checks are formalised in Task 15.

- [ ] **Step 3: Visual check**

```bash
npm run preview -- --port 4321 &
sleep 3
node scripts/shot.mjs /portfolio/sennett-road 1280 .tmp/proj-sennett.png
node scripts/shot.mjs /portfolio/mimosa 390 .tmp/proj-mimosa.png
node scripts/shot.mjs /portfolio/jalan-pari-dedap 390 .tmp/proj-pari.png
```

Open all three. Expected: Sennett has full-width hero, facts strip with just Sector, a varied gallery, and a next-project block; Mimosa shows the video hero and no gallery; Jalan Pari Dedap degrades to stacked wide images with no empty space. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: project page template" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 12: About and Testimonials

**Files:**
- Create: `src/pages/about.astro`, `src/components/LiteYouTube.astro`, `src/pages/testimonials.astro`

**Interfaces:**
- Consumes: `Base`, `Photo`, `PullQuote`, `BookingCTA`, collections.
- Produces: `/about`, `/testimonials`.

- [ ] **Step 1: About**

Mission and vision are the Brand Guide's own words (an owner decision in Task 16 if they prefer the legacy wording).

`src/pages/about.astro`:
```astro
---
import { getEntry } from 'astro:content';
import Base from '../layouts/Base.astro';
import Photo from '../components/Photo.astro';
import BookingCTA from '../components/BookingCTA.astro';

const feature = await getEntry('projects', 'sennett-road');
if (!feature) throw new Error('About page needs the sennett-road project');
---
<Base
  title="About"
  description="Loft Concept was founded in 2010 to design and build under one roof. One team, accountable from the first sketch to the final handover."
>
  <section class="container lead">
    <p class="eyebrow">About</p>
    <h1>More than interior design. <span class="accent">We design, plan and build.</span></h1>
    <p class="lead__text">When design and construction are handled by the same team, the result is more cohesive, more considered, and more truly yours.</p>
  </section>

  <section class="section story">
    <div class="container story__grid">
      <h2>Our story</h2>
      <div class="story__body" data-reveal>
        <p>Loft Concept was founded in 2010 on a conviction that set us apart from the start: truly great spaces are not just designed, they are built. While most interior firms hand their clients to separate contractors, we built a practice that does both, under one roof, with one team accountable from start to finish.</p>
        <p>Over fifteen years we have grown from a small, dedicated team into a full-service interior design and construction practice, with a portfolio spanning HDB flats, condominiums, landed properties and commercial spaces across Singapore. Our integrated approach means fewer miscommunications, tighter coordination, and a finished result that holds together.</p>
        <p>Through every project, our commitment stays the same: listen closely, design thoughtfully, and build with precision.</p>
        <a class="link" href="/#process">See how we work</a>
      </div>
    </div>
  </section>

  <figure class="feature" data-reveal='image'>
    <Photo image={feature.data.hero} alt={feature.data.heroAlt ?? 'A Loft Concept interior'} sizes="100vw" position={feature.data.coverPosition} />
  </figure>

  <section class="section">
    <div class="container pair">
      <div data-reveal>
        <p class="eyebrow">Our mission</p>
        <p class="pair__text">To design and deliver bespoke, premium living spaces that blend aesthetics, functionality and craftsmanship, enhancing the everyday lives of discerning homeowners.</p>
      </div>
      <div data-reveal style="--i:1">
        <p class="eyebrow">Our vision</p>
        <p class="pair__text">To be a leading design and architectural studio, renowned for timeless, sophisticated homes and trusted for shaping refined lifestyles through thoughtful, high-quality design.</p>
      </div>
    </div>
  </section>

  <BookingCTA heading="Ready to get started?" />
</Base>

<style>
  .lead { padding-block: var(--s-6) var(--s-5); display: grid; gap: var(--s-3); justify-items: start; }
  .lead h1 { max-width: 16ch; }
  .lead__text { font-size: var(--step-1); line-height: 1.5; color: var(--ink); }
  .story__grid { display: grid; gap: var(--s-4); }
  @media (min-width: 900px) { .story__grid { grid-template-columns: 4fr 8fr; } }
  .story__body { display: grid; gap: var(--s-3); justify-items: start; }
  .feature { margin: 0; height: min(70dvh, 48rem); min-height: 20rem; }
  .pair { display: grid; gap: var(--s-5); }
  @media (min-width: 900px) { .pair { grid-template-columns: 1fr 1fr; gap: var(--s-6); } }
  .pair__text { font-size: var(--step-2); line-height: 1.3; color: var(--ink); max-width: 28ch; }
</style>
```

- [ ] **Step 2: Lite YouTube embed**

The facade is a real link, so it works with JS disabled; JS swaps it for the iframe.

`src/components/LiteYouTube.astro`:
```astro
---
interface Props { id: string; title: string }
const { id, title } = Astro.props;
---
<a class="yt" href={`https://www.youtube.com/watch?v=${id}`} data-yt={id} aria-label={`Play video: ${title}`}>
  <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" width="480" height="360" loading="lazy" />
  <span class="yt__play" aria-hidden="true">Play</span>
</a>

<style>
  .yt { position: relative; display: block; aspect-ratio: 16 / 9; overflow: hidden; border-radius: var(--r-img); background: var(--ink); }
  .yt img { width: 100%; height: 100%; object-fit: cover; opacity: 0.88; }
  .yt__play { position: absolute; inset: 0; display: grid; place-items: center; color: var(--white); font-size: var(--step-1); letter-spacing: 0.08em; }
  .yt :global(iframe) { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
</style>

<script>
  document.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('[data-yt]');
    if (!link) return;
    event.preventDefault();
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${link.dataset.yt}?autoplay=1&rel=0`;
    iframe.title = link.getAttribute('aria-label') ?? 'Video';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.allowFullscreen = true;
    link.replaceChildren(iframe);
  });
</script>
```

- [ ] **Step 3: Testimonials page**

`src/pages/testimonials.astro`:
```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import LiteYouTube from '../components/LiteYouTube.astro';
import BookingCTA from '../components/BookingCTA.astro';

const items = (await getCollection('testimonials')).sort((a, b) => a.data.order - b.data.order);
---
<Base
  title="Homeowner stories"
  description="Hear from homeowners who worked with Loft Concept, and step inside a Jalan Lana residence we designed and built."
>
  <section class="container lead">
    <p class="eyebrow">Homeowner stories</p>
    <h1>The best way to understand our work <span class="accent">is to see it.</span></h1>
  </section>

  <section class="container video" data-reveal>
    <LiteYouTube id="rjq1_hLP6n4" title="A tour inside Jalan Lana" />
    <div class="video__text">
      <h2>A tour inside Jalan Lana</h2>
      <p>Step inside this Jalan Lana residence and see how Loft Concept transformed the space, from the entry foyer through to every thoughtfully designed room.</p>
      <a class="link" href="/portfolio/jalan-lana">View the project</a>
    </div>
  </section>

  <section class="section">
    <div class="container wall">
      {items.map((item, i) => (
        <figure class="quote" data-reveal style={`--i:${i % 2}`}>
          <blockquote class="accent">“{item.data.quote}”</blockquote>
          <figcaption>
            <strong>{item.data.author}</strong>
            <span>{item.data.projectSlug
              ? <a class="link" href={`/portfolio/${item.data.projectSlug}`}>{item.data.projectLabel}</a>
              : item.data.projectLabel}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  </section>

  <BookingCTA heading="Ready to get started?" />
</Base>

<style>
  .lead { padding-block: var(--s-6) var(--s-5); }
  .lead h1 { max-width: 18ch; }
  .video { display: grid; gap: var(--s-4); }
  @media (min-width: 900px) { .video { grid-template-columns: 7fr 5fr; align-items: end; gap: var(--s-5); } }
  .video__text { display: grid; gap: var(--s-2); justify-items: start; }
  .video h2 { font-size: var(--step-2); }
  .wall { columns: 1; column-gap: var(--s-6); }
  @media (min-width: 900px) { .wall { columns: 2; } }
  .quote { margin: 0 0 var(--s-5); break-inside: avoid; padding-top: var(--s-3); border-top: 1px solid color-mix(in srgb, var(--stone) 60%, transparent); }
  .quote blockquote { margin: 0; font-size: var(--step-1); line-height: 1.45; color: var(--ink); }
  .quote figcaption { display: grid; gap: 0.15rem; margin-top: var(--s-2); font-size: var(--step--1); letter-spacing: 0.03em; }
</style>
```

- [ ] **Step 4: Verify**

```bash
npm run check && npm run build && npm run preview -- --port 4321 &
sleep 3
node scripts/shot.mjs /about 1280 .tmp/about.png
node scripts/shot.mjs /testimonials 1280 .tmp/testimonials.png
```

Open both. Expected: About reads as an editorial page with the full-bleed project image between the story and the mission/vision pair; Testimonials shows the video block then a two-column quote wall. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: about and testimonials pages" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Contact, thank-you, 404, privacy

**Files:**
- Create: `src/lib/enquiry.ts`, `src/lib/enquiry.test.ts`, `src/pages/contact.astro`, `src/pages/thank-you.astro`, `src/pages/404.astro`, `src/pages/privacy.astro`

**Interfaces:**
- Produces: `validateEnquiry(values: { name: string; phone: string; email: string }): Partial<Record<'name'|'phone'|'email', string>>`; option lists `propertyTypes`, `propertyStatuses`, `keyCollections`, `budgets` (exact legacy values). Form markup contracts used by Task 15: `form[data-enquiry]`, error slots `[data-error="name|phone|email"]`, `[data-status]`, inputs with `name="name|phone|email"` and `aria-invalid`.

- [ ] **Step 1: Write the failing test**

`src/lib/enquiry.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { validateEnquiry } from './enquiry';

const ok = { name: 'Alex Tan', phone: '+65 8533 7311', email: 'alex@example.sg' };

describe('validateEnquiry', () => {
  it('accepts a valid enquiry', () => {
    expect(validateEnquiry(ok)).toEqual({});
    expect(validateEnquiry({ ...ok, phone: '8533 7311' })).toEqual({});
  });
  it('requires every field', () => {
    expect(validateEnquiry({ name: '', phone: '', email: '' })).toEqual({
      name: 'Please enter your name.',
      phone: 'Please enter a phone number we can reach you on.',
      email: 'Please enter your email address.',
    });
  });
  it('treats whitespace-only as empty', () => {
    expect(validateEnquiry({ ...ok, name: '   ' }).name).toBe('Please enter your name.');
  });
  it('rejects malformed phone numbers', () => {
    expect(validateEnquiry({ ...ok, phone: '1234567' }).phone).toBe("That phone number doesn't look right.");
    expect(validateEnquiry({ ...ok, phone: 'abcdefgh' }).phone).toBe("That phone number doesn't look right.");
  });
  it('rejects malformed email', () => {
    expect(validateEnquiry({ ...ok, email: 'alex@example' }).email).toBe("That email address doesn't look right.");
    expect(validateEnquiry({ ...ok, email: 'alex example@x.sg' }).email).toBe("That email address doesn't look right.");
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/lib/enquiry.test.ts`
Expected: FAIL, cannot resolve `./enquiry`.

- [ ] **Step 3: Implement**

`src/lib/enquiry.ts`:
```ts
export const propertyTypes = ['HDB 2-Room', 'HDB 3-Room', 'HDB 4-Room', 'HDB 5-Room', 'HDB Maisonette', 'Condominium', 'Landed Property', 'Commercial'] as const;
export const propertyStatuses = ['New BTO', 'Resale', 'New Launch Condo', 'Existing Home (Renovation)', 'Existing Home (Construction)'] as const;
export const keyCollections = ['Within 3 months', '3 – 6 months', '6 – 12 months', 'More than 12 months', 'Already Collected'] as const;
export const budgets = ['Under $30,000', '$30,000 – $50,000', '$50,000 – $80,000', '$80,000 – $120,000', '$120,000 – $200,000', 'Above $200,000'] as const;

export interface EnquiryValues { name: string; phone: string; email: string }
export type EnquiryErrors = Partial<Record<keyof EnquiryValues, string>>;

export function validateEnquiry(values: EnquiryValues): EnquiryErrors {
  const errors: EnquiryErrors = {};

  if (!values.name.trim()) errors.name = 'Please enter your name.';

  const phone = values.phone.trim();
  if (!phone) errors.phone = 'Please enter a phone number we can reach you on.';
  else if (!/^[0-9+()\s-]+$/.test(phone) || phone.replace(/\D/g, '').length < 8) errors.phone = "That phone number doesn't look right.";

  const email = values.email.trim();
  if (!email) errors.email = 'Please enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "That email address doesn't look right.";

  return errors;
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run src/lib/enquiry.test.ts`
Expected: all pass.

- [ ] **Step 5: Contact page**

The old form's qualification fields are kept, grouped as an optional second step so the first step stays short.

`src/pages/contact.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import { site } from '../lib/site';
import { budgets, keyCollections, propertyStatuses, propertyTypes } from '../lib/enquiry';
---
<Base
  title="Book a consultation"
  description="Book a consultation with Loft Concept. Tell us about your home or commercial space and one of our designers will be in touch."
>
  <section class="container contact">
    <div class="contact__intro">
      <p class="eyebrow">Book a consultation</p>
      <h1>You deserve a home <span class="accent">that feels like you.</span></h1>
      <p>Tell us a little about your space. We’ll be in touch shortly to arrange a first consultation.</p>
      <p class="contact__alt">Prefer to talk now? <a class="link" href={site.whatsapp} target="_blank" rel="noopener">WhatsApp us</a>, call <a class="link" href={site.phoneHref}>{site.phone}</a>, or email <a class="link" href={`mailto:${site.email}`}>{site.email}</a>.</p>
    </div>

    <form class="form" data-enquiry action={site.formAction} method="POST">
      <input type="hidden" name="_subject" value="New booking enquiry — Loft Concept" />
      <input type="hidden" name="_next" value={`${site.url}/thank-you`} />
      <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" class="form__trap" />

      <fieldset>
        <legend>About you</legend>
        <div class="field">
          <label for="name">Name</label>
          <input id="name" name="name" type="text" autocomplete="name" required aria-describedby="name-error" />
          <p class="field__error" id="name-error" data-error="name" role="alert"></p>
        </div>
        <div class="field">
          <label for="phone">Phone</label>
          <input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required aria-describedby="phone-error" />
          <p class="field__error" id="phone-error" data-error="phone" role="alert"></p>
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" autocomplete="email" required aria-describedby="email-error" />
          <p class="field__error" id="email-error" data-error="email" role="alert"></p>
        </div>
      </fieldset>

      <fieldset>
        <legend>About your project <span class="accent">(optional, helps us prepare)</span></legend>
        <div class="field">
          <label for="property_type">Property type</label>
          <select id="property_type" name="property_type"><option value="">Select</option>{propertyTypes.map((o) => <option>{o}</option>)}</select>
        </div>
        <div class="field">
          <label for="property_status">Property status</label>
          <select id="property_status" name="property_status"><option value="">Select</option>{propertyStatuses.map((o) => <option>{o}</option>)}</select>
        </div>
        <div class="field">
          <label for="key_collection">Estimated key collection</label>
          <select id="key_collection" name="key_collection"><option value="">Select</option>{keyCollections.map((o) => <option>{o}</option>)}</select>
        </div>
        <div class="field">
          <label for="budget">Estimated budget</label>
          <select id="budget" name="budget"><option value="">Select</option>{budgets.map((o) => <option>{o}</option>)}</select>
        </div>
        <div class="field">
          <label for="preferences">Design preferences</label>
          <textarea id="preferences" name="preferences" rows="4" placeholder="Anything else you would like us to take note of?"></textarea>
        </div>
        <div class="field">
          <label for="discount_code">Discount code</label>
          <input id="discount_code" name="discount_code" type="text" autocomplete="off" />
        </div>
      </fieldset>

      <button class="btn" type="submit">Send enquiry</button>
      <p class="form__status" data-status role="status" aria-live="polite"></p>
    </form>
  </section>
</Base>

<style>
  .contact { display: grid; gap: var(--s-5); padding-block: var(--s-6); }
  @media (min-width: 900px) { .contact { grid-template-columns: 5fr 7fr; gap: var(--s-6); } .contact__intro { position: sticky; top: calc(var(--header-h) + var(--s-4)); align-self: start; } }
  .contact__intro { display: grid; gap: var(--s-3); justify-items: start; }
  .contact__alt { font-size: var(--step--1); }
  .form { display: grid; gap: var(--s-4); }
  fieldset { border: 0; padding: 0; margin: 0; display: grid; gap: var(--s-3); }
  legend { padding: 0; margin-bottom: var(--s-2); font-size: var(--step-1); color: var(--ink); font-weight: 500; }
  .field { display: grid; gap: 0.35rem; }
  label { font-size: var(--step--1); letter-spacing: 0.04em; font-weight: 500; }
  input, select, textarea {
    width: 100%; padding: 0.85em 1em; background: var(--white); color: var(--ink);
    border: 1px solid color-mix(in srgb, var(--umber) 45%, transparent); border-radius: var(--r-ctl);
    font: inherit; transition: border-color 0.2s var(--ease-out);
  }
  input:focus, select:focus, textarea:focus { border-color: var(--umber); }
  input[aria-invalid='true'] { border-color: #9b2c2c; }
  .field__error { min-height: 1.2em; font-size: var(--step--1); color: #9b2c2c; }
  .form__trap { position: absolute; left: -9999px; }
  .form__status { min-height: 1.5em; font-size: var(--step--1); }
  .form button { justify-self: start; }
</style>

<script>
  import { validateEnquiry } from '../lib/enquiry';

  const FIELDS = ['name', 'phone', 'email'] as const;

  function wire() {
    const form = document.querySelector<HTMLFormElement>('form[data-enquiry]');
    if (!form || form.dataset.wired) return;
    form.dataset.wired = '1';
    form.noValidate = true;
    const status = form.querySelector<HTMLElement>('[data-status]')!;
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;

    const show = (errors: Partial<Record<(typeof FIELDS)[number], string>>) => {
      for (const field of FIELDS) {
        const input = form.elements.namedItem(field) as HTMLInputElement;
        form.querySelector<HTMLElement>(`[data-error="${field}"]`)!.textContent = errors[field] ?? '';
        input.setAttribute('aria-invalid', errors[field] ? 'true' : 'false');
      }
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const errors = validateEnquiry({
        name: String(data.get('name') ?? ''),
        phone: String(data.get('phone') ?? ''),
        email: String(data.get('email') ?? ''),
      });
      show(errors);
      const first = FIELDS.find((f) => errors[f]);
      if (first) { (form.elements.namedItem(first) as HTMLElement).focus(); return; }

      button.disabled = true;
      status.textContent = 'Sending…';
      try {
        const res = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(String(res.status));
        location.assign('/thank-you');
      } catch {
        status.textContent = 'We couldn’t send your enquiry. Please try again, or message us on WhatsApp.';
        button.disabled = false;
      }
    });
  }

  document.addEventListener('astro:page-load', wire);
</script>
```

- [ ] **Step 6: Thank-you, 404, privacy**

`src/pages/thank-you.astro`:
```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Thank you" description="Thank you for your enquiry. We will be in touch shortly." noindex>
  <section class="container wrap">
    <p class="eyebrow">Enquiry received</p>
    <h1>Thank you. <span class="accent">We’ll be in touch shortly.</span></h1>
    <p>In the meantime, you are welcome to look through some of our recent work.</p>
    <div class="actions"><a class="btn" href="/portfolio">Explore the portfolio</a><a class="link" href="/">Back to home</a></div>
  </section>
</Base>

<style>
  .wrap { padding-block: var(--s-7); display: grid; gap: var(--s-3); justify-items: start; }
  .wrap h1 { max-width: 14ch; }
  .actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-3); margin-top: var(--s-2); }
</style>
```

`src/pages/404.astro`:
```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Page not found" description="That page could not be found." noindex>
  <section class="container wrap">
    <p class="eyebrow">404</p>
    <h1>That page isn’t here. <span class="accent">The work is.</span></h1>
    <p>The link may be out of date. Start from the portfolio, or go back to the home page.</p>
    <div class="actions"><a class="btn" href="/portfolio">View the portfolio</a><a class="link" href="/">Back to home</a></div>
  </section>
</Base>

<style>
  .wrap { padding-block: var(--s-7); display: grid; gap: var(--s-3); justify-items: start; }
  .wrap h1 { max-width: 16ch; }
  .actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-3); margin-top: var(--s-2); }
</style>
```

`src/pages/privacy.astro`. This is a plain-language draft of what the site actually does. It needs the owner's (and ideally legal) review against Singapore's PDPA before launch.

```astro
---
import Base from '../layouts/Base.astro';
import { site } from '../lib/site';
---
<Base title="Privacy" description="How Loft Concept handles the information you send us through this website.">
  <section class="container doc">
    <p class="eyebrow">Privacy</p>
    <h1>How we handle your information</h1>
    <h2>What we collect</h2>
    <p>When you send an enquiry we receive the details you type into the form: your name, phone number and email address, and, if you choose to give them, your property type, status, estimated key collection date, budget, design preferences and any discount code.</p>
    <h2>Why we collect it</h2>
    <p>We use these details only to contact you, to arrange a consultation and to prepare a proposal for your project.</p>
    <h2>Who processes it</h2>
    <p>Enquiries are delivered to us by Formspree, a form-handling service. Formspree processes the form data on our behalf in order to deliver it to us. This site does not currently use advertising or analytics cookies.</p>
    <h2>Your choices</h2>
    <p>You can ask to see, correct or delete the information you have given us, or withdraw your consent to us contacting you, by emailing <a class="link" href={`mailto:${site.email}`}>{site.email}</a>.</p>
  </section>
</Base>

<style>
  .doc { padding-block: var(--s-6); display: grid; gap: var(--s-2); max-width: 52rem; margin-inline: 0; }
  .doc h1 { margin-bottom: var(--s-3); }
  .doc h2 { font-size: var(--step-1); margin-top: var(--s-3); }
</style>
```

Note: `.doc` uses `margin-inline: 0` so the legal text stays left-aligned within the container.

- [ ] **Step 7: Verify**

```bash
npm run check && npm run build && ls dist/*.html
```
Expected: `404.html contact.html index.html about.html portfolio/… privacy.html testimonials.html thank-you.html` (portfolio is a folder; `ls dist` shows `portfolio`). Then `npm run preview -- --port 4321 &`, `node scripts/shot.mjs /contact 1280 .tmp/contact.png`, and open it with Read. Expected: the intro on the left, sticky, and the two grouped fieldsets on the right with visible labels. Stop the server.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: contact form with validation, thank-you, 404, privacy" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 14: SEO and structured data

**Files:**
- Create: `src/lib/schema.ts`, `src/lib/schema.test.ts`, `public/robots.txt`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Produces: `localBusinessSchema(): Record<string, unknown>`; Home passes it as `schema` to `Base`.

- [ ] **Step 1: Write the failing test**

`src/lib/schema.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { localBusinessSchema } from './schema';

describe('localBusinessSchema', () => {
  const s = localBusinessSchema() as Record<string, unknown>;
  it('describes the business with real contact details', () => {
    expect(s['@type']).toBe('HomeAndConstructionBusiness');
    expect(s.name).toBe('Loft Concept');
    expect(s.foundingDate).toBe('2010');
    expect(s.telephone).toBe('+65 8533 7311');
    expect(s.email).toBe('loftconceptsg@gmail.com');
    expect(s.areaServed).toBe('Singapore');
  });
  it('links social profiles and a logo', () => {
    expect(s.sameAs).toEqual(['https://www.facebook.com/loftconceptsg', 'https://www.instagram.com/loftconcept.sg/']);
    expect(s.logo).toBe('https://loftconcept.com.sg/apple-touch-icon.png');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/lib/schema.test.ts`
Expected: FAIL, cannot resolve `./schema`.

- [ ] **Step 3: Implement**

`src/lib/schema.ts`:
```ts
import { site } from './site';

export function localBusinessSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: site.name,
    url: site.url,
    description: 'Interior design and construction practice in Singapore, delivering homes and commercial spaces since 2010.',
    foundingDate: String(site.founded),
    telephone: site.phone,
    email: site.email,
    areaServed: 'Singapore',
    logo: `${site.url}/apple-touch-icon.png`,
    sameAs: [site.facebook, site.instagram],
  };
}
```

- [ ] **Step 4: Wire Home and add robots**

In `src/pages/index.astro` frontmatter add `import { localBusinessSchema } from '../lib/schema';` and pass `schema={localBusinessSchema()}` as a prop on the `<Base …>` element.

`public/robots.txt`:
```
User-agent: *
Allow: /

Sitemap: https://loftconcept.com.sg/sitemap-index.xml
```

- [ ] **Step 5: Run tests and build**

Run: `npx vitest run && npm run build && ls dist/sitemap*.xml && grep -c "HomeAndConstructionBusiness" dist/index.html`
Expected: all tests pass, `sitemap-index.xml` and `sitemap-0.xml` exist, count is 1. Confirm `thank-you` and `404` are absent from `dist/sitemap-0.xml` (`grep -c "thank-you\|404" dist/sitemap-0.xml` prints 0).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: structured data, robots, sitemap checks" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Verification suite

**Files:**
- Create: `scripts/lib/resolve-internal.mjs`, `scripts/lib/resolve-internal.test.mjs`, `scripts/verify-build.mjs`, `scripts/verify-browser.mjs`, `scripts/check-lighthouse.mjs`

**Interfaces:**
- Consumes: the built `dist/`, `legacy/sitemap.xml`, the form and menu contracts from Tasks 7 and 13.
- Produces: `resolveInternal(distDir: string, href: string): boolean | null` (`null` for non-internal links); npm scripts `verify:build`, `verify:browser`, `verify:lighthouse` already declared in Task 1.

- [ ] **Step 1: Write the failing test**

`scripts/lib/resolve-internal.test.mjs`:
```js
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveInternal } from './resolve-internal.mjs';

const dist = mkdtempSync(join(tmpdir(), 'dist-'));
writeFileSync(join(dist, 'index.html'), '');
writeFileSync(join(dist, 'about.html'), '');
mkdirSync(join(dist, 'portfolio'));
writeFileSync(join(dist, 'portfolio', 'jalan-lana.html'), '');
writeFileSync(join(dist, 'portfolio.html'), '');

describe('resolveInternal', () => {
  it('resolves clean URLs to .html files', () => {
    expect(resolveInternal(dist, '/')).toBe(true);
    expect(resolveInternal(dist, '/about')).toBe(true);
    expect(resolveInternal(dist, '/portfolio/jalan-lana')).toBe(true);
  });
  it('ignores query strings and fragments', () => {
    expect(resolveInternal(dist, '/portfolio?sector=commercial')).toBe(true);
    expect(resolveInternal(dist, '/#process')).toBe(true);
  });
  it('reports missing pages', () => {
    expect(resolveInternal(dist, '/nope')).toBe(false);
  });
  it('returns null for external, mailto and tel links', () => {
    expect(resolveInternal(dist, 'https://example.com/x')).toBeNull();
    expect(resolveInternal(dist, 'mailto:a@b.sg')).toBeNull();
    expect(resolveInternal(dist, 'tel:+6585337311')).toBeNull();
    expect(resolveInternal(dist, '//cdn.example.com/x.js')).toBeNull();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run scripts/lib/resolve-internal.test.mjs`
Expected: FAIL, cannot resolve `./resolve-internal.mjs`.

- [ ] **Step 3: Implement**

`scripts/lib/resolve-internal.mjs`:
```js
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const isFile = (p) => existsSync(p) && statSync(p).isFile();

export function resolveInternal(distDir, href) {
  if (!href.startsWith('/') || href.startsWith('//')) return null;
  const path = decodeURI(href.split('#')[0].split('?')[0]);
  if (path === '/' || path === '') return isFile(join(distDir, 'index.html'));
  return [path, `${path}.html`, join(path, 'index.html')].some((p) => isFile(join(distDir, p)));
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run scripts/lib/resolve-internal.test.mjs`
Expected: all pass.

- [ ] **Step 5: Build verifier**

`scripts/verify-build.mjs`:
```js
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
const legacy = [...readFileSync('legacy/sitemap.xml', 'utf8').matchAll(/<loc>https:\/\/loftconcept\.com\.sg([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
for (const path of legacy) {
  if (resolveInternal(DIST, path) !== true && !redirectFroms.has(path)) fail(`legacy URL not covered: ${path}`);
}
for (const path of ['/thankyou', '/thankyou.html', '/index.html', '/sitemap.xml']) {
  if (!redirectFroms.has(path)) fail(`redirect missing: ${path}`);
}

console.log(`${pages.length} pages, ${legacy.length} legacy URLs checked`);
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('verify-build: OK');
```

Run: `npm run build && npm run verify:build`
Expected: `verify-build: OK`. Any failure line names the page and the problem; fix the page, not the check. A common first-run failure is `duplicate title`; the two Ernani and two Pari Dedap pages must differ (`Ernani Street II`), so confirm the titles in `src/content/projects`.

- [ ] **Step 6: Browser verifier**

`scripts/verify-browser.mjs`. Start a preview server first: `npm run preview -- --port 4321 &`.

```js
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
```

Run: `npm run build && (npm run preview -- --port 4321 &) ; sleep 3 && npm run verify:browser`
Expected: six `ok` lines and `verify-browser: 6 checks passed`. Then open a few screenshots with Read for a human pass (file names are width plus path, for example `.tmp/shots/360-.png` for the home page at 360px and `.tmp/shots/1280-portfolio.png`). Stop the server afterwards.

- [ ] **Step 7: Lighthouse**

`scripts/check-lighthouse.mjs`:
```js
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
```

Run (preview server on 4321 running):
```bash
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for pair in "home:/" "portfolio:/portfolio" "project:/portfolio/sennett-road"; do
  name=${pair%%:*}; path=${pair#*:}
  npx --yes lighthouse "http://localhost:4321$path" --form-factor=mobile --only-categories=performance,accessibility,seo \
    --output=json --output-path=".tmp/lh-$name.json" --chrome-flags="--headless=new" --quiet
done
npm run verify:lighthouse
```

Expected: all `ok`. If Performance is under 0.9, open the JSON's `audits` for `largest-contentful-paint` and `unsized-images` first. The usual causes are an unoptimized hero poster, a missing `fetchpriority` on the LCP image, or the hero video autoloading too early (`preload="metadata"` should already prevent that). Fix the cause, rebuild, and re-run.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "test: build, browser and Lighthouse verification" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Curation, deploy and handoff

**Files:**
- Modify: `src/content/projects/*.md` (curation), `docs/superpowers/specs/2026-10-04-website-redesign-design.md` (one amendment)

This task needs the owner. Do not deploy, change DNS, submit the live form, or delete `legacy/` without their explicit go-ahead at each point.

- [ ] **Step 1: Curation with the owner**

Produce a contact sheet so the owner can pick covers, heroes and featured projects without opening 19 folders:
```bash
for d in src/assets/projects/*/; do echo "$d: $(ls "$d" | wc -l) images"; done
```
Share `.tmp/shots/1280-portfolio.png`, and for any project whose hero or cover looks weak, change `cover`, `hero`, `coverPosition` (for example `"50% 30%"`), and `featured` in that project's frontmatter. Collect from the owner, per project: sector confirmation (all but Horse City were assumed residential), property type, location, area, year, scope, and descriptive alt text (`coverAlt`, `heroAlt`). Add facts only when the owner supplies them. Re-run `npm run build && npm run verify:build` after edits.

- [ ] **Step 2: Amend the spec**

In the spec's Portfolio index section, change "(Residential/Commercial, then property type: HDB, condo, landed)" to "(Residential / Commercial; property-type chips return once the owner has supplied a type for every project)", and note that the form keeps the legacy qualification fields as an optional second group. Commit with the plan.

- [ ] **Step 3: Owner decisions to close before launch**

Ask the owner and record the answers in the spec's Section 8:
- Q1 right-click blocking: it is already removed in the new site; confirm they accept that.
- Q2 Noah web license: if available, add the files under `public/fonts/` with an `@font-face` in `base.css` and put `'Noah'` first in `--font-sans`.
- Q3 vector logo: if supplied, replace `public/logo.svg` and keep the viewBox aspect (header `width`/`height` attributes in `Header.astro`).
- Q4 testimonials and the Jalan Lana video: confirm they are real and cleared for use.
- Q5 reply-time promise: the contact copy says "shortly". If they want a specific commitment (for example one working day), edit `contact.astro` and `thank-you.astro`.
- Mission/vision wording: the About page uses the Brand Guide's; the legacy page used different wording.
- Privacy text: have it reviewed against Singapore's PDPA before launch.

- [ ] **Step 4: Preview deploy (ask first)**

With the owner's approval and a chosen host (Cloudflare Pages shown):
```bash
npm run build
npx wrangler pages deploy dist --project-name loft-concept --branch redesign-preview
```
Expected: a preview URL. Re-run the three Lighthouse commands from Task 15 Step 7 against the preview URL with `BASE_URL` replaced, and `BASE_URL=<preview> npm run verify:browser`. Then, only if the owner agrees, submit one real test enquiry with the name "TEST, ignore" and confirm it arrives at `loftconceptsg@gmail.com` and lands on `/thank-you`.

- [ ] **Step 5: Cutover (ask first)**

The owner updates DNS for `loftconcept.com.sg` to the new host. After it propagates, run from any machine:
```bash
for p in /projects/project-jalan-lana /about.html /thankyou /sitemap.xml; do curl -sI "https://loftconcept.com.sg$p" | head -1; curl -sI "https://loftconcept.com.sg$p" | grep -i '^location'; done
```
Expected: each shows `301` and the right `location`. Ask the owner to resubmit `https://loftconcept.com.sg/sitemap-index.xml` in Google Search Console.

- [ ] **Step 6: Remove `legacy/` (ask first)**

Only after cutover is confirmed and the owner OKs it: `git rm -r legacy && npm run build && npm run verify:build`. The legacy sitemap check in `verify-build.mjs` reads `legacy/sitemap.xml`, so before removing, copy that file to `scripts/legacy-sitemap.xml` and change the path in the script. Re-run `npm run verify:build` and confirm it passes.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: curation, spec amendment, and handoff notes" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Self-review (run against the spec)

- **Success criteria 1-6:** 1 (Lighthouse) → Task 15 Step 7. 2 (page weight) → Task 4 pipeline, measured in Task 15 Step 7. 3 (URLs) → Task 6 and `verify-build.mjs`. 4 (booking CTA within one scroll) → header CTA on every page (Task 7) plus `BookingCTA`. 5 (reduced motion) → Tasks 2, 8, 15. 6 (add a project with one file) → Task 5 schema; the project template reads only the collection.
- **Spec pages:** Home, Portfolio, Project, About, Testimonials, Contact, Thank-you, 404, Privacy are all covered (Tasks 9-13).
- **Deliberate deviations from the spec, called out:** property-type filter chips deferred (data not available; Task 10, amended in Task 16); contact form keeps the legacy qualification fields as an optional group rather than being shortened; stars removed from testimonials; Process lives on Home and About links to it rather than duplicating it; "one-day reply" promise replaced by "shortly" until the owner commits to a time.
- **Placeholders:** none. Owner-supplied data (property facts, alt text, Noah license, vector logo) has a working default and a named step that collects it.
- **Type and name consistency:** `tile` / `data-tile` (Tasks 9, 10), `data-sector`, `data-reveal`, `data-ambient`, `form[data-enquiry]`, `[data-error]`, `[data-status]`, `.gallery`, `.header__nav`, `.header__menu` are used identically where defined and where verified (Task 15). `imageName` is the single source of generated image names (Tasks 4, 5).
