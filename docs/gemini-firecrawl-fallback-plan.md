# Gemini Reliability + Firecrawl Branding Fallback Plan

**Date:** 2026-06-24  
**Goal:** Reduce dependency on Gemini vision during high traffic or provider instability by using Firecrawl more fully, adding cheaper fallback models only where needed, and caching brand extraction aggressively.

## Executive Summary

Gemini should not be the primary dependency for every brand-kit generation. The current pipeline uses Firecrawl mainly as a rendered scraper and screenshot provider, then relies on Gemini to interpret the screenshot and HTML.

That is fine for a validation demo, but fragile for production:

- Gemini can return 503/high-demand errors.
- Vision model calls add latency.
- Vision calls are unnecessary when brand data can be extracted deterministically.
- High traffic will amplify provider instability and quota limits.

The production-oriented path is:

```txt
Firecrawl branding format
  -> deterministic HTML/CSS/meta extraction
  -> cheap vision fallback
  -> premium/stable vision fallback
  -> neutral/degraded fallback
```

The highest-leverage improvement is not switching from Gemini to another model. It is **calling vision models less often**.

## Current Pipeline

Current flow:

```txt
User URL
  -> POST /api/brand-kit
  -> scrapeSite()
       Firecrawl formats: markdown, html, links, screenshot
  -> extractBrandKit()
       Gemini vision + HTML + markdown
  -> brandKitSchema validation
  -> renderSignature()
```

Current Firecrawl usage:

```ts
formats: ['markdown', 'html', 'links', 'screenshot']
```

This means Firecrawl is being used for:

- rendering JavaScript-heavy sites
- extracting HTML
- extracting markdown text
- collecting links
- capturing a screenshot

Firecrawl is **not yet being used as the primary brand extractor**.

## Target Pipeline

### Priority Order

1. **Firecrawl branding extraction**
   - Use Firecrawl's brand/branding format if available in the installed SDK.
   - Extract logo, colors, fonts, and brand signals directly.
   - This should satisfy the majority of requests without any LLM vision call.

2. **Deterministic local extraction**
   - Keep and improve existing helpers:
     - `themeColorFromHtml()`
     - `brandColorsFromCss()`
     - `fallbackKitFromMeta()`
     - `socialsFromLinks()`
   - Extract from:
     - `meta[name="theme-color"]`
     - Open Graph title/site name/image
     - favicons
     - CSS custom properties
     - common logo image patterns
     - footer/header social links

3. **Cheap vision fallback**
   - Use only when Firecrawl branding + deterministic extraction are incomplete.
   - Candidate: Groq Llama 4 Scout vision, Qwen VL, or other cheap multimodal JSON-capable model.
   - Must return structured JSON and pass `brandKitSchema`.

4. **Stable premium fallback**
   - Use OpenAI mini vision model or Gemini fallback model only when cheap fallback fails or returns low-confidence data.
   - This protects quality without making expensive calls the default.

5. **Graceful degraded fallback**
   - Preserve current invariant: `/api/brand-kit` always returns HTTP 200.
   - If all extraction fails, return neutral or metadata-derived brand kit with `fallback: true`.

## Proposed Architecture

```txt
POST /api/brand-kit
  -> normalize URL
  -> check durable cache
  -> check rate limit
  -> scrape/enrich site with Firecrawl
      -> html
      -> markdown
      -> links
      -> screenshot
      -> branding data if supported
  -> buildBrandKitFromFirecrawl()
  -> mergeBrandKitCandidates()
  -> calculate confidence score
  -> if confidence high:
       return brand kit
     else:
       call cheap vision fallback
  -> if cheap vision fails:
       call premium fallback if configured
  -> validate through brandKitSchema
  -> cache result
  -> return response
```

## New Internal Types

Create an internal candidate shape before final schema validation:

