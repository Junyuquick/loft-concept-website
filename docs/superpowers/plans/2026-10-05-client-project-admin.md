# Client Project Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The client can add and edit portfolio projects at `loftconcept.com.sg/admin`, and every publish rebuilds the site and uploads it to Vodien.

**Architecture:** Sveltia CMS (static files in `public/admin/`) edits `src/content/projects/*.md` and commits to GitHub. Sign-in goes through the `sveltia-cms-auth` Cloudflare Worker. A GitHub Action tests, builds and verifies the site, then uploads `dist/` over FTPS: the `redesign` branch goes to a staging subdomain, and `main` goes live. Go-live (merging `redesign` into `main`) is the last task and happens only on the owner's say-so.

**Tech Stack:** Astro 7 (static, `build.format: 'file'`), Sveltia CMS 0.227.4 (CDN), Vitest 5, `yaml` 2.9.1, GitHub Actions (`actions/checkout@v7`, `actions/setup-node@v7`, `actions/cache@v6`, `SamKirkland/FTP-Deploy-Action@v4.4.0`), Vodien cPanel/Apache, Cloudflare Workers.

**Spec:** `docs/superpowers/specs/2026-10-04-client-project-admin-design.md`

## Global Constraints

- The site stays static. No server runtime, no database.
- Hosting is Vodien. The `deploy@loftconcept.com.sg` FTP account is rooted at `/home2/loftconceptcom/public_html`, the domain's document root. Explicit FTPS on port 21.
- GitHub secrets already exist: `VODIEN_FTP_HOST`, `VODIEN_FTP_USER`, `VODIEN_FTP_PASSWORD`. Never write the password anywhere else.
- Admin fields must match the `projects` schema in `src/content.config.ts` exactly. The schema is the source of truth; never change it to suit the CMS.
- Uploads go to `src/assets/projects/uploads/`, written in Markdown as `../../assets/projects/uploads/<file>`, and are shrunk to WebP, quality 85, at most 2400×2400.
- Existing projects and their photo folders are not moved or renamed.
- `/admin` is `noindex` and absent from the sitemap.
- No live deploy (push to `main`) before the owner approves go-live in Task 5.
- The repo is public. Commit no credentials.
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Editing an existing project keeps its photo paths.** Opening Bedok Road in the admin and changing only the summary must leave `cover`, `hero` and `gallery` byte-identical. Pinned by the diff check in Task 4 Step 6.
2. **An iPhone HEIC photo is refused at upload, not at build.** The image fields' `accept` excludes HEIC, so the client sees the refusal in the form rather than getting a failed deploy. Pinned by the `accept` test in Task 2.
3. **Uploads land where Astro can find them.** `public_folder`, resolved from `src/content/projects`, must equal `media_folder`. Otherwise every new project fails the build. Pinned by the path test in Task 2 and the upload check in Task 4 Step 5.
4. **A failed build or test uploads nothing, and staging never gets the live robots file or vice versa.** Pinned by the workflow-order and robots tests in Task 3.
5. **Two quick publishes don't interleave uploads.** Deploys of one branch queue rather than run at once. Pinned by the concurrency test in Task 3.

---

### Task 1: Route `/admin` to `/admin/` on Apache and Cloudflare

`renderApache` sets `DirectorySlash Off` so `/portfolio` serves `portfolio.html`. Side effect: `/admin` (a folder with no `admin.html`) would return 403 instead of the CMS. Add an explicit redirect, and teach the live-server verifier about `/admin` and staging.

**Files:**
- Modify: `src/lib/redirects.mjs` (`renderCloudflare`, `renderApache`)
- Modify: `src/lib/redirects.test.ts`
- Modify: `scripts/verify-server.mjs`

**Interfaces:**
- Consumes: nothing new.
- Produces: `dist/.htaccess` contains `RewriteRule ^admin$ /admin/ [R=301,L]`, and `dist/_redirects` contains `/admin /admin/ 301`. `verify-server.mjs` checks `/admin` → 301 `/admin/` and `/admin/` → 200, and skips the canonical-host check when `BASE_URL`'s hostname starts with `staging.`.

