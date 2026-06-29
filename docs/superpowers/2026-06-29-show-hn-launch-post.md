# Show HN / Launch Post

Origin-story launch asset. Plain engineer-to-engineer voice (NOT the editorial
"Press & Ink" brand voice — HN punishes polish, rewards specifics + admitted
limits). Every number below is real; do not round up — HN will check.

## Title (≤80 chars, lead with the verb)

> Show HN: Signet – paste a URL, get a brand-matched email signature in 10s

## URL

Vercel deploy link.

## Text / author's first comment

I kept getting handed "email signature generators" that are really just blank
template builders — pick a layout, type everything in, hope it matches your
brand. So I built the opposite: you paste your company URL and it reads your
actual site (logo, colors, font) and renders three signatures live. No signup.

How it works: deterministic-first. It pulls brand data from Firecrawl's branding
extraction, then inline CSS tokens, then page metadata. Only if something's
missing or looks wrong does it fall back to a Gemini vision call to fill the gap
— so on my test set ~50% of sites never touch the LLM, which keeps it fast and
cheap. If everything fails it degrades to your real logo + name with editable
color guesses. It never shows a broken signature.

The honest part: I spent ~5 days convinced my extraction was buggy, because my
own site kept coming out "wrong." It wasn't. My brand is a dark neon lime
(#d4f53c) on near-black. Email signatures render on white. Neon-on-white is a
1.2:1 contrast ratio — illegible — so the renderer auto-darkens body text to hit
WCAG AA, and the lime only survives as an accent border. Extraction was correct
the whole time; my own brand was just the adversarial edge case. I nearly built
an entire external-CSS-fetcher to "fix" a non-bug. Shipped instead.

What's deliberately *not* here: no accounts, no database, no saving. It's a
validation demo to find out whether the "paste URL → it just looks like you"
moment actually lands before I build the real thing (one sign-in, deploy a
signature across a whole team).

Known rough edges: dark-neon brands on a white canvas (above), SVG-only logos
(Gmail won't render SVG, so I rank rasters first), and the per-paste API cost is
why there's a rate limit.

Would love feedback on extraction quality specifically — paste your own site and
tell me whether the signature actually looks like you.

## Why this works (notes for adaptation to other channels)

- The struggle IS the credibility. The #d4f53c / 1.2:1 paragraph does 3 jobs:
  authentic-struggle, proof you understand the hard part (contrast on white),
  and it preempts the top HN comment ("doesn't work on dark brands") by raising
  it first.
- Founder-first-person, not customer-as-hero — correct for HN only. The
  customer-as-hero framing lives in the cold email + landing page, not here.
- Posting it is itself distribution — Show HN is an outreach channel, not a
  detour from "go get users."
