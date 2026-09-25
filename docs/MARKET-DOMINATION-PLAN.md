# Signet — Market Domination Plan

**Date:** 2026-07-02
**Status:** Extends `MASTER-PLAN.md` (which stays operative). This doc adds the 2026-07-02 market research findings, the product-quality bar required to win, and the marketing sequence. **Every MASTER-PLAN gate still holds — nothing here licenses building ahead of signal.**

---

## 1. Research findings (2026-07-02, fresh web verification)

### Market
- Email signature software: ~$0.5–1B today, growing 12–25% CAGR depending on report. Real, growing, crowded.
- Money concentrates in **teams** (recurring management), not solo users (one-time job, dominated by free tools: HubSpot, Canva, WiseStamp free tier, Gmail native).

### Competitive pricing (verified)
| Competitor | Pricing | Segment | Weakness |
|---|---|---|---|
| WiseStamp | $19–189/mo platform fee **+ $1/user/mo** | SMB→mid-market | Platform fee irrational for 5–20 seat teams; template/admin setup feel |
| Exclaimer / CodeTwo | Enterprise quotes | Enterprise M365 | Ignores small teams entirely |
| SyncSignature | **$2/user/mo flat, no platform fee** | Small teams | **Closest threat.** Still upload-your-logo, no URL extraction |
| MySignature | ~$4–6/mo solo | Individuals | Solo-only, manual entry |
| HubSpot / Canva | Free | Everyone | Template pickers, no brand automation, no team mgmt |

### The gap (verified today)
**Nobody in top search results does paste-URL → extracted brand → signature.** The wedge is real. But it is a *wedge, not a moat* — Brandfetch commoditizes extraction and SyncSignature could copy it in a quarter. The durable gap is **the 5–50 seat team WiseStamp's platform fee prices out and Exclaimer ignores** — exactly where SyncSignature is attacking at $2/seat.

### ICP (decided)
- **Primary (revenue):** founder / head of marketing / office manager at a 5–50 person company that recently launched or rebranded. Buying trigger: "told the team three times to update signatures; half haven't."
- **Secondary (multiplier):** agencies managing many client brands — one buyer, N brand kits.
- **Solo users:** free acquisition + "Made with Signet" footer flywheel. Do not spend marketing effort converting them; their willingness to pay is ~$0 against free HubSpot.

### Pricing (decided, post-validation)
| Tier | Price | Note |
|---|---|---|
| Free | $0 forever | Magic moment + footer flywheel |
| Pro solo | $49 one-time (test $29 if weak) | Job done once; avoids month-2 churn |
| Team | **$3–4/seat/mo, no platform fee, ~$15/mo min** | 10-seat math: WiseStamp ≈$29, SyncSignature $20 — $8/seat was 4x the floor and would not convert |
| Concierge | $99 one-time team setup | The real willingness-to-pay experiment (MASTER-PLAN Phase 3) |

### Will people pay? (conclusion)
Yes — teams, not solos. But this is answered by the Phase 0 outreach batch + $99 concierge offer, not by more analysis. 10 paid setups or $1K = build; zero = pivot to agency wedge.

---

## 2. What "dominate" means (realistic)

Not out-featuring Exclaimer. **Own one segment and one phrase:**
- Segment: 5–50 seat teams + agencies.
- Phrase: *"Paste your URL. Brand every email."* — become the answer to "email signature from website."
- Financial shape: $1M ARR ≈ ~2,500 teams at ~$33/mo average. That is niche domination in a $1B market and a real business for a solo founder.

---

## 3. Product qualities required to win (the moat stack, in order)

Extraction alone is copyable. The moat is the **stack** — each layer alone is weak; together they compound:

| # | Quality | Bar | Beats | Status |
|---|---|---|---|---|
| 1 | **Instant magic** | URL → signature <10s, no signup, no template picker | Everyone's onboarding | ✅ built |
| 2 | **Extraction accuracy** | ≥90% brand-match approval (logo ~90% now, color ~50% → must hit 90%) | Manual hex-code entry everywhere else | 🔶 Phase 1 |
| 3 | **Email-safe rendering** | Pixel-correct in Gmail, Outlook (incl. desktop), Apple Mail; raster logos; table HTML | The #1 complaint in every competitor's reviews | ✅ core, needs client QA matrix |
| 4 | **Team generation** | One URL + CSV → N correct signatures instantly | WiseStamp's admin setup ritual | 🔶 Phase 2 (fake team, no backend) |
| 5 | **Deployment** | Google Workspace push-to-Gmail (export-first, then API) | SyncSignature's install friction; this is the lock-in | ⛔ Phase 4 only, after paid signal |
| 6 | **Consistency over time** | Rebrand detection (re-scrape site, diff kit), new-hire flow, campaign banners | Converts one-time job → subscription; the retention engine | ⛔ Phase 4 |
| 7 | **Agency workspaces** | Multiple client kits, shareable preview links | Nobody serves "agency managing 12 client brands" well | ⛔ Phase 4 |
| 8 | **Taste** | Editorial, zero-radius, no-clip-art output (DESIGN.md system) | The generic-template look of the whole category | ✅ identity, keep enforcing |

**Anti-qualities — do not build:** SSO/SOC2/enterprise, Microsoft 365 first, analytics dashboards, template galleries, dark mode. Each drags toward incumbents' turf.

---

## 4. Marketing strategy — one channel mastered at a time

Sequence, don't sprawl. Each wave starts only when the prior one is working (or measurably dead).

### Wave 1 — Cold outreach (NOW, $0)
The unfair advantage: `scripts/outreach.ts` puts the prospect's **own brand rendered as a signature** in their inbox before they ever visit. The magic moment is the pitch.
- Send the 100-email batch (57 YC founders sourced; top off from Product Hunt launches).
- Score against the MASTER-PLAN scorecard (reply ≥5%, copy-intent ≥15% = Promising).
- Every interested reply → 15-min call → segment "just me" vs "my team of X" → offer $99 concierge to teams.

### Wave 2 — Launch spikes (after first paying customer)
- Product Hunt launch with 9-second paste-URL GIF (launch kit exists: `docs/superpowers/2026-06-30-launch-kit.md`).
- Show HN post (already drafted).
- Twitter/X screen recordings; #buildinpublic revenue posts.
- Purpose: spike + backlinks + waitlist. A launch is one day, not a strategy.

### Wave 3 — Compounding organic (after PMF signal, months 2–6)
- **Footer flywheel:** every free signature carries "Made with Signet" → the product markets itself in every email sent. This is the only honest viral loop the product has; protect it.
- **Programmatic SEO:** "email signature for Gmail/Outlook/Apple Mail", "[industry] email signature", and — highest intent — **comparison pages:** "WiseStamp alternative", "SyncSignature vs Signet", "Exclaimer for small teams". Competitors rank on these against each other; the segment actively shops.
- **G2/Capterra presence** + mining WiseStamp 1–3★ reviewers for direct outreach.
- **AppSumo LTD** ($49) if cash/reviews needed — validates one-time pricing, brings 500 reviewers.

### Wave 4 — Distribution partnerships (after $10K MRR-ish)
- **Google Workspace Marketplace listing** (once Phase 4 push-to-Gmail exists) — where team buyers already search.
- **Agency channel:** white-label / client-pack pricing; agencies resell to every client they rebrand.
- Affiliate program for productivity/branding newsletters.

