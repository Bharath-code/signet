# Email Signature Generator Demo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the validation demo: paste a website URL → see 3 branded email signatures in seconds.

**Architecture:** Single Next.js (App Router) app. One API route scrapes the URL with Firecrawl (HTML + screenshot), extracts a typed brand kit with the Vercel AI SDK + Gemini Flash, and returns it. The page renders the brand kit + 4 pre-filled personal fields into 3 table-based HTML signature layouts shown live in iframes, with an email-capture CTA.

**Tech Stack:** Next.js (App Router, TypeScript), `@mendable/firecrawl-js`, `ai` + `@ai-sdk/google`, `zod`, `vitest`.

## Global Constraints

- Node ≥ 20 (dev environment is Node 26).
- Demo only — NO auth, DB, Stripe, photo upload, OAuth, or team deploy.
- Signatures MUST be table-based HTML with inline CSS (Outlook-safe). Logo is a hosted image URL, never embedded.
- Preview MUST be alive on page load using pre-filled demo data (no typing required to see the magic).
- Two env vars: `FIRECRAWL_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`. Never commit them.
- Demo placeholder data: `fullName="Alex Rivera"`, `jobTitle="Head of Sales"`, `email="alex@company.com"`, `phone="+1 (555) 012-3456"`.
- Layout type: `'minimal' | 'logo' | 'logo-cta'`. CTA button copy: `"Visit website"`.
- The page must never block on a failed scrape — always show a signature (neutral fallback brand kit on failure).

---

### Task 1: Scaffold Next.js app and dependencies

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `.env.example`, `vitest.config.ts`
- Modify: `.gitignore` (already ignores `node_modules/`, `.next/`, `.env*`)

**Interfaces:**
- Produces: a runnable Next.js app (`npm run dev`) and a test runner (`npm test`).

- [ ] **Step 1: Scaffold the app non-interactively**

```bash
npx create-next-app@latest . --typescript --app --no-tailwind --no-src-dir --no-eslint --use-npm --yes
```

If the directory-not-empty prompt blocks it, scaffold in a temp dir and move files in:
```bash
npx create-next-app@latest tmp-app --typescript --app --no-tailwind --no-src-dir --no-eslint --use-npm --yes
cp -r tmp-app/. . && rm -rf tmp-app
```

- [ ] **Step 2: Install runtime + test deps**

```bash
npm install @mendable/firecrawl-js ai @ai-sdk/google zod
npm install -D vitest
```

- [ ] **Step 3: Add the test script and vitest config**

In `package.json` `"scripts"`, add: `"test": "vitest run"`.

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['**/*.test.ts'] },
});
```

- [ ] **Step 4: Create `.env.example`**

```bash
# .env.example
FIRECRAWL_API_KEY=fc-your-key-here
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-key-here
```

- [ ] **Step 5: Verify the app boots and tests run**

Run: `npm run build`
Expected: build succeeds (default scaffold page compiles).
Run: `npm test`
Expected: vitest runs and reports "No test files found" (exit 0) — runner works.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with firecrawl, ai-sdk, vitest"
```

---

### Task 2: Brand kit + signature types and Zod schema

**Files:**
- Create: `lib/types.ts`, `lib/brand-kit-schema.ts`, `lib/brand-kit-schema.test.ts`

**Interfaces:**
- Produces:
  - `BrandKit = { companyName: string; logoUrl: string; primaryColor: string; secondaryColor: string; fontFamily: string }`
  - `SignatureFields = { fullName: string; jobTitle: string; email: string; phone: string }`
  - `Layout = 'minimal' | 'logo' | 'logo-cta'`
  - `brandKitSchema: z.ZodType<BrandKit>` (a Zod schema)
  - `NEUTRAL_BRAND_KIT: BrandKit` (gray/serif fallback)
  - `DEMO_FIELDS: SignatureFields` (the pre-filled placeholders)

- [ ] **Step 1: Write the failing test**

