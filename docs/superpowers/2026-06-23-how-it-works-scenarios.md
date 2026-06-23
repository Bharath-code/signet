# Signet — How It Works, Every Scenario (Plain English)

*Date: 2026-06-23*
*Purpose: a simple explainer anyone can read to understand who uses Signet, what they
paste, and what they get. Hand this to a teammate, investor, or new hire.*

---

## The one idea behind the whole product

> **You point Signet at a website. It reads that website's logo, colors, and font, and
> builds an email signature that matches that brand.**

The brand kit (logo + colors + font) is **not a file** stored on the website. Signet
*looks* at the site — like a designer glancing at it — and figures the brand out:

```
website URL  →  grab the page (HTML + screenshot)  →  AI extracts logo, colors, font  →  branded signature
```

The URL you paste is **always "the website of the brand the signature should match."**
What changes between users is just **whose brand** and **how many signatures** come out.

---

## Part 1 — Individual scenarios (one person, one signature)

| # | Who | What they paste | What they get | Notes |
|---|---|---|---|---|
| 1 | **Founder of a startup** | their startup site `acme.com` | a signature in Acme's brand | Their company = their brand |
| 2 | **Freelancer with a personal site** | `janedoe.com` | a signature in their personal brand | Personal brand = the site |
| 3 | **Employee at a company** *(most common!)* | their **employer's** site, e.g. `stripe.com` | a signature in the employer's brand | They want to look on-brand without bugging IT or typing hex codes |
| 4 | **Person with NO website** (job seeker, student, brand-new freelancer) | — | a clean **neutral** signature they fill in by hand | **SHELVED (2026-06-23):** no site = no brand to extract, so our AI magic doesn't apply. Decided NOT to build the manual editor (color picker + logo upload) — that's a catch-up-to-competitors feature for our lowest-value segment (no company = no recurring revenue). Serve them the free neutral signature; don't invest. |
| 5 | **Employee whose company has a weak/ugly site** | the company site | best-effort kit, may need light manual tweaks | AI does its best; user can adjust |

**Key point for individuals:** they're solving **their own** signature. They paste a URL,
get one good-looking signature, drop in their name/title, copy it into Gmail/Outlook. Done.

---

## Part 2 — Team / company scenarios (one admin, many signatures)

| # | Who | What they paste | What they get | Notes |
|---|---|---|---|---|
| 6 | **Small-team admin (5–20)** | the company site **once** `acme.com` | the brand kit applied to everyone; each person adds their own name/title | Self-serve, per-seat billing |
| 7 | **Mid company (20–100) on Google Workspace / M365** | company site once | **every employee's** signature auto-generated from the company directory (name, title, photo) | The 10x moment — *future feature* (directory sync) |
| 8 | **Agency managing many clients** | each client's site, e.g. `clientA.com`, `clientB.com` | a separate brand kit per client | Multi-brand — they manage several kits |
| 9 | **Company that rebrands** | re-paste the (new) site | everyone's signature updates to the new brand at once | Recurring value: brand changes over time |
| 10 | **Holding company / multi-brand** | each sub-brand's site | one kit per sub-brand | Same as agency, internal |

**Key point for companies:** an admin solves **everyone's** signatures at once and keeps
them **consistent** as people join, leave, and the brand changes. That ongoing consistency
is *why a company pays every month* — not the one-time signature.

---

## Part 3 — The same URL, different scale

The thing that confused us is worth saying clearly:

- A **solo employee** and a **company admin** both paste a **company website**.
- The difference is **scale**: the solo user walks away with **1** signature;
  the admin walks away with **40** (and control over all of them).
- That's why one product serves both — everyone starts by pasting a website. The solo case
  is the free/cheap funnel; the team case is the paid, recurring business.

---

## Is an email signature actually *needed*? (Is there real demand?)

**Yes — for anyone who sends professional email.** Evidence:
- It's a **~$777M (2025) market growing double digits** — people pay for this today.
- Every business email is a brand touchpoint; inconsistent or ugly signatures look
  unprofessional, and companies legally/visually want consistency.

**But be honest about the shape of the need:**
- For an **individual**, it's a **"vitamin"** — nice to have, used once, low willingness to
  pay recurring. → so we keep the individual tier **free/cheap** (it feeds the funnel).
- For a **company**, it's a **"painkiller"** — turnover, rebrands, and brand consistency are
  ongoing pain. → that's where **recurring, per-seat revenue** lives.

So: needed by everyone, but only *worth paying monthly for* at team scale.

---

## Are we B2B or B2C?

**We are a B2B company** — specifically **B2B SaaS with a self-serve (PLG, "bottoms-up")
motion.**

Why B2B, even though solo people use it:
- Even a solo user is using it in a **work / professional** context (their *business* email),
  not for personal leisure. The value is professional, not consumer.
- The **money** is in businesses paying per seat for team management — that's a B2B sale.
- The buyer is a founder, freelancer-as-a-business, or a company admin — all business buyers.

The nuance: our **acquisition** *feels* B2C (anyone can self-serve, paste a URL, no sales
call) — that's the "PLG / bottoms-up" part. But the **business model is B2B**: individuals
land for free, teams convert to paid. This is the standard modern pattern (think Notion,
Loom, Linear) — often called **"B2B with a self-serve front door."**

> **One-line answer:** *B2B SaaS, sold bottoms-up (self-serve) — free for individuals,
> paid per-seat for teams.*

---

## TL;DR to explain to anyone in 20 seconds

> "You paste a company's website. Signet reads its logo, colors, and font and instantly
> makes a matching email signature. One person uses it for themselves (free); a company
> admin uses it to brand and manage their whole team's signatures (paid per seat). It's a
> B2B SaaS product with a free self-serve front door."
