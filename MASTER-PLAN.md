# Signet Master Plan

**Date:** 2026-06-25
**Status:** Supersedes `product-executive-review.md`, `product-validation-and-10x-plan.md`, `gemini-firecrawl-fallback-plan.md`, `competitor-analysis-and-market-domination-plan.md`. Those remain as research; this is the operative plan.

**Core rule (from the docs, kept):** validate demand before building persistence, payments, or team-sync. Each phase below is gated on a measurable signal from the prior phase. Do not skip a gate.

---

## 1. Reconciliation — what the older docs got wrong

The four docs were written 2026-06-24 and lead with blockers that are now fixed. Verified against `main` on 2026-06-25:

| Older doc claim | Reality today |
|---|---|
| `npm run build` fails on undefined `ADMIN_COPY` | **Fixed.** Builds clean; `ADMIN_COPY` defined at `app/components/SignaturePreview.tsx:11` (env flag `NEXT_PUBLIC_SIGNET_COPY`). |
| Test suite ~48 tests | **48/48 pass.** |
| Landing says "Free: Copy HTML" but app gates behind Pro | **Resolved.** Landing redesigned (`97b094e`); no contradictory promise. Copy is honestly gated: flag on → "Copy", else "Copy with Pro". |
| `?from=` outreach + personalized links not built | **Built** (per session memory: 3-layout outreach, Puppeteer screenshots, PostHog funnel). |
| No real payment | **Still true.** `proHref` → `#notify`/`#pricing`; no Stripe/checkout wired. |
| No persistence / saved kits | **Still true.** |
| No team features | **Still true.** |
| Extraction is Gemini-primary, fragile | **Still true.** Firecrawl used as scraper+screenshot, not brand extractor. |

**Implication:** "Week 1" of every older plan is shipped. The remaining work is payment, persistence, team flow, and extraction reliability — and none of it should be built before the validation gate (Phase 0) produces signal.

---

## 2. Positioning (locked)

Not: "AI email signature generator" (broad, commoditized, copyable).

**Yes:** *The fastest way to turn a company website into on-brand email signatures — for one person or a whole small team.*

Win condition = the **first 60 seconds**. Paste URL → tasteful, email-safe signature, no template picker, no hex codes, no logo upload, no signup.

**Moat** (extraction alone is not enough — Brandfetch commoditizes it): extraction **+ taste + email-safe rendering + small-team/agency workflow + brand consistency over time.**

Taglines to test: "Your website already knows your brand." / "Paste your URL. Brand every email." / "No template picker. No hex codes."

---

## 3. Phased plan (each phase gated on a signal)

### Phase 0 — Validation instrumentation + completable job  *(do first, ~days)*

**Goal:** make the wedge measurable and the job finishable. No new product surface.

- Confirm/complete PostHog events: `url_submitted`, `extraction_success`, `extraction_fallback`, `copy_clicked`, `team_cta_clicked`, `pro_clicked`. (`pro_link_clicked` already fires.)
- Make copy/export honestly usable for at least one layout free (with Signet footer is fine) — a demo that generates but can't be used only validates a waitlist, not the job.
- Add Gmail / Outlook web / Apple Mail install instructions shown immediately after copy.
- QA the rendered signature pasted into Gmail, Outlook web, Apple Mail.

**Files:** `app/components/SignatureDemo.tsx`, `app/components/SignaturePreview.tsx`, `lib/render-signature.ts` (no layout padding — keep pure), a small `InstallInstructions` component.

**Gate to Phase 1:** run 100 personalized `?from=` outreach. Pass = scorecard below hits **Promising** or better on reply rate **and** copy/export intent.

| Metric | Weak | Promising | Strong |
|---|---:|---:|---:|
| Reply rate | <5% | 5–15% | >15% |
| Brand-match approval | <50% | 50–70% | >70% |
| Copy/export intent | <15% | 15–30% | >30% |
| Team interest | <5% | 5–15% | >15% |
| Paid setup conversion | 0 | 1–2 | 3+ |

