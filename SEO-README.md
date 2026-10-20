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

**6. Three new service pages** (built and tested locally, **not yet deployed**). These give Google a page for each of the phrases people search, instead of everything competing on the homepage.

| Page | Targets | Source of truth |
|---|---|---|
| `/landed-interior-design` | landed property / landed house interior design Singapore | `src/lib/services.ts` |
| `/condo-interior-design` | condo / condominium interior design Singapore (about 590 searches a month) | same |
| `/hdb-interior-design` | HDB interior design / renovation (about 260 plus 880 for permits) | same |

How it works: the copy for all three lives in `src/lib/services.ts`; one template, `src/pages/[service].astro`, renders them, so they look identical to each other and to the rest of the site (same tokens, `Photo`, `ProjectCard`, `BookingCTA`). Each has its own title and 160-character description, a "what we take care of" section, a timeline, projects (from the project `propertyType` tags), and an FAQ.

Why each part matters:
- **Own URL and own title per property type:** Google matches a search to the page most clearly about it.
- **FAQ and Service structured data (JSON-LD):** lets Google show your answers directly in results, and tells it exactly what service you offer and where.
- **Internal links:** the footer, which appears on every page, links to all three, so visitors and Google can find them. They are also in the sitemap automatically.
- **No prices anywhere,** by design, and a unit test fails if one is ever added. The cost question is answered with an invitation to message you.

Facts used came only from you: founded 2010, 100+ projects (not yet shown on the pages), HDB-registered, as short as one month for renovations, 12+ months for major structural landed work, full-process design and build including teardown, pools and lifts. The HDB page shows an interior photo, not a landed exterior, because you do not list HDB photos.

**7. Descriptive photo descriptions (alt text).** All 154 images on the project pages now have a specific one-sentence description, such as "Walnut kitchen island with wine cubbies, stainless steel appliances and a crystal pendant light". Google reads these (it is how photos appear in Google Images), and screen readers read them to blind visitors. Main/cover photos use the existing `heroAlt` and `coverAlt` fields. Gallery photos use a new `galleryAlts` list in each project file, in the same order as `gallery`; I added the field to `src/content.config.ts`, the admin editor (`public/admin/config.yml`, label "Gallery photo descriptions") and `src/pages/portfolio/[slug].astro` (falls back to "Title, view N" when a description is missing, so a new project added in the admin still works). Written from the photos only: no client names, no house numbers.

**8. HDB page photo changed** to the Mount Sinai Road kitchen (an interior with no people in it). The previous one showed a person in a mirror reflection.

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

## Google Search Console: step by step (you do this, about 15 minutes)

Search Console is Google's free dashboard for your site. It is where Google tells you what it indexed, what it did not, and which searches brought people to you. Do it now, not at the end: Google takes days to weeks to crawl, so starting early saves time.

1. **Open it:** go to https://search.google.com/search-console and sign in with the Google account that owns the business.
2. **Check your site is added.** If `loftconcept.com.sg` is already listed (it must be, since Google emailed you), click it. If not: Add property, choose **Domain**, enter `loftconcept.com.sg`, and follow the DNS verification steps.
3. **Confirm the sitemap.** Left menu, **Sitemaps**. You should see `sitemap-index.xml` with status "Success". If it is missing, type `sitemap-index.xml` in "Add a new sitemap" and Submit.
4. **After the new pages deploy, ask Google to look at them.** Click the search bar at the top, paste `https://loftconcept.com.sg/landed-interior-design` and press Enter. When it says "URL is not on Google", click **Request indexing**. Repeat for `/condo-interior-design` and `/hdb-interior-design`. This is the fastest way to get them seen.
5. **Look at the email's warning.** Left menu, **Pages**. Scroll to "Why pages aren't indexed" and click **Alternate page with proper canonical tag**. Click a few of the example URLs. Expected: addresses with `?sector=`, `.html`, a trailing `/`, `http://` or `www.`. That is normal. **If a URL that is in your sitemap appears there, tell me.**
6. **Look at the other reasons too.** In the same list, anything saying "Crawled - currently not indexed" or "Discovered - currently not indexed" on project pages is the thin-content issue, not a bug.
7. **Check back weekly.** Left menu, **Performance**. It shows which searches show your site and how many clicks you get. Once there is data (usually after 1-2 weeks), send me a screenshot or the top queries and I will turn them into actions.

You do not need to do anything with Google Analytics for this.

## Later tasks

- [x] **More descriptive photo descriptions (alt text). Done 2026-10-21, see fix 7.** Alt text is the written description of a picture. Google reads it (it is how images rank in Google Images), and screen readers read it to blind visitors. Right now every project photo has a generic description such as "Bedok Road, residential interior by Loft Concept" or "Bedok Road, view 3".
  - Replace them with a specific, plain description of what is in the photo, e.g. "Double-height kitchen with dark walnut millwork and a crystal chandelier". Keep it factual, one sentence, about 8-16 words.
  - Do **not** include client names, house numbers or anything sensitive. Street names already on the site are fine.
  - Where they live: `coverAlt` and `heroAlt` are fields in each project file in `src/content/projects/`. Gallery photos have no field yet: they are auto-labelled "view N" in `src/pages/portfolio/[slug].astro`, so this needs a new `galleryAlts` list added to `src/content.config.ts`, `public/admin/config.yml` and the page template, plus a test.
  - 19 projects, about 6-8 photos each. I can draft all of them by looking at each photo; you review the wording.
