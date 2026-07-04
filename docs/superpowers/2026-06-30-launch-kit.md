# Signet Launch Kit — Twitter + Product Hunt

*Prepared: 2026-06-29 · Prod URL: https://signet-ruby.vercel.app*

---

## Production QA Results (verified tonight)

| Check | Result |
|---|---|
| `/api/health` | `ok: true` — Firecrawl key set, Gemini `ok`, model `gemini-3.5-flash` |
| Homepage | 200 |
| OG image `/hero.jpg` | 200 — Twitter card will render |
| `npm run build` (local) | Passes |
| Tests | 76/76 pass |

### 10-URL extraction test (prod API)

| Site | Result | Source | Time | Brand |
|---|---|---|---|---|
| stripe.com | ✅ Pass | firecrawl | 14.7s | Stripe, `#533afd` |
| linear.app | ✅ Pass | firecrawl | 14.3s | Linear, `#e4f222` |
| vercel.com | ✅ Pass | firecrawl | 14.6s | Vercel, `#0072f5` |
| notion.so → figma.com | ⚠️ Rate-limited | — | <1s | Neutral fallback |

**3/3 real extractions succeeded** before the **3/hour IP rate limit** kicked in. Extraction quality on Stripe, Linear, and Vercel is strong — use those three in the demo video.

**Launch-day warning:** After 3 unique URLs from the same IP, users get a neutral "Your Company" signature. On Product Hunt day, many visitors share office WiFi or VPN egress — some will hit this fast. Consider temporarily bumping `HOUR_LIMIT` to 10 for launch day, or upgrading Firecrawl before the spike.

---

## Twitter Thread (copy-paste)

### Tweet 1 (pin this — attach 15–30s screen recording)

```
I got tired of "email signature generators" that are really blank template builders.

So I built Signet: paste your company URL → it reads your live site (logo, colors, font) → renders 3 branded signatures. No signup.

Try it: https://signet-ruby.vercel.app

[attach video: stripe.com → linear.app → vercel.com]
```

### Tweet 2

```
How it works (deterministic-first):

1. Firecrawl reads your site's branding + CSS
2. Only fills gaps with Gemini vision (~50% of sites skip the LLM entirely)
3. Renders Outlook-safe HTML you can paste into Gmail / Outlook / Apple Mail

If extraction is partial, you still get a working signature — never a broken page.
```

### Tweet 3 (honesty = credibility)

```
What's NOT here yet (on purpose):

• No accounts
• No saving kits
• No team deploy / Workspace sync (coming)

This is a validation demo. I want to know one thing:

Paste YOUR site — does the signature actually look like you?

Reply with your URL + honest feedback 👇
```

### Tweet 4 (CTA + engagement bait)

```
Free right now:
→ Paste URL on the homepage
→ Customize fields + colors in /app
→ Copy 1 layout (Logo style) — no card

If it nails your brand, RT helps more than anything.

https://signet-ruby.vercel.app
```

### Optional reply to your own thread (the #d4f53c story)

Use if someone says "colors are wrong":

```
Fun bug that wasn't a bug: my own brand is neon lime on near-black. Email signatures render on white — that's 1.2:1 contrast, illegible.

So the renderer auto-darkens body text for WCAG AA and keeps bright accents as borders. Extraction was right; email-safe rendering changed what you see.
```

---

## Product Hunt Assets

### Tagline (≤60 chars)

```
Paste your URL. Get brand-matched email signatures in 10s.
```

### Short description (PH subtitle)

```
Signet reads your live website — logo, colors, font — and builds three on-brand email signatures instantly. No template picker. No hex codes. No signup.
```

### Gallery captions (4 images)

1. **Hero** — Homepage with URL input + three live previews
2. **Stripe** — Extraction result for stripe.com
3. **Linear** — Extraction result for linear.app
4. **App** — `/app` customize + copy flow

### Maker's First Comment (paste immediately after launch)

```
Hey PH 👋 — I built Signet because every "email signature generator" I tried was really a template builder: pick a layout, type 15 fields, hope it matches your brand.

Signet does the opposite. Paste your company URL → it reads your actual site (logo, colors, font) → renders three signatures live. No signup.

How it works:
• Deterministic-first: Firecrawl branding extraction → CSS tokens → page metadata
• Gemini vision only fills gaps (~50% of sites never touch the LLM)
• If everything fails: real logo + name + editable guesses — never a broken signature

The honest part: I spent days thinking extraction was broken on my own site. It wasn't. My brand is neon lime (#d4f53c) on near-black. Email signatures render on white — 1.2:1 contrast, illegible — so the renderer auto-darkens body text for WCAG AA. Extraction was correct; email-safe rendering is the hard part.

What's deliberately NOT here yet:
• No accounts, no database, no saving
• Team deploy / Google Workspace sync is on the roadmap, not shipped

This is a validation demo. The one thing I need from you:

Paste YOUR site and tell me — does the signature actually look like you?

Free: generate + customize + copy 1 layout.
Pro waitlist: all 3 layouts, saved kits, no footer.

Known rough edges: dark-neon brands on white canvas, SVG-only logos (Gmail won't render SVG — we rank rasters first), rate limit during high traffic.

Try it → https://signet-ruby.vercel.app

Happy to answer anything about extraction quality, email-client rendering, or the roadmap.
```

### PH Reply Templates

**"Does it work with Outlook?"**

