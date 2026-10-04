# Client project admin: design spec

Date: 2026-10-04 · Status: draft for review

## 1. Intent

**Goal.** The client (Loft Concept, non-technical) can add new portfolio projects and edit existing ones from a web page, without a developer, and see the change on the live site.

**Decided with the owner**
- A separate private admin page at `loftconcept.com.sg/admin`, not inline editing on the public pages.
- The site stays static. A change goes live about 2-3 minutes after Publish (rebuild and upload). Instant publishing was considered and rejected: it needs a server, a database or hosted CMS, and likely a move off Vodien.
- Hosting stays on Vodien (cPanel, Apache).
- The client signs in with their own free GitHub account, added as a collaborator on the repo.
- Photos: a ~2400px master copy lives in the GitHub repo; only the optimised AVIF/WebP output goes to Vodien. Repo growth (~3-5MB per project) is acceptable; GitHub's 100MB limit is per file, and the repo stays well under the 1GB guidance for years.

**Success criteria (machine-checkable)**
1. A Vitest test proves every field and enum value in `public/admin/config.yml` matches the `projects` schema in `src/content.config.ts`, and fails if either drifts.
2. In local-repository mode, creating a project and editing an existing one through `/admin` produces files that pass `npm run build` and `npm run verify:build`, and the new project appears at `/portfolio/<slug>`.
3. `GET /admin/` returns 200, `GET /admin` returns 301 to `/admin/`, and `/admin` is absent from the sitemap and carries `noindex` (checked by `verify:build` and `verify:server`).
4. A push to `main` runs the GitHub Action: tests, build, `verify:build`, then upload to Vodien. A failing step uploads nothing.

**Out of scope:** testimonials editing, inline/visual editing, instant publishing, an external image service.

## 2. Architecture

```
Client browser ──▶ loftconcept.com.sg/admin  (Sveltia CMS, static files)
      │  "Sign in with GitHub"
      ▼
Cloudflare Worker (sveltia-cms-auth) ◀──▶ GitHub OAuth app
      │  token
      ▼
GitHub repo Junyuquick/loft-concept-website  ── commit on Publish ──▶ main
      │  push event
      ▼
GitHub Action: npm ci → test → build → verify:build → FTPS upload of dist/
      ▼
Vodien public_html  (live site)
```

Each unit has one job: the admin edits files, GitHub stores them, the Action builds and deploys, Vodien serves.

## 3. Components

### 3.1 Admin page
- `public/admin/index.html`: loads Sveltia CMS from its CDN and sets `<meta name="robots" content="noindex">`.
- `public/admin/config.yml`:
  - `backend`: `github`, repo `Junyuquick/loft-concept-website`, branch `main`, `base_url` = the Cloudflare Worker URL.
  - One collection, `projects`, with `folder: src/content/projects`, `extension: md`, `format: frontmatter`, `create: true`, `delete: true`, slug from title (`{{slug}}`).
  - Collection list sorted by `order`, showing title and sector.
- Fields map one to one onto the Zod schema:

| Schema field | Widget | Required |
|---|---|---|
| title | string | yes |
| sector | select: residential, commercial | yes |
| propertyType | select: hdb, condo, landed, commercial | no |
| location, area, scope | string | no |
| year | number (integer) | no |
| summary | text, min length 20 | yes |
| cover, hero | image | yes |
| coverAlt, heroAlt | string | no |
| coverPosition | string, default `50% 50%` | no |
| gallery | image, `multiple: true` (reorderable) | no (default empty) |
| video | string | no |
| featured | boolean, default false | no |
| order | number (integer) | yes |

Each field gets a plain-English hint (for example, "Lower numbers appear first in the portfolio").

### 3.2 Photos
- Uploads go to one shared folder, `src/assets/projects/uploads/`, referenced from Markdown as `../../assets/projects/uploads/<file>` so Astro's `image()` resolves and optimises them like existing photos. Decided: Sveltia only gives per-entry media folders when each entry is its own folder (`path: '{{slug}}/index'`), which would mean moving all 19 projects and changing their Astro ids. A shared folder needs no migration and makes no visible difference on the site.
- Sveltia's built-in transformation shrinks uploads before commit: `media_libraries.default.config.transformations.raster_image` with `format: webp`, `quality: 85`, `width: 2400`, `height: 2400`.
- Existing photos in `src/assets/projects/<slug>/` are untouched and stay editable.

### 3.3 Login
- A GitHub OAuth app (callback to the Worker).
- The open-source `sveltia-cms-auth` Worker deployed on a free Cloudflare account, holding the OAuth client ID and secret.
- The client's GitHub account is added to the repo as a collaborator with write access.

### 3.4 Apache routing for `/admin`
`renderApache` in `src/lib/redirects.mjs` sets `DirectorySlash Off`, so `/admin` would not reach `admin/index.html`, and relative asset paths need the trailing slash. Add `RewriteRule ^admin$ /admin/ [R=301,L]` before the generic rules (and the equivalent `/admin /admin/ 301` line in `_redirects`), with a unit test in `src/lib/redirects.test.ts`. Confirm `/admin/` is not caught by the `^(.+)/$` rule (it isn't, since no `admin.html` exists).

### 3.5 Deploy
- `.github/workflows/deploy.yml`, on push to `main` and manual dispatch:
  1. checkout, Node LTS, `npm ci`
  2. `npm test`, `npm run build`, `npm run verify:build`
  3. upload `dist/` to Vodien with an FTP deploy action over FTPS, syncing only changed files.
- Secrets: `VODIEN_FTP_HOST`, `VODIEN_FTP_USER`, `VODIEN_FTP_PASSWORD`, `VODIEN_FTP_DIR`.
- `concurrency` group so two quick publishes don't upload at the same time; the later one wins.
- First run targets a staging folder on Vodien, then switches to `public_html`.

## 4. Error handling
- The admin form enforces required fields and the summary length, so most mistakes are blocked before publishing.
- Anything that slips through fails the Zod schema at build time. The Action stops before upload, the live site keeps its previous version, and GitHub emails the repo owner.
- A bad edit is undone by reverting the commit in GitHub (or re-editing in the admin).

## 5. Testing
- `src/lib/cms-config.test.ts`: parse `public/admin/config.yml` and compare fields, required flags and enum values to the schema (success criterion 1).
- `src/lib/redirects.test.ts`: `/admin` redirect in both Apache and Cloudflare output.
- `scripts/verify-build.mjs`: `dist/admin/index.html` exists with `noindex`; sitemap excludes `/admin`.
- `scripts/verify-server.mjs`: `/admin` → 301 `/admin/`, `/admin/` → 200.
- Manual, local: Sveltia "Work with Local Repository" in Chrome; add a test project with photos, edit an existing one, build, check both pages, then discard the test changes.

## 6. Setup the owner provides
- Vodien FTP/FTPS host, username, password and target directory.
- A free Cloudflare account for the auth Worker.
- The client's GitHub username.

## 7. Risks
| Risk | Mitigation |
|---|---|
| Client uploads huge phone photos | Upload transformation caps at 2400px WebP. |
| Repo grows over years | ~3-5MB per project; revisit an external image service near 1GB. |
| Config and schema drift apart | Drift test in CI fails the deploy. |
| Vodien FTP credentials leak | Stored only as GitHub secrets; use a dedicated FTP account scoped to the site folder. |
| Client deletes a project by accident | Every change is a Git commit and can be reverted. |
