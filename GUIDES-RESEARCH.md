# Guides research: what to write, how to write it, and how it turns into enquiries

Written 21 October 2026 for Loft Concept. This explains what I researched, what I found, how I decided what to write, and where the evidence is weak. If something here looks wrong to you, say so: you know your customers better than any article does.

## The short version

1. **Write four guides, in this order:** HDB permits and timing, landed rebuild vs renovate, condo approvals, how to choose a renovation firm.
2. **Search volume is small except for HDB.** The point of the landed, condo and "choose a firm" guides is not traffic. It is to reach people who are already close to hiring, and to earn their trust before they enquire.
3. **Trust is the real barrier in Singapore renovation.** Renovation contractors drew more consumer complaints than any other sector in 2022. The guides should reduce that fear, not just rank.
4. **Google's own rules reward what competitors skip:** first-hand experience, named sources, accuracy. Most competing guides are generic and price-heavy. Ours can be exact and sourced.
5. **No prices in the guides.** I found no solid evidence either way for renovation, so this stays your decision. The guides explain what drives cost and what a good quotation looks like instead.
6. **A correction to something I told you earlier:** Google stopped showing FAQ rich results on 7 May 2026. The FAQ markup I added to your three service pages no longer does what I said. See section 3.

## 1. What I researched and how reliable it is