```ts
// lib/brand-kit-schema.test.ts
import { describe, it, expect } from 'vitest';
import { brandKitSchema, NEUTRAL_BRAND_KIT, DEMO_FIELDS } from './brand-kit-schema';

describe('brandKitSchema', () => {
  it('accepts a valid brand kit', () => {
    const ok = brandKitSchema.safeParse({
      companyName: 'Acme', logoUrl: 'https://x/logo.png',
      primaryColor: '#1a2b3c', secondaryColor: '#ffffff', fontFamily: 'Inter',
    });
    expect(ok.success).toBe(true);
  });

  it('rejects a non-hex primary color', () => {
    const bad = brandKitSchema.safeParse({
      companyName: 'Acme', logoUrl: 'https://x/logo.png',
      primaryColor: 'blue', secondaryColor: '#fff', fontFamily: 'Inter',
    });
    expect(bad.success).toBe(false);
  });

  it('exposes a neutral fallback and demo fields', () => {
    expect(brandKitSchema.safeParse(NEUTRAL_BRAND_KIT).success).toBe(true);
    expect(DEMO_FIELDS.fullName).toBe('Alex Rivera');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot import from `./brand-kit-schema` (module not found).

- [ ] **Step 3: Write the types**

```ts
// lib/types.ts
export type BrandKit = {
  companyName: string;
  logoUrl: string;
  primaryColor: string;   // hex
  secondaryColor: string; // hex
  fontFamily: string;
};

export type SignatureFields = {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
};

export type Layout = 'minimal' | 'logo' | 'logo-cta';
```

- [ ] **Step 4: Write the schema, fallback, and demo fields**

```ts
// lib/brand-kit-schema.ts
import { z } from 'zod';
import type { BrandKit, SignatureFields } from './types';

const hex = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'must be hex color');

export const brandKitSchema = z.object({
  companyName: z.string().min(1),
  logoUrl: z.string().url(),
  primaryColor: hex,
  secondaryColor: hex,
  fontFamily: z.string().min(1),
}) satisfies z.ZodType<BrandKit>;

export const NEUTRAL_BRAND_KIT: BrandKit = {
  companyName: 'Your Company',
  logoUrl: 'https://placehold.co/120x40/eeeeee/333333?text=Logo',
  primaryColor: '#333333',
  secondaryColor: '#777777',
  fontFamily: 'Georgia, serif',
};

