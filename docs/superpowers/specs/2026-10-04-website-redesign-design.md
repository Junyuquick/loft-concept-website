# Loft Concept website redesign: design spec

Date: 2026-10-04 · Status: draft for review

## 1. Intent

**Goal.** A quiet-luxury, editorial site where the portfolio is the hero and every page has a clear path to booking a consultation.

**Audience** (Brand Guide): homeowners and business owners aged 30-55 in Singapore. HDB and condo upgraders, landed-property owners seeking bespoke homes, and commercial clients. They value good design and reliable execution.

**Voice** (Brand Guide): confident yet warm, professional without being rigid, articulate, elegant, reassuring.

**Differentiator to lead with:** interior design and construction under one roof, since 2010.

**Decided with the owner**
- Direction: quiet luxury / editorial.
- Freedom: layout, structure and copy may all change.
- Tech: a framework is allowed. Hosting may move to Vercel, Netlify or Cloudflare.
- Motion: subtle and refined.
- Photography is of mixed quality, so the design must flatter average shots.
- The logo mark is kept and vectorized. Everything else is open.

**Success criteria (machine-checkable)**
1. Mobile Lighthouse (simulated 4G): Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95, on home, portfolio and one project page.
2. Median page transfer ≤ 1.5MB on first load, excluding the hero video stream. Today the originals total 316MB.
3. Every legacy URL resolves, directly or via a 301. Nothing the sitemap lists returns 404.
4. Every page exposes a booking call to action within one scroll of load.
5. `prefers-reduced-motion` disables all non-essential motion.
6. A new project can be added with one content file plus a folder of images, with no template edits.

## 2. Findings from the current site (audit)

| Finding | Evidence | Consequence |
|---|---|---|
| Off-brand palette and type | Site uses orange #E8731A and Barlow. The guide specifies #FFFFFF / #F5F0E6 / #B6A591 / #564739, Noah and TeX Gyre Pagella. | Re-token to the guide. Orange is removed. |
| 316MB of unoptimized originals | `du`: 94MB in 66-ceylon-road, 76MB in 15-sennett-road. Hero is an 18MB `.mov`. | Image pipeline and video re-encode are mandatory. |
| Nav and footer copy-pasted across 25 pages | Identical markup in index and every project page. | Components and layouts. |
| 19 hand-built project pages | `projects/project-*.html` | One content collection plus one template. |
| Generic patterns | Pill nav, three equal review cards, centered symmetrical sections, inline `style=` attributes, "Explore Interiors" two-up grid. | Replaced per section 4. |
| Right-click and image-drag disabled | `main.js` lines 5-6. | See open question Q1. It is hostile to normal use and does not protect images. |
| Logo is a 41KB JPEG | `assets/images/logo/` | Vectorize to SVG. |
| Form via Formspree, `_next` points to `/thankyou.html` | `contact.html` | Keep Formspree, update the redirect. |

## 3. Design system

### 3.1 Tokens (from the Brand Guide)

```
--white:  #FFFFFF   surfaces, cards, form fields
--bone:   #F5F0E6   page background
--stone:  #B6A591   rules, secondary text on dark, hover tints
--umber:  #564739   text, primary buttons, dark sections
--ink:    derived, ~#2B241D  (darkened umber, for large headings only)
```