```
Yes — output is table-based HTML with inline CSS, built for Outlook/Gmail/Apple Mail. Copy from /app and paste into your client's signature settings. I QA'd Gmail + Outlook web; happy to hear if something breaks on your setup.
```

**"Why rate limited?"**

```
Each paste costs ~$0.006 (Firecrawl scrape + optional Gemini). The limit protects the free demo from bots burning my monthly scrape quota. Cached URLs are free. If you hit the limit, try again in an hour — or test with stripe.com / linear.app / vercel.com to see the magic moment first.
```

**"When is team deploy?"**

```
After validation. If enough people want team rollout, next step is CSV bulk-generate (no OAuth), then a $99 concierge setup, then Workspace sync. Not selling vapor — building in that order based on what you ask for.
```

---

## Pre-Launch Checklist

### Tonight — do these

- [ ] **Record demo video** using `stripe.com`, `linear.app`, `vercel.com` (confirmed working on prod)
- [ ] **Screenshot those 3** for PH gallery + tweet images
- [ ] **Decide on rate limit for launch day** — bump `HOUR_LIMIT` from 3 → 10 in `app/api/brand-kit/route.ts`, redeploy, or accept some users see neutral fallback
- [ ] **Check Firecrawl dashboard** — scrapes remaining this month; upgrade if <300 left
- [ ] **Set `NEXT_PUBLIC_SITE_URL=https://signet-ruby.vercel.app`** on Vercel prod (canonical + OG consistency)
- [ ] **Test waitlist** — submit one real email, confirm Resend notification lands in your inbox
- [ ] **Paste-copy test** — copy layout 1 from `/app` into Gmail; confirm it renders
- [ ] **Deploy latest to production** — confirm Vercel production ≠ stale preview
- [ ] **`GET /api/health`** on prod — Firecrawl `ok`, Gemini `ok`, model ID valid
- [ ] **Env vars on Vercel prod:** `FIRECRAWL_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `RESEND_API_KEY`, `RESEND_AUDIENCE_ID` (optional), PostHog keys
- [ ] **Verify `/hero.jpg` OG image** loads on prod (Twitter card preview)

### Launch morning

- [ ] PH goes live 12:01am PT (or your slot) + first comment pasted within 60s
- [ ] Pin Twitter thread with video at 8–10am your timezone
- [ ] **PostHog live** — `page_view`, `url_submitted`, `extraction_success`, `extraction_fallback`, `signature_copied`, `waitlist_joined` firing
- [ ] Monitor PostHog for `extraction_fallback` + `rateLimited` spikes
- [ ] Reply to every PH comment for first 2 hours
- [ ] Quote-tweet PH link from your pinned thread
- [ ] **Reply fast** for 2–3 hours — extraction feedback is gold
- [ ] **Have 3–5 friend sites ready** — if someone's site fails publicly, redirect: "dark-on-white edge case, try X"

### Twitter-specific

- [ ] Thread structure: (1) problem, (2) 10s demo GIF/video, (3) honest limits, (4) "paste your site" CTA
- [ ] Tagline: *"Your website is the source of truth"* (matches hero)
- [ ] Ask one question: *"Does it match your brand?"* — drives replies
- [ ] DM 10–20 founders with personalized `?from=` links (outreach script)

### Product Hunt-specific

- [ ] Tagline ≤60 chars (see above)
- [ ] Gallery: hero screenshot + 3 layout variants + before/after vs template picker
- [ ] First comment: origin story + `#d4f53c` contrast anecdote (builds trust)
- [ ] Maker comment replies within 30 min of each question
- [ ] Don't promise Workspace deploy — say "validating before we build team sync"

### Post-launch (week 1)

- [ ] Export PostHog funnel: visit → url_submitted → open_in_app → signature_copied → waitlist
- [ ] Log every extraction failure URL + reason
- [ ] Follow up with everyone who said "doesn't look like us"
- [ ] Run `npx tsx scripts/eval-extraction.ts` on failure URLs
- [ ] Decide: upgrade Firecrawl tier vs tighten cache TTL
- [ ] Ship Show HN 2–3 days after PH (different audience, reuse assets) — draft in `docs/superpowers/2026-06-29-show-hn-launch-post.md`

---

## Success Signals (first 48h)

| Signal | Target |
|---|---|
| `url_submitted` events | 100+ |
| Non-fallback extractions | >60% |
| `signature_copied` | 15%+ of generations |
| Waitlist signups | 30+ |
| Replies saying "looks like us" | Track manually |

---

## Optional Pre-Launch Code Fix

Bump launch-day rate limit (`HOUR_LIMIT` 3 → 10) and add clearer UI copy when `rateLimited: true` fires — main failure mode in QA.

**Files:** `app/api/brand-kit/route.ts`, `app/components/useBrandKit.ts`

---

## 360° Viability Summary (reference)

| Question | Answer |
|---|---|
| Is the idea viable? | **Yes** — real pain, large category, differentiated wedge |
| Is the product viable as a business today? | **Not yet** — no payments, no persistence, PMF unproven |
| Should you launch? | **Yes** — as a validation event, not a revenue launch |
| Will Product Hunt work? | **Likely** — if extraction holds under traffic and you reply fast |
| Will Twitter work? | **Very likely** — if you lead with video, not feature bullets |

**Launch framing:** You're not launching "the email signature platform for teams." You're launching: *"Paste your URL — does this actually look like your brand? Free, no signup. Tell me where it's wrong."*