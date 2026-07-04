# Firecrawl JSON-Mode Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the deprecated Firecrawl `/extract` call with JSON mode riding on the primary scrape (one API call instead of two), add `buttonPrimary.background` as a deterministic accent-color signal, and drop the undocumented `stealth` proxy tier.

**Architecture:** The zod schema and prompt that today power `extractViaFirecrawlExtract` move to `lib/scrape-site.ts`, where they're attached to the primary scrape as a `{ type: 'json', prompt, schema }` format. The parsed result travels on `ScrapeResult.fcJson` → route → `extractBrandKit(opts.fcJson)`. `extractBrandKit` loses its `/extract` call, cache, and timeout (~60 lines deleted); every downstream merge/priority rule is unchanged. Firecrawl's official guidance ("Choosing the Data Extractor") marks `/extract` as "use /agent instead" and recommends scrape JSON mode for single known URLs — cheapest (5 credits/page flat), synchronous, no job polling.

**Tech Stack:** `@mendable/firecrawl-js@4.28.2` (installed; `JsonFormat = { type: 'json', prompt?, schema? }`, result on `Document.json`), zod v4 (`z.toJSONSchema` for the wire schema), vitest.

## Global Constraints

- `POST /api/brand-kit` must never return non-200 and never throw to the client (CLAUDE.md invariant).
- `ExtractResult.source` values stay exactly `'firecrawl' | 'extract' | 'vision' | 'degraded'` — the UI and eval script read them.
- Colors reaching `brandKitSchema.parse` must be strict hex; non-hex JSON-mode colors are normalized via `normHex` (invalid → undefined) before the merge, same as `/extract` today.
- No new dependencies. No comments in generated code beyond constraint-stating ones (user's global CLAUDE.md).
- Verify SDK call shapes against installed `.d.ts`, not docs (project CLAUDE.md) — shapes cited here were verified against `node_modules/@mendable/firecrawl-js/dist/index.d.ts` on 2026-07-04.
- `npm run build` is the type gate (no ESLint). Full suite: `npm test` (89 tests green before this work).

## Acceptance Criteria

1. **One Firecrawl call on the happy path.** A user request for a well-branded site produces exactly one Firecrawl API call (the primary scrape). `firecrawlClient.extract` is gone from the codebase (`grep -rn "\.extract(" lib app` → no matches).
2. **Contact info still extracted.** With JSON-mode data present, `extractBrandKit` returns the same `contact` fields (`fullName`, `jobTitle`, `email`, `phone`, socials) it returned via `/extract` — proven by the updated `lib/extract-brand-kit.test.ts` suite.
3. **Gemini-outage degradation preserved.** With `geminiResult` undefined and `fcJson` present, the merge still produces a real (non-NEUTRAL) kit tagged `source: 'extract'`; with both absent, `source: 'degraded'`.
4. **Vivid button background wins over grey palette.** A `BrandingProfile` with only grey `colors.*` but a vivid `components.buttonPrimary.background` yields that background as `primaryColor` — proven by a new test in `lib/brand-from-firecrawl.test.ts`.
5. **No `stealth` proxy usage.** `grep -n stealth lib/` → no matches.
6. **All tests and build green.** `npm test` passes (including new tests); `npm run build` passes.
7. **CLAUDE.md matches reality.** The extraction-pipeline section no longer references `/extract` as a separate call; it describes JSON mode on the primary scrape.

## File Structure

- Modify `lib/scrape-site.ts` — owns the JSON-mode schema/prompt, attaches the format, parses `doc.json` into `ScrapeResult.fcJson`. (Schema lives here, not in extract-brand-kit, because extract-brand-kit already imports from scrape-site; the reverse import would create a cycle.)
- Modify `lib/extract-brand-kit.ts` — deletes `/extract` machinery, consumes `opts.fcJson`.
- Modify `app/api/brand-kit/route.ts` — one line: pass `fcJson` through.
- Modify `lib/brand-from-firecrawl.ts` — `buttonPrimary.background` accent candidate.
- Test files: `lib/scrape-site.test.ts`, `lib/extract-brand-kit.test.ts`, `lib/brand-from-firecrawl.test.ts`.
- Modify `CLAUDE.md` — pipeline invariants.

---

### Task 1: JSON-mode schema, prompt, and parser in scrape-site

**Files:**
- Modify: `lib/scrape-site.ts`
- Test: `lib/scrape-site.test.ts`

**Interfaces:**
- Consumes: `normHex` from `./brand-from-firecrawl` (existing, no cycle: brand-from-firecrawl imports only logo-url).
- Produces: `export const fcExtractSchema` (zod object, all fields optional strings), `export type FcExtractData = z.infer<typeof fcExtractSchema>`, `export function parseFcJson(raw: unknown): FcExtractData | undefined`, and `ScrapeResult.fcJson?: FcExtractData`. Task 2 imports `FcExtractData`; Task 3 reads `scraped.fcJson`.

- [ ] **Step 1: Write the failing tests**

Append to `lib/scrape-site.test.ts`:

```ts
import { parseFcJson } from './scrape-site';

describe('parseFcJson', () => {
  it('parses valid json-mode output and normalizes colors to hex', () => {
    const out = parseFcJson({
      companyName: 'Acme',
      contactEmail: 'jane@acme.com',
      primaryColor: 'rgb(226, 58, 26)',
      secondaryColor: 'not-a-color',
    });
    expect(out?.companyName).toBe('Acme');
    expect(out?.contactEmail).toBe('jane@acme.com');
    expect(out?.primaryColor).toBe('#e23a1a');
    expect(out?.secondaryColor).toBeUndefined();
  });

  it('returns undefined for non-object or schema-violating input', () => {
    expect(parseFcJson(undefined)).toBeUndefined();
    expect(parseFcJson('nope')).toBeUndefined();
    expect(parseFcJson({ companyName: 42 })).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/scrape-site.test.ts`
Expected: FAIL — `parseFcJson` is not exported.

- [ ] **Step 3: Implement schema, prompt, parser, and format wiring**

In `lib/scrape-site.ts`:

Add imports (top of file):

```ts
import { z } from 'zod';
import type { FormatOption } from '@mendable/firecrawl-js';
import { normHex } from './brand-from-firecrawl';
```

(`pickEmailLogo`, `brandKitSchema` imports already exist; `FormatString` import stays.)

Add below the `BRAND_PATHS` constant (schema + prompt moved verbatim from extract-brand-kit, parser new):

```ts
// JSON mode rides on the primary scrape (replaces the deprecated /extract call):
// Firecrawl runs an LLM over the full page content server-side and returns the
// result on Document.json in the same response. All fields optional — results
// are validated against the strict brandKitSchema downstream.
export const fcExtractSchema = z.object({
  companyName: z.string().optional(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  fontFamily: z.string().optional(),
  contactName: z.string().optional(),
  contactRole: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  website: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  x: z.string().optional(),
  discord: z.string().optional(),
});
export type FcExtractData = z.infer<typeof fcExtractSchema>;

const BRAND_JSON_PROMPT = [
  'Extract brand identity from this website. Only return values that are actually visible on the page — do not guess or fabricate.',
  'companyName: the business or site name',
  'logoUrl: absolute URL of the logo image (from <img> tags, never the page URL)',
  'primaryColor: dominant brand accent color in #hex (NOT link-blue)',
  'secondaryColor: supporting dark/neutral color in #hex',
  'fontFamily: CSS font-family used for headings or body text',
  'contactName, contactRole, contactEmail, contactPhone: contact details found on the page',
  'website: the URL of this site',
  'linkedin, github, x, discord: absolute URLs to social profiles',
].join('\n');

const JSON_FORMAT: FormatOption = {
  type: 'json',
  prompt: BRAND_JSON_PROMPT,
  // zod v4 native JSON Schema conversion — avoids relying on the SDK's own
  // zod-3-era converter.
  schema: z.toJSONSchema(fcExtractSchema) as Record<string, unknown>,
};

// json-mode colors are untyped strings ("blue", "rgb(…)"); a non-hex value
// reaching brandKitSchema.parse downstream throws and degrades the whole
// result. Normalize here; invalid → undefined (field simply not contributed).
export function parseFcJson(raw: unknown): FcExtractData | undefined {
  const parsed = fcExtractSchema.safeParse(raw);
  if (!parsed.success) return undefined;
  parsed.data.primaryColor = normHex(parsed.data.primaryColor);
  parsed.data.secondaryColor = normHex(parsed.data.secondaryColor);
  return parsed.data;
}
```

Change `scrapeOnce` to attach the format on desktop scrapes (mobile and `scrapeExtra` stay json-free — the +4 credits/page for JSON mode is only worth paying once, on the primary page):

```ts
function scrapeOnce(url: string, maxAge: number, mobile = false, proxy: ProxyTier = 'auto') {
  return client.scrape(url, {
    formats: mobile
      ? (['markdown', 'html', 'links', 'screenshot'] as FormatOption[])
      : ([...SCRAPE_FORMATS, JSON_FORMAT] as FormatOption[]),
    onlyMainContent: false,
    blockAds: true,
    removeBase64Images: true,
    proxy,
    waitFor: parseInt(process.env.FIRECRAWL_WAIT_FOR ?? '', 10) || 3000,
    maxAge,
    ...(mobile ? { mobile: true, viewport: { width: 390, height: 844 } as const } : {}),
  });
}
```

Add to the `ScrapeResult` type:

```ts
  fcJson?: FcExtractData; // JSON-mode LLM output from the primary scrape (contact + brand text fields)
```

And in `scrapeSite`, add to the `result` object literal (next to `pageTitle`):

```ts
    fcJson: parseFcJson(doc.json),
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/scrape-site.test.ts`
Expected: PASS (existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add lib/scrape-site.ts lib/scrape-site.test.ts
git commit -m "feat: attach Firecrawl JSON mode to primary scrape, parse into ScrapeResult.fcJson"
```

---

### Task 2: extract-brand-kit consumes fcJson; delete /extract machinery

**Files:**
- Modify: `lib/extract-brand-kit.ts`
- Modify: `app/api/brand-kit/route.ts:91-100`
- Test: `lib/extract-brand-kit.test.ts`

**Interfaces:**
- Consumes: `FcExtractData` type from `./scrape-site` (Task 1). `ExtractOpts` gains `fcJson?: FcExtractData`.
- Produces: unchanged `ExtractResult` shape and `source` semantics. `clearExtractCache` export is **deleted** (its only consumer is the test file being updated here).

- [ ] **Step 1: Rewrite the test file (failing first)**

Replace `lib/extract-brand-kit.test.ts` in full. Mechanical transformation of the existing 5 tests: `mockExtract.mockResolvedValue({ success: true, data: X })` → `fcJson: X` in opts; `mockExtract.mockResolvedValue({ success: false, data: null })` → omit `fcJson`; drop `clearExtractCache` and `mockExtract`; keep `mockSearch` (name-search still calls `firecrawlClient.search`). One new test covers the vision-outage + fcJson merge path (acceptance criterion 3).

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractBrandKit } from './extract-brand-kit';
import { NEUTRAL_BRAND_KIT } from './brand-kit-schema';
import type { BrandingProfile } from '@mendable/firecrawl-js';

const { mockSearch } = vi.hoisted(() => ({
  mockSearch: vi.fn(),
}));

vi.mock('./scrape-site', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    firecrawlClient: { search: mockSearch },
  };
});

const BRANDING: BrandingProfile = {
  colors: { primary: '#D4FF33', secondary: '#0c0c0c' },
  images: { logo: 'https://example.com/logo.png' },
  typography: { fontFamilies: { heading: 'Inter' } },
};

const CSS_HTML = '<style>:root{--color-primary:#D4FF33;--color-secondary:#0c0c0c}</style>';
const FALLBACK_KIT = { ...NEUTRAL_BRAND_KIT, companyName: 'Existing Corp' };
const SCREENSHOT_URL = 'https://example.com/screenshot.png';
const BASE_URL = 'https://example.com';

describe('deterministic path — contact extraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extracts contact info from scrape JSON mode when deterministic brand kit is complete', async () => {
    mockSearch.mockResolvedValue({ web: [] });

    const result = await extractBrandKit(CSS_HTML, SCREENSHOT_URL, {
      branding: BRANDING,
      fallbackKit: FALLBACK_KIT,
      baseUrl: BASE_URL,
      links: ['https://linkedin.com/in/johndoe'],
      markdown: 'Welcome to Existing Corp',
      fcJson: {
        contactName: 'John Doe',
        contactRole: 'CEO',
        contactEmail: 'john@example.com',
        contactPhone: '+1234567890',
      },
    });

    expect(result.source).toBe('firecrawl');
    expect(result.brandKit.companyName).toBe('Existing Corp');
    expect(result.brandKit.logoUrl).toBe('https://example.com/logo.png');
    expect(result.brandKit.primaryColor).toBe('#d4ff33');
    expect(result.brandKit.secondaryColor).toBe('#0c0c0c');
    expect(result.brandKit.fontFamily).toBe('Inter');
    expect(result.contact.fullName).toBe('John Doe');
    expect(result.contact.jobTitle).toBe('CEO');
    expect(result.contact.email).toBe('john@example.com');
    expect(result.contact.phone).toBe('+1234567890');
    expect(result.contact.linkedin).toBe('https://linkedin.com/in/johndoe');
  });

  it('falls back to page title for contact when JSON mode returned nothing', async () => {
    mockSearch.mockResolvedValue({ web: [] });

    const html = CSS_HTML + '\n<p>Contact: jane@example.com</p>';

    const result = await extractBrandKit(html, SCREENSHOT_URL, {
      branding: BRANDING,
      fallbackKit: FALLBACK_KIT,
      baseUrl: BASE_URL,
      markdown: 'Email: jane@example.com',
      htmlSnippets: '<title>Jane Smith | Head of Design</title>\n<p>jane@example.com</p>',
      pageTitle: 'Jane Smith | Head of Design',
    });

    expect(result.source).toBe('firecrawl');
    expect(result.contact.fullName).toBe('Jane Smith');
    expect(result.contact.jobTitle).toBe('Head of Design');
    expect(result.contact.email).toBe('jane@example.com');
    expect(result.contact.phone).toBeUndefined();
  });

  it('prefers JSON-mode contact over HTML fallback when both are available', async () => {
    mockSearch.mockResolvedValue({ web: [] });

    const result = await extractBrandKit(CSS_HTML, SCREENSHOT_URL, {
      branding: BRANDING,
      fallbackKit: FALLBACK_KIT,
      baseUrl: BASE_URL,
      pageTitle: 'Brand Co | Products',
      fcJson: {
        contactName: 'Extracted Name',
        contactRole: 'Extracted Role',
        contactEmail: 'extracted@example.com',
      },
    });

    expect(result.contact.fullName).toBe('Extracted Name');
    expect(result.contact.jobTitle).toBe('Extracted Role');
    expect(result.contact.email).toBe('extracted@example.com');
  });

  it('corrects job-title-looking company name from search validation', async () => {
    mockSearch.mockResolvedValue({
      web: [{ title: 'Frontend Engineer' }],
    });

    const fbWithJobTitle = { ...NEUTRAL_BRAND_KIT, companyName: 'Frontend Engineer' };

    const result = await extractBrandKit(CSS_HTML, SCREENSHOT_URL, {
      branding: BRANDING,
      fallbackKit: fbWithJobTitle,
      baseUrl: BASE_URL,
      pageTitle: 'Bharathkumar Palanisamy | Frontend Engineer',
    });

    expect(result.source).toBe('firecrawl');
    expect(result.brandKit.companyName).toBe('Bharathkumar Palanisamy');
  });

  it('returns empty contact when both JSON mode and HTML fallback yield nothing', async () => {
    mockSearch.mockResolvedValue({ web: [] });

    const result = await extractBrandKit(CSS_HTML, SCREENSHOT_URL, {
      branding: BRANDING,
      fallbackKit: FALLBACK_KIT,
      baseUrl: BASE_URL,
      markdown: 'No contact info here',
      htmlSnippets: '<title>Just a page</title>',
    });

    expect(result.source).toBe('firecrawl');
    expect(result.contact.fullName).toBeUndefined();
    expect(result.contact.jobTitle).toBeUndefined();
    expect(result.contact.email).toBeUndefined();
    expect(result.contact.phone).toBeUndefined();
    expect(result.brandKit.companyName).toBe('Existing Corp');
  });
});

describe('vision-unavailable merge path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('serves a real kit from fcJson with source extract when vision fails and kit is incomplete', async () => {
    mockSearch.mockResolvedValue({ web: [] });

    // No branding, no CSS vars, neutral fallback → deterministic kit incomplete
    // → vision path runs; GOOGLE_GENERATIVE_AI_API_KEY is unset in vitest, so
    // generateObject throws and geminiResult stays undefined (the outage case).
    const result = await extractBrandKit('<html></html>', SCREENSHOT_URL, {
      fallbackKit: NEUTRAL_BRAND_KIT,
      baseUrl: BASE_URL,
      fcJson: {
        companyName: 'Json Co',
        logoUrl: 'https://example.com/logo.png',
        primaryColor: '#e23a1a',
        secondaryColor: '#131210',
        fontFamily: 'Inter',
        contactEmail: 'founder@example.com',
      },
    });

    expect(result.source).toBe('extract');
    expect(result.brandKit.companyName).toBe('Json Co');
    expect(result.brandKit.primaryColor).toBe('#e23a1a');
    expect(result.contact.email).toBe('founder@example.com');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/extract-brand-kit.test.ts`
Expected: FAIL — `fcJson` is not a known `ExtractOpts` property (TS error) / contact assertions fail.

Note: the vision-unavailable test takes up to ~35s if `generateObject` waits for its abort signal; in practice a missing API key throws immediately. If it hangs, set `VISION_TIMEOUT_MS`-adjacent expectations aside and confirm the missing-key error is synchronous before proceeding.

- [ ] **Step 3: Implement — delete /extract machinery, consume opts.fcJson**

In `lib/extract-brand-kit.ts`:

1. **Delete** (lines cited from current file): `clearExtractCache` export (lines 16-20), `FC_EXTRACT_TIMEOUT_MS` (line 23), the `fcExtractSchema` + `FcExtractData` definitions (lines 47-65 — now imported), `extractCache` / `EXTRACT_CACHE_TTL` / `EXTRACT_CACHE_MAX` (lines 67-71), and the entire `extractViaFirecrawlExtract` function (lines 73-123).

2. **Change imports**: `firecrawlClient` is no longer needed for extract but **is still needed** for `searchValidateCompanyName` — keep it. Add the type import:

```ts
import { firecrawlClient, brandNameFromTitle, type FcExtractData } from './scrape-site';
```

3. **Extend `ExtractOpts`**:

```ts
  fcJson?: FcExtractData; // JSON-mode output from the primary scrape (replaces the old /extract call)
```

4. **Replace the promise wiring.** Current:

```ts
  const fcExtractPromise = extractViaFirecrawlExtract(opts.baseUrl ?? '');
```

becomes:

```ts
  const fcExtract = opts.fcJson ?? null;
```

5. **Fast path** (current line 401): `const [fcExtract, searchName] = await Promise.all([fcExtractPromise, nameSearchPromise]);` becomes:

```ts
    const searchName = await nameSearchPromise;
```

6. **Merge path** (current lines 504-508): delete both `await fcExtractPromise;` and keep only `const searchName = await nameSearchPromise;`. All downstream `fcExtract?.field` reads compile unchanged.

7. Update the `ExtractResult.source` doc comment: `'extract' = Firecrawl JSON mode (rides on the primary scrape; full page content, best for text);`. Update the `buildConfidence` doc comment's `'high'` line the same way (`Firecrawl /extract` → `scrape JSON mode`).

In `app/api/brand-kit/route.ts`, add one line to the `extractBrandKit` opts (after `pageTitle: scraped.pageTitle,`):

```ts
      fcJson: scraped.fcJson,
```

- [ ] **Step 4: Run the full suite and build**

Run: `npm test`
Expected: PASS, all files.
Run: `npm run build`
Expected: clean — proves no lingering references to deleted exports.

- [ ] **Step 5: Commit**

```bash
git add lib/extract-brand-kit.ts lib/extract-brand-kit.test.ts app/api/brand-kit/route.ts
git commit -m "feat: consume scrape JSON mode in extractBrandKit, drop deprecated /extract call"
```

---

### Task 3: buttonPrimary.background as accent candidate

**Files:**
- Modify: `lib/brand-from-firecrawl.ts:48-53, 68-81`
- Test: `lib/brand-from-firecrawl.test.ts`

**Interfaces:**
- Consumes: `BrandingProfile.components.buttonPrimary.background` (verified in installed `.d.ts`).
- Produces: unchanged `FirecrawlBrand` shape; `pickAccent` signature changes from `(c: colors)` to `(b: BrandingProfile)` — it is module-private, no external consumers.

- [ ] **Step 1: Write the failing test**

Append to `lib/brand-from-firecrawl.test.ts`:

```ts
describe('buttonPrimary accent', () => {
  it('uses a vivid buttonPrimary background when palette colors are grey', () => {
    const kit = brandKitFromFirecrawl({
      colors: { primary: '#333333', secondary: '#666666', textPrimary: '#111111' },
      components: { buttonPrimary: { background: '#E23A1A' } },
    });
    expect(kit.primaryColor).toBe('#e23a1a');
  });

  it('still prefers the most saturated color overall', () => {
    const kit = brandKitFromFirecrawl({
      colors: { primary: '#D4FF33', textPrimary: '#111111' },
      components: { buttonPrimary: { background: '#888888' } },
    });
    expect(kit.primaryColor).toBe('#d4ff33');
  });
});
```

(If the file lacks a `brandKitFromFirecrawl` import or `describe` import, mirror the existing imports at its top — it already tests this function.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/brand-from-firecrawl.test.ts`
Expected: FAIL — first test gets `undefined` (grey palette yields no accent today).

- [ ] **Step 3: Implement**

In `lib/brand-from-firecrawl.ts`, replace `pickAccent` and its call site:

```ts
// Accent = the most saturated *real* brand color. Never colors.link (that's the
// hyperlink color, the #1 source of bogus link-blue accents in the eval) and never
// a near-grey. The primary CTA button background is the strongest signal a site
// gives about its accent — it's included ahead of the palette. A monochrome site
// (no vivid color) returns no accent rather than promoting a neutral — the
// orchestrator then lets the vision pass try.
function pickAccent(b: BrandingProfile): string | undefined {
  const c = b.colors ?? {};
  const cands = [b.components?.buttonPrimary?.background, c.primary, c.accent, c.secondary]
    .map((x) => normHex(x))
    .filter((x): x is string => !!x && chroma(x) >= VIVID);
  return cands.length ? cands.reduce((a, b) => (chroma(b) > chroma(a) ? b : a)) : undefined;
}
```

And in `brandKitFromFirecrawl`, change `primaryColor: pickAccent(c),` to `primaryColor: pickAccent(b),`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/brand-from-firecrawl.test.ts`
Expected: PASS (existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add lib/brand-from-firecrawl.ts lib/brand-from-firecrawl.test.ts
git commit -m "feat: use buttonPrimary background as deterministic accent candidate"
```

---

### Task 4: Drop the stealth proxy tier

**Files:**
- Modify: `lib/scrape-site.ts:129-130, 196-204`

The v2 API documents only `basic | enhanced | auto`; `auto` already retries with enhanced internally, so the explicit escalation keeps only the forced-`enhanced` rung. No test — this is config, and `scrape-site.test.ts` doesn't exercise proxy tiers.

- [ ] **Step 1: Implement**

Replace:

```ts
const PROXY_TIERS = ['auto', 'stealth', 'enhanced'] as const;
type ProxyTier = typeof PROXY_TIERS[number];
```

with:

```ts
type ProxyTier = 'auto' | 'enhanced';
```

And in `scrapeSite` Step 2, replace the retry loop:

```ts
  if (!doc.screenshot) {
    const retry = await scrapeOnce(url, 0, false, 'enhanced').catch(() => null);
    if (retry?.screenshot) doc = retry;
  }
```

- [ ] **Step 2: Verify**

Run: `npm test && npm run build`
Expected: both green; `grep -n stealth lib/` → no matches.

- [ ] **Step 3: Commit**

```bash
git add lib/scrape-site.ts
git commit -m "fix: drop undocumented stealth proxy tier (v2 enum is basic|enhanced|auto)"
```

---

### Task 5: Update CLAUDE.md pipeline docs

**Files:**
- Modify: `CLAUDE.md` (extraction-pipeline bullets, lines ~45-58)

- [ ] **Step 1: Edit the three stale references**

1. In the pipeline diagram line for `scrapeSite()`, change the annotation to:

```
├─ scrapeSite()      lib/scrape-site.ts    (Firecrawl → {html, screenshot, branding, fcJson})
```

2. In the **"Brand kit is deterministic-first"** bullet, after "skips the Gemini vision call entirely", the existing text stands; no `/extract` reference there — leave it.

3. In the **"The vision call is bounded and degrades, never hangs"** bullet, replace:

> the merge falls back to the deterministic kit + Firecrawl `/extract` (logo, cleaned name, font, a recovered color)

with:

> the merge falls back to the deterministic kit + the scrape's JSON-mode data (`ScrapeResult.fcJson` — Firecrawl runs an LLM over the full page server-side in the same scrape call; the old separate `/extract` endpoint is deprecated and no longer used)

4. Add one sentence to the deterministic-first bullet's cache note (end of bullet), replacing "No durable cache yet (Firecrawl `maxAge` + the route's in-process Map only)":

> No durable cache yet (Firecrawl `maxAge` + the route's in-process Map only; JSON-mode contact data rides on the same scrape, so there is exactly one Firecrawl call per uncached request)

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md reflects JSON-mode-on-scrape pipeline (no separate /extract)"
```

---

## Self-Review Notes

- **Spec coverage:** All four review findings are covered — JSON mode (Tasks 1-2), buttonPrimary (Task 3), stealth (Task 4), docs (Task 5). Acceptance criteria 1-7 each map to a task step.
- **Type consistency:** `FcExtractData` defined once in scrape-site (Task 1), imported by extract-brand-kit (Task 2). `fcJson` name used consistently in `ScrapeResult`, `ExtractOpts`, and the route.
- **Deliberate exclusions (YAGNI):** no JSON format on mobile/extra scrapes (+4 credits each, primary page suffices); no `/agent` (100-500 credits, discovery tool — wrong fit); no `images`/`summary` formats (marginal); no numeric confidence thresholds (the `detComplete` gate + `BrandKitConfidence` labels already cover it).
- **Risk noted:** `z.toJSONSchema` output shape vs Firecrawl's schema expectations — if extraction quality drops, fall back to passing the zod schema directly (SDK's `JsonFormat.schema` accepts `ZodTypeAny` and converts internally). Verify quality with `npx tsx scripts/eval-extraction.ts` after Task 2.
