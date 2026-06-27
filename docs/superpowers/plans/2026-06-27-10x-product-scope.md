# 10x Product Scope — From Demo to Delight

*Date: 2026-06-27*
*Addresses the gap between "it works" and "holy shit"*

---

## Current State

A user pastes a URL → waits 5–35s → sees 3 signatures → thinks "neat" → leaves.

The extraction pipeline is now reliable (multi-page scrape, `/extract` parallel path, proxy retry, mobile fallback, CJK font mapping, confidence badges). But the interaction hasn't changed since day one. There is no wow, no delight, no reason to come back.

## The 10x Claim

Competitors make you: pick template → fill 15 fields per person → deploy via IT → days.

Current us: paste URL → signatures → 5–35s.

**10x us:** don't type anything → signature appears before you know you need it.

The gap isn't extraction quality. It's *initiative*. The product should do the work before the user asks.

---

## Wow Moments (Ranked by Impact)

### Wow #1 — Zero-Input Onboarding (Highest leverage)

The `/app` page loads. User sees nothing to fill. Instead:
- Browser detects the current tab URL (via extension) or referrer
- Searches Crunchbase/LinkedIn for the user's company
- Shows: "Is this your company? [logo] [name]" — one click confirm
- Then: "Is this you? [name] [email]" — one click confirm
- Three signatures render instantly

**Holy shit factor:** User didn't type anything. The product found them.

### Wow #2 — The Extension

Chrome/Firefox/Safari extension. User is on their company website → clicks extension icon → signature is copied to clipboard in <2s. No navigation, no typing, no page load.

**Holy shit factor:** It lives where they work. One click from anywhere.

### Wow #3 — Before/After Slider

On the landing page, a live slider. Left side: a WiseStamp-style 15-field form. Right side: one URL input. User drags the slider → sees the form disappear. No copy needed.

**Holy shit factor:** Visual proof of friction eliminated, not a claim.

### Wow #4 — "It Knows Me"

Extension detects user is on `company.com` → extracts brand → also pulls their name from the page (if on a `/team` page) or from the LinkedIn URL in their clipboard. Pre-fills everything. User just confirms.

**Holy shit factor:** It guessed my name and title correctly.

### Wow #5 — Live Preview as You Type

Not after pressing Enter. As the user types the URL character by character, the product already shows a partial signature (favicon + domain name from Firecrawl /search). By the time they finish typing, they've already seen something.

**Holy shit factor:** The preview starts before the URL is entered.

### Wow #6 — Outlook-safe Guarantee + One-click Deploy

After generation, a single "Copy HTML" button that actually works (copies HTML, not escaped text). Then: "Deploy to Gmail" → OAuth → signature installed. Done.

**Holy shit factor:** From zero to live signature in 3 clicks.

---

## Technical Approach

### Phase 1 — The `/app` Guided Flow (2–3 days)

```
Flow:
  1. User opens /app
  2. Single prompt: "Enter your company website or name"
  3. Backend: Firecrawl /search for "company.com email signature" →
     also Firecrawl /search for "{company} linkedin" → extract LinkedIn URL
  4. Show confirmation card: [logo] [company name] → "Is this right?"
  5. Then: "Enter your name and title" (2 fields, not 15)
  6. Three signatures render
  7. One-tap copy or deploy
```

**What it changes:**
- URL input becomes optional (user can type a company name)
- Brand extraction happens in background during confirmation step
- Perceived time: instant (because the extraction is hidden behind the confirmation)

**Files touched:**
- `app/app/page.tsx` — the guided flow
- `app/api/brand-kit/route.ts` — add `companyName` search param as alternative to URL
- `app/components/GuidedFlow.tsx` — new component, confirmation cards + minimal form
- `lib/extract-brand-kit.ts` — accept company name, Firecrawl /search to find the domain

### Phase 2 — The Extension (1 week)

Chrome extension (Manifest V3):

```
Architecture:
  - Content script: detect company logo + name from current page's meta tags
  - Popup: show preview with "Copy HTML" button
  - Background: open /api/brand-kit with the detected URL
  - Optional: scan `/team` page for names/titles to pre-fill
```

**The killer path:** User browses → clicks extension → signature copies to clipboard. No navigation away from what they're doing.