export const DEMO_FIELDS: SignatureFields = {
  fullName: 'Alex Rivera',
  jobTitle: 'Head of Sales',
  email: 'alex@company.com',
  phone: '+1 (555) 012-3456',
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/brand-kit-schema.ts lib/brand-kit-schema.test.ts
git commit -m "feat: add brand kit types, zod schema, neutral fallback, demo fields"
```

---

### Task 3: `renderSignature` — the 3 layouts (TDD, core logic)

**Files:**
- Create: `lib/render-signature.ts`, `lib/render-signature.test.ts`

**Interfaces:**
- Consumes: `BrandKit`, `SignatureFields`, `Layout` from `lib/types.ts`.
- Produces: `renderSignature(brandKit: BrandKit, fields: SignatureFields, layout: Layout): string` — returns a table-based HTML string with inline CSS.

- [ ] **Step 1: Write the failing test**

```ts
// lib/render-signature.test.ts
import { describe, it, expect } from 'vitest';
import { renderSignature } from './render-signature';
import type { BrandKit, SignatureFields } from './types';

const kit: BrandKit = {
  companyName: 'Acme', logoUrl: 'https://x/logo.png',
  primaryColor: '#1a2b3c', secondaryColor: '#aabbcc', fontFamily: 'Inter',
};
const fields: SignatureFields = {
  fullName: 'Alex Rivera', jobTitle: 'Head of Sales',
  email: 'alex@company.com', phone: '+1 (555) 012-3456',
};

describe('renderSignature', () => {
  for (const layout of ['minimal', 'logo', 'logo-cta'] as const) {
    it(`${layout}: uses table layout, brand color, and all fields`, () => {
      const html = renderSignature(kit, fields, layout);
      expect(html).toContain('<table');
      expect(html).toContain('#1a2b3c');           // primary color present
      expect(html).toContain('Alex Rivera');
      expect(html).toContain('Head of Sales');
      expect(html).toContain('alex@company.com');
      expect(html).toContain('+1 (555) 012-3456');
      expect(html).toContain('Inter');              // font applied
    });
  }

  it('logo and logo-cta include the logo image', () => {
    expect(renderSignature(kit, fields, 'logo')).toContain('https://x/logo.png');
    expect(renderSignature(kit, fields, 'logo-cta')).toContain('https://x/logo.png');
  });

  it('logo-cta includes the CTA button copy', () => {
    expect(renderSignature(kit, fields, 'logo-cta')).toContain('Visit website');
  });

  it('minimal does NOT include the logo image', () => {
    expect(renderSignature(kit, fields, 'minimal')).not.toContain('https://x/logo.png');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `renderSignature` not defined.

- [ ] **Step 3: Write the implementation**

```ts
// lib/render-signature.ts
import type { BrandKit, SignatureFields, Layout } from './types';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function details(kit: BrandKit, f: SignatureFields): string {
  const font = esc(kit.fontFamily);
  return `
    <div style="font-family:${font};font-size:14px;color:#222;line-height:1.4">
      <strong style="color:${kit.primaryColor}">${esc(f.fullName)}</strong><br>
      <span style="color:${kit.secondaryColor}">${esc(f.jobTitle)} · ${esc(kit.companyName)}</span><br>
      <a href="mailto:${esc(f.email)}" style="color:${kit.primaryColor};text-decoration:none">${esc(f.email)}</a><br>
      <span style="color:#555">${esc(f.phone)}</span>
    </div>`;
}

function logoCell(kit: BrandKit): string {
  return `<td style="padding-right:16px;vertical-align:top;border-right:3px solid ${kit.primaryColor}">
      <img src="${esc(kit.logoUrl)}" alt="${esc(kit.companyName)}" height="40" style="display:block;border:0">
    </td>`;
}

export function renderSignature(kit: BrandKit, fields: SignatureFields, layout: Layout): string {
  if (layout === 'minimal') {
    return `<table cellpadding="0" cellspacing="0" role="presentation"><tr>
      <td style="border-left:3px solid ${kit.primaryColor};padding-left:12px">${details(kit, fields)}</td>
    </tr></table>`;
  }

  const ctaRow = layout === 'logo-cta'
    ? `<tr><td colspan="2" style="padding-top:12px">
         <a href="#" style="display:inline-block;background:${kit.primaryColor};color:#fff;
            font-family:${esc(kit.fontFamily)};font-size:13px;text-decoration:none;
            padding:8px 16px;border-radius:4px">Visit website</a>
       </td></tr>`
    : '';

  return `<table cellpadding="0" cellspacing="0" role="presentation">
    <tr>${logoCell(kit)}<td style="vertical-align:top">${details(kit, fields)}</td></tr>
    ${ctaRow}
  </table>`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (all renderSignature tests).

- [ ] **Step 5: Commit**

```bash
git add lib/render-signature.ts lib/render-signature.test.ts
git commit -m "feat: render 3 table-based signature layouts from brand kit"
```

---

### Task 4: `scrapeSite` — Firecrawl wrapper

**Files:**
- Create: `lib/scrape-site.ts`

**Interfaces:**
- Produces: `scrapeSite(url: string): Promise<{ html: string; screenshotUrl: string }>`. Throws on failure (caller handles fallback).

- [ ] **Step 1: Write the implementation**

```ts
// lib/scrape-site.ts
import Firecrawl from '@mendable/firecrawl-js';

const client = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });

export async function scrapeSite(url: string): Promise<{ html: string; screenshotUrl: string }> {
  const doc = await client.scrape(url, { formats: ['html', 'screenshot'], onlyMainContent: false });
  const html = (doc as { html?: string }).html ?? '';
  const screenshotUrl = (doc as { screenshot?: string }).screenshot ?? '';
  if (!screenshotUrl) throw new Error('Firecrawl returned no screenshot');
  return { html: html.slice(0, 20000), screenshotUrl };
}
```

> Note: Firecrawl SDK v4 returns the Document directly from `scrape(...)` with `.html` and `.screenshot`. If the installed version nests under `.data`, adjust the two reads. Use the `firecrawl:firecrawl-scrape` skill if the response shape differs.

- [ ] **Step 2: Manually verify against a real site**

Requires a real `FIRECRAWL_API_KEY` in `.env.local`. Create a throwaway script `scripts/try-scrape.mjs`:
```js
import 'dotenv/config';
import { scrapeSite } from '../lib/scrape-site.ts';
scrapeSite('https://stripe.com').then(r =>
  console.log('html len:', r.html.length, 'screenshot:', r.screenshotUrl.slice(0, 60)));
```
Run: `node --experimental-strip-types --env-file=.env.local scripts/try-scrape.mjs`
Expected: prints a non-zero html length and a screenshot URL. Then delete the script.

```bash
rm scripts/try-scrape.mjs
```

- [ ] **Step 3: Commit**

```bash
git add lib/scrape-site.ts
git commit -m "feat: add Firecrawl scrape wrapper returning html + screenshot"
```

---

### Task 5: `extractBrandKit` — AI SDK + Gemini Flash

**Files:**
- Create: `lib/extract-brand-kit.ts`

**Interfaces:**
- Consumes: `brandKitSchema` from `lib/brand-kit-schema.ts`; `BrandKit` from `lib/types.ts`.
- Produces: `extractBrandKit(html: string, screenshotUrl: string): Promise<BrandKit>`. Throws on model/validation failure (caller handles fallback).

- [ ] **Step 1: Write the implementation**

```ts
// lib/extract-brand-kit.ts
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { brandKitSchema } from './brand-kit-schema';
import type { BrandKit } from './types';

export async function extractBrandKit(html: string, screenshotUrl: string): Promise<BrandKit> {
  const { object } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: brandKitSchema,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text:
            'You are extracting an email-signature brand kit from a company homepage. ' +
            'Return the company name, the absolute URL of the primary logo image, the primary ' +
            'and secondary brand colors as hex codes, and the main heading font family. ' +
            'Prefer the screenshot for colors/font and the HTML for the exact logo URL. ' +
            'HTML (truncated):\n' + html,
        },
        { type: 'image', image: new URL(screenshotUrl) },
      ],
    }],
  });
  return object;
}
```

- [ ] **Step 2: Manually verify end-to-end with scrape**

Requires both API keys in `.env.local`. Create `scripts/try-extract.mjs`:
```js
import 'dotenv/config';
import { scrapeSite } from '../lib/scrape-site.ts';
import { extractBrandKit } from '../lib/extract-brand-kit.ts';
const { html, screenshotUrl } = await scrapeSite('https://stripe.com');
console.log(await extractBrandKit(html, screenshotUrl));
```
Run: `node --experimental-strip-types --env-file=.env.local scripts/try-extract.mjs`
Expected: prints a `BrandKit` object with a real logo URL and hex colors. Then delete the script.

```bash
rm scripts/try-extract.mjs
```

- [ ] **Step 3: Commit**

```bash
git add lib/extract-brand-kit.ts
git commit -m "feat: extract typed brand kit from screenshot + html via Gemini Flash"
```

---

### Task 6: `/api/brand-kit` route with fallback

**Files:**
- Create: `app/api/brand-kit/route.ts`

**Interfaces:**
- Consumes: `scrapeSite`, `extractBrandKit`, `NEUTRAL_BRAND_KIT`.
- Produces: `POST /api/brand-kit` accepting `{ url: string }`, returning `{ brandKit: BrandKit; fallback: boolean }` (HTTP 200 always, so the UI never breaks).

- [ ] **Step 1: Write the route**

```ts
// app/api/brand-kit/route.ts
import { NextResponse } from 'next/server';
import { scrapeSite } from '@/lib/scrape-site';
import { extractBrandKit } from '@/lib/extract-brand-kit';
import { NEUTRAL_BRAND_KIT } from '@/lib/brand-kit-schema';

