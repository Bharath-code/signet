# Landing Page Redesign Plan — Signet
*Date: 2026-06-22*

> Companion to `2026-06-22-strategic-analysis.md`. Read that first.
> Scope: **Phase 1 only** — visual + IA + copy overhaul of the existing landing page on the *current* capability. No new backend.

---

## Guiding principle

**The demo is the hero. The URL input is the hero.**
Everything else is subordinate to letting a visitor paste their URL and see their branded signature appear above the fold, with no gate.

One metric decides every decision: **"Did the user copy a signature?"**

---

## Scope

| Phase | What | When |
|---|---|---|
| **Phase 1 (this plan)** | Rebuild landing page: demo-as-hero, honest pricing, visual before/after, polish. No backend. | Now, ~1-2 days |
| Phase 2 | Auth + DB + Stripe → real Pro tier (save kits, copy HTML as paid gate) | Next 2 weeks |
| Phase 3 | Google Workspace sync / Team tier | Month 4-6 |

Non-goals for Phase 1: no auth, no DB, no Stripe, no Workspace, no "Made with Signet" footer enforcement, no team deploy. Sell only what exists.

---

## What changes (summary)

1. **Hero**: paper-forward, live URL input as hero, signature previews render above the fold on submit.
2. **Kill the waitlist gate above the fold**; move email capture to *after* generation.
3. **Honest pricing**: Free + Pro only. Team → "Coming soon — join the waitlist" (or removed).
4. **Remove the marquee ticker.**
5. **Before/after** becomes a visual screenshot pair, not bullet lists.
6. **Fix contrast violations** (hero subhead, nav links on dark).
7. **Push vertical rhythm** toward the spec's `128px` page-level cadence.
8. **Trim nav** to wordmark + "Try it free" only (drop Pricing link — pricing is one scroll away).

---

## New information architecture

```
NAV        Signet [left]  ·  "Try it free →" [right]   (solid on scroll)

HERO       ← THE PAGE. Live demo lives here.
           eyebrow · H1 · sub · [URL INPUT + Generate] · [3 SIGNATURE PREVIEWS]
           ↓ "How it works" ghost link

HOW        4 steps (keep current, lighten)
           only meaningful if visitor didn't interact with the hero

BEFORE/AFTER   visual: Wisestamp 15-field form screenshot  vs.  one URL field
               one line of copy each side

PRICING    Free · Pro · [Team: Coming soon]
           honest feature lists

FINAL CTA  "Generate yours free" → /app

FOOTER     minimal
```

Deleted sections: marquee ticker, dark "old way is broken" prose section (replaced by visual before/after), waitlist form above fold.

---

## Hero spec (the rebuild)

The hero stops being a dark marketing block and becomes the product surface. Paper background, warm grain (already in `globals.css`), one amber accent.

```
<section>  background: var(--color-paper)   min-height: 100svh

  <div max-w-3xl, centered, pt-32>

    eyebrow   "BRAND SIGNATURES, AUTOMATED"
              text-[0.64rem] uppercase tracking-[0.2em]
              color: var(--color-accent)

    H1        "Your mark on every email."
              font-display, clamp(2.75rem, 7vw, 5.5rem)
              leading-[1.0] tracking-[-0.04em] color: var(--color-ink)
              (no italic amber word — too quiet at hero scale;
               amber lives in the eyebrow + input focus + button)

    sub       "Paste your company URL. Watch your logo, colors,
               and fonts appear as a polished signature in 9 seconds."
              text-lg, color: var(--color-muted), max-w-[52ch]

    [URL INPUT ROW]   full-width, mt-10
      <form>
        <input
          type="url"
          placeholder="yourcompany.com"
          height: 56px
          background: var(--color-card)
          border: 1px var(--color-line)
          focus: 1.5px var(--color-accent) + var(--shadow-seal)
          font: var(--font-body), text-base
        />
        <button type="submit">
          "Generate →"
          height: 56px
          background: var(--color-ink)  color: var(--color-paper)
          hover: background var(--color-accent) color var(--color-ink)
        </button>
      </form>

    [RESULTS]   appears on submit (below input, still above the fold on desktop)
      - loading state: "Reading your site…" (amber dot pulse, 9s budget)
      - success: 3 signature previews in a row (reuse renderSignature + iframe)
      - error/fallback: NEUTRAL_BRAND_KIT + "We couldn't read that site —
        here's a starter you can refine."  (still renders, still HTTP 200)
      - each preview: [Copy HTML] button (free, with footer) +
        tiny "Remove Signet footer → Pro" upsell chip

    ghost link  "See how it works ↓"  →  #how

  </div>
</section>
```

**Key behaviors:**
- The hero form `POST`s to `/api/brand-kit` (the existing route — no backend change).
- On response, render the three layouts via `renderSignature(kit, fields, layout)` into iframes — exactly what `SignatureDemo.tsx` already does. Lift that logic into a shared hook/component.
- `SignatureFields` for the hero: prefill with sensible demo defaults (`Alex Chen · Head of Design · alex@yourcompany.com`), but make them editable inline after render (Phase 2 polish; optional in Phase 1).
- **Email capture moves here, after generation succeeds:** a slim "Save your kit — enter email" line under the previews. This is the waitlist, repositioned to the moment of peak intent.

