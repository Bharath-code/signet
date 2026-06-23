# Brand Identity & Design System v2 — Signet

*Date: 2026-06-23*

> **Supersedes `2026-06-22-brand-design-system.md`.** The original "Ink & Wax"
> system encoded two of the most-flagged AI-design tells: the warm cream + brass/clay
> + espresso palette (`design-taste-frontend` §4.2 PREMIUM-CONSUMER PALETTE BAN)
> and Fraunces as the default display serif (explicitly banned as a default).
> This v2 rotates off both while preserving the Signet/wax-seal *metaphor*.

---

## The brand metaphor survives the palette swap

The "signet ring pressed once → your mark is everywhere" idea is intact. It's
rendered as a **single saturated stamp of color on near-pure monochrome**, not
as warm wax on cream paper. The mark is still the moment of intent — it's just
blue ink, not amber wax.

---

## Vibe archetype

**Pure Monochrome + Single Saturated Pop** — one of the explicit alternatives
to the banned warm-craft palette. The accent does ALL the work; nothing else
is allowed to be colorful.

- Read as: a SaaS tool that feels like a precision instrument, not a candle company.
- Reference tier: Linear / Vercel / Cron — restrained, instrument-grade, one accent.

---

## Color tokens

### Light mode (default)

```css
/* Paper — neutral cool off-white (zinc family) */
--color-paper:      #FAFAFA;
--color-paper-deep: #F4F4F5;

/* Ink — near-black cool (zinc-950, not espresso) */
--color-ink:        #09090B;
--color-muted:      #52525B;
--color-line:       #E4E4E7;
--color-card:       #FFFFFF;

/* Stamp — the ONE accent. Electric blue, used sparingly. */
--color-accent:      #2563EB;
--color-accent-deep: #1D4ED8;
--color-accent-tint: #DBEAFE;
```

### Dark mode (auto via `prefers-color-scheme`)

```css
--color-paper:      #09090B;
--color-paper-deep: #18181B;
--color-ink:        #FAFAFA;
--color-muted:      #A1A1AA;
--color-line:       #27272A;
--color-card:       #18181B;
--color-accent-tint: #1E293B;
```

### Color rules (locked)

- **One accent per page, ever.** No secondary accent. The accent appears in:
  the hero eyebrow, the focus ring, the focus border, one mid-page italic word,
  the "Popular" pricing badge, and hover states. That's it — counted and locked.
- **No warm neutrals.** No cream, no brass, no ochre, no espresso, no oxblood.
- **No pure `#000` or `#fff`** anywhere — `#09090B` and `#FAFAFA` instead.
- **Page themes don't invert mid-scroll.** One theme per page (the page is light
  by default; dark auto-switches only via `prefers-color-scheme`).

---

## Typography

### Fonts

```css
--font-display: var(--font-space-grotesk), system-ui, sans-serif;   /* headlines, eyebrows */
--font-body:    var(--font-hanken), system-ui, sans-serif;           /* body, UI, inputs   */
```

### Why these specifically

- **Space Grotesk** replaces Fraunces. Distinctive sans display with technical,
  precise character (the "stamp/mark" feel) — and it's NOT on the banned defaults
  list. Available on Google Fonts via `next/font`, zero new infrastructure.
- **Hanken Grotesk** stays — already loaded, geometric, calm, pairs cleanly.
- **Mixed-family emphasis is banned.** When a word needs emphasis inside a
  headline, use **italic of the same family**, never inject a serif.

### Type scale & rules

- Display sizes: `clamp(3rem, 8vw, 6rem)` hero · `clamp(1.9rem, 4vw, 3.25rem)` section H2.
- Body max width: `52ch` for hero subtext, `48ch` for hero subhead.
- Section rhythm: `py-40 desktop / py-24 mobile` (160px / 96px) — the layout breathes.
- **Italic descender clearance:** whenever italic display words contain `y g j p q`,
  `leading-[1.05]` minimum + `pb-1` reserve. No clipped descenders.

---

## Component architecture — Double-Bezel (Doppelrand)

Every premium card, input, pricing cell, and signature preview is nested
hardware, not a flat CSS box (per `high-end-visual-design` §4.A).

### `.bezel` (outer shell)

```css
background: color-mix(in srgb, var(--color-ink) 5%, transparent);
border: 1px solid var(--color-line);
border-radius: 1.5rem;
padding: 0.5rem;
```

### `.bezel-inner` (inner core)

