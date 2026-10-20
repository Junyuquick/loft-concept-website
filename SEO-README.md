# Loft Concept SEO log

A running record of what has been done to improve organic search (free Google results) for https://loftconcept.com.sg, and why. Updated each time SEO work is done.

## SEO in one minute

Google ranks a page by asking three questions:

1. **Can I find and read it?** (technical SEO: sitemap, robots.txt, speed, valid HTML)
2. **Does it match what people type?** (keywords: titles, headings and page text use the phrases people actually search)
3. **Do others trust it?** (backlinks, reviews, a complete Google Business Profile)

OpenSEO gives data for questions 2 and 3. The code on the site handles question 1.

## Baseline (checked 2026-10-21)

Already in the code, nothing to fix here:

| What | Where | Why it matters |
|---|---|---|
| Unique `<title>` and meta description per page | `src/layouts/Base.astro` | These are the blue link and grey snippet in Google results |
| Canonical URL | `Base.astro` | Tells Google which URL is the "real" one, so duplicates don't split ranking |
| Open Graph + Twitter card | `Base.astro` | Controls how links look when shared on WhatsApp, Facebook, etc. |
| JSON-LD schema (`HomeAndConstructionBusiness`) | `src/lib/schema.ts` | Structured data that tells Google "this is a local business" |
| Sitemap | `@astrojs/sitemap` in `astro.config.mjs` | A list of every page, so Google finds them all |
| `robots.txt` pointing at the sitemap | `public/robots.txt` | Tells crawlers what to read |
| Site is live (HTTP 200) | https://loftconcept.com.sg | |

## Google email: "Alternate page with proper canonical tag"

This is a Search Console status, not an error. It means Google found a URL whose canonical tag points at a different URL, so it indexed the canonical one and left this one out. That is the intended behaviour.

Checked on the live site (2026-10-21):

- Every page's canonical points at its clean URL (e.g. `/about`).
- `/about.html`, `/about/`, `/index.html`, `http://` and `www.` all 301-redirect to the clean URL.
- The sitemap lists only clean URLs.

So the site is set up correctly, and the flagged URLs are most likely old or variant addresses Google discovered. The email doesn't say which URLs. To confirm, open Search Console, go to Pages, then "Alternate page with proper canonical tag", and read the example URLs. Only worry if a URL that **is** in the sitemap shows up there.

## Plan

| # | Step | Status | Needs |
|---|---|---|---|
| 1 | Install OpenSEO (self-hosted, Docker) | **Done.** Running at http://localhost:3001 | |
| 2 | Connect OpenSEO to Claude Code (MCP at `http://localhost:3001/mcp`) | **Done** (restart Claude Code once to load the tools) | |
| 3 | Keyword research: find the phrases Singapore homeowners search | **First pass done** (see below). Needs your decision on which to target | |
| 4 | Competitor gap: keywords competitors rank for that we don't | Not started | Step 2 |
| 5 | OpenSEO site audit of the live site, then fix findings in code | **Done** except thin content (needs your project facts). Deploy needed | Deploy |
| 6 | Apply keywords to titles, headings, page copy, image alt text | Not started | Steps 3-5 |
| 7 | Local SEO: Google Business Profile, local schema, NAP consistency | Not started | |
| 8 | Rank tracking: record starting positions, re-check monthly | Not started | Step 3 |
| 9 | Submit sitemap in Google Search Console | Not started | Google account |

## Install notes (step 1)

- OpenSEO is a self-hosted web app. It is a front end for **DataForSEO**, a paid data provider. DataForSEO has the real keyword and ranking numbers; OpenSEO displays them and exposes them to Claude.
- DataForSEO gives $1 free credit on signup. After that the minimum top-up is $50. You pay per request, no subscription.
- Run location: `/Users/junyuquick/Documents/Coding-Projects/open-seo` (kept outside the website folder so it is never deployed with the site).
- In Docker mode there is **no login** (`AUTH_MODE=local_noauth`). Only run it on your own laptop and don't expose it to the internet.

To finish step 1 yourself:

1. Create a DataForSEO account at https://app.dataforseo.com/api-access, click "Send by email", and copy the **Base64** credentials.
2. Put it in `open-seo/.env` as `DATAFORSEO_API_KEY=<value>`.
3. Start Docker Desktop, then run `docker compose up -d` inside `open-seo`.
4. Open http://localhost:3001.

## Site audit results (2026-10-21, 27 pages crawled)

| Issue | Pages | Severity | What it means and the fix |
|---|---|---|---|
| Thin content | 23 | Warning | Portfolio and project pages have only about 90-100 words. Google has little to judge them on, so they rarely rank. Fix: add real detail per project (location type, size, brief, materials, challenge, outcome). Needs facts from you. |
| Meta description too long | 20 | Info | Descriptions run 184-227 characters, Google cuts them at about 160, so the ending (often the call to action) is lost. Fix: rewrite to 70-160 characters. |
| Heading levels skip | 3 | Info | `/portfolio` jumps heading levels (e.g. H1 to H3). Fix: step down one level at a time. Helps accessibility and clarity. |
| Canonicalized to another URL | 2 | Info | `/portfolio?sector=residential` and `?sector=commercial` point their canonical at `/portfolio`. **This is almost certainly the "Alternate page with proper canonical tag" in Google's email.** It is correct behaviour for filter URLs, so no fix is needed. |

