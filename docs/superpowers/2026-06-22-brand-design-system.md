# Brand Identity & Design System — Signet
*Date: 2026-06-22*

---

## The Name: Signet

**Signet** (n.) — a small seal, especially one set in a ring, used to stamp an official mark on correspondence.

Historically, a signet ring was how royalty, merchants, and officials left their personal mark on every letter they sent. That's exactly what this product does — stamps your brand identity on every email automatically.

The metaphor earns the name. The name writes the marketing copy. That's when you know it's right.

**Domain options:**
- `signet.so` (preferred — clean, modern TLD)
- `getsignet.com`
- `signethq.com`

**Works naturally in context:**
- "Your Signet. Every email."
- "Signet for Teams"
- "Deploy with Signet"
- "Signet Pro"

---

## Brand Position

**Category we're creating:** Brand Signatures (not "email signature generators")

The distinction matters. "Email signature generators" are form-fillers. "Brand signatures" are what happens when the product reads your entire brand identity and expresses it correctly — automatically.

**The one word we own:** *Automatic*

Every competitor requires manual input. We don't. That's the word to own in this category.

**Who we're for:** Founders, marketing managers, and agencies who care about their brand — and have better things to do than pick hex codes.

**Who we're explicitly not for (yet):** Enterprise IT procurement. Don't chase them.

**Positioning statement:**
> For founders and marketing teams who send emails, Signet is the brand signature tool that generates, personalizes, and deploys your company's email signatures automatically — unlike Wisestamp or Newoldstamp, which require manual template setup and field-filling for every employee.

---

## Brand Personality

| Dimension | Direction | Not |
|---|---|---|
| Tone | Confident, direct | Arrogant, pushy |
| Register | Professional, slightly warm | Corporate, cold |
| Wit | Present but restrained | Trying too hard |
| Focus | Outcome, not feature | Technical spec |
| Voice | "You" centric | "We" centric |

**Brand metaphor:** The signet ring. Pressed once. Your mark is everywhere.