- [ ] **Step 1: Write the failing tests.** Append inside the existing `describe('renderCloudflare', …)` block in `src/lib/redirects.test.ts`:

```ts
  it('sends /admin to /admin/ without looping on /admin/', () => {
    expect(out).toContain('/admin /admin/ 301');
    expect(out).not.toContain('/admin/ /admin/');
  });
```

Append inside the existing `describe('renderApache', …)` block:

```ts
  it('sends /admin to /admin/ so the CMS folder index loads despite DirectorySlash Off', () => {
    expect(out).toContain('RewriteRule ^admin$ /admin/ [R=301,L]');
    expect(out.indexOf('RewriteRule ^admin$')).toBeLessThan(out.indexOf('RewriteRule ^(.+)$ $1.html [L]'));
  });
```

- [ ] **Step 2: Run them and confirm they fail.**

Run: `npx vitest run src/lib/redirects.test.ts`
Expected: 2 failures, both `expected … to contain` for the admin lines.

- [ ] **Step 3: Implement.** In `src/lib/redirects.mjs`, in `renderCloudflare`, before `return`:

```js
  lines.push('/admin /admin/ 301');
```

In `renderApache`, change the `lines.push(` that follows the legacy loop so it begins:

```js
  lines.push(
    '',
    '# /admin is a folder; with DirectorySlash Off Apache will not add the slash itself',
    'RewriteRule ^admin$ /admin/ [R=301,L]',
    '',
    '# Any other /page.html or /page/ goes to /page',
```

Leave the rest of that `push` unchanged.

- [ ] **Step 4: Run the tests and confirm they pass.**

Run: `npx vitest run src/lib/redirects.test.ts`
Expected: all pass, including the existing 14-rule count, because `buildRedirects` is unchanged.

- [ ] **Step 5: Extend `scripts/verify-server.mjs`.** After the `const LIVE = …` line add:

```js
const STAGING = BASE.hostname.startsWith('staging.');
```

Add `'/admin/'` to the `pages` array, and add `['/admin', '/admin/']` to the `redirects` array. Wrap the existing canonical-host `for (const host of …)` loop in `if (!STAGING) { … }`, with this comment above it:

```js
// Staging shares Vodien's IP; a faked live Host header would hit the live site, not staging.
```

`/admin/` won't return 200 until Task 2 adds the folder. Its server run happens in Task 2 Step 8.

- [ ] **Step 6: Commit.**

```bash
git add src/lib/redirects.mjs src/lib/redirects.test.ts scripts/verify-server.mjs
git commit -m "feat: redirect /admin to /admin/ on Apache and Cloudflare" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Admin page, CMS config and schema-drift test

**Files:**
- Create: `public/admin/index.html`
- Create: `public/admin/config.yml`
- Create: `src/lib/cms-config.test.ts`
- Modify: `package.json` / `package-lock.json` (devDependency `yaml@2.9.1`)
- Modify: `scripts/verify-build.mjs`

**Interfaces:**
- Consumes: `.astro/collections/projects.schema.json`, generated by `npx astro sync` from `src/content.config.ts`. It is gitignored, so CI must run `npx astro sync` before `npm test` (Task 3).
- Produces: `public/admin/config.yml` with `backend.branch: redesign` and no `base_url` yet. Task 4 adds `base_url`; Task 5 switches the branch to `main`. `dist/admin/index.html` and `dist/admin/config.yml` appear in the build.

- [ ] **Step 1: Add the YAML parser.**

Run: `npm install --save-dev --save-exact yaml@2.9.1`
Expected: `package.json` devDependencies gain `"yaml": "2.9.1"`.

- [ ] **Step 2: Write the failing drift test** at `src/lib/cms-config.test.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