export async function POST(req: Request) {
  let url = '';
  try {
    ({ url } = await req.json());
    new URL(url); // throws if not a valid URL
  } catch {
    return NextResponse.json({ brandKit: NEUTRAL_BRAND_KIT, fallback: true }, { status: 200 });
  }
  try {
    const { html, screenshotUrl } = await scrapeSite(url);
    const brandKit = await extractBrandKit(html, screenshotUrl);
    return NextResponse.json({ brandKit, fallback: false });
  } catch (err) {
    console.error('brand-kit extraction failed:', err);
    return NextResponse.json({ brandKit: NEUTRAL_BRAND_KIT, fallback: true });
  }
}
```

> Note: `@/` path alias is configured by create-next-app in `tsconfig.json`. If absent, use relative imports.

- [ ] **Step 2: Manually verify the route**

Run (terminal A): `npm run dev` (with `.env.local` present)
Run (terminal B):
```bash
curl -s -X POST localhost:3000/api/brand-kit -H 'content-type: application/json' \
  -d '{"url":"https://stripe.com"}' | head -c 400
```
Expected: JSON with `"fallback":false` and a populated `brandKit`.
Then test the fallback:
```bash
curl -s -X POST localhost:3000/api/brand-kit -H 'content-type: application/json' \
  -d '{"url":"not-a-url"}'
```
Expected: JSON with `"fallback":true` and the neutral brand kit.

- [ ] **Step 3: Commit**

```bash
git add app/api/brand-kit/route.ts
git commit -m "feat: add /api/brand-kit route with neutral fallback on failure"
```

---

### Task 7: Page UI — URL input, pre-filled fields, 3 live previews, email CTA

**Files:**
- Create: `app/components/SignatureDemo.tsx`
- Modify: `app/page.tsx` (render the demo component)

**Interfaces:**
- Consumes: `renderSignature`, `DEMO_FIELDS`, `NEUTRAL_BRAND_KIT`, `Layout`, types.
- Produces: the interactive demo page.

- [ ] **Step 1: Write the client component**

```tsx
// app/components/SignatureDemo.tsx
'use client';
import { useState } from 'react';
import { renderSignature } from '@/lib/render-signature';
import { DEMO_FIELDS, NEUTRAL_BRAND_KIT } from '@/lib/brand-kit-schema';
import type { BrandKit, SignatureFields, Layout } from '@/lib/types';