```css
background: var(--color-card);
border-radius: calc(1.5rem - 0.5rem);   /* concentric curve */
box-shadow: inset 0 1px 0 rgba(255,255,255,0.25);
```

Dark mode swaps the inset to `rgba(255,255,255,0.06)`.

### Email signature cards stay white-core

`SignaturePreview` inner cores always render on `#fff` — that's the actual
email output, not preview chrome. Theme swaps the bezel shell only.

---

## Buttons — Button-in-Button trailing icon

Every primary CTA is a pill (`rounded-full`) with the arrow nested inside its
own circular wrapper, never naked text. On hover, the inner circle translates
`+2px, -1px` diagonally to create kinetic tension (§4.B / §5.B).

```jsx
<button className="hero-button ...">
  Generate yours
  <span className="hero-button-trail" aria-hidden>→</span>
</button>
```

Magnetic hover physics applies to the hero CTA only — tracked via direct DOM
mutation in a `useEffect` (NEVER `useState` — that re-renders on every frame,
collapses on mobile per `design-taste-frontend` §3.B).

---

## Motion choreography

### Reveal: blur-up with stagger

```js
gsap.from(el, {
  y: 32, opacity: 0, filter: 'blur(8px)',
  duration: 0.9, ease: 'power3.out',
  scrollTrigger: { trigger: el, start: 'top 88%', once: true },
});
```

Standard `power2.out` reads as templated. The blur parameter is what separates
"good" from "\$150k agency" — it costs nothing and is the elite signature.

### Easing

- All transitions use `cubic-bezier(0.32, 0.72, 0, 1)` (`--ease-fluid`), not
  `linear` or `ease-in-out` (both banned by `high-end-visual-design` §2).
- Spring physics on hover/active: `active:scale-[0.98]`.

### What's banned

- `window.addEventListener('scroll', ...)` for state — magnetic hover uses
  direct DOM mutation, not React state.
- Animating `width`/`height`/`top`/`left`. Only `transform` + `opacity` + `filter`.
- Marquees (≤ 1 per page; current page has 0).
- Static elements that claim motion dials they don't deliver.

---

## Eyebrow discipline (the #1 production rule)

**Max 1 eyebrow per 3 sections.** Page has 5 sections → max 1 eyebrow. The hero
owns it ("Brand signatures, automated"). Every other section leads with the
headline alone. Eyebrows are pill badges (`rounded-full px-3 py-1 text-[10px]`),
never plain tracking text.

---

## CTA label rules

**One label per intent.** All signup-intent CTAs read "Generate yours →":
nav, hero, final CTA, Free + Pro pricing CTAs. The Team waitlist CTA is the
only different label ("Join the waitlist") because it's a different intent.

CTA labels must fit on one line at desktop. Wrapped CTAs are a pre-flight fail.

---

## Layout families (no repetition)

Each section uses a distinct family — never the same one twice:

| Section | Layout family |
|---|---|
| Hero | Centered manifesto, input-as-hero (Raycast/Cron) |
| How it works | Asymmetric 2×2 bento of Double-Bezel cards |
| Before/After | Split-screen, tilted ±1deg opposing Double-Bezel cards |
| Pricing | 3-col grid, middle card physically `scale(1.04)` elevated |
| Final CTA | Full-bleed `paper-deep`, oversized centered display, accent italic |

A page with 8 sections must use at least 4 different layout families. This
page has 5 sections and 5 families — passes.

---

## Anti-patterns we explicitly avoid

- ❌ Warm cream / brass / clay / ochre / oxblood / espresso palette
- ❌ Fraunces / Instrument Serif as default display
- ❌ Eyebrow above every section header
- ❌ Generic 3-column equal feature cards (asymmetric bento instead)
- ❌ Flat `border border-gray-200` cards without nested architecture
- ❌ Naked trailing arrows on CTAs
- ❌ `power2.out` / `linear` / `ease-in-out` motion
- ❌ "AI purple" neon glows
- ❌ Pure `#000` or `#fff`
- ❌ Mixed-family emphasis (serif word inside sans headline)
- ❌ Three different "signup" CTA labels on one page
- ❌ Static elements claiming motion dials they don't deliver

---

## What survives from v1

- The name "Signet" and the wax-seal metaphor
- Hanken Grotesk as body font
- The product wedge (URL → brand kit → signatures)
- The "one accent used sparingly" rule
- The "demo is the hero, input is the hero" landing architecture
- 4-step "how it works" content (layout changed, copy stays)

Everything else rotated to escape the AI-tell flags.