**Contrast fixes (WCAG AA):**
- Hero subhead: `var(--color-muted)` (#78716C) on `var(--color-paper)` (#F9F6F0) ≈ 4.6:1 ✓
- No more `rgba(249,246,240,0.46)` on dark.
- Nav ghost link on dark sections (when nav is not solid): bump from `0.42` → `0.6` minimum.

---

## Before/after section (visual, not prose)

```
<section>  background: var(--color-paper-deep)

  eyebrow:  THE DIFFERENCE
  H2:       One URL. Or fifteen fields.

  [grid 2 cols, gap-0, border]

  LEFT card  (muted, label "The old way")
    <img> screenshot of Wisestamp/MySignature form with 15+ fields
    caption: "Pick a template. Find your hex codes. Fill every field. Per employee."

  RIGHT card  (amber accent border-left, label "With Signet")
    <img> screenshot of the hero URL input with one field
    caption: "Paste your URL. Done."

</section>
```

Source the two screenshots manually (or render them as HTML mocks in-component to stay self-contained). One image pair replaces two five-item bullet lists.

---

## Pricing section (honest)

```
FREE        $0
            1 brand kit · 3 layouts · Copy HTML · "Made with Signet" footer
            CTA: "Get started free"  → /app

PRO         $12 / month
            Unlimited brand kits · all layouts · no Signet footer · font picker
            CTA: "Start Pro"  →  (Phase 2: Stripe; Phase 1: mailto or "Notify me")

TEAM        Coming soon
            Google Workspace sync · one-click team deploy · admin controls
            CTA: "Join the waitlist"  →  email input (reuse /api/waitlist)
            badge: "COMING SOON"
```

Team is visually de-emphasized (muted, no "Popular" badge, lower opacity) but still collects intent via the waitlist route that already exists. This converts the current vaporware claim into honest demand-validation.

Pro tier in Phase 1: since Stripe isn't built, the "Start Pro" button either (a) scrolls to the waitlist with a `?plan=pro` flag, or (b) is a `mailto:`. Pick (a) — it's honest ("we'll email you when paid plans open") and keeps the waitlist populated with high-intent leads.

---

## Token / CSS changes

Add to `globals.css` `@theme`:
```css
--color-accent-tint: #FEF3C7;   /* amber-100 — subtle background tints */
--shadow-seal: 0 0 0 3px rgba(217, 119, 6, 0.22);  /* amber focus ring */
```

Add component classes:
```css
.hero-input {
  height: 56px;
  background: var(--color-card);
  border: 1px solid var(--color-line);
  color: var(--color-ink);
  font-family: var(--font-body);
  transition: border-color 150ms, box-shadow 150ms;
}
.hero-input:focus {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-seal);
  outline: none;
}
.hero-button {
  height: 56px;
  background: var(--color-ink);
  color: var(--color-paper);
  font-weight: 500;
  transition: background 150ms, color 150ms;
}
.hero-button:hover { background: var(--color-accent); color: var(--color-ink); }
```

Remove: the `marquee` keyframes + the ticker JSX. (Keep the keyframes in CSS only if reused elsewhere — it isn't.)

Adjust: section vertical padding from `py-24` (96px) to `py-32` (128px) on desktop for the page-level rhythm the design spec calls for.

---

## Copy deck (final)

```
NAV
  Signet                                    [Try it free →]

HERO
  EYEBROW    Brand signatures, automated
  H1         Your mark on every email.
  SUB        Paste your company URL. Watch your logo, colors,
             and fonts appear as a polished signature in 9 seconds.
  INPUT      yourcompany.com
  BUTTON     Generate →
  GHOST      See how it works ↓
  POST-GEN   Your signature is ready.  [Copy HTML]
             Save your kit →  [email input] [Save]

HOW IT WORKS
  EYEBROW    How it works
  H2         From URL to signature. Under 3 minutes.
  01  Paste your URL       Drop in your company website. No setup, no credentials.
  02  Brand extracted      Logo, colors, and fonts — read from your site automatically.
  03  Pick a layout        Three polished options, all on-brand. Pick one or all.
  04  Copy & install       Copy the HTML. Paste into Gmail. Done.

BEFORE/AFTER
  EYEBROW    The difference
  H2         One URL. Or fifteen fields.
  LEFT       The old way — Pick a template. Find your hex codes.
             Fill every field. Per employee.
  RIGHT      With Signet — Paste your URL. Done.

PRICING
  EYEBROW    Pricing
  H2         Start free. Scale when you're ready.
  FREE   $0           1 brand kit · 3 layouts · Copy HTML · Signet footer
  PRO    $12/mo       Unlimited kits · all layouts · no footer · font picker
  TEAM   Coming soon  Workspace sync · team deploy · admin controls

FINAL CTA
  H2         Your brand deserves to be in every email.
  SUB        9 seconds. No credit card. No IT ticket.
  BUTTON     Generate yours free →

FOOTER
  Signet  ·  No template picker · No hex codes · No IT ticket  ·  © 2026
```

Note the copy changes from "Under 3 minutes" → keep "3 minutes" in how-it-works (the deploy story is future), but the hero promises the *current* capability: "9 seconds" to signature. Honest to what the code does today.

---

## Build sequence (Phase 1)

Ordered so each step ships something visible and independently verifiable.

| Step | What | Est. | Verify |
|---|---|---|---|
| **1a** | Honest pricing: rewrite `PLANS` array, remove Team feature claims, add "Coming soon" Team card with waitlist CTA. | 30m | Pricing section shows Free / Pro / Coming-soon only. |
| **1b** | Delete marquee ticker JSX + `marquee` keyframes. | 10m | No ticker between hero and demo. |
| **1c** | Extract signature-render logic from `SignatureDemo.tsx` into a shared `useBrandKit` hook + `<SignaturePreview>` component. | 1h | `/app` still works unchanged. |
| **1d** | Rebuild hero: paper background, URL input form, wire to `/api/brand-kit`, render previews above the fold on response. Loading + fallback states. | 3-4h | Paste a real URL → see 3 branded signatures above the fold. |
| **1e** | Move email capture into hero, post-generation. Remove old waitlist form. | 30m | Email only requested after a signature renders. |
| **1f** | Replace dark "old way is broken" section with visual before/after (two screenshot cards). | 1h | Section is two images + two captions, no bullet lists. |
| **1g** | Contrast + rhythm pass: hero subhead color, nav link opacity, section `py-32`, focus rings. | 30m | Lighthouse / axe: no AA contrast failures. |
| **1h** | Trim nav (drop Pricing link), final CTA copy update, footer trim. | 20m | Nav = wordmark + one button. |

**Total: ~7-8 hours of focused work.** Shipable in one day.

---

## Acceptance criteria

Phase 1 is done when all of these are true:

- [ ] A first-time visitor can paste a real URL above the fold and see three branded signatures render without scrolling, with no email required first.
- [ ] No pricing claim on the page references a feature that doesn't exist in code (no "Workspace sync," "team deploy," "admin controls" as live features).
- [ ] Team tier is visibly marked "Coming soon" and routes to the waitlist, not to a checkout.
- [ ] No email is requested before a signature has rendered.
- [ ] Hero subhead and all body text pass WCAG AA contrast (≥ 4.5:1).
- [ ] No marquee ticker.
- [ ] `npm run build` passes (the type gate).
- [ ] `npm test` passes (existing `renderSignature` + schema tests untouched).
- [ ] `/app` (SignatureDemo) still works unchanged.
- [ ] Page works on mobile (input + previews stack, no horizontal scroll).

---

## What NOT to build in Phase 1

- Auth, sessions, user accounts
- Database, persistence, "save my kit" beyond the current session
- Stripe or any payment
- Google Workspace OAuth, Directory API, Gmail API
- "Made with Signet" footer enforcement (it's in the render output, but not gated)
- Team admin UI
- A/B test infra
- Analytics (beyond a basic pageview + "signature generated" + "signature copied" event)

These are Phase 2/3. Phase 1 is about making the page honest and letting the demo sell.

---

## Success metrics for Phase 1

Since there's no analytics yet, instrument three events only (a single lightweight `track()` call, no SDK):

| Event | Definition | Target |
|---|---|---|
| `page_view` | Landing page loaded | — |
| `url_submitted` | Hero form submitted with a URL | — |
| `signature_copied` | "Copy HTML" clicked on any preview | **>40% of `url_submitted`** |

The 40% copy-rate target is straight from the GTM doc's "aha rate." If Phase 1 hits it, the page is doing its job and Phase 2 (real Pro tier) is worth building. If it doesn't, fix the demo before building billing.

---

## Open decisions (need a call before building)

1. **Pro tier CTA in Phase 1** — `mailto:` or scroll-to-waitlist with `?plan=pro`? (Recommend: waitlist with flag — captures intent, honest.)
2. **Before/after screenshots** — source real screenshots of Wisestamp, or render HTML mocks in-component? (Recommend: HTML mocks — self-contained, no copyright issue, on-brand.)
3. **Editable signature fields in hero** — Phase 1 or Phase 2? (Recommend: Phase 2. Phase 1 uses demo defaults; the magic is the brand extraction, not field editing.)

---

## Files touched (Phase 1)

- `app/components/LandingPage.tsx` — major rewrite (hero, pricing, before/after, nav, footer)
- `app/globals.css` — add tokens, component classes, remove marquee, adjust rhythm
- `app/components/SignatureDemo.tsx` — extract shared render logic (refactor, no behavior change)
- `app/components/SignaturePreview.tsx` — **new** (shared preview component)
- `app/components/useBrandKit.ts` — **new** (shared hook wrapping `/api/brand-kit`)

No changes to: `lib/render-signature.ts`, `lib/extract-brand-kit.ts`, `lib/scrape-site.ts`, `app/api/**`, `app/app/page.tsx`, tests.
