# AI-Native Email Signature Generator — Demo Design

**Date:** 2026-06-21
**Status:** Approved, ready for implementation plan
**Scope:** The 1-day validation demo only (the hero "paste URL → branded signature" moment). NOT the full MVP.

## Purpose

Validate the core magic of the email-signature product before building the MVP:
**paste a website URL → in seconds, see a perfectly branded email signature.**

This is the validation gate from `micro-saas-idea-analysis.md`: build the hero demo
as a free landing page, drive ~100 visitors, and only proceed to the 2-week MVP if
it converts (≥5 emails captured per 100 visitors).

## Success Criteria

- A visitor pastes any company URL and sees 3 branded signature options within ~10s.
- Signatures use the company's real logo, brand colors, and font.
- The preview is alive on page load (pre-filled demo data) — no form-filling required to see the magic.
- An email-capture CTA lets interested visitors ask for the team-deploy version.
- Runs at $0 infra cost for ~100 visitors. No headless browser to maintain.

## Out of Scope (YAGNI for the demo)

- Auth, accounts, database, Stripe/payments.
- Photo upload, social icons, address, multi-language.
- Gmail/Outlook install flow, Google Workspace OAuth, team deploy.
- Microsoft 365 / Exchange.
- These belong to the MVP, added only if the demo converts.

## Architecture

Single Next.js app. One API route orchestrates the extraction; the page renders the result.

```
Browser (paste URL + 4 pre-filled fields)
   │  POST /api/brand-kit { url }
   ▼
API route (server)
   ├─ Firecrawl scrape(url)  ──► clean HTML + homepage screenshot
   ├─ Vercel AI SDK generateObject(google('gemini-2.0-flash'),
   │     schema, [screenshot + HTML])  ──► typed BrandKit
   └─ return BrandKit JSON
   ▼
Browser
   └─ renderSignature(brandKit, fields, layout)  ──► table-based HTML
       └─ live preview of 3 layouts in iframes
```

### Locked stack

- **Next.js** (App Router) — single app, API route + page.
- **Firecrawl** (hosted API, free tier) — scrape + screenshot. No self-hosted browser.
- **Vercel AI SDK** (`ai` package) + **Google Gemini 2.0 Flash** — `generateObject` with a
  Zod schema for typed brand-kit extraction. Provider is swappable (one-line change to
  `anthropic(...)` if quality disappoints).

### Why this stack

- Firecrawl's free tier (1,000 scrapes/mo) covers the demo at $0 and handles JS-heavy sites.
- Gemini Flash vision is ~$0.001/image (~$0.10 for 100 runs) with a free tier.
- Screenshot + vision is *less* code than parsing CSS for colors/fonts, and higher fidelity.
- No headless browser = no "heavy infra" the analysis doc warned against.

## Components (each independently understandable)

| Unit | Does | Depends on |
|---|---|---|
| `POST /api/brand-kit` | URL → BrandKit JSON. Orchestrates scrape + extract. | Firecrawl, AI SDK |
| `scrapeSite(url)` | Returns `{ html, screenshotUrl }`. | Firecrawl SDK |
| `extractBrandKit(html, screenshotUrl)` | Returns typed `BrandKit` via `generateObject`. | AI SDK + Gemini |
| `renderSignature(brandKit, fields, layout)` | Pure function → table-based HTML string. | none |
| Page UI | URL input, 4 pre-filled fields, 3 live previews, email-capture CTA. | the above |

### Data shapes

```ts
type BrandKit = {
  companyName: string;
  logoUrl: string;
  primaryColor: string;    // hex
  secondaryColor: string;  // hex
  fontFamily: string;
};

type SignatureFields = {
  fullName: string;   // pre-filled: "Alex Rivera"
  jobTitle: string;   // pre-filled: "Head of Sales"
  email: string;      // pre-filled: "alex@company.com"
  phone: string;      // pre-filled: "+1 (555) 012-3456"
};

type Layout = 'minimal' | 'logo' | 'logo-cta';
```

### The three layouts (same data, different arrangement)

1. **minimal** — name, title, company, brand-color divider, website link.
2. **logo** — scraped logo left, details right, brand-color accent.
3. **logo-cta** — layout 2 plus a brand-color CTA button ("Visit website").

All three use the scraped logo (no photo upload). All three need only the 4 personal fields.

## Field strategy

- **Auto from scrape:** company name, logo, primary/secondary color, font, website URL.
- **User-entered (4, pre-filled with demo placeholders):** full name, job title, email, phone.
- Preview is alive on page load using the placeholders, so the branded signature appears
  before the user types — edits feel like tuning, not work.

## Rendering correctness

- Signatures are **table-based HTML with inline CSS** (the Outlook-safe pattern). Logo is a
  hosted image URL, not embedded. This is the one genuinely careful part, but it's a solved,
  copyable pattern — not novel work.
- For the demo, preview each layout in an `<iframe>` so its inline styles render in isolation.

## Error handling

- Invalid / unreachable URL → friendly inline message, keep the pre-filled demo signature visible.
- Firecrawl failure or timeout → fall back to a neutral brand kit (gray/serif) so the user still
  sees *a* signature, with a "couldn't read that site — try another" note.
- Gemini returns malformed data → Zod validation catches it; retry once, then neutral fallback.
- Never block the page on a failed scrape; the magic-moment UI must always show something.

## Testing

- One unit test on `renderSignature` (pure function): asserts each layout includes the brand
  color, logo URL, and all four fields. This is the only logic with real branching.
- Manual: paste 3–4 real company URLs (a JS-heavy SaaS, a simple static site, an agency) and
  eyeball the previews across Gmail + Outlook web. No e2e framework for a 1-day demo.

## Validation gate (what this demo is for)

Drive ~100 visitors. If ≥5 enter their email asking for the team-deploy version, proceed to the
2-week MVP. If not, the hero demo didn't sell the magic — fix the demo before building more.

## Keys required (free)

- Firecrawl API key.
- Google AI Studio (Gemini) API key.
