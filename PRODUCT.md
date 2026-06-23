# Product

## Register

brand

## Users

Founders, solo operators, and small-team leads who want a polished, on-brand email signature without hiring a designer or fighting a template builder. They arrive skeptical (they've seen generic signature generators) and time-poor. Their context is a single evaluative moment: they paste their company URL to see whether the tool actually understands their brand. The job to be done is "make me a signature that looks like my design team made it — in seconds, without work."

This is a validation-stage demo, not the full product. The primary surface is the marketing landing (`/`); the signature studio (`/app`) exists to deliver the proof live and convert that conviction into a waitlist signup.

## Product Purpose

Prove the "magic moment" — paste a website, watch a genuinely on-brand signature render instantly — convincingly enough that visitors join the waitlist for the real product (one sign-in, whole-team signature deploy). Success is measured by URL submissions and waitlist conversions, segmented self-vs-team. The landing must sell the outcome; the demo must earn belief by performing, not describing.

## Brand Personality

Editorial, precise, confident. Swiss-typographic restraint: type and whitespace carry the weight, chrome is minimal. The voice is assured and quiet — it states the outcome and then demonstrates it, never hypes. Emotional goal: the visitor feels they've found a tool built by people with taste, and trusts the output before they've signed up.

## Anti-references

- **Generic SaaS template**: gradient hero, identical icon-heading-text card grids, rounded-everything, Inter-on-white, tiny tracked uppercase eyebrows over every section. The default AI-landing look — the exact thing this must not be mistaken for.
- **Cluttered / busy**: dense feature walls, competing elements, no breathing room. Restraint is the differentiator; one clear idea per viewport.

## Design Principles

- **Show, don't tell.** The live demo is the pitch. Prove the magic moment by performing it instantly; never explain what a paragraph of copy could replace with a rendered result.
- **Instant proof, no gates.** Previews render on load (SSR-seeded) before any fetch or typing. No signup, no spinner-first experience, nothing between the visitor and belief.
- **Output quality is the promise.** "Looks like your design team made it" is the product claim, so the marketing surface must itself clear that bar. Craft and restraint signal competence more than any feature list.
- **Honest degradation.** Never show broken. When extraction partially fails, salvage and show the real logo and name with editable approximations — framed as an invitation, not an error. A graceful fallback is a conversion surface, not a dead end.
- **Editorial restraint.** Fewer, sharper elements. Whitespace, typographic hierarchy, and a single committed accent do the work; decoration does not.

## Accessibility & Inclusion

Target WCAG 2.1 AA. Body text ≥4.5:1 contrast (watch muted text on the bone background — bias toward the ink end of the ramp), large text ≥3:1, visible non-layered focus rings, and a `prefers-reduced-motion` alternative for every animation. Forms carry accessible labels and `suppressHydrationWarning` for extension-injected attributes. Don't rely on the vermilion accent alone to carry meaning.
