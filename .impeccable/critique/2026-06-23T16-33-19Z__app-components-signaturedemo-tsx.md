---
target: the studio (/app)
total_score: 31
p0_count: 0
p1_count: 0
timestamp: 2026-06-23T16-33-19Z
slug: app-components-signaturedemo-tsx
---
# Critique (re-run) — Studio (`/app` → SignatureDemo.tsx)

Re-critique after the fix pass. Source review + deterministic scan (0 findings). No browser overlay this run.

## Design Health Score

| # | Heuristic | Score | Δ | Key Issue |
|---|-----------|-------|---|-----------|
| 1 | Visibility of System Status | 3 | — | Reading…/Saving… + role=status on note and confirmation |
| 2 | Match System / Real World | 3 | — | Plain language |
| 3 | User Control and Freedom | 3 | — | Swatches now labeled "extracted · read-only" |
| 4 | Consistency and Standards | 3 | — | /app waitlist now matches the landing (real endpoint, note role) |
| 5 | Error Prevention | 4 | +1 | Both forms validate inline; generate guards empty URL |
| 6 | Recognition Rather Than Recall | 3 | — | Fields/fonts/colors visible; read-only state now signalled |
| 7 | Flexibility and Efficiency | 3 | — | Edit + font pick; copy Pro-gated |
| 8 | Aesthetic and Minimalist Design | 3 | — | Previews now render at realistic email width |
| 9 | Error Recovery | 3 | — | Real waitlist with specific error copy; degraded brand.note |
| 10 | Help and Documentation | 3 | — | Inline hints |
| **Total** | | **31/40** | **+1** | **Good — 0 P1/P0** |

## Anti-Patterns Verdict

**LLM assessment:** On-system, not AI slop. The core issue — cramped previews — is resolved; the with-logo layout is now featured at realistic width with two alternates below.

**Deterministic scan:** 0 findings.

**Visual overlays:** not run this pass.

## Resolved Since Last Run

- **[P1] Cramped previews** — featured with-logo preview at `max-w-2xl` (realistic email width), two alternates in a 2-col grid below; mobile still stacks full-width.
- **[P2] role=status** — added to `brand.note` and the confirmation; screen readers now announce results/errors.
- **[P2] Team CTA** — wired to `POST /api/waitlist` (real notification + validation), replacing the fake-success no-op. Consistent with the landing.
- **[P2] aria-pressed** — added to font buttons; active font now exposed to assistive tech.
- **[P3] Read-only swatches** — labeled "extracted · read-only" + `cursor-default`, no longer reading as interactive.

## Remaining (low priority)

- **[P3]** No "Reading your site…" pulse like the landing — slightly thinner status feedback during generation.
- **[P3]** Three identical "Copy with Pro" links (one per preview) — repetitive but acceptable.

## Questions to Consider

- Worth mirroring the landing's generation pulse for parity?
- Should the featured preview rotate to whichever layout the user last interacted with?