No broken links, missing titles, duplicate titles or server errors were found.

## Fixes made (2026-10-21, built and tested locally, **not yet deployed**)

**1. Meta descriptions trimmed (20 pages).** Every description is now 160 characters or fewer, so Google shows the whole sentence.
- Project pages: added an optional `metaDescription` field in `src/content.config.ts` (limit 160, so the build fails if one runs long). Each project's `.md` file in `src/content/projects/` has a new `metaDescription:` line. `src/pages/portfolio/[slug].astro` uses it for Google and falls back to `summary`.
- Why a separate field: `summary` is also shown as visible text on the project page, so editing it would have changed your page copy.
- Homepage: rewritten in `src/pages/index.astro` to say "interior design and construction company" (matches what people search) and fit 160 characters.
- Checked: all 27 built pages have a description of 160 characters or fewer.

**2. Heading order on `/portfolio`.** The page went H1 straight to H3 (the project card titles). Cards on that page are now H2, same visual size. `ProjectCard.astro` has a new optional `headingLevel` prop; the homepage still uses H3 because its section heading is H2.

**3. Project data corrected.** Ceylon Road is landed (was tagged condo). Jalan Loyang Besar is commercial (was filed under Residential, so it also moves into the Commercial filter on `/portfolio`). The 13 projects with no type are tagged landed. Result: 16 landed, 1 condo (Leedon Green), 2 commercial. These tags drive the upcoming landed, condo and HDB pages.

**4. Back button bug (not SEO, but it hurts visitors and Google measures that).** After using a filter button on `/portfolio`, opening a project and pressing Back changed the URL but left the project on screen. Cause: the filter button called `history.replaceState(null, ...)`, which erased the position data Astro's page router keeps in `history.state`, so the router ignored the Back press. Fix: one word in `src/pages/portfolio/index.astro` (`history.state` instead of `null`). Added a regression check to `scripts/verify-browser.mjs`; it failed before the fix and passes after.

**5. Scroll jump on Back.** Pressing Back from a project returned to `/portfolio` but visibly scrolled down from the top to where you left off, which looked laggy. Cause: the site sets `scroll-behavior: smooth` on the whole page, and Astro restores your position with a plain `scrollTo()`, which that setting turns into an animated scroll. Fix: in `src/scripts/motion.ts`, smooth scrolling is switched off only while the router swaps pages, so Back lands instantly. Smooth scrolling elsewhere is unchanged. Regression check added to `scripts/verify-browser.mjs` (it failed with 914px against 3879px expected before the fix).

## Keyword research, first pass (Singapore, Google, monthly searches)

Source: OpenSEO `research_keywords` with 5 seeds. Volumes are estimates. "KD" is keyword difficulty (0-100); the low KD numbers here look optimistic, so treat them as relative, not absolute. Check real results before committing (step 4/8).

**Best fit for a firm that does landed and high-end homes:**

| Keyword | Searches | Notes |
|---|---|---|
| interior design service singapore | 4,400 | Biggest generic term. Hardest to win, but the homepage should target it |
| interior design company in singapore | 880 | Buyer looking to hire |
| interior design firms in singapore | 880 | Same intent |
| interior design services | 590 | |
| singapore condo interior design | 590 | |
| best interior design singapore | 260 | People comparing firms |
| commercial interior design singapore | 260 | CPC about $34, so advertisers value it highly |
| hdb interior design | 260 | Only if you want HDB clients |
| award winning interior design singapore | 140 | Good if you have awards |
| luxury interior design singapore | 110 | Matches your positioning |
| landed property interior design singapore | 110 | CPC about $26, meaning high-value customers |
| landed interior design singapore / landed house interior design singapore | 90 each | Small but very specific, so top 3 is realistic |
| residential interior design singapore | 90 | |

**Reading this:** A page can only rank well for one main phrase and a few close variants. A sensible mapping would be: homepage targets "interior design service/company Singapore", a landed-homes page targets the "landed" phrases, a condo page targets "condo interior design". Today the site has no page for each of these services, so that is the main gap (not yet decided).

**Skip:** jobs, courses, schools, competitor brand names and property-listing terms. They have volume but the people searching will not hire you.

## Change log

- **2026-10-21**: Corrected project tags (Ceylon landed, Loyang Besar commercial, rest landed) fixed the portfolio Back button and the scroll jump on Back (details above). 74 unit tests and 10 browser checks pass.
- **2026-10-21**: Trimmed 20 meta descriptions, fixed `/portfolio` heading order (details above). Tests (74) and build pass.
- **2026-10-21**: Installed and started OpenSEO (Docker), registered its MCP server with Claude Code, created the "Loft Concept" project (Singapore, English). Ran the site audit and a first keyword pass (results above). No website code changed yet.
- **2026-10-21**: Investigated Google's "Alternate page with proper canonical tag" email (see above): no code change needed. Estimated DataForSEO budget: about $0.04 per keyword search and $0.06 per backlink check self-hosted, so $50 lasts months.
- **2026-10-21**: Wrote this plan. Audited what the code already does (table above). Cloned OpenSEO and prepared its `.env`.