**What to never say in copy:**
- "Revolutionary" / "game-changing" / "disrupting"
- "Easy to use" (show it, don't say it)
- "Powerful yet simple" (cliché)
- "AI-powered" as a leading claim (means, not end)
- "For teams of all sizes" (everyone = no one)

---

## Marketing Copy

### Hero (Landing Page, Above Fold)

```
EYEBROW
Brand Signatures, Automated

HEADLINE
Your mark on every email.

SUB
Paste your company URL. Signet reads your brand —
logo, colors, fonts — and generates polished signatures
for your entire team. Deploy to Google Workspace in one click.

PRIMARY CTA    →  Generate yours free
SECONDARY CTA  →  Watch the demo (30s)
```

### Headline Alternates (A/B test candidates)

```
"Your brand in every email. Zero setup."
"Paste your URL. Your whole team gets branded signatures."
"The email signature your brand deserves. In 10 seconds."
"Stop asking your team to install signatures correctly."
```

### Three Value Props (Below Hero)

```
01  Zero configuration
    We read your website. You don't fill a single field.

02  Whole team in 3 minutes
    Connect Google Workspace. One deploy button. Everyone's live.

03  Stays in sync
    Rebrand? Update once. It propagates automatically.
```

### How It Works (Section)

```
SECTION HEADLINE
From URL to deployed. Under 3 minutes.

STEP 1  Paste your URL
        We scrape your site and extract your logo,
        brand colors, and font — automatically.

STEP 2  Preview your signatures
        Three polished layouts, branded to your company.
        Pick one. Or all three.

STEP 3  Connect your team
        One Google Workspace OAuth click — we read
        your company directory. Every employee, auto-filled.

STEP 4  Deploy
        One button. Every inbox updated. Done.
```

### Competitive Contrast Copy

```
"Other tools make you pick colors. We read your website."
"No template picker. No hex codes. No IT ticket."
"Newoldstamp takes days. Signet takes 3 minutes."
```

### For the Solo Founder

```
"Your brand on every email — without spending an hour
on HTML you'll paste wrong anyway."
```

### For Marketing Teams

```
"Set it once. Control it from one place.
Every employee, on-brand, always."
```

### Pricing Section

```
HEADLINE
Start free. Scale when you're ready.

FREE        $0     1 brand kit · 3 layouts · "Made with Signet" footer
PRO         $12/mo Unlimited kits · all fonts · no footer · copy HTML
TEAM        $8/seat/mo  Workspace sync · team admin · bulk deploy
```

---

## Color System — "Ink & Wax"

The palette is built on the metaphor: ink on quality paper, sealed with wax. Warm, premium, editorial — without feeling like a candle company.

### Core Tokens

```css
/* Backgrounds */
--color-paper:        #FAFAF7;   /* Primary background — warm off-white */
--color-paper-raised: #F5F0E8;   /* Card surfaces, inputs */
--color-paper-sunken: #EFECE3;   /* Code blocks, subtle wells */

/* Ink */
--color-ink:          #1C1917;   /* Near-black, warm — primary text */
--color-ink-secondary: #57534E;  /* Secondary text */
--color-ink-muted:    #A8A29E;   /* Placeholder, disabled text */

/* Seal — the brand accent color */
--color-seal:         #92400E;   /* Amber/wax — primary brand color */
--color-seal-hover:   #78350F;   /* Darker on hover */
--color-seal-light:   #FEF3C7;   /* Amber tint backgrounds */
--color-seal-vivid:   #D97706;   /* CTAs, highlights */

/* Borders */
--color-border:       #E7E5E4;   /* Default border */
--color-border-strong: #D6D3D1;  /* Emphasis border */

/* Semantic */
--color-success:      #15803D;
--color-error:        #DC2626;
--color-warning:      #B45309;
```

### Dark Mode (App Shell / Demo Area)

```css
--color-surface-dark:    #1A1714;  /* App background */
--color-surface-dark-raised: #242019;
--color-text-dark-primary: #F5F0E8;
--color-text-dark-secondary: #A8A29E;
--color-border-dark:     #2D2926;
```

### Color Usage Rules

- **Seal (`#D97706`)** — CTAs, active states, focus rings, key data points. Use sparingly. One instance per view is enough.
- **Ink (`#1C1917`)** — All body text, headings. Never pure `#000000`.
- **Paper (`#FAFAF7`)** — Page backgrounds only. Never for text.
- **Paper-raised** — Cards, input backgrounds, elevated surfaces.
- No gradients on interactive elements. No drop shadows on text.

---

## Typography System

### Fonts

```css
--font-display: 'Fraunces', Georgia, serif;
/* Optical size variable font — use opsz axis for headlines */
/* Already loaded in the product. Keep it. */

--font-body: 'Hanken Grotesk', system-ui, sans-serif;
/* UI text, body copy, labels, inputs */

--font-mono: 'Geist Mono', 'Fira Code', monospace;
/* HTML output display, code blocks only */
```

### Type Scale

```css
--text-xs:   0.75rem;    /* 12px — labels, metadata */
--text-sm:   0.875rem;   /* 14px — secondary UI, captions */
--text-base: 1rem;       /* 16px — body copy */
--text-lg:   1.125rem;   /* 18px — lead text, card titles */
--text-xl:   1.25rem;    /* 20px — section subheads */
--text-2xl:  1.5rem;     /* 24px — section headings */
--text-3xl:  1.875rem;   /* 30px — page headings */
--text-4xl:  2.25rem;    /* 36px — hero subhead */
--text-5xl:  3rem;       /* 48px — hero headline (desktop) */
--text-hero: clamp(2.5rem, 5vw, 4.5rem); /* Fluid hero */
```

### Line Heights

```css
--leading-none:    1;      /* Display text, very large sizes */
--leading-tight:   1.2;    /* Headlines 3xl+ */
--leading-snug:    1.35;   /* Subheadings */
--leading-normal:  1.5;    /* Body copy */
--leading-relaxed: 1.65;   /* Long-form prose */
```

### Letter Spacing

```css
--tracking-tighter: -0.04em;  /* Large display (5xl+), Fraunces */
--tracking-tight:   -0.02em;  /* Headings (3xl–4xl) */
--tracking-normal:   0;        /* Body */
--tracking-wide:     0.05em;   /* Labels, eyebrows, small caps */
--tracking-wider:    0.1em;    /* All-caps labels only */
```

### Typography Rules

- Headlines use **Fraunces** (optical size `opsz 144` for large display, `opsz 72` for section headers)
- Body and UI copy uses **Hanken Grotesk**
- Never mix both in the same line
- Max line width: `65ch` for prose, `80ch` for UI descriptions
- Eyebrows / labels: Hanken Grotesk, `--text-sm`, `--tracking-wide`, uppercase optional

---

## Spacing System

Base unit: **4px**. Everything is a multiple of 4.

```
1  →   4px   micro spacing (icon gaps, inline items)
2  →   8px   tight (label → input, icon → text)
3  →  12px   compact (list items)
4  →  16px   default (form fields, card padding mobile)
5  →  20px
6  →  24px   standard component padding
8  →  32px   between components
10 →  40px
12 →  48px   section internal spacing
16 →  64px   between sections (mobile)
20 →  80px
24 →  96px   between sections (desktop)
32 → 128px   page-level vertical rhythm
```

### Layout

```css
--container-max:    1120px;  /* Max page width */
--container-narrow:  720px;  /* Content/prose columns */
--container-wide:   1280px;  /* Full-bleed layouts only */
--section-y-desktop: 96px;
--section-y-mobile:  64px;
--page-x-padding:    24px;   /* Mobile horizontal padding */
```

---

## Component Tokens

### Border Radius

```css
--radius-sm:   4px;     /* Badges, chips, small elements */
--radius-md:   8px;     /* Buttons, inputs */
--radius-lg:  12px;     /* Cards (default) */
--radius-xl:  16px;     /* Modal, large cards */
--radius-2xl: 24px;     /* Signature preview frames */
--radius-pill: 9999px;  /* Tags, pill buttons */
```

### Shadows

```css
--shadow-sm:   0 1px 2px rgba(28, 25, 23, 0.06);
--shadow-md:   0 4px 12px rgba(28, 25, 23, 0.08),
               0 1px 3px  rgba(28, 25, 23, 0.06);
--shadow-lg:   0 8px 32px rgba(28, 25, 23, 0.12),
               0 2px 8px  rgba(28, 25, 23, 0.06);
--shadow-seal: 0 0 0 3px  rgba(146, 64, 14, 0.2);  /* Focus ring */
```

Shadows are warm (amber-tinted), never blue-grey. The focus ring (`--shadow-seal`) uses the brand amber — consistent, distinctive.

### Motion

```css
--duration-fast:   100ms;
--duration-normal: 200ms;
--duration-slow:   350ms;

--ease-out:   cubic-bezier(0.0, 0.0, 0.2, 1);   /* Entrances */
--ease-in:    cubic-bezier(0.4, 0.0, 1.0, 1);   /* Exits */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* UI interactions */
```

---

## Component Design Decisions

### Buttons

```
PRIMARY    bg: --seal-vivid   text: white   radius: --radius-md   height: 44px
SECONDARY  bg: --paper-raised text: --ink   border: --border-strong
GHOST      bg: transparent    text: --ink   border: transparent   underline on hover
DANGER     bg: #DC2626        text: white

All buttons: font Hanken Grotesk, font-weight 500, text-base, tracking-normal
Hover: 6% darken, 150ms ease-out
Active: 10% darken, scale(0.98), 100ms
Focus: --shadow-seal ring
```

### Inputs

```
Height:      44px (matches buttons — same tap target)
Background:  --paper-raised
Border:      1px --border
Border-focus: 1.5px --seal
Shadow-focus: --shadow-seal
Font:        Hanken Grotesk, text-base
Placeholder: --ink-muted
Border-radius: --radius-md
```

### Cards

```
Background:  white or --paper
Border:      1px --border
Radius:      --radius-lg
Shadow:      --shadow-md on hover, --shadow-sm at rest
Padding:     24px (desktop), 16px (mobile)
Transition:  shadow 200ms ease-out
```

### Signature Preview Cards

```
Radius:      --radius-2xl
Shadow:      --shadow-lg
Background:  white (always — email signatures render on white)
Border:      2px transparent (selected: 2px --seal-vivid)
Aspect:      fixed width 520px max, natural height
```

---

## Logo / Wordmark Direction

**Wordmark:** "Signet" in Fraunces, optical size 72, weight Regular, color --ink.

**Mark concept:** A stylized wax seal impression — circular, with an "S" letterform pressed into it. Used as:
- Favicon
- App icon
- "Made with Signet" footer stamp on free-tier signatures

**Don't:** Make the mark look like a ring. Keep it as the impression/stamp, not the ring itself.

---

## Applied Design — Landing Page Structure

```
NAV
  Signet wordmark [left] | Pricing · Log in · "Get started" [right]

HERO   (--section-y-desktop top)
  Eyebrow: "Brand Signatures, Automated"
  H1: "Your mark on every email."  [Fraunces, --text-hero, --tracking-tighter]
  Sub: [Hanken Grotesk, --text-xl, --ink-secondary, max 60ch]
  CTAs: [Primary: "Generate yours free"] [Ghost: "Watch demo →"]
  Demo: Autoplay GIF / video below CTAs — URL pasted → signature appears

HOW IT WORKS  (4 steps, numbered, horizontal on desktop)
  "From URL to deployed. Under 3 minutes."

FOR TEAMS  (split layout: copy left, signature preview grid right)
  "Set once. Control from one place. Every employee, always on-brand."

PRICING  (3 columns, Free / Pro / Team)

FOOTER  (minimal: logo, links, © Signet)
```

---

## Design Anti-Patterns (Avoid These)

- **No gradients** on primary surfaces. Flat color only.
- **No dark-on-dark text** below 4.5:1 contrast ratio.
- **No icon-only buttons** without tooltip or label.
- **No pure `#000` or `#fff`** — always the warm variants.
- **No body text below `--text-sm`** in UI.
- **No blue** anywhere. It's the generic SaaS color. We own amber/wax.
- **No Fraunces below `--text-2xl`** — too decorative at small sizes.
- **No shadow on text**. None. Ever.
- **No rounded corners below `--radius-sm`** — avoid sharp-only design.
- **No more than 2 font weights per screen** — Regular + Medium is enough.
