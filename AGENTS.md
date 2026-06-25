# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## What this is

A validation-stage demo (not the full product): paste a website URL → scrape it → an LLM extracts a brand kit (logo, colors, font) → render three branded email-signature previews live. The goal is to prove the "magic moment" before building the real MVP. Scope is deliberately constrained — **no auth, database, Stripe, OAuth, or persistence.** The email-capture CTAs (landing + `/app`) both POST to `POST /api/waitlist`, which sends a founder notification and optionally upserts to a Resend Audience — notify-only, no app-side DB.

Design spec and implementation plan live in `docs/superpowers/`.

## Commands

```bash
npm run dev          # dev server (reads .env.local)
npm run build        # production build — the real type-check/lint gate (no separate lint script)
npm test             # vitest run (all tests once)
npx vitest run lib/render-signature.test.ts   # single test file
npx vitest -t "minimal"                        # single test by name
```

There is no ESLint setup (scaffolded with `--no-eslint`); `npm run build` is the type gate.

## Environment

Keys go in `.env.local` (gitignored) — **not** `.env.example` (that is a tracked placeholder template; putting real keys there both fails to load and risks committing them):

- `FIRECRAWL_API_KEY` — Firecrawl scrape API
- `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini (AI Studio key, format `AIza…`)
- `GEMINI_MODEL` — optional model override (default `gemini-3.5-flash`)
- `GEMINI_FALLBACK_MODEL` — optional; a second model `extractBrandKit` tries only if `GEMINI_MODEL` throws (e.g. "high demand" 503). Empty = no fallback
- `RESEND_API_KEY` — Resend API key for waitlist emails (get one free at resend.com)
- `RESEND_AUDIENCE_ID` — optional; if set, `POST /api/waitlist` also adds contacts to a Resend Audience for bulk emailing later

`GET /api/health` pings both providers and reports `ok` / `quota-exceeded` / `bad-key` / `no-key` plus the model tested. Use it to diagnose key problems instead of reading server logs.

`POST /api/waitlist` accepts `{ email }`, sends a notification to the founder email, and optionally upserts the contact into a Resend Audience. Returns `{ ok: true }` or `{ error }`. Returns `503` when `RESEND_API_KEY` is not set (graceful — form shows an error, no crash).

## Architecture: the extraction pipeline

The whole app is one server pipeline plus one client page. Data flows:

```
SignatureDemo (client) ──POST {url}──▶ /api/brand-kit
                                          ├─ scrapeSite()      lib/scrape-site.ts    (Firecrawl → {html, screenshotUrl})
                                          └─ extractBrandKit()  lib/extract-brand-kit.ts (AI SDK generateObject + Gemini → BrandKit)
                                       ◀── {brandKit, fallback} (ALWAYS HTTP 200)
SignatureDemo renders renderSignature(kit, fields, layout) into <iframe srcDoc>
```

Key invariants — read these before changing the relevant file:

- **`/api/brand-kit` never returns non-200 and never throws to the client.** Any failure (bad URL, scrape error, model/quota error) returns the `NEUTRAL_BRAND_KIT` fallback with `fallback: true`. The UI must always be able to render *a* signature. `scrapeSite` and `extractBrandKit` throw freely; the route catches.

- **`renderSignature` (lib/render-signature.ts) is the real email output, not preview chrome.** It is a pure function emitting table-based HTML with inline CSS (Outlook-safe) and a hosted `<img>` logo. Do **not** add layout padding/centering here — the preview-only `frameDoc` wrapper in `SignatureDemo.tsx` handles visual placement inside the card. Keep it pure so it stays unit-testable.

- **The "magic moment" depends on SSR-on-load.** `SignatureDemo` seeds state with `NEUTRAL_BRAND_KIT` + `DEMO_FIELDS`, so all three signatures render before any fetch or typing. Don't gate the previews behind the fetch.

- **`brandKitSchema` is the trust boundary.** `extractBrandKit` passes it as the `generateObject` schema, so malformed model output (e.g. a non-hex color) throws rather than reaching the renderer. Colors are validated as strict hex here.

## Security model (signature HTML)

Untrusted website content flows: scraped page → LLM → `BrandKit` → HTML → iframe. Two layers keep it safe — preserve both:

1. `renderSignature` HTML-escapes every interpolated value via `esc()` (including color/font values, which sit inside `style="…"`).
2. `brandKitSchema` validates colors as strict hex at the boundary.

Note: the schema's `z.url()` on `logoUrl` is permissive (accepts `data:`/`javascript:`), so do **not** rely on it for scheme safety — `logoUrl`'s only sink is `<img src>` (non-executing) and the preview iframes use `sandbox=""`. If you ever add a new sink for `logoUrl` (e.g. an `<a href>`), add scheme validation.

## Gotchas

- **Model IDs churn.** `gemini-2.0-flash` was shut down 2026-06-01. Change the model only via `GEMINI_MODEL` / the `GEMINI_MODEL` constant in `lib/extract-brand-kit.ts` (shared with the health route so they can't drift). A wrong model ID surfaces as Google `404 NOT_FOUND`; a `403 PERMISSION_DENIED` is a project/key problem, not a model problem.
- **`ai` v6 + `@ai-sdk/google` v3, zod v4, Tailwind v4, Next 16** — newer than many examples assume. Verify SDK call shapes against installed `.d.ts` rather than older docs. `generateObject` is soft-`@deprecated` in `ai` v6 but used intentionally.
- **The focus-visible ring in `app/globals.css` is unlayered on purpose** — it must beat Tailwind's layered `outline-none` utility. Don't move it into `@layer base`.
- **Inputs carry `suppressHydrationWarning`** to silence browser-extension attribute injection on form fields.
- **Tests cover only `renderSignature` and the schema** (the branching logic). External APIs are intentionally not unit-tested — mocking them would assert nothing; verify those via `/api/health` and live requests.

## Design Context

Strategy and visual system live in two root files — read them before UI work:

- **`PRODUCT.md`** — register (`brand`; landing leads), users, purpose, brand personality (Editorial / precise / confident), anti-references (generic SaaS template, clutter), and five design principles (show-don't-tell, instant-proof-no-gates, output-quality-is-the-promise, honest-degradation, editorial-restraint). Accessibility target: WCAG AA.
- **`DESIGN.md`** (+ `.impeccable/design.json` sidecar) — the "Press & Ink" Swiss system: bone `#F3F2EC` / ink `#131210` / one vermilion stamp `#E23A1A`, Bricolage / Hanken / JetBrains Mono, zero-radius, blur-free hard-offset shadow. Named rules: One Stamp (vermilion ≤10%), Locked-Light (no dark mode), Mono-Metadata, Eyebrow-Discipline, Hard-Offset.
