# Strategic Analysis — Signet
*Date: 2026-06-22*

## The one-sentence verdict
**Continue — but the landing page is selling a product that doesn't exist yet, and that gap is the single biggest risk. The wedge is real, the demo is genuinely magical, the unit economics are textbook. The problem isn't the idea, it's the scope drift between docs and code.**

---

## What's genuinely strong

- **The category is "boring enough that no one cool has touched it."** Email signatures touch every outbound email at every company. Real surface area, not a manufactured need.
- **The wedge is defensible.** URL → Firecrawl → Gemini multimodal → brand kit is a real pipeline nobody wants to rebuild. Templates and fonts are commodity; *extraction* is the moat.
- **The magic moment is real and demo-able.** Paste URL → 9s → three branded signatures. A 30-second sale. Most startups never get a moment this tight.
- **Unit economics are clean.** ~$0.006/generation, ~99% gross margin, profitable at 4 Pro subs. Not burning to learn.
- **The brand work is above average.** "Signet," the wax-seal metaphor, "Ink & Wax" palette, Fraunces + Hanken Grotesk — genuinely good naming and design direction.

## The critical problem nobody on the team is saying out loud

**The strategy docs describe the MVP. The code is a validation-stage smoke test. The landing page sells the MVP.**

| Landing page claims | Exists in code? |
|---|---|
| "Google Workspace sync" (Team plan) | No |
| "One-click team deploy" (Team plan) | No |
| "Admin controls" (Team plan) | No |
| "Connect Google Workspace → AI reads company directory" | No |
| "One Deploy button → every employee's Gmail is live" | No |
| "Copy HTML" (Pro) | Not as a paid gate — demo renders free |
| Paste URL → brand kit → 3 signatures | **Yes** |

Selling Team-tier features that don't exist is a truth-in-advertising problem and a founder-credibility problem. The first marketing manager who clicks "Contact us" and asks "show me the Workspace deploy" kills the word-of-mouth flywheel the entire GTM depends on.