The guide has no accent. The accent is **umber on bone** for CTAs, with stone for hairlines. Contrast check is a build gate: umber on bone must pass WCAG AA for body text. Only tinted shadows, hue-matched to umber. Dark sections, if any, use umber (not #111) so they read as the same palette.

### 3.2 Type

- **Titles and body: Noah.** It is a commercial typeface, so a web license is needed (see Q2). **Interim fallback: Figtree**, loaded behind a single `--font-sans` token so the swap is one line.
- **Accents: TeX Gyre Pagella Italic** (open license, self-hosted). It is used sparingly: pull quotes, small lead-ins, project location lines.
- Scale: fluid `clamp()` display sizes with negative tracking on large headings. Body measure ≤ 65ch. Sentence case throughout. `text-wrap: balance` on headings and `pretty` on paragraphs.
- Self-host fonts, `font-display: swap`, subset to Latin.

### 3.3 Layout and spacing

- 12-column grid, container max 1440px, side gutter `clamp(20px, 5vw, 80px)`.
- A spacing scale based on 8px, with section padding at least double today's. Whitespace is a feature.
- Asymmetry as the default: offset text columns, mixed aspect ratios, one overlap or bleed per page maximum.
- `min-height: 100dvh` for full-viewport sections, never `100vh`.

### 3.4 Surfaces

A very light fixed grain overlay (`pointer-events: none`, under 3% opacity) to avoid a sterile flat finish. The Brand Guide has a Texture page, so the final grain should be driven by it. No gradients and no heavy shadows. Radius: 0-2px on images, small on controls. No pill nav.

### 3.5 Motion (subtle and refined)

- Easing: one custom ease-out curve and one spring-like curve for press feedback, stored as tokens.
- Image reveal: a clip or opacity reveal as images enter, staggered by 60-100ms. `transform` and `opacity` only.
- Hero: slow scale or parallax of at most 4%.
- Page transitions: the browser View Transitions API (Astro `ClientRouter`), with a graceful no-op fallback.
- Hover: a link underline draws in, image hover is a 1.02 scale, buttons have a hover and a `scale(0.98)` press.
- All of it gated by `prefers-reduced-motion`.

### 3.6 Imagery rules (Brand Guide: "realism, warmth, professionalism; avoid stocky and generic")

- Each project gets a curated **cover**, a **hero**, and **3-6 selects**, with the rest in a gallery. Authoring a cover crop in the content file hides weaker frames.
- Fixed aspect ratios on grids (4:5 and 3:2) with `object-position` set per image.
- Light consistent grade via CSS only where it helps. Do not alter the photos themselves.

## 4. Information architecture and pages

```
/                     Home
/portfolio            Index, filterable
/portfolio/<slug>     19 project pages (replaces /projects/project-*.html, with 301s)
/about                Studio, design-and-build, team
/testimonials         Kept, restyled as an editorial wall
/contact              Booking
/thank-you            Confirmation (301 from /thankyou)
/404                  Branded
/privacy              Legal link in footer (content to be supplied)
```

### Home (portfolio-led)
1. **Hero:** full-bleed, muted, looping video (re-encoded, under 3MB, with poster). A short headline in Noah with one Pagella Italic phrase. A minimal wordmark header, with a "Book a consultation" text-plus-button on the right.
2. **Statement:** one paragraph on design and construction under one roof, since 2010. It replaces today's long intro and keeps the claim.
3. **Selected work:** 4 flagship projects in an asymmetric editorial layout (not equal columns), each with name, type and area. A link to the full portfolio.
4. **Residential / Commercial** split, as two large image links rather than a video card.
5. **Process:** the existing six steps as a calm numbered sequence on a sticky-left, scrolling-right layout. The copy is tightened and kept.
6. **One testimonial:** a large pull quote in Pagella Italic, with a link to the rest.
7. **Booking close:** a single confident call to action plus WhatsApp.
8. **Footer:** minimal. Nav, contact, social, privacy.

### Portfolio index
Filter chips (Residential / Commercial; property-type chips return once the owner has supplied a type for every project). A mixed-ratio grid built from each project's cover. The filter is progressive enhancement: the full list works without JavaScript.

### Project page
Hero image, then a facts strip (location, type, size, scope), a short narrative, 2-3 large images alternating with text, a gallery, then **Next project**. A booking call to action sits at the end. The Mimosa page keeps its walkthrough video. A project with few images degrades to a simpler layout rather than looking empty.

### About, Testimonials, Contact
- **About:** the design-and-build story, the studio, and the mission and vision in the guide's own words.
- **Testimonials:** editorial wall with names and project links. Replace the dots-carousel pattern.
- **Contact:** a short required group (name, phone, email), with the legacy qualification fields (property type, status, key collection, budget, preferences, discount code) kept as an optional second group; a reply promise of "shortly" until the owner commits to a time; and WhatsApp. Inline validation with plain error text. A visible focus ring.

## 5. Technical design

**Framework: Astro (static output).** Reasons: content-heavy, near-zero client JavaScript, built-in image optimization, and built-in View Transitions. Next.js was rejected as heavier than this site needs. Staying hand-written was rejected because the image weight and duplicated markup would persist.

> Note: the `redesign-skill` says "don't migrate frameworks". The owner explicitly chose to be open to one, so this spec overrides that rule, with the reasons above.

```
src/
  layouts/Base.astro            head, meta, nav, footer, transitions
  components/                   Header, MenuOverlay, Footer, ProjectCard,
                                Reveal, FilterBar, PullQuote, BookingCTA
  content/
    projects/<slug>.md          frontmatter: title, location, type, area, year?,
                                cover, hero, selects[], gallery[], order, featured
    testimonials/*.md
  pages/                        index, portfolio/index, portfolio/[slug],
                                about, testimonials, contact, thank-you, 404, privacy
  styles/                       tokens.css, base.css, type.css
  assets/                       images processed by astro:assets
public/                         fonts, favicon set, hero video, og images
```

- **Images:** `astro:assets` generates AVIF/WebP at responsive widths with `sizes`. Originals stay outside the deployed bundle. A one-off script resizes the 316MB originals to a sensible long edge (about 2400px) before they enter `src/assets`.
- **Hero video:** re-encode the 18MB `.mov` to H.264 MP4 plus WebM, about 1080p, 3MB or less, with a poster frame. The Mimosa tour gets the same treatment.
- **Hosting:** Vercel or Cloudflare Pages (static). A `redirects` file replaces `.htaccess`, covering `.html` to clean paths, `/projects/project-x` to `/portfolio/x`, and `/sitemap` to `/sitemap.xml`. If hosting stays on Apache, the same redirects are emitted as `.htaccess` rules, so both paths work.
- **SEO:** per-page title and description, canonical URLs, Open Graph images, JSON-LD (`LocalBusiness`/`HomeAndConstructionBusiness`, `ImageObject` on projects), and a generated `sitemap.xml`. Descriptive alt text is written for every project cover and hero image.
- **Accessibility:** semantic landmarks, skip link, visible focus ring, keyboard-operable menu overlay and filters, AA contrast, `lang` attribute, labelled form fields.
- **Analytics and consent:** none today. Add privacy-respecting analytics only if the owner asks (see Q5).

## 6. Delivery phases

1. **Foundations:** the Brand Guide's Texture and Logo pages, the image and video audit, and the cover/hero selection per project.
2. **Tokens and type:** `tokens.css`, fonts, the base layout, and the logo as SVG.
3. **Scaffold:** the Astro project, the content collection schema, and the redirects.
4. **Asset pipeline:** resize the images, re-encode the videos, and migrate the 19 projects to content files.
5. **Home**, then **portfolio index**, then **project template**.
6. **About, Testimonials, Contact, Thank-you, 404, Privacy.**
7. **Motion and View Transitions**, with the reduced-motion gate.
8. **SEO, structured data and accessibility pass.**
9. **QA and deploy:** Lighthouse runs, responsive screenshots (360, 768, 1280, 1920), a redirect-table test, a form test, and a keyboard-only pass.

Each phase ends with its own verification command or screenshot set. Nothing is called done without it.

## 7. Risks

| Risk | Mitigation |
|---|---|
| Noah is a commercial font | Token-isolated fallback (Figtree). The spec does not depend on the license. |
| Mixed-quality photos undermine "luxury" | Curated covers, strict aspect ratios, fewer and larger images, and a shot-list for the key spaces if the owner wants one. |
| Copy rewrite changes meaning | The owner reviews all rewritten copy. Factual claims (since 2010, design-and-build) are preserved exactly. |
| SEO loss from URL changes | 301 map, a canonical tag on each page, and a sitemap check. |
| Hosting migration | Dual redirect output (Apache and platform), and DNS cutover as a separate step. |
| Review quotes are possibly placeholders | Confirm they are real and approved for use before they are featured prominently (Q4). |

## 8. Open questions for the owner

- **Q1.** Keep or remove the right-click and image-drag blocking? Recommendation: remove it. It frustrates visitors and does not stop image copying. 
ans: remove it
- **Q2.** Is there a web license for Noah? If not, is Figtree acceptable as the interim?
ans: figtree
- **Q3.** Is the logo available as a vector (AI, SVG or PDF)? If not, I will trace the JPEG.
ans: nope
- **Q4.** Are the testimonials and client videos real and cleared for use? Do you have more?
ans: real
- **Q5.** Do you want analytics, a WhatsApp number on the site, or a privacy policy text? What is the contact number to publish? (The guide has placeholders.)
- yes analytics will be good, contact nuumber is +65 8533 7311
- **Q6.** Should I generate 2-3 visual direction mockups before the build starts?

**Decisions recorded 2026-10-04**
- Right-click and drag blocking: removed (Q1).
- Type: Figtree stays as the interim sans; no Noah web license yet (Q2).
- Logo: no vector exists; the traced `public/logo.svg` is the mark (Q3).
- Testimonials and the Jalan Lana video: real and cleared for use (Q4).
- Reply promise: "within one working day" on the contact and thank-you pages.
- Mission and vision: the Brand Guide's wording.
- Jalan Lana photos carry a third-party watermark (David Wang / PropertyGuru): the project page stays, but it is off Home. Mount Sinai Road replaces it in Selected work and as the Residential tile.
- Analytics: wanted (Q5). Provider not yet chosen; once it is, update the privacy page, which currently says no analytics cookies are used.
- Hosting and preview deploy: not yet.