// The Zod schema in src/content.config.ts is the source of truth; `astro sync` emits it as JSON Schema.
const SCHEMA = '.astro/collections/projects.schema.json';
if (!existsSync(SCHEMA)) throw new Error(`${SCHEMA} is missing: run "npx astro sync" first`);
const schema = JSON.parse(readFileSync(SCHEMA, 'utf8'));
const props: Record<string, any> = Object.fromEntries(Object.entries(schema.properties).filter(([k]) => k !== '$schema'));
const config = parse(readFileSync('public/admin/config.yml', 'utf8'));
const projects = config.collections.find((c: any) => c.name === 'projects');
const fields = new Map<string, any>(projects.fields.map((f: any) => [f.name, f]));
const optionValues = (f: any) => f.options.map((o: any) => (typeof o === 'object' ? o.value : o));
// JSON Schema can't tell an image() from a string, so these mirror the image() calls in content.config.ts.
const IMAGE_FIELDS = ['cover', 'hero', 'gallery'];

describe('admin config matches the projects schema', () => {
  it('edits src/content/projects as Markdown front matter', () => {
    expect(projects).toMatchObject({ folder: 'src/content/projects', extension: 'md', format: 'frontmatter', create: true });
  });
  it('has exactly the schema fields', () => {
    expect([...fields.keys()].sort()).toEqual(Object.keys(props).sort());
  });
  it('requires exactly the fields the schema requires', () => {
    for (const [name, f] of fields) expect({ name, required: f.required !== false }).toEqual({ name, required: schema.required.includes(name) });
  });
  it('offers exactly the schema enum values', () => {
    for (const [name, p] of Object.entries(props)) if (p.enum) expect({ name, values: optionValues(fields.get(name)) }).toEqual({ name, values: p.enum });
  });
  it('uses integer number inputs for integer properties', () => {
    for (const [name, p] of Object.entries(props)) if (p.type === 'integer') expect({ name, ...fields.get(name) }).toMatchObject({ name, widget: 'number', value_type: 'int' });
  });
  it('carries the schema defaults', () => {
    for (const [name, p] of Object.entries(props)) if (p.default !== undefined) expect({ name, default: fields.get(name).default }).toEqual({ name, default: p.default });
  });
  it('enforces the summary minimum length', () => {
    expect(fields.get('summary').minlength).toBe(props.summary.minLength);
  });
  it('uses image widgets for image fields, with gallery as a reorderable list', () => {
    for (const name of IMAGE_FIELDS) expect(fields.get(name).widget).toBe('image');
    expect(fields.get('gallery').multiple).toBe(true);
  });
});