This is also why the landing page feels "worst" — not because the visual design is bad (it isn't), but because **the page is a brochure for a product that hasn't been built**, and visitors sense it.

---

## SWOT

| | |
|---|---|
| **Strengths** | Magic moment that demo-sells in 30s · Defensible extraction pipeline (Firecrawl+Gemini) · Strong brand identity · ~99% margins · PLG-native (output is distribution via footer) · Clear ICP segmentation |
| **Weaknesses** | Landing page sells unbuilt Team/Workspace features · No auth, DB, persistence, or deploy — code is a smoke test · No real social proof yet · Demo is buried below the fold instead of being the hero · Hero CTA is an email waitlist gate (anti-PLG) · Single AI model dependency (Gemini model-ID churn risk) |
| **Opportunities** | "Email signature generator" ~100K searches/mo (SEO) · Product Hunt fit · Agency channel (white-label, $29-49/mo) · Rebrand-cycle recurring demand · CTA-banner auto-rotation as a retention hook · Expand to Outlook/M365 later |
| **Threats** | Wisestamp/Newoldstamp could ship auto-extraction (they have distribution) · Google could natively add signature deploy to Workspace · Resend/Firecrawl/Gemini pricing or quota shifts · "vibe-coded" clones once the pattern is visible · AI-extraction quality on JS-heavy/broken sites |

---

## Where to improve — ranked by leverage

1. **Stop selling features you don't have.** Pull Workspace sync / team deploy / admin controls off the pricing page *today*. Sell what the code does: Free (3 layouts, footer) and Pro ($12, unlimited kits, no footer, copy HTML). Highest-leverage fix, costs nothing.
2. **Make the demo the hero.** The positioning doc says it: *"the demo video is the product… above the fold only: demo GIF + one line + one CTA."* That spec was violated. The URL input should BE the hero — live, not a waitlist form. Let visitors paste their real URL above the fold and watch their signature appear. The landing page should literally *be* the demo. (Raycast/Arc/Cron pattern: the input is the hero.)
3. **Kill the email waitlist gate above the fold.** A waitlist for a product whose thesis is "instant magic in 10 seconds" is self-sabotage. Move email capture to *after* generation — when WTP is highest. Capturing email before the magic moment just bounces people.
4. **Lead with paper, not ink.** "Ink & Wax" means ink *on paper*. The hero is near-black with a tiny amber italic — the amber barely registers. The design-system doc itself says paper is the primary background. A paper-forward hero with the URL input, a live signature preview, and a single amber wax-seal accent is more on-brand and more distinctive than a generic dark-SaaS hero. The dark section belongs on the "old way is broken" contrast.
5. **Fix hero subhead contrast.** `rgba(249,246,240,0.46)` on `#1C1917` is ~4.3:1 — borderline WCAG AA fail. The design doc says "no dark-on-dark below 4.5:1." Violated on the most-read line on the page.
6. **Replace the marquee ticker.** SaaS cliché; the brand doc warns against filler. Either drop it or replace with a single rotating proof line (only when true).
7. **Show the before/after visually, not as text lists.** Side-by-side: a real Wisestamp-style 15-field form screenshot vs. the one URL field. One image, no copy needed.
8. **Build the Pro tier actually.** Honest path to "$1K MRR by Month 3": Free (footer) + Pro ($12, no footer, copy HTML, save kits). A 2-week build (auth + a DB table + Stripe). Workspace sync is Phase 2, Month 4-6.

---

## Landing page redesign — reference patterns

- **Raycast / Arc / Cron** — the input *is* the hero. One giant URL field centered on paper, amber focus ring, live signature rendering below. No nav clutter, no email gate.
- **Linear** — restraint, one accent color used sparingly (already a rule, just not followed on the hero).
- **Vercel** — product-as-hero, live demo above the fold, copy subordinate to the working thing.
- **Editorial/portfolio sites** — paper-forward, warm grain (already in `globals.css`), oversized Fraunces, generous `128px` vertical rhythm (spec calls for it; page uses `py-24` ≈ 96px — push it).

Concrete hero rebuild:
```
[PAPER background, warm grain]
  eyebrow:   BRAND SIGNATURES, AUTOMATED  (amber, tracking-wide)
  H1:        Your mark on every email.    (Fraunces, fluid, ink)
  sub:       Paste your URL. Watch your brand appear in 9 seconds.
  [ GIANT URL INPUT — amber focus ring, "Generate →" button inline ]
  [ LIVE: three signature previews render here, above the fold, on input ]
  one ghost link: "See how it deploys to your team ↓"
```
No waitlist above the fold. No dark hero. No marquee. The working demo *is* the hero.

---

## Final verdict

**Continue. Don't pivot the product — pivot the scope of what you market.**

- **The idea:** keep it. The wedge is real and defensible.
- **The near-term product:** Free + Pro on the *current* capability (URL → brand kit → copy HTML). Build auth + DB + Stripe in 2 weeks. A real, sellable, honest product that can hit $1K MRR.
- **The Team/Workspace tier:** remove from the page until built. Phase 2, 2-3 months minimum (Google OAuth, Directory API, Gmail API, admin controls). Selling it now borrows against unearned credibility.
- **The landing page:** not "worst" visually — a competent editorial design. But strategically broken: buries the magic moment, gates it behind an email form, advertises vaporware. Rebuild the hero around the live URL input. That one change is worth more than every other tweak combined.
- **The one metric that still matters:** *"Did the user copy a signature?"* Build the page so that's the only thing a visitor can do above the fold.

A genuinely good wedge, strong brand work, and a magical demo trapped inside a page trying to sell a bigger product than has been built. Free the demo, tell the truth about pricing, ship the Pro tier. Everything else is downstream.

---

## Addendum: Bot-Abuse Economics & Mitigation (for a bootstrapped dev)

*Added 2026-06-23. Covers rate-limit math, copy-button leak, and the free-vs-paid decision.*

### The real risk isn't going bankrupt — it's your providers cutting you off

Variable cost per generation (from GTM doc):

| Cost | Per generation |
|---|---|
| Firecrawl scrape | $0.003 |
| Gemini extraction | $0.001 |
| Vercel compute | $0.002 |
| **Total** | **$0.006** |

At $0.006/gen, a bot storm of 1,000 unique URLs costs **$6 in variable fees** — annoying, not fatal. The real failure mode is **plan caps**, not dollars:

- **Firecrawl Hobby ($16/mo) ≈ 500 scrapes/month.** A bot hitting 500 unique URLs burns the whole month in ~10 minutes. You're dead for 29 days.
- **Gemini AI Studio free tier** has per-minute rate limits → bots hit 429s → real users see errors.
- **Vercel function invocations** throttle under sustained load.

**The Firecrawl cap IS your protection.** You can't lose more than the plan allows. The real cost of bot abuse is a broken product for real users, not bankruptcy.

### Mitigation deployed (Phase 1, no backend, free)

**Rate limiter on `/api/brand-kit`** — in-memory `Map<ip, RateEntry>`:
- **3 generations/hour per IP**
- **10 generations/day per IP**
- Only **real scrape attempts** count (cached + invalid-URL responses bypass the meter)
- Over-limit returns **HTTP 200 + neutral fallback + `rateLimited: true`** (preserves the "UI always renders" invariant; bots get a useless neutral signature, your budget is protected)
- Crude size guard: map clears at 10,000 entries

**Copy button removed** — replaced "Copy" with "Copy with Pro →" link:
- One-click HTML theft eliminated (the real leak)
- Dev-tools extraction (iframe `srcdoc`) still possible — can't prevent it, high-friction, only technical users who weren't going to pay $12 anyway
- Removed `copyLayout`/`copied` dead code from `useBrandKit` hook

### Economics after mitigation

| Scenario | Cost to you |
|---|---|
| Bot hammers 100 unique URLs in 1 min | 3 succeed ($0.018), 97 get neutral fallback ($0.00) → **$0.018 total, budget safe** |
| Real user tries 3 URLs | $0.018, within hourly limit |
| Real user tries 4th in same hour | Neutral fallback + "come back in an hour" message |
| Same URL repeated 1000x | Cache hit, $0.00, no rate count |
| Bot rotates 1,000 IPs, 3 each | Worst case: 3,000 scrapes = $9 + Firecrawl cap hit at 500 |

**Firecrawl Hobby (500 scrapes/mo) now lasts ~166 distinct users at 3 generations each**, instead of being burned by a single bot in 10 minutes. If you outgrow 500/mo, that's a good problem — it means ~167 real users, enough to justify upgrading.

### The free-vs-paid decision (Marc Lou, adapted)

Marc Lou's rule: *don't give away a free tier; charge from day 1.* He's right about **free tiers** (ongoing free usage with an account = cost center, attracts tire-kickers). He's wrong if you read it as *never let anyone see the product for free* — that kills the PLG magic moment that sells products like this one.

**The distinction: free DEMO ≠ free TIER.**

- **Free demo** = one-shot, no account, shows value, rate-limited hard. This is a **sales tool**, not the product. It's the 30-second video, except interactive.
- **Free tier** = ongoing free usage with an account, generous limits, no time bomb. This is a **cost center** that attracts tire-kickers who never convert.

The model for a bootstrapped dev with no money:

```
FREE DEMO (no account, no signup)
  → paste URL, see 3 branded signatures render
  → NO copy button, NO save, NO deploy
  → rate-limited: 3/hr, 10/day per IP
  → "Made with Signet" footer on all output (free marketing)
  → this is the sales tool, not the product

PRO $12/mo (Stripe — Phase 2)
  → copy HTML
  → save brand kits
  → no Signet footer
  → unlimited generations

TEAM $8/seat (Phase 3)
  → Google Workspace sync, deploy, admin controls
```

**See free, take paid.** Marc Lou-aligned (no free tier, charge from day 1 for the *product*) while preserving the PLG magic moment (the *demo* is free).

### What NOT to do

- **Don't build auth/DB/Stripe today** to "solve" abuse — that's Phase 2, 2 weeks. The rate limiter + copy removal handles 95% of the risk for free.
- **Don't gate the demo generation behind email capture** — kills the magic moment, and bots use disposable emails anyway.
- **Don't try to block dev tools / right-click** — doesn't work, breaks trust, signals insecurity.
- **Don't upgrade Firecrawl until paying users justify it** — the Hobby cap is your free rate limiter.
- **Don't add CAPTCHA preemptively** — only if you see real abuse. Cloudflare Turnstile is free and invisible if you need it later.