```ts
type BrandKitCandidate = {
  companyName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  source: 'firecrawl-branding' | 'css' | 'meta' | 'vision' | 'neutral';
  confidence: {
    companyName: number;
    logoUrl: number;
    colors: number;
    fontFamily: number;
    overall: number;
  };
};
```

Then convert to final:

```ts
type BrandKitResult = {
  brandKit: BrandKit;
  contact: Partial<SignatureFields>;
  finalUrl: string;
  fallback: boolean;
  degraded?: 'scrape' | 'extract' | 'vision' | 'rate-limit';
  confidence?: BrandKitCandidate['confidence'];
  sources?: string[];
};
```

## Confidence Scoring

Use confidence to decide whether to call vision.

Suggested thresholds:

- `overall >= 0.8`: return without vision.
- `overall >= 0.6`: return without vision but mark `degraded: 'extract'`.
- `overall < 0.6`: call cheap vision fallback.

Suggested scoring:

```txt
companyName:
  1.0 from og:site_name or branding result
  0.7 from title
  0.3 from hostname

logoUrl:
  1.0 from Firecrawl branding logo
  0.8 from og:image if likely image
  0.7 from favicon
  0.0 if neutral placeholder

colors:
  1.0 from branding color palette
  0.8 from CSS variables / theme-color
  0.5 from LLM guess
  0.2 neutral

fontFamily:
  1.0 from branding typography
  0.7 from CSS font-family analysis
  0.5 from LLM guess
  0.2 neutral
```

## Caching Plan

Current cache TTL is 1 hour. For brand extraction, that is too short.

Recommended:

- Cache successful brand kits for **7-30 days**.
- Cache scrape failures for **15-60 minutes**.
- Cache rate-limit responses only indirectly through rate limiter, not as brand results.
- Cache by normalized domain, not full path, unless future product supports page-specific signatures.

Suggested key:

```txt
brand-kit:v2:{hostname}
```

Use Vercel KV, Upstash Redis, or another durable cache before real launch. In-memory cache is acceptable only for local/demo traffic.

## Provider Fallback Plan

### Environment Variables

Add:

```bash
BRAND_VISION_PROVIDER=groq
BRAND_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
BRAND_VISION_FALLBACK_PROVIDER=openai
BRAND_VISION_FALLBACK_MODEL=gpt-4.1-mini
BRAND_VISION_TIMEOUT_MS=12000
```

Keep:

```bash
GEMINI_MODEL=
GEMINI_FALLBACK_MODEL=
```

But stop treating Gemini as the only extractor.

### Recommended Provider Order

```txt
Default:
  Firecrawl branding + deterministic extraction

Cheap fallback:
  Groq vision / Qwen VL / other low-cost JSON-capable multimodal model

Premium fallback:
  OpenAI mini vision model or Gemini fallback model

Final:
  metadata/neutral fallback
```

## Firecrawl Capability Audit

Before implementation, inspect the installed Firecrawl SDK types:

```bash
rg "branding|formats" node_modules/@mendable/firecrawl-js -n
```

Confirm whether the installed SDK supports:

- `formats: ['branding']`
- branding result shape
- logo output shape
- color palette output shape
- typography output shape

If SDK support is missing:

1. Check Firecrawl API docs.
2. Upgrade `@mendable/firecrawl-js`.
3. If still unavailable, call the Firecrawl REST endpoint directly for branding.

## Implementation Steps

### Phase 1: Fix Launch Blockers

1. Fix `ADMIN_COPY` build failure in `app/components/SignatureDemo.tsx`.
2. Align pricing/copy promise:
   - Either Free includes copy with footer,
   - or landing no longer says Free includes Copy HTML.
3. Tighten iframe sandbox if popups are not required.
4. Run:

```bash
npm test
npm run build
```

### Phase 2: Add Firecrawl Branding Extraction

1. Extend `scrapeSite()` to request branding if SDK supports it.
2. Add a `branding` field to `ScrapeResult`.
3. Create:

```txt
lib/build-brand-kit-from-firecrawl.ts
```