- [ ] **Add "100+ projects" to the service pages** if you want it shown.
- [x] **Competitor gap and rank tracking: done 2026-10-21, see "OpenSEO research results".** use OpenSEO to see what competitors rank for, then set up rank tracking for the target keywords.
- [x] **Re-check the site audit (done 2026-10-21: 48 issues down to 25, only thin content and filter URLs remain).** with OpenSEO once the new pages are live and indexed.

## OpenSEO research results (2026-10-21)

Market: Singapore, Google, English. Data from DataForSEO through OpenSEO. Volumes are monthly searches. "KD" is difficulty, and the low numbers look optimistic, so treat them as relative.

**Phrases worth targeting, and where they live on the site**

| Phrase | Searches | Page |
|---|---|---|
| interior design service singapore | 4,400 | homepage |
| renovation contractor singapore | 1,600 | HDB page (we are HDB-registered) |
| hdb renovation permit | 880 | HDB page FAQ (informational, a good way in) |
| interior design company in singapore / interior design firms in singapore / interior designer singapore | 880 each | homepage |
| hdb renovation | 720 | HDB page |
| singapore condo interior design | 590 | condo page |
| hdb renovation contractor | 480 | HDB page |
| hdb registered renovation contractor | 390 | HDB page |
| best interior design singapore / condominium interior design singapore / hdb interior design | 260 each | homepage / condo / HDB |
| award winning interior design singapore | 140 | homepage (only if you have awards) |
| design and build singapore | 110 | homepage / about |
| landed property interior design singapore / luxury interior design singapore | 110 each | landed page / homepage |
| landed house interior design singapore / landed interior design singapore | 90 each | landed page |

Teardown and rebuild phrases ("rebuild house singapore", "landed house rebuild") have almost no search volume. Customers do not search for them, so describe that specialty on the landed page but do not expect search traffic from it.

**Who ranks today.** Qanvast, Homevera, Flo Design, The Interior Lab and MyDesign appear most across your phrases. A large share of results are not firms at all: directories and publications (Qanvast, Houzz, Tatler, The Honeycombers, HomeTrust), listicles ("10 best HDB renovation contractors") and Reddit. For "interior design company in singapore" and "singapore condo interior design", Google shows a **map pack of three local businesses** above the normal results (SG Interior Design, Casa, The Alchemists; Flo Design, HOFT, Key Concept). Landed searches show a mix of firm service pages and long guides ("landed house interior design ideas, costs and tips").

**Where you start.** The audit shows 5 keywords ranking, all minor (street names from the old site). The backlink data shows none. **Baseline rank check (2026-10-21, live Google, top 40, Singapore, mobile).** I checked all 22 phrases below directly. Your site is in the top 40 for exactly one of them: "loft concept singapore" at position 5 (the contact page). Every other phrase, including "loft concept" alone, "interior design service singapore", all landed, condo and HDB phrases, shows **not in top 40**. This is the "before" picture to compare against. Google's listing for your contact page still shows text from the old site, so Google has not re-crawled yet.

Re-run the same check monthly. In OpenSEO there is also a rank tracker with these 22 phrases (project "Loft Concept"), but its first run got stuck on "running" and never stored positions, and a restart did not clear it. Until that is sorted out, ask Claude to run the live lookup instead (a few cents; I did not record the exact charge).

**What this means we should do next (in order of likely payoff)**
1. **Google Business Profile.** The map pack decides "company" and "condo" searches. Complete every field, pick the right categories, add photos, and ask finished clients for reviews.
2. **Get listed where Google already looks.** Qanvast, Houzz, HomeTrust and the HDB renovation contractor directory all rank for your phrases, and a listing is also a backlink. Being named in "best HDB renovation contractors" articles (Epos, Women's Weekly style) is the same idea.
3. **Guides.** Landed and condo searches reward long guides as well as service pages. One well-written guide per property type (renovation process, approvals, timeline, no prices) would compete for those results.
4. **Re-run the rank tracker monthly** (manual runs cost about $0.29). Compare against this baseline.

## Change log

- **2026-10-21**: Ran OpenSEO research (keyword demand, competitor and SERP review, rank tracker baseline, re-audit), wrote descriptive alt text for all project photos, and swapped the HDB page photo.
- **2026-10-21**: Added the landed, condo and HDB service pages with FAQ schema and internal links (details above). 79 unit tests pass.
- **2026-10-21**: Corrected project tags (Ceylon landed, Loyang Besar commercial, rest landed) fixed the portfolio Back button and the scroll jump on Back (details above). 74 unit tests and 10 browser checks pass.
- **2026-10-21**: Trimmed 20 meta descriptions, fixed `/portfolio` heading order (details above). Tests (74) and build pass.
- **2026-10-21**: Installed and started OpenSEO (Docker), registered its MCP server with Claude Code, created the "Loft Concept" project (Singapore, English). Ran the site audit and a first keyword pass (results above). No website code changed yet.
- **2026-10-21**: Investigated Google's "Alternate page with proper canonical tag" email (see above): no code change needed. Estimated DataForSEO budget: about $0.04 per keyword search and $0.06 per backlink check self-hosted, so $50 lasts months.
- **2026-10-21**: Wrote this plan. Audited what the code already does (table above). Cloned OpenSEO and prepared its `.env`.