describe('admin media settings', () => {
  it('writes upload paths that resolve, from a project file, to the upload folder', () => {
    const fromProjectFile = resolve('src/content/projects', config.public_folder);
    expect(fromProjectFile).toBe(resolve(config.media_folder.replace(/^\//, '')));
    expect(config.media_folder).toBe('/src/assets/projects/uploads');
  });
  it('shrinks uploads to WebP of at most 2400px', () => {
    expect(config.media_libraries.default.config.transformations.raster_image).toEqual({ format: 'webp', quality: 85, width: 2400, height: 2400 });
  });
  it('refuses formats the build cannot process, such as iPhone HEIC', () => {
    for (const name of IMAGE_FIELDS) {
      const accept = fields.get(name).accept as string;
      expect(accept.split(',').sort()).toEqual(['image/jpeg', 'image/png', 'image/webp']);
    }
  });
  it('commits to the repo on the expected branch', () => {
    expect(config.backend).toMatchObject({ name: 'github', repo: 'Junyuquick/loft-concept-website', branch: 'redesign' });
  });
});
```

- [ ] **Step 3: Run it and confirm it fails.**

Run: `npx astro sync && npx vitest run src/lib/cms-config.test.ts`
Expected: FAIL with `ENOENT … public/admin/config.yml`.

- [ ] **Step 4: Write `public/admin/config.yml`.**

```yaml
# Sveltia CMS: https://sveltiacms.app/en/docs
# Fields mirror the projects schema in src/content.config.ts; src/lib/cms-config.test.ts fails if they drift.
backend:
  name: github
  repo: Junyuquick/loft-concept-website
  branch: redesign

media_folder: /src/assets/projects/uploads
public_folder: ../../assets/projects/uploads

media_libraries:
  default:
    config:
      transformations:
        raster_image:
          format: webp
          quality: 85
          width: 2400
          height: 2400

slug:
  encoding: ascii
  clean_accents: true

collections:
  - name: projects
    label: Projects
    label_singular: Project
    folder: src/content/projects
    extension: md
    format: frontmatter
    create: true
    delete: true
    identifier_field: title
    slug: '{{slug}}'
    summary: '{{title}} · {{sector}}'
    sortable_fields: [order, title]
    fields:
      - { name: title, label: Title, widget: string, hint: 'Also becomes the web address for new projects, e.g. "Tanjong Rhu" → /portfolio/tanjong-rhu.' }
      - name: sector
        label: Sector
        widget: select
        options: [{ label: Residential, value: residential }, { label: Commercial, value: commercial }]
      - name: propertyType
        label: Property type
        widget: select
        required: false
        options: [{ label: HDB, value: hdb }, { label: Condo, value: condo }, { label: Landed, value: landed }, { label: Commercial, value: commercial }]
      - { name: location, label: Location, widget: string, required: false }
      - { name: area, label: Area, widget: string, required: false, hint: 'e.g. "1,200 sq ft"' }
      - { name: year, label: Year completed, widget: number, value_type: int, required: false }
      - { name: scope, label: Scope of work, widget: string, required: false }
      - { name: summary, label: Summary, widget: text, minlength: 20, hint: 'Two or three sentences shown on the project page and in search results.' }
      - { name: cover, label: Cover photo, widget: image, accept: 'image/jpeg,image/png,image/webp', hint: 'Shown on the portfolio grid.' }
      - { name: coverAlt, label: Cover photo description, widget: string, required: false, hint: 'Describe the photo for visitors using screen readers.' }
      - { name: coverPosition, label: Cover focus point, widget: string, required: false, default: '50% 50%', hint: 'Which part of the cover stays visible when cropped. "50% 50%" is the centre; leave as is if unsure.' }
      - { name: hero, label: Main photo, widget: image, accept: 'image/jpeg,image/png,image/webp', hint: 'The large photo at the top of the project page.' }
      - { name: heroAlt, label: Main photo description, widget: string, required: false }
      - { name: gallery, label: Gallery, widget: image, multiple: true, required: false, default: [], accept: 'image/jpeg,image/png,image/webp', hint: 'Drag to reorder.' }
      - { name: video, label: Video, widget: string, required: false, hint: 'Leave empty unless your developer has added a video file.' }
      - { name: featured, label: Feature on home page, widget: boolean, required: false, default: false }
      - { name: order, label: Order, widget: number, value_type: int, hint: 'Lower numbers appear first in the portfolio.' }
```

- [ ] **Step 5: Run the drift test and confirm it passes.**

Run: `npx vitest run src/lib/cms-config.test.ts`
Expected: all 12 tests pass. If one fails, fix `config.yml`, never the schema.

- [ ] **Step 6: Write `public/admin/index.html`.** The version is pinned so an upstream release can't break the client's admin unannounced; bump it deliberately.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Loft Concept · Admin</title>
    <link href="/admin/config.yml" type="application/yaml" rel="cms-config-url" />
  </head>
  <body>
    <script src="https://unpkg.com/@sveltia/cms@0.227.4/dist/sveltia-cms.js"></script>
  </body>
</html>
```

- [ ] **Step 7: Teach `scripts/verify-build.mjs` about the admin.** The public-page checks (canonical, one `<h1>`, description) don't apply to the CMS shell. Change the `pages` line to:

```js
const pages = walk(DIST).filter((f) => f.endsWith('.html') && !f.startsWith(join(DIST, 'admin')));
```

Then, before the `console.log(\`${pages.length} pages…` line, add:

```js
// The CMS shell: present, hidden from search, and kept out of the sitemap.
const adminHtml = join(DIST, 'admin', 'index.html');
try {
  const html = readFileSync(adminHtml, 'utf8');
  if (!/<meta name="robots" content="noindex"/.test(html)) fail('admin/index.html: should be noindex');
  if (!/rel="cms-config-url"/.test(html)) fail('admin/index.html: missing config link');
} catch { fail('admin/index.html: missing'); }
try { readFileSync(join(DIST, 'admin', 'config.yml')); } catch { fail('admin/config.yml: missing'); }
for (const f of readdirSync(DIST).filter((f) => /^sitemap.*\.xml$/.test(f))) {
  if (readFileSync(join(DIST, f), 'utf8').includes('/admin')) fail(`${f}: lists /admin`);
}
if (!redirectFroms.has('/admin')) fail('redirect missing: /admin');
```

- [ ] **Step 8: Build, verify, and smoke-test on local Apache.**

```bash
npm test && npm run build && npm run verify:build
/usr/sbin/httpd -f "$PWD/.tmp/apache/httpd.conf" -k start
node scripts/verify-server.mjs
node -e '
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await p.goto("http://127.0.0.1:8088/admin/"); await p.waitForTimeout(5000);
  const text = await p.locator("body").innerText();
  console.log(text.slice(0, 300)); console.log("errors:", errors);
  await b.close(); process.exit(/Sign In with GitHub|GitHub/i.test(text) && !errors.some((e) => /config/i.test(e)) ? 0 : 1);
})();'
/usr/sbin/httpd -f "$PWD/.tmp/apache/httpd.conf" -k stop
```

Expected: all tests pass; `verify-build: OK`; `verify-server: OK`, including `/admin → 301 /admin/` and `/admin/ → 200`; the smoke script prints the Sveltia sign-in screen, exits 0, and shows no configuration errors.

- [ ] **Step 9: Commit.**

```bash
git add public/admin src/lib/cms-config.test.ts scripts/verify-build.mjs package.json package-lock.json
git commit -m "feat: Sveltia CMS admin for portfolio projects" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Deploy workflow and the staging site

**Owner action first:** in cPanel → **Domains** → **Create A New Domain**, enter `staging.loftconcept.com.sg`, untick "Share document root", set the document root to `public_html/staging`, and submit. DNS is at Vodien (`ns1–3.vodien.com`), so the record is created automatically. AutoSSL may take up to a few hours to issue HTTPS; until then, use `http://`.

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `src/lib/deploy-workflow.test.ts`

**Interfaces:**
- Consumes: the three `VODIEN_FTP_*` secrets; `npm test`, `npm run build`, `npm run verify:build`.
- Produces: a push to `redesign` deploys to `public_html/staging/` (`staging.loftconcept.com.sg`); a push to `main` deploys to `public_html/` (live).

- [ ] **Step 1: Write the failing test** at `src/lib/deploy-workflow.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const wf = parse(readFileSync('.github/workflows/deploy.yml', 'utf8'));
const steps: any[] = wf.jobs.deploy.steps;
const at = (pred: (s: any) => boolean) => steps.findIndex(pred);
const run = (cmd: string) => at((s) => s.run === cmd);
const ftp = at((s) => String(s.uses).startsWith('SamKirkland/FTP-Deploy-Action@'));

describe('deploy workflow', () => {
  it('deploys redesign to staging and main to live, on push', () => {
    expect(wf.on.push.branches).toEqual(['main', 'redesign']);
    expect(steps[ftp].with['server-dir']).toBe("${{ github.ref_name == 'main' && './' || './staging/' }}");
  });
  it('uploads only after schema sync, tests, build and verification all pass', () => {
    const order = [run('npx astro sync'), run('npm test'), run('npm run build'), run('npm run verify:build'), ftp];
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(steps.some((s) => s['continue-on-error'])).toBe(false);
  });
  it('hides staging from search engines and never touches live robots.txt', () => {
    const robots = steps[at((s) => /robots\.txt/.test(s.run ?? ''))];
    expect(robots.if).toBe("github.ref_name != 'main'");
    expect(steps.indexOf(robots)).toBeLessThan(ftp);
  });
  it('queues deploys of the same branch instead of overlapping them', () => {
    expect(wf.concurrency).toEqual({ group: 'deploy-${{ github.ref_name }}', 'cancel-in-progress': false });
  });
  it('uploads over FTPS with credentials from secrets only', () => {
    expect(steps[ftp].with).toMatchObject({
      protocol: 'ftps', port: 21, 'local-dir': './dist/',
      server: '${{ secrets.VODIEN_FTP_HOST }}', username: '${{ secrets.VODIEN_FTP_USER }}', password: '${{ secrets.VODIEN_FTP_PASSWORD }}',
    });
  });
  it('restores the image cache after npm ci, which would otherwise wipe it', () => {
    expect(at((s) => String(s.uses).startsWith('actions/cache@'))).toBeGreaterThan(run('npm ci'));
  });
});
```

- [ ] **Step 2: Run it and confirm it fails.**

Run: `npx vitest run src/lib/deploy-workflow.test.ts`
Expected: FAIL with `ENOENT … .github/workflows/deploy.yml`.

- [ ] **Step 3: Write `.github/workflows/deploy.yml`.**

```yaml
# redesign → staging.loftconcept.com.sg (public_html/staging), main → loftconcept.com.sg (public_html).
# Admin publishes are commits, so they deploy the same way. Any failed step uploads nothing.
name: Deploy

on:
  push:
    branches: [main, redesign]
  workflow_dispatch:

concurrency:
  group: deploy-${{ github.ref_name }}
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - name: Reuse optimised images from earlier builds
        uses: actions/cache@v6
        with:
          path: node_modules/.astro
          key: astro-assets-${{ hashFiles('src/assets/**') }}
          restore-keys: astro-assets-
      - run: npx astro sync
      - run: npm test
      - run: npm run build
      - run: npm run verify:build
      - name: Keep staging out of search engines
        if: github.ref_name != 'main'
        run: printf 'User-agent: *\nDisallow: /\n' > dist/robots.txt
      - name: Upload to Vodien
        uses: SamKirkland/FTP-Deploy-Action@v4.4.0
        with:
          server: ${{ secrets.VODIEN_FTP_HOST }}
          username: ${{ secrets.VODIEN_FTP_USER }}
          password: ${{ secrets.VODIEN_FTP_PASSWORD }}
          protocol: ftps
          port: 21
          local-dir: ./dist/
          server-dir: ${{ github.ref_name == 'main' && './' || './staging/' }}
```

- [ ] **Step 4: Run the test and confirm it passes.** Then simulate CI's clean checkout.

Run: `npx vitest run src/lib/deploy-workflow.test.ts && rm -rf .astro && npx astro sync && npm test`
Expected: all pass.

- [ ] **Step 5: Commit and push `redesign`.** This triggers the first staging deploy. `main` is untouched, so the live site isn't affected.

```bash
git add .github/workflows/deploy.yml src/lib/deploy-workflow.test.ts
git commit -m "ci: test, build and deploy to Vodien over FTPS (redesign → staging, main → live)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin redesign
gh run watch --repo Junyuquick/loft-concept-website --exit-status "$(gh run list --repo Junyuquick/loft-concept-website --branch redesign --workflow Deploy --limit 1 --json databaseId --jq '.[0].databaseId')"
```

Expected: the run succeeds. The first upload sends everything (about 250 MB), so allow 10–20 minutes; later runs send only changed files. If the FTP step fails with a TLS error, try `security: loose` on the FTP step (Vodien's certificate may be issued for the server hostname, not `ftp.loftconcept.com.sg`), record why in a comment, and re-run.

- [ ] **Step 6: Verify staging.**

Run: `BASE_URL=http://staging.loftconcept.com.sg node scripts/verify-server.mjs` (use `https://` once AutoSSL has issued)
Expected: `verify-server: OK`. Also `curl -s http://staging.loftconcept.com.sg/robots.txt` prints `Disallow: /`, and `curl -sI https://loftconcept.com.sg/ | grep -i last-modified` still shows the old site's `Thu, 21 May 2026`.

---

### Task 4: GitHub sign-in and the owner's end-to-end test on staging

**Owner actions** (Claude walks the owner through these; it can't do them itself):
1. Open `https://deploy.workers.cloudflare.com/?url=https://github.com/sveltia/sveltia-cms-auth`, sign in to Cloudflare, and deploy. Copy the Worker URL (`https://sveltia-cms-auth.<subdomain>.workers.dev`) and paste it into chat. It isn't secret.
2. At `https://github.com/settings/applications/new` (signed in as `Junyuquick`), create an OAuth app: name `Loft Concept Admin`, homepage `https://loftconcept.com.sg`, callback `<WORKER_URL>/callback`. Click **Generate a new client secret**.
3. In Cloudflare → Workers → `sveltia-cms-auth` → **Settings → Variables**, add `GITHUB_CLIENT_ID` (the Client ID), `GITHUB_CLIENT_SECRET` (the secret, with **Encrypt** clicked), and `ALLOWED_DOMAINS` = `loftconcept.com.sg, staging.loftconcept.com.sg`. Save and deploy. The secret goes only into Cloudflare, never into chat.

**Files:**
- Modify: `public/admin/config.yml` (`backend.base_url`)
- Modify: `src/lib/cms-config.test.ts`

**Interfaces:**
- Consumes: the Worker URL from the owner.
- Produces: `backend.base_url` set; a working sign-in on staging.

- [ ] **Step 1: Write the failing test.** In `src/lib/cms-config.test.ts`, inside `it('commits to the repo on the expected branch', …)`, add:

```ts
    expect(config.backend.base_url).toMatch(/^https:\/\/sveltia-cms-auth\.[a-z0-9-]+\.workers\.dev$/);
```

- [ ] **Step 2: Run it and confirm it fails.**

Run: `npx vitest run src/lib/cms-config.test.ts`
Expected: FAIL on `base_url` (`undefined`).

- [ ] **Step 3: Implement.** Add `base_url: <WORKER_URL>` under `backend:` in `public/admin/config.yml`, using the exact URL the owner pasted, with no trailing slash.

- [ ] **Step 4: Run the test, commit and push.**

```bash
npx vitest run src/lib/cms-config.test.ts
git add public/admin/config.yml src/lib/cms-config.test.ts
git commit -m "feat: GitHub sign-in for the admin via the Sveltia auth worker" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin redesign
```

Expected: tests pass; the staging deploy succeeds (`gh run watch` as in Task 3 Step 5).

Record the commit to restore after testing: `export BEFORE_ADMIN_TEST=$(git rev-parse HEAD)`. If running across sessions, note the SHA in chat instead.

- [ ] **Step 5: Owner test: add a project.** The owner opens `staging.loftconcept.com.sg/admin/`, clicks **Sign In with GitHub**, and creates a project titled `Admin Test Project`: sector Residential, a summary of at least 20 characters, a JPEG cover and main photo, two gallery photos and order `99`. Then they click **Publish**. Claude then checks:

```bash
git pull origin redesign
cat src/content/projects/admin-test-project.md
ls -la src/assets/projects/uploads/
```

Expected: the front matter has `cover: ../../assets/projects/uploads/<name>.webp` (and the same pattern for `hero` and `gallery`). The uploaded files are `.webp` with a long edge of at most 2400px; check with `sips -g pixelWidth -g pixelHeight src/assets/projects/uploads/*.webp`. After the deploy run succeeds, `http://staging.loftconcept.com.sg/portfolio/admin-test-project` returns 200 and appears in the `/portfolio` grid.

- [ ] **Step 6: Owner test: edit an existing project** (Review Focus 1). The owner opens **Bedok Road**, changes only the last word of the summary, and publishes. Claude checks:

```bash
git pull origin redesign
git diff HEAD~1 -- src/content/projects/bedok-road.md
```

Expected: the diff touches only the `summary:` line. `cover`, `hero` and all 7 `gallery` paths are unchanged. If the CMS rewrote quoting or field order, that's acceptable only if every path string is identical; if any path changed, stop and fix the config before going further.

- [ ] **Step 7: Owner test: rules hold.** In the admin, try a new project with a 5-character summary, and try uploading a `.heic` file. Expected: the form blocks publishing for the summary, and the HEIC file is refused by the picker. Discard the draft.

- [ ] **Step 8: Clean up the test data** so it never reaches live.

```bash
git pull origin redesign
git rm -r -q src/content/projects/admin-test-project.md src/assets/projects/uploads
git checkout "$BEFORE_ADMIN_TEST" -- src/content/projects/bedok-road.md
git commit -m "chore: remove admin test data" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin redesign
```

Expected: `git diff "$BEFORE_ADMIN_TEST" -- src/content src/assets` is empty, and `/portfolio/admin-test-project` returns 404 on staging after the deploy.

---

### Task 5: Go-live (only after the owner says "go")

**Owner actions before go-live:**
1. Review the whole new site at `staging.loftconcept.com.sg` and say "go".
2. Back up the current live site: cPanel → **File Manager** → select `public_html` → **Compress** (Zip) → **Download** the zip and keep it. This is the rollback.

**Files:**
- Modify: `public/admin/config.yml` (`backend.branch: main`)
- Modify: `src/lib/cms-config.test.ts` (expected branch `main`)

- [ ] **Step 1: Write the failing test.** In `src/lib/cms-config.test.ts`, change `branch: 'redesign'` to `branch: 'main'`.

Run: `npx vitest run src/lib/cms-config.test.ts`
Expected: FAIL on `branch`.

- [ ] **Step 2: Implement.** In `public/admin/config.yml`, set `branch: main`. Run the same command; expected: PASS. Commit:

```bash
git add public/admin/config.yml src/lib/cms-config.test.ts
git commit -m "feat: point the admin at main for go-live" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin redesign
```

- [ ] **Step 3: Open and merge the go-live PR.** Ask the owner for an explicit go before merging; this replaces the live site.

```bash
gh pr create --repo Junyuquick/loft-concept-website --base main --head redesign --title "Launch redesigned site with client admin" --body "$(printf 'Launches the Astro redesign and the /admin project editor.\n\nRollback: re-upload the public_html backup zip taken before merge.\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)')"
gh pr merge --repo Junyuquick/loft-concept-website --merge
```

`main` has only the initial commit and `redesign` grew from it, so the merge is clean. If GitHub reports unrelated histories, stop and ask the owner.

- [ ] **Step 4: Watch the live deploy and verify.**

```bash
gh run watch --repo Junyuquick/loft-concept-website --exit-status "$(gh run list --repo Junyuquick/loft-concept-website --branch main --workflow Deploy --limit 1 --json databaseId --jq '.[0].databaseId')"
BASE_URL=https://loftconcept.com.sg node scripts/verify-server.mjs
curl -s https://loftconcept.com.sg/robots.txt
```

Expected: the run succeeds; `verify-server: OK`, covering every page, legacy redirect, `/admin`, and http/www → https; `robots.txt` shows `Allow: /` and the sitemap line, not `Disallow`.

- [ ] **Step 5: Hand over to the client.** With the owner's confirmation, add `loftconcept` as a collaborator:

```bash
gh api -X PUT repos/Junyuquick/loft-concept-website/collaborators/loftconcept -f permission=push
```

The client accepts the email invite, then signs in at `https://loftconcept.com.sg/admin/`. Expected: `gh api repos/Junyuquick/loft-concept-website/collaborators --jq '.[].login'` lists `loftconcept` once they accept.

- [ ] **Step 6: Record it.** Under §6 of the spec, note the go-live date, the Worker URL and that the client has access. Commit:

```bash
git add docs/superpowers/specs/2026-10-04-client-project-admin-design.md
git commit -m "docs: record admin go-live" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```