const LAYOUTS: Layout[] = ['minimal', 'logo', 'logo-cta'];

export default function SignatureDemo() {
  const [url, setUrl] = useState('');
  const [kit, setKit] = useState<BrandKit>(NEUTRAL_BRAND_KIT);
  const [fields, setFields] = useState<SignatureFields>(DEMO_FIELDS);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setNote('');
    try {
      const res = await fetch('/api/brand-kit', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      setKit(data.brandKit);
      if (data.fallback) setNote("Couldn't read that site — showing a neutral signature. Try another URL.");
    } finally { setLoading(false); }
  }

  const set = (k: keyof SignatureFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields(f => ({ ...f, [k]: e.target.value }));

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui', padding: 16 }}>
      <h1>Your branded email signature in 10 seconds</h1>
      <p>Paste your website URL — we read your logo, colors, and font automatically.</p>

      <form onSubmit={generate} style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://yourcompany.com"
          style={{ flex: 1, padding: 10 }} />
        <button disabled={loading} style={{ padding: '10px 18px' }}>
          {loading ? 'Reading…' : 'Generate'}
        </button>
      </form>
      {note && <p style={{ color: '#b00' }}>{note}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, margin: '16px 0' }}>
        <input value={fields.fullName} onChange={set('fullName')} placeholder="Full name" />
        <input value={fields.jobTitle} onChange={set('jobTitle')} placeholder="Job title" />
        <input value={fields.email} onChange={set('email')} placeholder="Email" />
        <input value={fields.phone} onChange={set('phone')} placeholder="Phone" />
      </div>

      {LAYOUTS.map(layout => (
        <div key={layout} style={{ margin: '12px 0' }}>
          <small style={{ textTransform: 'uppercase', color: '#888' }}>{layout}</small>
          <iframe title={layout} style={{ width: '100%', height: 130, border: '1px solid #eee' }}
            srcDoc={renderSignature(kit, fields, layout)} />
        </div>
      ))}

      <form onSubmit={e => { e.preventDefault(); alert('Thanks! We\\'ll be in touch about team deploy.'); }}
        style={{ marginTop: 24, padding: 16, background: '#f6f6f6', borderRadius: 8 }}>
        <strong>Want this live for your whole team in 2 minutes?</strong>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input type="email" required placeholder="you@work.com" style={{ flex: 1, padding: 10 }} />
          <button style={{ padding: '10px 18px' }}>Notify me</button>
        </div>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Wire it into the page**

```tsx
// app/page.tsx
import SignatureDemo from './components/SignatureDemo';

export default function Page() {
  return <SignatureDemo />;
}
```

- [ ] **Step 3: Manually verify the magic moment**

Run: `npm run dev`
Open `localhost:3000`. Expected:
- On page load, 3 signatures already render with the neutral kit + "Alex Rivera" demo data (alive before typing).
- Paste `https://stripe.com`, click Generate → previews update with Stripe's logo/colors/font within ~10s.
- Edit a field (e.g. name) → all 3 previews update live.
- Paste garbage → neutral fallback + the friendly note, signatures still visible.
- Email CTA accepts an address and shows the thank-you.

- [ ] **Step 4: Run the full test suite and build**

Run: `npm test`
Expected: PASS (schema + renderSignature tests).
Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/components/SignatureDemo.tsx app/page.tsx
git commit -m "feat: signature demo UI with live previews and email capture"
```

---

## Self-Review Notes

- **Spec coverage:** scaffold (T1), brand kit types/schema/fallback/demo fields (T2), 3 layouts + render correctness (T3), Firecrawl scrape (T4), Gemini extraction (T5), API route + fallback (T6), UI with live-on-load previews + email CTA (T7). All spec sections mapped.
- **Testing matches spec:** unit test on `renderSignature` (the only branching logic) + schema validation; external APIs (Firecrawl, Gemini) verified manually with throwaway scripts and curl, not faked unit tests.
- **Types consistent:** `BrandKit`, `SignatureFields`, `Layout` defined once in `lib/types.ts` and reused; `renderSignature` signature identical across T3/T7; `/api/brand-kit` contract identical across T6/T7.
- **Out-of-scope respected:** no auth/DB/Stripe/OAuth/photo upload. Email CTA is a non-persisting alert (validation signal only) — wiring it to a real list is MVP work, not demo.