4. Convert Firecrawl branding result into `BrandKitCandidate`.
5. Unit-test Firecrawl branding conversion with fixture JSON.

### Phase 3: Add Candidate Merge + Confidence

1. Create:

```txt
lib/brand-kit-candidates.ts
```

2. Merge candidates from:
   - Firecrawl branding
   - metadata fallback
   - CSS colors
   - existing LLM result
3. Prefer higher-confidence fields.
4. Validate final object with `brandKitSchema`.
5. Unit-test:
   - branding wins over neutral
   - CSS color wins over LLM color when deterministic
   - invalid logo URL is rejected
   - low-confidence result triggers vision fallback

### Phase 4: Make Vision Optional

1. Rename current `extractBrandKit()` into a more explicit vision fallback:

```txt
extractBrandKitWithVision()
```

2. Create a new orchestrator:

```txt
extractBrandKit()
```

that:

- tries Firecrawl branding candidate first
- uses deterministic extraction
- calls vision only below confidence threshold

3. Add provider abstraction:

```ts
type VisionProvider = 'gemini' | 'groq' | 'openai';
```

4. Add timeout and fallback behavior per provider.

### Phase 5: Durable Cache + Observability

1. Add durable cache for brand kits.
2. Track extraction source:

```txt
firecrawl_branding_success
deterministic_success
vision_fallback_called
vision_fallback_failed
brandkit_confidence
brandkit_cached
```

3. Add server logs with provider/model/source but never log API keys.

## Testing Plan

### Unit Tests

Add tests for:

- Firecrawl branding result conversion.
- Candidate confidence scoring.
- Candidate merge ordering.
- Vision fallback trigger threshold.
- Invalid/missing logo fallback.
- Cache key normalization.

### Integration Tests

Use a fixed fixture set:

- Simple static SaaS site.
- JS-heavy modern site.
- Personal portfolio.
- Agency site.
- Site with no visible logo.
- Site with weak/ugly branding.
- Site returning error page.

### Manual QA

For each test site:

1. Paste URL.
2. Confirm extraction source.
3. Confirm logo is not broken.
4. Confirm colors are plausible.
5. Confirm font maps to email-safe font.
6. Confirm preview renders.
7. Confirm copy/export works.

## High-Traffic Controls

Before public launch:

- Durable cache with 7-30 day TTL.
- Domain-level dedupe so repeated URLs do not cause repeated provider calls.
- Per-IP and per-domain rate limits.
- Provider timeout.
- Provider circuit breaker:

```txt
If Gemini/Groq/OpenAI fails 5 times in 5 minutes:
  disable that provider for 10 minutes
  use Firecrawl/deterministic fallback only
```

- Queue background re-extraction if needed.
- Show usable degraded result instead of spinner failure.

## Product UX Changes

Expose extraction quality softly:

```txt
Logo: extracted
Colors: extracted
Font: closest email-safe match
Links: found from site
```

If degraded:

```txt
We found your logo and company name. Colors are our best guess; adjust them below.
```

Do not show raw provider errors to users.

## Cost Strategy

The cheapest model is the model you do not call.

Cost priority:

1. Cache hit: near zero.
2. Firecrawl branding/deterministic: low and stable.
3. Cheap vision fallback: acceptable for low-confidence cases.
4. Premium vision fallback: reserved for quality recovery.

The goal should be:

```txt
>= 70% of successful generations do not call a vision model
<= 25% call cheap vision fallback
<= 5% call premium fallback
```

## Final Recommendation

Do not simply swap Gemini for another vision model.

Implement Firecrawl branding as the primary extraction path, add confidence scoring, then make vision a fallback. This will improve reliability, reduce latency, reduce cost, and make the product less dependent on any one AI provider.

Production readiness target:

```txt
Build passes
Tests pass
Firecrawl branding path works
Vision fallback is optional
Brand kits cached for 7-30 days
User always sees a usable signature
```

