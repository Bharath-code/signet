# Ship review + 10x roadmap — 2026-07-02

Full-codebase bug hunt before launch, then the value roadmap. Fixes landed the
same day are checked; unchecked items are open. Details (repro + fix rationale)
live in the session transcript; file refs below are post-fix.

## Part 1 — Pre-ship fixes

### P0 — broke the core flow

- [x] **#1 Landing "Copy my signature — free" CTA dropped the kit for most sites.**
      Empty-string contact fields (`linkedin: ''` etc.) failed `contactSchema`'s
      `.url()`/`.email()` → `decodeKitParam` → null → neutral kit + demo fields
      at the conversion point. Fixed via shared codec (`lib/kit-codec.ts`):
      writers strip blanks, reader tolerates `''`. Round-trip unit-tested.
- [x] **#2 CTA button href skipped `safeHref`.** `?from=javascript:alert(1)` with a
      preloaded kit landed in the copied signature HTML. Now scheme-validated at
      the sink (`lib/render-signature.ts`), unsafe → inert `#`. Test added.
- [x] **#3 Verify `RESEND_API_KEY` is set in Vercel prod** (`vercel env ls`).
      Confirmed 2026-07-04: project linked, key set.
      Without it `/api/waitlist` 503s → export gate is a dead end (2 of 3 layouts
      permanently locked) and every waitlist submit errors. Config, not code.

### P1 — real bugs

- [x] **#4 Rate-limited/failed generation wiped the user's good kit** back to
      neutral (`setKit` ran unconditionally). Now gated by `hadKit` ref in
      `useBrandKit`; degraded-extract (real salvage) still applies.
- [x] **#5 Team-share link ignored color/font edits** (roles + font live outside
      `BrandKit`). Share links now encode `roles` + `font`; preload restores them.
- [x] **#6 Non-ASCII company names corrupted `?kit=` links** (base64 `+` →
      space via URLSearchParams). Codec emits base64url; decoder also accepts
      legacy base64 and the mangled-`+` form, so already-sent outreach links work.
- [x] **#7 Waitlist returned `ok:true` even when every Resend op failed**
      (`allSettled` never inspected; SDK resolves with `{error}` instead of
      throwing). Now 502 when all ops fail, warn-log on partial failure.
- [x] **#8 Non-hex color from Firecrawl `/extract` degraded the whole extraction**
      (`brandKitSchema.parse` threw in the merge). `/extract` colors now run
      through exported `normHex`; invalid → field simply not contributed.

### P2 — known, shipped anyway

- [x] **#11 Fallback responses flipped the "extracted" UI** (labels + share
      section for a neutral kit) — fixed as a side effect of #4 (`setSiteUrl`
      only on real kits).
- [ ] **#9** In-process rate limiter + caches are per-instance on Vercel (limits
      multiply across warm instances; `rateMap.clear()` at 10k resets everyone;
      response cache never evicts). Upgrade path: Upstash counter.
- [x] **#10** Contact fallback grabs the first email regex match on the page —
      can surface `support@`/`privacy@` as the user's own. Fixed: `ROLE_INBOX`
      prefix filter in `extractContactFromContent`; first non-role email wins,
      role-only pages surface no email.
- [x] **#12 Pricing/FAQ copy contradicts the product** — copy aligned to
      reality: Free = 1 layout instantly + all 3 with a free email, no
      watermark claim; Pro tier drops "all 3 layouts"/"no footer" lines
      (differentiates on saved kits, roles, share links, priority extraction).
- [x] **#13** Bare X handles render broken links (`@acme` → `https://@acme`).
      Fixed in `render-signature.ts`: no dot/slash → `https://x.com/<handle>`.
      Unit-tested (bare, @-prefixed, full-URL passthrough).
- [ ] **#14** Firecrawl `/extract` is deprecated (SDK maintenance mode) — plan
      migration for the contact-info path. *Migration note:* only caller is
      `extractBrandKit`'s contact/salvage pass; replace with a `scrapeSite`
      JSON-mode scrape (same schema) or lean on the deterministic
      `extractContactFromContent` fallback. Do it when the SDK warns at
      runtime or the endpoint 4xxs — no behavior change until then.
- [x] **#15** Neutral kit logo hotlinks placehold.co — now self-hosted
      (`public/logo-placeholder.png`, 240×80 raster) via `SITE_URL`;
      `lib/site.ts` also reads `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL` so
      the client bundle resolves the prod domain.
- [x] **#16** Repo hygiene: gitignored `brag-output*/`, `config/`,
      `tsconfig.tsbuildinfo` (untracked from index).

Verification: 88/88 tests pass (7 new: codec round-trips incl. CJK + legacy
links, CTA scheme validation), `npm run build` clean.

## Part 2 — 10x roadmap

Spine: one-shot generator → durable personal asset → continuous monitor →
deployed team asset. Pricing power scales with value *duration*. Phases gate on
signals per MASTER-PLAN (validate-first, no infra ahead of paid-team signal).

### Phase 1 — Bulletproof output (now → launch +2wk, no gate)

- [ ] **1a Logo re-hosting** (Vercel Blob proxy at copy-time, 2× PNG).
      *AC:* copied `<img src>` on our domain; source 404 after copy doesn't
      break signatures; SVG rasterized; copy latency +<1s.
- [ ] **1b Client-matrix verification.**
      *AC:* documented pass for all 3 layouts in Gmail web, Outlook web,
      Outlook desktop, Apple Mail (logo, borders, font fallback, CTA).
      Failures become renderer fixes before Phase 2.
- [x] **1c Shared kit codec** — done (see #1/#5/#6). Remaining half:
- [ ] **1c′ Short server-side share links** (KV slug, `signet.app/s/ab12cd`).
      *AC:* URL <40 chars; round-trip preserves edits; per-slug open tracking.
- [ ] **1d Download as PNG** (mobile Gmail / some Outlook builds can't paste HTML).
      *AC:* one-click 2× PNG; PostHog splits copy-html vs download-png.

### Phase 2 — Durability per person (gate: extraction→copy conversion >25%)

- [ ] **2a Magic-link accounts + saved kits** (export-gate email is the key; no
      passwords/OAuth). *AC:* email link restores last kit+fields <5s; unlock
      survives refresh; zero-account flow untouched.
- [ ] **2b Brand-drift monitor** — weekly re-scrape of saved kits; "your site
      changed" email with one-click regenerate. The retention hook no template
      tool can copy. *AC:* detects logo/primary-color change <7 days; email
      links to pre-loaded diff; false positives <1/user/month.

### Phase 3 — Team tier (gate: first paying team OR 3+ "team" waitlist segments from one domain)

- [ ] **3a Team workspace** — admin locks brand; invite link; members fill
      name/title only; admin-set role presets (parked CTA-scaling plan lands here).
      *AC:* invite→copied signature <60s with zero brand editing; admin edit
      propagates; 5-member team onboards unassisted.
- [ ] **3b Google Workspace deploy** — Gmail `sendAs` signature API, domain-wide
      delegation. The moat. *AC:* admin OAuth → all member signatures written
      without member action; re-deploy on brand change; signature-scope only.
- [ ] **3c Stripe** — $49 one-time Pro / team sub per locked GTM; checkout only.
      *AC:* payment unlocks tier server-side (not client state); refund path
      documented; first dollar before more billing infra.

### Deliberately not on the roadmap

- Manual from-scratch editor (shelved — no-website users aren't the ICP)
- Outlook/M365 deploy (sequence after Workspace proves the motion)
- Durable rate limiting / KV extraction cache (add when Firecrawl spend hurts)
