# Plan: Gated "Full Brand Kit Export" (lead-capture upgrade)

**Status:** PARKED — do not build yet. See "Build trigger" below.
**Origin:** free-tool-strategy audit (2026-06-29). The demo is engineering-as-
marketing but currently has only ONE capture surface (the waitlist CTA). This
adds a second, lower-commitment capture: email → full brand kit export.

## The hard constraint (read first)

PRODUCT.md principle **instant-proof-no-gates**: the three signatures render on
load (SSR-seeded) and must stay ungated. The magic moment cannot sit behind an
email wall — gating it kills the exact thing we're validating.

→ Therefore we gate the **export/install artifacts**, never the preview. This is
the free-tool-strategy "show the preview, gate the full report" pattern. The
visitor sees their signature render free; the email buys the *take-it-with-you*
bundle.

## What's free vs gated

| Free (unchanged) | Gated behind email |
|---|---|
| Paste URL → 3 signatures render live | Copy-ready signature HTML for all 3 layouts, per-client (Gmail / Outlook / Apple Mail) |
| Edit color / logo / fields | A one-page brand kit: logo file(s), hex codes, font name, email-safe font fallback |
| Copy the *currently shown* signature | PNG renders of each layout (paste-into-email-client ready) |

The free tier already proves quality. The gated bundle is the "I want to actually
install this everywhere" artifact — plausibly worth an email to a founder who
just watched it nail their brand.

## Implementation shape (minimal — respects no-auth/no-db scope)

**Client-side unlock, zero new backend storage.** The `brandKit`, `contact`, and
rendered signature HTML already live in `useBrandKit` client state. Flow:

1. User clicks "Get your full brand kit" (new CTA, sits beside — not replacing —
   the waitlist CTA).
2. Email input → `POST /api/waitlist` (REUSE existing endpoint: already validates
   email, notifies founder, optionally upserts to Resend Audience). Add a
   `source: 'export'` field so captures are segmentable from waitlist signups.
3. On `{ ok: true }`, client generates the bundle in-browser from state:
   - signature HTML blocks (call `renderSignature` for all 3 layouts — already a
     pure function)
   - a brand-kit summary (HTML or .txt — colors, font, logo URL)
   - optionally PNGs (needs client-side canvas render of the HTML; defer if hard)
   Package as a .zip (a small dep like `jszip`, OR skip the zip and just trigger
   a multi-file download / a single self-contained .html the user saves).
4. PostHog: `export_gate_viewed` → `export_email_submitted` → (download fired).

No database, no server-side file storage, no email attachments. Bundle is
ephemeral, generated from data the client already has. Fits the validation-stage
scope exactly.

### Deferred alternative (only if client-side export proves clunky)
Server renders + emails a download link. Adds storage + attachment infra —
explicitly NOT in scope until the simple version is proven insufficient.

## Metrics (the point of the feature)

- Primary: `export_email_submitted / export_gate_viewed` — lead-capture rate of
  the new surface.
- Guardrail: does it cannibalize waitlist signups or complement them? Watch
  waitlist conversion before/after. Hypothesis: complements — captures the
  "love my kit, not ready to think about my whole team" segment the waitlist CTA
  misses.

## Open questions (resolve at build time, not now)

1. **Beside or instead of the waitlist CTA?** Default: beside. Two intents
   (self-serve export vs team-deploy waitlist) = two CTAs, segmentable. Risk:
   choice paralysis / diluted primary CTA. A/B if traffic allows.
2. **Is the bundle actually worth an email?** If export-gate conversion is weak,
   the bundle isn't valuable enough — add the per-client install instructions
   (the real friction) rather than more file formats.
3. **PNG generation client-side** — `renderSignature` emits table HTML; turning
   that into a PNG in-browser (html-to-canvas) may be fiddly. Ship HTML-only
   first; add PNGs only if users ask.
4. **Abuse / cost** — export is client-side so it adds ~zero API cost (no new
   scrape/LLM call). The existing per-paste rate limit still governs the
   expensive path. Good.

## Build trigger (when to unpark)

Build this ONLY after validation shows the magic moment lands AND lead volume is
the bottleneck — i.e. decent paste→render rate but the single waitlist CTA is
under-capturing. Per [[master-plan-validate-first]] and
[[no-website-user-shelved]]: don't add capture infra ahead of a signal that
capture is the constraint. If nobody's pasting URLs, a second CTA fixes nothing.
