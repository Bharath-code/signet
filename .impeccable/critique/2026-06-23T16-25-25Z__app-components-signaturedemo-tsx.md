---
target: the studio (/app)
total_score: 30
p0_count: 0
p1_count: 1
timestamp: 2026-06-23T16-25-25Z
slug: app-components-signaturedemo-tsx
---
# Critique — Studio (`/app` → SignatureDemo.tsx)

Register: product (tool surface — forms + live preview). Source review + deterministic scan; detector clean (0 findings). No browser overlay this run.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | "Reading…" + brand.note, but no status pulse and the note lacks role=status |
| 2 | Match System / Real World | 3 | Plain language, "edit any field" |
| 3 | User Control and Freedom | 3 | Editable fields, re-generate, ← Home; read-only swatches look editable |
| 4 | Consistency and Standards | 3 | Matches the system; note-role + CTA behavior differ from the landing |
| 5 | Error Prevention | 3 | Generate path guards empty URL; team CTA accepts anything |
| 6 | Recognition Rather Than Recall | 3 | Fields/fonts/colors all visible; swatches mislead |
| 7 | Flexibility and Efficiency | 3 | Edit + font pick; copy is Pro-gated (intentional) |
| 8 | Aesthetic and Minimalist Design | 3 | Clean, but the previews — the page's whole payload — render cramped on desktop |
| 9 | Error Recovery | 3 | Degraded brand.note is specific; team CTA fakes success |
| 10 | Help and Documentation | 3 | Inline hints ("edit any field", copy hint) |
| **Total** | | **30/40** | **Good — but one P1 matters more than the number** |

## Anti-Patterns Verdict

**LLM assessment:** Consistent with the Press & Ink system — not AI slop. Clean tool surface, good scaffolding.

**Deterministic scan:** 0 findings.

**Visual overlays:** not run this pass.

## Overall Impression

The studio is clean and on-system, and the SSR-seeded instant previews deliver the core "magic moment" principle. The single biggest problem isn't visual style — it's that the three previews, which ARE the product, are squeezed into a 3-up desktop grid far narrower than a real email signature. The page scores "Good," but the cramped previews undersell the exact thing the demo exists to prove.

## What's Working

1. **Instant proof on load.** Previews render seeded before any fetch — the "instant-proof-no-gates" principle, delivered.
2. **Honest degraded messaging.** The brand.note now states what was salvaged vs. failed, specifically.
3. **Good scaffolding.** Labeled 4-field grid, email-safe font picker, read-only brand swatches — sensible defaults, low intrinsic load.

## Priority Issues

- **[P1] Cramped 3-up preview grid on desktop.** The three signatures sit in `md:grid-cols-3` (~220px each) while real email signatures run 400–600px wide, so on desktop they squeeze/clip — and ironically mobile (1-col, full width) shows them better. This undersells the magic moment, which is the demo's entire job.
  - *Fix:* give previews realistic width on desktop — feature one full-width primary preview with the two alternates smaller/below, or drop to 1–2 columns. Mobile already does the right thing.
  - *Command:* /impeccable layout

- **[P2] `brand.note` isn't announced to screen readers.** The result/error note lacks `role="status"` (the landing has it), so Sam never hears "couldn't read that site" or the degraded message.
  - *Fix:* add `role="status"` to the note.
  - *Command:* /impeccable audit

- **[P2] Dead "Notify me" team CTA fakes success.** The bottom email form sets `sent` and says "Thanks — we'll be in touch" but POSTs nothing, while the landing's waitlist hits `/api/waitlist`. A Riley trap and an inconsistency. (CLAUDE.md notes capture is intentionally non-persistent — so at minimum align copy with reality, ideally reuse the real endpoint.)
  - *Fix:* wire to `/api/waitlist` like the landing, or soften the copy.
  - *Command:* /impeccable harden

- **[P2] Font buttons lack `aria-pressed`.** The selected font is conveyed by color only; screen readers can't tell which is active.
  - *Fix:* add `aria-pressed={brand.font === f.value}`.
  - *Command:* /impeccable audit

- **[P3] Read-only color swatches look interactive.** Bordered chips read as clickable but aren't (picker is "later"). De-emphasize as display, or signal read-only.
  - *Command:* /impeccable clarify

## Persona Red Flags

**Jordan (First-Timer):** Clear flow, "edit any field" hint helps. The bordered color chips look editable but aren't — a small dead-end.

**Sam (Accessibility):** `brand.note` not announced (no role=status); font buttons lack `aria-pressed`. Two avoidable screen-reader gaps the landing doesn't have.

**Riley (Stress Tester):** The team "Notify me" form reports success while saving nothing. Submitting it looks like it worked; it didn't.

**Casey (Mobile):** Previews stack full-width on mobile — actually the *best* preview experience on the page. Fields stack cleanly. Strong here.

## Minor Observations

- No "Reading your site…" pulse like the landing — slightly thinner status feedback.
- Three identical "Copy with Pro" links (one per card) — repetitive but acceptable.

## Questions to Consider

- If one preview were featured at full email width, would the magic moment land harder than three cramped ones?
- Should `/app`'s email capture reuse the landing's real waitlist endpoint instead of faking success?
