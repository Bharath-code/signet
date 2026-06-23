---
target: the landing page (/)
total_score: 30
p0_count: 0
p1_count: 0
timestamp: 2026-06-23T16-21-38Z
slug: app-components-landingpage-tsx
---
# Critique (re-run) — Landing (`/` → LandingPage.tsx)

Re-critique after the fix pass. Source review + deterministic scan; no browser overlay this run.

## Design Health Score

| # | Heuristic | Score | Δ | Key Issue |
|---|-----------|-------|---|-----------|
| 1 | Visibility of System Status | 3 | — | Solid loading/status feedback |
| 2 | Match System / Real World | 3 | — | "§ 01" / "[ Validation demo ]" kept as deliberate brand voice (documented exception) |
| 3 | User Control and Freedom | 3 | — | Low-trap landing |
| 4 | Consistency and Standards | 3 | — | Badge sizes unified; CTA verbs still vary slightly |
| 5 | Error Prevention | 3 | +1 | Inline email validation now blocks empty/invalid submits on both forms |
| 6 | Recognition Rather Than Recall | 3 | — | Everything visible |
| 7 | Flexibility and Efficiency | 3 | — | Keyboard + skip link solid |
| 8 | Aesthetic and Minimalist Design | 3 | — | Hero capped to 6rem; mobile nav restored |
| 9 | Error Recovery | 3 | +1 | Specific failure copy; reduced-motion now compliant |
| 10 | Help and Documentation | 3 | — | Steps section self-documents |
| **Total** | | **30/40** | **+2** | **Good** |

## Anti-Patterns Verdict

**LLM assessment:** Distinctive Swiss-editorial system, not generic AI slop. The §-section-marker cadence remains, now a *documented deliberate device* (DESIGN.md sanctioned exception) rather than reflex scaffolding — an explicit brand choice, not an accident.

**Deterministic scan:** 2 advisory `design-system-color` hits (`#1d4ed8`, `#475569`) — the ACME demo brand in the Before/After block. Intentional sample data, not drift. No action.

**Visual overlays:** not run this pass.

## Resolved Since Last Run

- **[P1] Reduced-motion** — GSAP reveals gated behind `gsap.matchMedia('(prefers-reduced-motion: no-preference)')`; reduced-motion users get content at natural opacity, no entrance. WCAG AA gap closed.
- **[P1] §-markers** — kept by design decision; recorded as a sanctioned exception in DESIGN.md so they won't be stripped later.
- **[P2] Hero ceiling** — `clamp(2.8rem, 9vw, 6rem)`; within the 6rem ceiling and consistent with DESIGN.md.
- **[P2] Email validation** — both waitlist forms validate inline before submit.
- **[P2] Mobile nav** — How/Pricing surfaced at all widths.
- **Minors** — badge legibility (`0.62rem`), specific waitlist error copy.

## Remaining (low priority)

- **[P3]** CTA verb inconsistency across surfaces (Generate / Generate yours / Generate yours free / Notify me / Save my kit) — pick one or two canonical verbs.
- **[P3]** Pro plan CTA reads "Generate yours" but links to `#notify` (waitlist), not generation — slight label/destination mismatch.
- **[P3]** Two waitlist forms share `wlDone` state — confirm the cross-section done-flip is intended.

## Questions to Consider

- Should the Pro CTA say "Join the waitlist" to match its destination, reserving "Generate" for paths that actually generate?
- Is one canonical primary verb ("Generate") worth enforcing for recognition?