### Phase 3 — Live Preview on Landing Page (1 day)

The landing page hero already has the URL input. Make it live:
- On keystroke, show a skeleton placeholder
- On Enter, stream the signature preview inline (below the input, same page)
- No page transition, no loading spinner, no separate page

**Effect:** The landing page IS the product. Every visitor sees their brand in 9 seconds without signing up.

---

## Differentiation Matrix

| Dimension | Incumbents (WiseStamp, Exclaimer) | Current Us | 10x Us |
|---|---|---|---|
| Input required | 15+ fields, hex codes, template picker | URL only | Nothing (auto-detect) |
| Time to signature | Days (IT deploy) | 5–35s | 0–3s (extension) |
| Deployment | IT ticket, PowerShell, GPO | "Copy HTML" | One-click OAuth |
| Team management | CSV upload, manual entry | Doesn't exist | Auto-detect from org chart |
| Where it lives | Web app only | Web app only | Browser extension + web |
| Brand recognition | Manual entry | URL → extract | URL + auto-suggest + search |
| Design taste | Template gallery (2014) | 3 editorial layouts | 3 editorial layouts + AI layout match |
| Confidence transparency | None | Per-field badges | Per-field badges + suggested edits |

---

## Implementation Phases

### Phase 1 — Guided `/app` (Now)

```
Scope:
  - /app shows a confirm-your-company card instead of a URL input
  - Firecrawl /search finds the domain from company name
  - Extraction runs in background during confirmation
  - User enters name + title (2 fields, not 15)
  - Three signatures render
  - Copy HTML button

Why it's Phase 1:
  - No extension, no new platform
  - Pure frontend + API changes
  - Delivers the "it found me" feeling in 2–3 days
  - Validates whether zero-input onboarding actually improves conversion
```

### Phase 2 — Chrome Extension (1 week)

```
Scope:
  - Manifest V3 extension
  - Content script: extract page meta + logo from current tab
  - Popup: preview + copy
  - Optional: auto-scan /team page for names
  - Store recent signatures locally

Why Phase 2:
  - Extension requires Chrome Web Store publishing (1–2 day review)
  - The distribution moat: extension lives in the browser, not a bookmark
  - Extension is the "holy shit" demo for in-person pitches
```

### Phase 3 — Landing Page Live Preview (1 day)

```
Scope:
  - Hero URL input renders signatures inline (no page transition)
  - Skeleton loading state as extraction runs
  - "Made with Signet" footer on output
  - No signup required

Why Phase 3:
  - Makes the landing page the product
  - Every visitor becomes a demo
  - SEO value: "email signature generator" searchers get results instantly
```

### Phase 4 — Gmail One-Click Deploy (Post-validation)

```
Scope:
  - Google OAuth
  - Gmail API: update signature server-side
  - "Deploy to Gmail" button after generation
  - Requires Google Cloud Project + OAuth consent screen

Why Phase 4:
  - Requires GCP setup, OAuth, security review
  - Only worth building if Phase 1–3 show retention
  - This is the deploy moat incumbents charge $8–19/seat for
```

---

## What "10x" Actually Means Here

The incumbents make you work. The current demo makes you type a URL. **10x means you don't even do that.**

The metric isn't extraction accuracy (already ~90% for well-structured sites). The metric is **seconds from intent to signature.** Today: ~15s (open tool → type URL → wait → copy). With extension + auto-detect: <2s.

**2s vs 15s is not 10x. It's 100x perception shift** because the user never even thinks "I should set up my signature" — they just see it ready.

---

## Risk

| Risk | Probability | Mitigation |
|---|---|---|
| Extension doesn't get Chrome Web Store approval | Low | Standard manifest V3, no permissions beyond `activeTab` |
| Users don't want auto-detect (privacy) | Medium | Make it opt-in per session, show a "why this matters" tooltip |
| /app guided flow feels too invasive | Low | Keep the URL input as a fallback — "I'll type it myself" link |
| Firecrawl /search can't find the domain from a company name | Medium | Fall back to URL input; also show "try pasting your website URL" |
| Extraction behind confirmation feels slow if backend isn't cached | Medium | Warm the cache on `/app` load (Firecrawl /search runs before confirmation) |
