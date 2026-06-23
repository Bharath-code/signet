---
name: Signet
description: On-brand email signatures in ten seconds — Editorial Swiss validation demo.
colors:
  ink: "#131210"
  muted: "#5E5A52"
  paper: "#F3F2EC"
  paper-deep: "#E9E8DF"
  card: "#FFFFFF"
  line: "#D8D6CC"
  accent: "#E23A1A"
  accent-deep: "#BF2E0F"
typography:
  display:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(2.8rem, 9vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.7rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.16em"
rounded:
  none: "0px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    height: "68px"
    padding: "0 32px"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
  cta-outline:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "12px 24px"
  cta-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  input-underline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px 0"
  card-bezel:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
---

# Design System: Signet

## 1. Overview

**Creative North Star: "Press & Ink"**

Signet is set like a letterpress broadsheet rendered for the browser — the International Typographic (Swiss) style, committed without apology. The surface is warm bone paper, the text is a near-black warm ink, and a single saturated vermilion acts as the stamp: accent, emphasis, and full stop in one. Whitespace is never merely empty; it is *structured* by hairline rules and a strict grid. Monospace carries every piece of metadata — labels, indices, captions — the way a printer's register marks sit beside the plate.

The system is deliberately light. There is no OS auto-invert, no dark mode; the bone-and-ink contrast is the identity, and flipping it would break the press metaphor (an earlier dark-mode flip was removed on purpose). Restraint is the product argument: this is a tool that promises "looks like your design team made it," so the marketing surface must itself read as the work of someone with taste. Every element earns its place or is cut.

This system explicitly rejects the **generic SaaS template** — gradient heroes, identical icon-heading-text card grids, rounded-everything, Inter-on-white, a tracked uppercase eyebrow stamped over every section. It equally rejects **clutter**: dense feature walls and competing elements. One clear idea per viewport, carried by type and rule, not chrome.

**Key Characteristics:**
- Warm bone paper (#F3F2EC), warm near-black ink (#131210), one vermilion stamp (#E23A1A)
- Zero border-radius — every corner is sharp
- Monospace (JetBrains Mono) for all metadata; grotesque display (Bricolage) for headlines
- Hairline rules (#D8D6CC) and grid structure instead of boxes and shadows
- Hard, blur-free offset shadow as the only elevation gesture

## 2. Colors

A warm-neutral print palette — bone and ink — punctuated by exactly one saturated color.

### Primary
- **Vermilion Stamp** (#E23A1A): The single saturated color in the system. Used as accent, period, and emphasis — the focus ring, the eyebrow tick, button-hover fill, the marquee star, the live "on-brand" word in the hero. Its rarity is the entire point.
- **Vermilion Deep** (#BF2E0F): The pressed state of the stamp — primary-CTA hover, active fills. Vermilion under pressure.

### Neutral
- **Warm Ink** (#131210): Near-black, warm-biased. Body copy, headlines, default button fill, input borders.
- **Muted Ink** (#5E5A52): Metadata and secondary copy. Warm gray off the ink hue — never a cool gray. Watch contrast on bone; keep it for ≥14px or label use, not long body runs.
- **Bone Paper** (#F3F2EC): The body surface. Warm, reads as printed stock — not white, not cream-by-default; this is the brand's own warm neutral.
- **Paper Deep** (#E9E8DF): Recessed bands and alternating sections; a half-step down from bone.
- **Card** (#FFFFFF): True white, used only where content needs to sit *on* the paper (preview frames, the hero input bar).
- **Line** (#D8D6CC): Hairline rules and dividers. The structural skeleton of the grid.

### Named Rules
**The One Stamp Rule.** Vermilion is the only saturated color and appears on ≤10% of any screen. It is accent and punctuation, never a fill for large areas (CTAs aside). A second accent color is forbidden.

**The Locked-Light Rule.** The system is light, always. `color-scheme: light` is set explicitly; `prefers-color-scheme` is never honored. No dark mode, no auto-invert.

## 3. Typography

**Display Font:** Bricolage Grotesque (with system-ui, sans-serif)
**Body Font:** Hanken Grotesk (with system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, monospace)

**Character:** A grotesque/humanist-sans pairing held apart by role and weight, not by clashing styles — Bricolage's tight, slightly idiosyncratic display contrasting Hanken's calm reading body, with JetBrains Mono as the register-mark voice for all metadata. The contrast axis is display-vs-mono, never two similar sans side by side.

### Hierarchy
- **Display** (800, clamp(2.8rem, 9vw, 6rem), lh 0.9, ls -0.03em, often UPPERCASE): Hero headlines only. Tight-set, balanced lines. Instances run 5rem (studio) to 6rem (landing hero); 6rem is the hard ceiling — the page designs, it does not shout.
- **Headline** (700, clamp(1.5rem, 3vw, 2rem), lh 1.05, ls -0.02em): Section and CTA headings.
- **Body** (400, 1.125rem, lh 1.65): Reading copy. Capped at 65–75ch (`max-w-xl` / `max-w-2xl`). Bias color toward ink, not muted, for long runs.
- **Label** (500, 0.7rem, ls 0.16em, UPPERCASE, mono): Field labels, captions, indices, the eyebrow. The metadata voice.

### Named Rules
**The Mono-Metadata Rule.** Every label, caption, index, and eyebrow is JetBrains Mono, uppercase, wide-tracked (≥0.12em). Metadata never borrows the body or display face.

**The Eyebrow-Discipline Rule.** The `.eyebrow` (mono caption + vermilion tick) is a deliberate brand mark, not section scaffolding. Use it sparingly as voice — never stamp one over every section. An eyebrow above every heading is the AI tell the brand rejects.

> **Sanctioned exception — the §-section markers.** The landing's right-aligned mono section markers (`§ 01 — Process`, `§ 02 — The difference`, `§ 03 — Pricing`) are a *deliberate* editorial device, kept on purpose as brand voice. They are the documented carve-out to this rule — do not "fix" or strip them. New sections may extend the sequence; the device stays consistent.

## 4. Elevation

Flat by default. Depth is conveyed by hairline rules, grid structure, and tonal layering (bone → paper-deep → white), not by ambient shadow. There is exactly one shadow in the system, and it has no blur.

### Shadow Vocabulary
- **Hard Offset** (`box-shadow: 6px 6px 0 -1px var(--color-line)`): The bezel/preview-frame hover state. A crisp, blur-free offset — a sheet of paper lifted off the stack, the way a print proof casts a hard edge. Paired with a border shift to ink.

### Named Rules
**The Hard-Offset Rule.** Shadows have zero blur. Depth is a printed offset, never a soft glow. Blurred drop-shadows and glassmorphism are forbidden — they break the press metaphor instantly.

## 5. Components

### Buttons
- **Shape:** Sharp rectangles, zero radius (`{rounded.none}`). 1.5px borders.
- **Primary (hero):** Ink fill (#131210), bone text, 68px tall, mono uppercase label. Hover fills vermilion (#E23A1A) with a 3px arrow-trail nudge; active translates 1px down. The transition eases on `cubic-bezier(0.32, 0.72, 0, 1)`.
- **Primary (plan CTA):** Vermilion fill (#E23A1A), white text; hover deepens to vermilion-deep (#BF2E0F).
- **Outline:** 1.5px ink border on white, ink mono-uppercase label; hover inverts to ink fill with bone text.

### Cards / Containers
- **Corner Style:** Zero radius. Sharp.
- **Background:** White card (#FFFFFF) on bone paper.
- **Border:** 1px hairline (#D8D6CC) at rest.
- **Shadow Strategy:** Flat at rest; on hover the border shifts to ink and the Hard Offset shadow appears. See Elevation.
- **Doctrine:** Cards are used only as preview frames where content must sit on the paper — not as the default layout unit. Nested cards are forbidden.

### Inputs / Fields
- **Style:** Underline only — transparent background, 1px bottom hairline (#D8D6CC), no box. The hero URL field is the exception: a sharp 1.5px ink-bordered bar (68px) on white.
- **Focus:** Border/underline shifts to vermilion (`border-accent`). The global focus-visible ring is an unlayered 2px vermilion outline at 2px offset (WCAG 2.4.7) — never removed.
- **Labels:** Mono uppercase above the field. Inputs carry `suppressHydrationWarning` for extension-injected attributes.

### Navigation
- **Style:** Sticky top bar, bone at 86% opacity with a 10px backdrop blur, hairline bottom border. Brand mark + "Signet" in Bricolage extrabold; links in mono uppercase, muted, hover to ink.

### Live Signature Preview (signature component)
- Three side-by-side iframe previews (`sandbox=""`) rendering real table-based, inline-CSS email HTML — the literal product output, not preview chrome. Seeded with a neutral kit on load so all three render before any fetch (the "instant proof" principle). Visual placement (centering, padding) lives in the preview card wrapper, never in the rendered signature.

## 6. Do's and Don'ts

### Do:
- **Do** keep vermilion (#E23A1A) to ≤10% of any screen — accent and punctuation only (The One Stamp Rule).
- **Do** set every corner sharp (radius 0). Sharpness is identity.
- **Do** render all metadata — labels, captions, indices, eyebrows — in JetBrains Mono, uppercase, ≥0.12em tracking.
- **Do** structure whitespace with hairline rules (#D8D6CC) and the grid; let type and rule carry hierarchy.
- **Do** convey depth with the blur-free Hard Offset shadow and tonal layering (bone → paper-deep → white).
- **Do** bias body text toward ink (#131210); reserve muted (#5E5A52) for ≥14px labels, and verify ≥4.5:1 on bone (WCAG AA).

### Don't:
- **Don't** ship the **generic SaaS template**: no gradient heroes, no identical icon-heading-text card grids, no rounded corners, no Inter-on-white.
- **Don't** stamp the eyebrow (or any tracked-uppercase kicker) over every section. One deliberate mark is voice; on every heading it's the AI tell the brand rejects.
- **Don't** clutter: no dense feature walls or competing elements. One clear idea per viewport.
- **Don't** introduce a second saturated accent. Vermilion is the only stamp.
- **Don't** add dark mode or honor `prefers-color-scheme` (The Locked-Light Rule).
- **Don't** use blurred drop-shadows or glassmorphism. Shadows have zero blur (The Hard-Offset Rule).
- **Don't** let display headings exceed 5rem or set tighter than -0.04em — design, don't shout.
