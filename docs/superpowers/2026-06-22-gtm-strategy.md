# GTM & Startup Strategy — Email Signature Generator

*Date: 2026-06-22*

---

## ICP (Ideal Customer Profile)

**Primary — Solo founders & freelancers (80% of early users)**
- 1–5 person operation, B2B-facing (client emails matter)
- Already has a website, no design budget
- Pain: email signature is blank, off-brand, or manually hacked
- Trigger: just launched or rebranded
- WTP: $8–15/month without hesitation

**Secondary — Marketing managers at 10–50 person SMBs**
- Manages brand consistency across the team
- Pain: 12 employees, 12 different signature formats
- Trigger: new hire onboarding, rebrand, "we need consistency"
- WTP: $6–10/seat/month

**Avoid (for now):** Enterprise — requires SSO, SOC2, on-prem; years away.

---

## Branding

**Positioning:** "Paste your URL. Get a signature your brand would be proud of."

| Dimension | Direction |
|---|---|
| Tone | Confident, slightly delightful, no fluff |
| Visual | Clean — the *output* does the showing-off |
| Category | "AI brand tools", not "email tools" |
| Differentiator | Zero-config (vs. every competitor's template pickers) |

**Name directions:** SignKit, AutoSig, BrandSign, Inksig — anything that signals *automatic* + *professional*

**Tagline options:**
- "Your brand, in every email."
- "Paste URL. Get signatures. Done."
- "Email signatures that actually match your brand."

---

## GTM Motion: PLG-first

Product is a perfect PLG candidate:
- Value visible in <30 seconds, zero setup
- Every sent signature is passive distribution ("Made with [product]" footer)
- No sales motion needed to prove the product

**Sequence:**
1. **First 100 users manually** — DM founders on Twitter/LinkedIn, post in r/Entrepreneur, r/freelance, indie hacker forums. Do it yourself, don't automate.
2. **Prove 40% "aha" rate** (users who copy a signature in session)
3. **Product Hunt launch** — best category fit, one-day spike → organic tail
4. **SEO** — "email signature generator" (~100K searches/month), "branded email signature"
5. **Paid** only after organic converts

**Channels ranked:**

| Channel | Priority | Reason |
|---|---|---|
| Twitter/X demo video | 1 | Viral potential, founder-audience overlap |
| Product Hunt | 2 | Category fit, indiehacker audience |
| SEO / content | 3 | Long-term compounding |
| LinkedIn | 4 | Reaches marketing managers |
| Directory listings (G2, AlternativeTo, Capterra) | 5 | Passive discovery |
| Paid | Last | Only after organic works |

---

## Revenue Model

**Freemium → Subscription**

| Tier | Price | Includes |
|---|---|---|
| Free | $0 | 1 brand kit, 3 layouts, Arial/Georgia only, "Made with [product]" footer |
| Pro | $12/mo | Unlimited brand kits, all fonts, no footer, copy HTML |
| Team | $8/seat/mo | Shared brand kits, team admin, bulk export |

Anchored below Wisestamp ($15), above MySignature ($4). Faster and smarter than both.

**MRR milestones:**
- Month 3: $1K MRR — before spending anything on paid
- Month 6: $5K MRR — signal to invest
- Month 12: $20K MRR — proof of repeatable growth

---

## Unit Economics

**COGS per active user/month:**

| Cost item | Estimate |
|---|---|
| Firecrawl per scrape | ~$0.003 |
| Gemini Flash per extraction | ~$0.001 |
| Vercel compute | ~$0.002 |
| **Total per generation** | **~$0.006** |
| At 10 generations/user/month | **~$0.06** |

**Gross margin: ~99%** — textbook SaaS. COGS is not the concern.

**Fixed monthly costs at launch:**

| Item | Cost |
|---|---|
| Vercel Pro | $20 |
| Firecrawl Hobby | $16 |
| Domain + misc | $5 |
| **Total** | **~$40/month** |

Profitable at **4 Pro subscribers**.

---

## Key Metrics

**Pre-PMF (now):**

| Metric | Target |
|---|---|
| Magic moment activation (URL → signatures rendered) | >80% |
| Signature copy rate | >40% |
| 7-day return rate | >20% |
| Email capture rate (CTA) | >15% |

**Post-PMF:**

| Metric | Healthy benchmark |
|---|---|
| MRR growth | >15%/month |
| Monthly churn | <5% |
| CAC payback | <3 months |
| LTV:CAC | >3:1 |
| NPS | >40 |

---

## Competitive Landscape

| Competitor | Weakness you exploit |
|---|---|
| Wisestamp | Templates only, no auto-extraction |
| MySignature | Manual design, cheap but ugly |
| HubSpot generator | Basic, no brand intelligence |
| Canva | General-purpose, high friction |

**Moat:** URL → brand kit extraction is the only defensible differentiator. Templates, fonts, layouts are commodity. R&D goes here — make extraction faster, more accurate, better fallbacks.

---

## The One Thing

Right now the only metric that matters: **"Did the user copy a signature?"**

If yes → product works, start charging.
If no → fix that before touching anything above.