### What NOT to do
- No paid ads before organic converts (paying to learn the product doesn't convert).
- No Discord/community (ghost town risk; no user-to-user value yet).
- No TikTok/Instagram (B2B buyer isn't there).
- No enterprise sales motion (product isn't enterprise-ready; deals will die on SSO/SOC2).

---

## 5. The phased plan (gates from MASTER-PLAN, extended)

| Phase | Work | Gate to next |
|---|---|---|
| **0. Validate** (this week) | Send 100 outreach emails; QA copy/export in Gmail/Outlook/Apple Mail; track scorecard | Reply ≥5% AND copy-intent ≥15% |
| **1. Extraction moat** (if brand-match <70%) | Color accuracy 50%→90%; durable KV cache; confidence UI | Brand-match ≥70% on fresh batch |
| **2. Fake team** (if team interest ≥ Promising) | CSV/manual rows → N signatures client-side; no DB | ≥5 teams ask "for my team?" |
| **3. First money** | $99 concierge setup, one Stripe payment link, fulfil manually, document every step | **10 paid setups OR $1K revenue** |
| **4. Productize team** | Persistence, Team plan **$3–4/seat/mo no platform fee**, agency workspaces, Google Workspace push | Retention: teams still active month 3 |
| **5. Dominate the niche** | Wave 3+4 marketing at full tilt; comparison-page SEO; Workspace Marketplace; agency channel; rebrand-detection retention | $1M ARR ≈ 2,500 teams |

**Failure branch:** Phase 3 gate missed → pivot to the agency/client-pack wedge before abandoning; agencies feel the multi-brand pain harder than any single team.

---

## 6. Risks

1. **SyncSignature ships "paste your URL" first.** They move fast and price at the floor. Mitigation: win the phrase publicly now (launch, SEO, footer) so the feature is associated with Signet before they copy it.
2. **Gemini dependency** — extraction quality is the whole promise. Mitigation: Phase 1 deterministic-first pipeline (already largely built), durable cache.
3. **Solo-founder bandwidth** — the plan dies if all four waves run at once. One channel at a time; cold outreach until it's mastered or dead.
4. **Solo-user gravity** — free users will ask for solo features. The roadmap answers to the team buyer only.

---

## 7. Outreach engine assessment (2026-07-02)

`scripts/outreach.ts` reviewed. **Verdict: good enough for the Phase 0 100-batch. The tool is not the bottleneck — lead quality and follow-up are.**

### What it does well
- Reuses the real pipeline (scrape → extract → render) — the artifact IS the pitch.
- `?kit=` encoded links: prospect's page renders instantly, no re-scrape.
- Paste-ready 2x PNGs, CSV tracker, gallery review page, 4-wide concurrency, repo-host filtering.

### Gaps (in priority order — fix only when they block)
| Gap | Impact | When to fix |
|---|---|---|
| **Default lead source is Show HN** → solo devs, wrong ICP for team revenue | Validates the magic moment, not the team wedge | Now: use `--file` with team-ICP lists instead |
| **No contact-email enrichment** — `contact.email` is often empty from scraping | Can't send at all for many targets | Before the batch: Hunter/Apollo lookup or manual for 100 |
| **No follow-up sequencing** — most cold-email replies come on touch 2–3 | Halves effective reply rate | After first batch, before scaling |
| No sending/deliverability infra (separate domain, warmup, tracking) | Fine at 100 manual sends; blocks scale to 1,000/mo | Only if outreach becomes the mastered Wave 1 channel |

### Seed new leads? Yes — by ICP, not more of the same
1. **YC companies, 11–50 headcount** (57 founders already sourced; refilter for size) — team buyer.
2. **Product Hunt launches this month** — brand-invested founders at peak intent.
3. **WiseStamp/MySignature 1–3★ G2/Capterra reviewers** — highest intent, actively churning; small list but each one is warm.
4. **LinkedIn: Head of Marketing / Office Manager at 11–50 SaaS cos that rebranded recently** — the actual Team-plan buyer.

Show HN stays as the demo-volume firehose, not the revenue list. `scripts/find-leads.ts` already exists — point it at these sources.

---

## 8. Revenue potential (aggressive execution)

Assumptions: Team plan ~$3.5/seat avg, ~12 seats/team ≈ **$40/mo/team**; Pro $49 one-time; concierge $99. Comparables: MySignature/Newoldstamp (bootstrapped, reached seven figures ARR over ~5 yrs), SyncSignature (fast bootstrapped entrant, likely <$1M ARR). These are estimates, not promises — the Phase 0/3 gates produce the real numbers.

| Horizon | Scenario | Paying teams | MRR | ARR |
|---|---|---:|---:|---:|
| Year 1 | Aggressive (outreach mastered + PH launch + AppSumo) | 100–250 | $4–10K | **$50–120K** (+ ~$10–20K one-time Pro/LTD/concierge) |
| Year 2 | SEO comparison pages + Workspace Marketplace compounding | 500–1,200 | $20–50K | **$250–600K** |
| Year 3 | Niche owned (agency channel + rebrand-detection retention) | 2,000–2,500 | $80–100K | **$1M–1.2M** |

Reality checks:
- **Year 1 money is mostly validation money.** The $1K concierge gate is the year-1 milestone that matters; $100K ARR year 1 requires everything going right.
- Churn is the silent killer: without quality #6 (consistency-over-time features) teams cancel after setup. Retention features ARE the revenue model.
- Solo-founder ceiling without hiring: realistically **$1M ARR ±** — which at micro-SaaS multiples is also the exit ticket (below).

---

## 9. Exit paths — can we sell to a competitor?

**Yes, this category has a real acquisition track record** (verified 2026-07-02):

| Precedent | Buyer | Why they bought |
|---|---|---|
| WiseStamp → **vCita** | SMB business-management suite | Distribution + SMB product line |
| Sigstr → **Terminus** (2019) | ABM/martech platform | Email signatures as an ad/marketing channel |
| Mailtastic → **Sendoso** (2020) | Sending/engagement platform | Same: signature = owned media channel |
| Exclaimer → PE (Insight Partners, $133M) | Private equity platform | Category consolidator — actively acquires |

### Buyer map (most → least likely)
1. **Category consolidators:** Exclaimer (PE-backed, buys), WiseStamp/vCita — buy to remove a fast-growing low-end attacker and absorb its funnel.
2. **Adjacent martech:** Sendoso-likes, ABM platforms — buy "signature as marketing channel" + tech.
3. **Brand-asset platforms:** Canva, Frontify, Brandfetch — buy the *URL→brand-kit extraction engine* itself; for them the signature product is a feature, the extraction tech is the asset.
4. **Workspace ecosystem:** SMB suites wanting a Google Workspace Marketplace foothold.

Micro-SaaS reality: financial buyers (Acquire.com etc.) pay ~3–5x ARR; a *strategic* buyer who feels threatened pays more. At $500K ARR that's a **$1.5–3M+ exit**; at $1M ARR, **$3–6M+**.

### What makes an acquirer notice you (threat signals to deliberately build)
Acquirers buy for one of three reasons — Signet should stack all three:

**1. You're taking their customers (pain signal)**
- Rank #1–3 on "WiseStamp alternative", "Exclaimer for small teams", "SyncSignature vs" — the pages their churn reads.
- G2/Capterra reviews that say *"switched from WiseStamp"*. Ten of those is a board-slide problem for them.
- Show up in their lost-deal notes: agencies and 10–50 seat teams picking Signet on price + setup speed.

**2. You have tech they'd rather buy than build (asset signal)**
- The extraction pipeline + eval harness (`scripts/eval-extraction.ts`, accuracy metrics over time) is a demonstrable, benchmarked asset — keep the eval reports; they are due-diligence gold.
- Brand-kit cache across thousands of domains = proprietary dataset no one else has.
- Email-client rendering QA matrix — boring, hard-won, valuable.

**3. You own distribution they want (channel signal)**
- Google Workspace Marketplace ranking for "email signature" (Phase 4).
- The "Made with Signet" footer loop — measurable viral coefficient in every email.
- The agency channel: one relationship = dozens of client accounts.

### Acquisition-readiness hygiene (cheap, do along the way)
- Clean metrics from day 1: MRR, churn, CAC by channel (PostHog already wired).
- Clean IP: no GPL contamination, contracts/ToS in order, trademark "Signet" (check collision early — the name is common).
- Keep the codebase boring and documented — diligence speed is deal speed.
- **Do not build for exit.** Every quality above is identical to what wins customers. Build the business; the exit is a side effect of being a visible, growing annoyance in their segment.

### Timeline honesty
Nobody acquires a pre-revenue demo. The threat sequence is: Phase 3 revenue (months 1–3) → visible growth + comparison-page SEO (months 6–12) → $250K+ ARR with their churned customers (year 2) → that's when Exclaimer's corp-dev or vCita notices. The same work that reaches $1M ARR is the work that makes the phone ring.