| Question | Where I looked | How much to trust it |
|---|---|---|
| What does Google reward? | Google Search Central: [people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), [AI features guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [Article markup](https://developers.google.com/search/docs/appearance/structured-data/article), [FAQ markup](https://developers.google.com/search/docs/appearance/structured-data/faqpage) | **High.** Google's own words. |
| What are the actual rules? | [HDB's homeowner guide](https://www.mynicehome.gov.sg/get-settled-in/hdb-renovation-guide/), URA pages on [new landed houses](https://www.ura.gov.sg/Corporate/Guidelines/Development-Control/Planning-Permission/Plan-Lodgment-Application/New-Erection-of-Landed-House) and [additions and alterations](https://www.ura.gov.sg/Corporate/Guidelines/Development-Control/Planning-Permission/Plan-Lodgment-Application/Additions-and-Alterations-Landed-House), BCA on [condo owners](https://www1.bca.gov.sg/home-and-building-owners/condo-strata/condo-living-be-condo-savvy/what-to-know-as-a-condo-owner/) and [building plans](https://www1.bca.gov.sg/safety-and-standards/applications-and-licenses/building-plan-submission/) | **High.** Read directly from the government pages. |
| What ranks, and how are those pages built? | Live Google results through OpenSEO, then I read six top pages and counted length, headings and calls to action | **High for what I measured.** Six pages is a sample, not the whole market. |
| How many people search for each topic? | OpenSEO / DataForSEO keyword data | **Medium.** Estimates, and small numbers are unreliable. |
| What do Singapore customers worry about? | Press coverage of [CASE](https://case.org.sg) complaint data, renovation-firm advice pages | **Medium.** Figures are from 2022 and 2023, quoted second-hand. I found no 2025 figures. |
| What makes content convert? | Agency and vendor marketing blogs | **Low.** Mostly unsourced claims. I treat these as ideas to test, not facts. |

**Blogs vs official sources.** When I searched for HDB rules, the contractor blogs disagreed with each other about Saturday noisy work, the start time, and how many days' notice neighbours should get. The official HDB guide settles two of those, so I only use official wording. I will not state the neighbour-notice period, because the only place I found it was blogs that contradicted each other.

## 2. What Google says it rewards

From Google's [guidance on helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) and its [guide to AI search features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide):

- **First-hand experience.** Google asks: does the content "demonstrate first-hand expertise and a depth of knowledge"? It lists "a unique point of view" and "non-commodity content" as what AI features favour, and gives "7 Tips for First-Time Homebuyers" as an example of commodity content (common knowledge that could come from anyone).
- **Clear sourcing and a real author.** It asks whether the page shows "clear sourcing, evidence of the expertise involved, background about the author or the site".
- **Accuracy.** It asks whether the content "has any easily-verified factual errors".
- **Warnings that apply to us.** Do not write to a word count ("No, we don't [have a preferred word count]"). Do not "mainly summarize what others have to say without adding much value". Do not produce lots of content on many topics hoping some ranks. Do not change dates to look fresh.
- **Trust matters most.** Google says that of experience, expertise, authority and trust, "trust is most important".
- **AI answers (the box at the top of many results).** They rely on the same ranking systems. Google's advice is to write unique, useful content, and it says you should *not* create separate pages for every phrasing of a question to game them. Vendor blogs add tips (short direct answers near the top, question headings), but their statistics conflict and none comes from independent research, so I use these as sensible style, not as promised results.

**What this means for the guides:** each one has to say something a generic page cannot (real rules, correctly read, plus what Loft Concept sees in practice), cite where facts come from, show the date it was reviewed, and not be padded.

## 3. Correction: the FAQ markup on your service pages

I told you the FAQ and Service structured data on the three service pages "lets Google show your answers directly in results". That is out of date. Google's documentation now says the FAQ rich result feature "will no longer appear in Google Search starting May 7, 2026", and removed its documentation.

- **What still works:** the visible FAQ on each page is real, useful text. Google still reads it, and question-style headings are good practice.
- **What does not work:** the hidden FAQ markup (`FAQPage`) no longer produces a special result.
- **Harm:** none. It is just inert. The `Service` markup is unaffected.
- **My recommendation:** remove the `FAQPage` part from the service pages at some point so the code says what it does. It is low priority. I did not use `FAQPage` markup on the new guides.

## 4. What currently ranks for these topics

OpenSEO showed me the live top 10 for six phrases (Singapore, Google, 21 Oct 2026). Pattern:

| Search | Who ranks |
|---|---|
| hdb renovation permit | Small contractor blogs (9creation, Swiss Interior, Renodots), two Reddit threads, the HDB site, plus Google's AI answer and a "People also ask" box |
| hdb renovation timing | Contractor blogs (Prestige Affairs, Mega Furniture, Renovation Contractor Singapore), Reddit, Facebook, one video |
| hdb renovation guidelines | Contractor blogs, a Facebook post, a video playlist, Carousell, plus an AI answer box |
| condo renovation rules singapore | MoneySmart, contractor blogs, BCA's own page, HDB page |
| landed house rebuild singapore | Design-and-build firms (PCE Build, Sevens Build, TCA, Inplex), a directory (HomeMatch), a cost guide |

**Takeaways**
- These results are mostly **small firms' blog posts**, plus Reddit and official pages. Firms like yours can compete. A well-built guide is a realistic way in.
- For landed homes, "**rebuild vs renovate**" is the recurring winning angle (two of the top eight results use it directly, and design-and-build firms hold several other places), and design-and-build firms rank. That fits what you do.
- Cost-led pages are common (MoneySmart, Qanvast, a cost guide). You are not listing prices, so we compete on accuracy and clarity instead, not on a price table.

**How six top pages are built** (I read and measured them):

| Page | Words | Subheadings | Question headings | Cost mentions | "Contact us" style calls |
|---|---|---|---|---|---|
| HDB approval time (9creation) | ~860 | 16 | 2 | 3 | 1 |
| HDB permit list (RCS) | ~5,000 | 63 | 0 | 113 | 0 |
| Rebuild vs renovate (PCE Build) | ~2,750 | 16 | 6 | 34 | 1 |
| Design-build landed (TCA) | ~680 | 0 | 0 | 11 | 0 |
| MCST condo rules (PRDT) | ~1,750 | 12 | 1 | 22 | 6 |
| Rebuild vs renovate (Inplex) | ~790 | 12 | 1 | 9 | 0 |

Length ranges from under 700 to 5,000 words, so there is no magic number (Google says the same). **Most have almost no real call to action** (0 to 1 in four of six), no named author, and no first-hand detail. That is the gap.

## 5. How many people search (Singapore, per month)

| Topic | Searches | Verdict |
|---|---|---|
| hdb renovation permit | 880 | **Write for this.** |
| hdb renovation timing | 720 | Same guide. |
| hdb renovation guidelines | 320 | Same guide. |
| hdb renovation rules / cost / checklist / tips | 10 to 50 each | Same guide covers them. Not worth separate pages. |
| hdb renovation contractor / hdb approved renovation contractor | 480 / 390 | Service page and the "choose a firm" guide. |
| landed house renovation | 30 | Tiny. |
| rebuild landed house / landed property rebuild / landed house a&a | too small to report | Tiny, but exactly your customer. |
| condo renovation rules / approval / permit / timeline | 10 or none reported | Tiny, same reason. |

**What this changes.** Only HDB has real search volume for guide-style questions. Landed and condo guides will not bring crowds. But a person who searches "landed house rebuild" is far more likely to be a real client than someone searching "hdb renovation tips". Keyword tools also undercount long, specific questions, so small numbers are not zero. These guides exist to be found by, and to persuade, the few who are serious.

## 6. What Singapore customers worry about (and why it shapes the guides)

- Renovation contractors received the **most consumer complaints of any sector in 2022**, 1,454 cases, according to [SingSaver quoting CASE's report](https://www.singsaver.com.sg/page/blog/why-should-you-hire-casetrust-accredited-renovation-firms). It names **shoddy workmanship and delays in completion** as the two most common complaints. I tried to open CASE's own report, but its site blocked my reader, so this is second-hand. Other coverage also reported customers losing prepayments when small firms closed, which I could not confirm from the source. I could not find 2025 figures.
- CASE's reported advice to consumers is to avoid large prepayments and to negotiate a **progressive payment schedule tied to project milestones** (from press coverage of CASE; I could not open the CASE page itself). CaseTrust accreditation for renovation firms includes protection of customers' prepayments (SingSaver; [Home & Decor](https://www.homeanddecor.com.sg/design/news/singaporeans-spending-too-much-on-home-renovation-and-complaints-against-the-industry-increases) describes the deposit performance bond scheme).
- Advice pages from renovation firms and platforms repeat the same questions customers should ask: who runs the site, whether you get a dedicated contact, whether the quotation is itemised, whether payments are staged, whether you can see a finished project of your type.

**What this means for conversion.** The reader's fear is not "what is the price". It is "will this go wrong, and will I be left chasing someone?" Your single accountable team, itemised quotation (your own process page says you explain the quotation item by item) and regular updates are direct answers to that fear. So the guides lead with the reader's problem, give honest, checkable information, and then show how working with one team removes the risks. They do not hard-sell.

## 7. What makes a guide turn into enquiries, and how little is proven

The marketing sources agree on a few ideas, but they are agency blogs, so I treat them as directional:

- **Place calls to action throughout**, not only at the end: after a useful section, near proof, and at the end. Match the ask to the reader's stage: a light invitation early, a fuller one after they have seen the process and your work.
- **Link each guide to the matching service page**, with a plain next step.
- **Use proof and photos** of finished work next to the advice.
- **Expect modest conversion.** One source suggests 1% to 3% for lead-capture posts. That figure is unverified and varies by industry.

**What I could not verify, and therefore will not claim:**
- Whether hiding prices raises or lowers enquiries for renovation. The only hard data I found (HockeyStack, on B2B software) shows hidden pricing brings more form fills but fewer real sales, and it does not apply to home renovation. Home-service claims (for example "80% close rates with transparent pricing") had no checkable source. A firm that does structural and permit work faces real unknowns before it can quote, which supports not publishing a fixed number. The guides explain what shapes a quote instead.
- Whether a WhatsApp button beats a form. Vendor figures conflict and none is independent. Your site already offers both. The honest way to learn is to count chats and form enquiries over a few months.

## 8. Facts I verified from official sources (and will use)

**HDB** (from [HDB's homeowner guide](https://www.mynicehome.gov.sg/get-settled-in/hdb-renovation-guide/)):
- The flat owner is responsible for obtaining the renovation permits before works start. The contractor must be listed in HDB's **Directory of Renovation Contractors (DRC)** and can submit the application online for you. If you hack or build walls or reposition fittings, layout plans, elevations, sections or details are submitted with it.
- After approval, work should be completed within **3 months for new flats and 1 month for existing flats**.
- A **permit is needed** to remove and replace floor finishes, to raise floor levels in kitchen, balcony or bathroom, to hack or alter walls, to replace a main door on a fire escape route (half-hour fire-rated with a door closer), and to relocate doors. New doors must not go through reinforced concrete walls.
- Newly built **BTO** flats: **wait 3 years** before removing wall or floor finishes in toilets (you can overlay tiles). Glass shower screens need no permit, but the floor slab must not be tampered with. Air-conditioners need no permit if the flat's electrical load already supports them (mainly flats built after 1 Jan 1994 or upgraded flats), and must be installed by a BCA-trained installer. Windows need a BCA-approved window contractor on the DRC. **Household shelter walls must not be hacked or drilled.**
- **Hours:** general works (plastering, screeding) Monday to Saturday 9am to 6pm, not on Sundays and public holidays. **Noisy works** (demolishing walls, removing finishes) Monday to **Friday** 9am to 5pm, **not** on weekends, public holidays or the eve of major public holidays.

**Landed** (from URA, new-erection page last updated 13 July 2026, and [BCA](https://www1.bca.gov.sg/safety-and-standards/applications-and-licenses/building-plan-submission/)):
- A qualified person (a registered architect or professional engineer) must be appointed. Building plans go to BCA through the QP, after the QP obtains written URA permission. Submission is online through CORENET 2.0.
- URA's Plan Lodgment Scheme can apply to rebuilding or altering a landed house if criteria are met (for example residential zoning, not in a conservation area, Good Class Bungalow area or special control area, same housing type, within envelope control).
- **Additions and alterations are judged against thresholds:** floor area added of no more than 50% of the existing approved area, no more than 50% of external walls replaced, no more than 50% structural change to existing floor area. If the proposal cannot meet them, it must be lodged as a **new erection/reconstruction** instead. This 50% test is a genuinely useful way to explain "renovate or rebuild".
- Where a rebuild keeps parts of an old non-compliant house, at least 25% of the existing floor plate must be retained, with a professional engineer's certification.
- URA: alterations or additions generally need planning permission if they increase gross floor area.

**Condo** (from [BCA](https://www1.bca.gov.sg/home-and-building-owners/condo-strata/condo-living-be-condo-savvy/what-to-know-as-a-condo-owner/)):
- Unit owners are part of the Management Corporation (MCST) and must follow its by-laws.
- **Structural elements (slabs, beams, columns, walls) cannot be altered** without assessment by a professional engineer and approval from the Commissioner of Building Control.
- Check restrictions with the developer or MCST and the Sale and Purchase agreement before any work.
- Alterations to external features (windows, walls) need MCST approval and any relevant agency approvals. Work that increases the estate's total floor area (for example roofing a private enclosed space) needs a **90% resolution** of the MCST.
- **Defects Liability Period:** for new units, report defects within it so the developer fixes them. After that, you are responsible.

**Facts I will not state, because I could only find them in blogs that disagree:** security deposit amounts and exact working hours for condos (they depend on your MCST), how many days' notice neighbours must get, how long HDB or URA approvals take, and any cost figures.

## 9. My analysis: what to write and why

| # | Guide | Why | Main phrases | Expect |
|---|---|---|---|---|
| 1 | **HDB renovation permits and timing** | Only topic with real demand (880 + 720 + 320). Competing pages are mostly thin firm blogs. Official rules are clear, so ours can be exact. You are HDB-registered. | hdb renovation permit, hdb renovation timing, hdb renovation guidelines | Most traffic. Leads here are lower budget and further from deciding, so the guide funnels to the HDB service page and consultation. |
| 2 | **Rebuild or renovate your landed home?** | The recurring winning angle for landed. The URA 50% test gives a real, checkable answer that generic posts lack. It is your specialty. | landed house rebuild, rebuild vs renovate, landed a&a | Little traffic, high-value readers. |
| 3 | **Condo renovation: approvals, rules and planning** | Official BCA facts on structural limits and the 90% rule are valuable. Low volume, high intent. | condo renovation rules, condo renovation approval | Little traffic, serious readers. |
| 4 | **How to choose a renovation firm: what to ask before you sign** | Directly answers the top Singapore fear (complaints about delays, workmanship and upfront payments). Strongest trust-builder, and it explains why one accountable team matters. More crowded search. | how to choose an interior designer / renovation firm singapore | Converts better than it ranks. |

**What I deliberately left out:** separate pages for every phrasing (Google warns against this), cost guides (you do not publish prices, and the topic is crowded), "10 design ideas" pieces (commodity content with no edge for you), and anything I cannot support from an official source.

**Structure every guide will follow**
1. **A direct answer at the top.** Two to four sentences answering the question, so a reader or an AI answer box gets it at once.
2. **Question-style headings** that match how people search.
3. **Official facts, linked to the source,** with the date we last reviewed them. A short sources list at the end.
4. **A section on what we see in practice,** written from Loft Concept's experience, kept to what you have told me (see the questions below).
5. **Three calls to action, each different:** a light "tell us about your home" after the first useful section, a more specific one after the main section, and the full booking section at the end. Each links to the matching service page. WhatsApp is always offered, since it is how people in Singapore often prefer to reach a firm, though I could not prove it converts better.
6. **No prices, no promises we cannot keep,** and a plain note that rules change and homeowners should confirm with HDB, URA, BCA or their MCST.
7. **Real photos of your work** with proper descriptions.

**What each reader should feel at the end:** "these people know the rules, they are straight with me, and one team will deal with all of it. I should message them."

## 10. What I need from you to make them better than good

Google rewards first-hand experience, and I only know what you have told me. I will build all four guides now using verified facts plus what you have said (design and build under one roof, 100+ projects, teardown to rebuild, pools and lifts, HDB-registered, as short as one month, 12 months or more for major structural landed work). The "what we see in practice" parts will be careful and general. To make them truly yours, answer any of these and I will work them in:

1. What are the **three most common mistakes** you see homeowners make before they call you?
2. For landed homes, what usually **tips owners toward rebuilding** instead of renovating?
3. What **surprises** come up most often on site (hidden structural issues, approval delays)?
4. Are you **CaseTrust accredited**, or a member of an industry body? I will only mention it if true.
5. How do you handle **payments**? (For example progress payments tied to milestones.) I will not claim this unless you confirm it.
6. Do you want a **named author or reviewer** on the guides (for example the founder or lead designer), with a photo? Google asks about "background about the author". Anonymous "Loft Concept" works, but a name is stronger.
7. Is your first consultation **free**? I will not say it is unless you tell me.

Anything I write that is not from an official source or from you will be marked in the guide's source file so you can check it before it goes live.

## Sources

Google: [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) · [Guide to optimizing for generative AI features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) · [Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article) · [FAQ rich result deprecation notice](https://developers.google.com/search/docs/appearance/structured-data/faqpage) · [Featured snippets](https://developers.google.com/search/docs/appearance/featured-snippets)

Government: [HDB: How to renovate your flat](https://www.mynicehome.gov.sg/get-settled-in/hdb-renovation-guide/) · [URA: New erection of landed house](https://www.ura.gov.sg/Corporate/Guidelines/Development-Control/Planning-Permission/Plan-Lodgment-Application/New-Erection-of-Landed-House) · [URA: Additions and alterations to a landed house](https://www.ura.gov.sg/Corporate/Guidelines/Development-Control/Planning-Permission/Plan-Lodgment-Application/Additions-and-Alterations-Landed-House) · [URA: Renovating private residential property](https://www.ura.gov.sg/Corporate/Property/Residential/Renovating-private-residential-property) · [BCA: What to know as a condo owner](https://www1.bca.gov.sg/home-and-building-owners/condo-strata/condo-living-be-condo-savvy/what-to-know-as-a-condo-owner/) · [BCA: Building plan submission](https://www1.bca.gov.sg/safety-and-standards/applications-and-licenses/building-plan-submission/)

Consumer protection and market: [Home & Decor on renovation complaints and the CaseTrust deposit bond](https://www.homeanddecor.com.sg/design/news/singaporeans-spending-too-much-on-home-renovation-and-complaints-against-the-industry-increases) · [SingSaver on CaseTrust renovation firms](https://www.singsaver.com.sg/page/blog/why-should-you-hire-casetrust-accredited-renovation-firms) · [HockeyStack: pricing, demo and case study pages](https://www.hockeystack.com/lab-blog-posts/state-of-pricing-demo-case-study-pages) (B2B software only)

Competitor pages read for structure: [9creation](https://9creation.com.sg/how-long-does-hdb-take-to-approve-renovation/) · [Renovation Contractor Singapore](https://renovationcontractorsingapore.com/blogs/news/hdb-renovation-permit-complete-guide-2025) · [PCE Build](https://www.pcebuild.com/blog/landed-property-rebuild-vs-renovation-which-is-the-better-option/) · [TCA Design Build](https://tcadesignbuild.com/blog/f/your-guide-to-design-building-your-landed-property-in-singapore) · [PRDT](https://www.prdt.com.sg/blog/mcst-condo-renovation-rules-singapore/) · [Inplex](https://inplex.net/community/rebuild-vs-renovate-for-landed-property/)

Search volumes, rankings and competitor results: OpenSEO (DataForSEO), Singapore, Google, 21 October 2026.