---

### Phase 1 — Extraction reliability moat  *(only if Phase 0 shows brand-match <70% OR fallback rate is high)*

**Goal:** stop depending on Gemini for every request; raise brand-match quality. Spec: `gemini-firecrawl-fallback-plan.md`.

- Audit installed Firecrawl SDK for a `branding` format; if absent, hit REST directly.
- `lib/build-brand-kit-from-firecrawl.ts` → `BrandKitCandidate`.
- `lib/brand-kit-candidates.ts` → merge candidates (Firecrawl branding > CSS/meta > vision > neutral) + confidence score.
- Make vision optional: rename current `extractBrandKit` → `extractBrandKitWithVision`; new orchestrator calls vision only when `confidence.overall < 0.6`.
- Durable cache (Vercel KV / Upstash) keyed `brand-kit:v2:{hostname}`, 7–30 day TTL.
- Surface confidence softly in UI: "Logo: extracted · Colors: best guess, adjust below."

**Targets:** ≥70% of successful generations skip vision; ≤25% cheap vision; ≤5% premium.

**Gate to Phase 2:** brand-match approval ≥70% in a fresh outreach batch.

---

### Phase 2 — Fake team (no OAuth)  *(only if Phase 0 team-interest ≥ Promising)*

**Goal:** show the team wow before building any backend.

- "Generate for team" → manual teammate rows + CSV paste (name, title, email, phone, LinkedIn).
- Render N signatures instantly from one shared brand kit; copy/export per teammate.

**Files:** new `app/components/TeamGenerator.tsx`, reuse `renderSignature`. Still no DB — state is client-side + export.

**Gate to Phase 3:** ≥5 teams ask "can I do this for my team?" in outreach/calls.

---

### Phase 3 — Concierge setup (first real money)  *(only if Phase 2 gate met)*

**Goal:** validate willingness to pay + learn deployment pain manually. No automation.

- CTA: **"Team Setup — $99 one-time beta. We generate your team's signatures and help you install them."**
- Wire one real payment link (Stripe Payment Link / Gumroad — no full billing system).
- Fulfil manually. Document every step — that document is the Phase 4 spec.

**Gate to Phase 4:** **10 paid setups OR $1,000 setup revenue.** Below this, do not build persistence/OAuth — pivot to the agency/client-pack wedge instead.

---

### Phase 4 — Productize team  *(only after Phase 3 gate — this is where real engineering starts)*

- Persistence: saved brand kit + saved team (email magic link or local-first + capture).
- Recurring Team plan (e.g. $29/mo + $3/user); remove Signet footer on paid.
- Agency workspaces: multiple client kits, shareable preview links.
- Google Workspace import (OAuth, Directory API, admin review screen, export-first then push-to-Gmail). **Microsoft 365 never first.**
- Retention surface: new-hire updates, rebrands, campaign banners, analytics.

---

## 4. What NOT to build (until its gate)

Persistence, Stripe billing system, accounts/auth, team backend, Google Workspace OAuth, Microsoft 365, SSO, SOC2, admin roles, template marketplace, analytics dashboards, AI headshots, mobile app. Every one is downstream of a paying-team signal that does not exist yet.

---

## 5. Kill / pivot criteria

- **Extraction weak (brand-match <50%):** fix Phase 1 before anything else; the wedge fails without taste.
- **Individuals like it, teams don't (team-interest <5%):** drop team; sharpen solo + **agency client-pack** wedge (paste each client URL → branded signature pack).
- **Nobody pays $99 concierge:** do not build Workspace. The business is the one-time/agency wedge, not a team SaaS.
- **Strong on all:** proceed to Phase 4 with confidence.

---

## 6. This week's single highest-leverage action

Phase 0: instrument the funnel + make copy/export honestly completable with install instructions, then run the 100-link outreach. Everything else waits on that data.
