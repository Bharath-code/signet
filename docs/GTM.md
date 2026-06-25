# Go-To-Market Plan — Signet

## The Two ICPs

### ICP 1 — Individual Pro (`$49 one-time` target)

| Signal | Where they are |
|---|---|
| Just launched a startup/product | Product Hunt launches (last 30 days) |
| Building in public | Twitter/X `#buildinpublic`, `#indiehackers` |
| Freelancer/consultant | r/freelance, r/consulting, Toptal community |
| Cares about brand | LinkedIn posts about rebranding, "we just launched" |
| Frustrated with WiseStamp | G2 + Capterra reviews of WiseStamp, MySignature |

**Pain:** Their website looks polished. Their email signature looks like a different company. They know it's inconsistent. They don't want to manually extract hex codes.

### ICP 2 — Team buyer (`$8/seat/month` Team target)

| Signal | Where they are |
|---|---|
| Just hired a Head of Marketing | LinkedIn company announcements |
| Recently rebranded | Press releases, LinkedIn "new look" posts |
| Managing 10-100 person team | LinkedIn: Office Manager, RevOps, COO at seed-stage companies |
| Has brand compliance pain | Online Geniuses Slack, Demand Gen Slack, r/marketing |

**Pain:** They told the team three times to update their signatures. Half haven't. The CEO still has the old logo. It came up in the last board meeting.

---

## Where to Find 100 Leads (Specific, Scrape-Ready)

**Source 1 — Y Combinator batches** (highest quality, all have websites)
- URL: `ycombinator.com/companies` → filter S24, W25
- Every company has a domain, small team, founder who cares about brand
- Run `outreach.ts` against their domain → personalized email with their extracted signature

**Source 2 — Product Hunt recent launches**
- `producthunt.com` → launches this week/month → companies with a real website
- These founders just invested in brand (logo, colors, website) and are actively marketing
- Highest intent moment: they care about their brand *right now*

**Source 3 — G2/Capterra WiseStamp reviews** (highest buying intent)
- People who reviewed WiseStamp are actively shopping or unhappy
- 1–3 star reviews = active churn candidates → direct outreach
- Script: "Saw your WiseStamp review — we extract the brand from your website automatically, no manual entry"

**Source 4 — LinkedIn search (Team buyer)**
```
Filter: Head of Marketing / Brand Manager / Office Manager
Company size: 11–50 employees
Industry: Software, Marketing, Professional Services
Geography: US/UK/Canada
```
Find their company domain → run outreach script → send

**Source 5 — Twitter/X search (Individual buyer)**
```
Search: "email signature" lang:en -is:retweet
Search: "email signatures" "inconsistent" OR "wrong logo" OR "outdated"
Search: "WiseStamp" (anyone mentioning it is a live prospect)
```

---

## The Outreach Email (via `scripts/outreach.ts`)

The script takes a company URL → extracts their brand kit → renders a signature with their actual logo/colors → generates a personalized email with the rendered signature embedded.

**Structure:**
```
Subject: Your website → email signature (took 9 seconds)

Hey [Name],

Pulled this from [company.com] —

[RENDERED SIGNATURE IMAGE HERE]

Most email signature generators make you enter your hex codes
manually. This reads your live site instead.

Free to try: [signet-url]?from=[their-domain]

—Bharath
```

Why it works: the prospect sees their brand in an email signature before signing up. The magic moment happens in their inbox.

```bash
# Run for each target domain
npx tsx scripts/outreach.ts --url https://company.com
```

---

## Channel Plan

### Phase 0 — Validate demand (now, $0 spend)

| Channel | Action | Goal | Timeline |
|---|---|---|---|
| Cold email outreach | 100 personalized emails via `outreach.ts` to YC S24 + PH launches | ≥5% reply rate | Week 1 |
| r/entrepreneur | Post: "I built a thing — paste your URL, get a brand-extracted signature" | 50+ upvotes, 10 DMs | Week 1 |
| Twitter/X | Screen recording: paste URL → signature in 9 seconds | Retweets from founders | Week 1 |
| Indie Hackers | "Show IH: Signet — paste your URL, it reads your brand" | 20+ comments, 5 waitlist | Week 2 |
| G2 WiseStamp reviews | DM 20 reviewers (1–3 star) on LinkedIn | 2–3 demos | Week 2 |

### Phase 1 — Validate willingness to pay (after ≥5% reply rate)

| Channel | Action | Goal |
|---|---|---|
| Reply-to demo | Every interested reply → 15-min call → understand team size | 10 discovery calls |
| Segment responses | "Just me" vs "my team of X" → identifies Pro vs Team buyer | Pricing validation |
| Soft paywall test | Change Pro CTA to "Buy now — $49" with Stripe | First payment |
| LinkedIn DM | Team buyers → send rendered signature from their domain | ≥2 team leads |

### Phase 2 — Compound (after first paying customer)

| Channel | Action | Notes |
|---|---|---|
| Product Hunt launch | Full launch with GIF demo + waitlist link | Biggest single-day spike |
| AppSumo deal | $49 LTD → 500 customers + reviews | Validates one-time pricing |
| SEO content | "email signature for Gmail / Outlook / Apple Mail" | Long tail, months out |
| "Made with Signet" footer | Every free user's signature links back to Signet | Zero-cost compounding |

---

## Validation Scorecard

Track after sending 100 outreach emails:

| Metric | Dead | Weak | Promising | Strong |
|---|---|---|---|---|
| Reply rate | <2% | 2–5% | 5–15% | >15% |
| Copy/export intent | <5% | 5–15% | 15–30% | >30% |
| Demo requests | 0 | 1–2 | 3–7 | >7 |
| "Team" mentions in replies | 0 | 1 | 2–3 | >3 |

- **Promising on both reply + copy intent** → price at $49 LTD and launch on Product Hunt
- **Weak** → change the pitch or the ICP, run 50 more
- **Dead** → pain not felt strongly enough for cold email; pivot to community posting

---

## Pricing Model (post-validation)

| Tier | Price | Model | Why |
|---|---|---|---|
| Free | $0 | Forever | Acquisition, magic moment, "Made with Signet" flywheel |
| Pro | $49 | One-time | Solves month-2 churn; utility product, job done after setup |
| Team | $8/seat/mo | Subscription | Recurring value: new hires, brand updates, admin control |

**Key insight:** Email signatures are set-and-forget. Monthly subscriptions for individuals will churn at month 2 because the job is already done. One-time pricing matches the product's nature. Subscriptions only make sense for the Team tier where the admin has ongoing jobs.

---

## The One Thing to Do Today

Run the outreach script against 100 YC S24 companies. The list is public, every company has a domain, and YC founders are exactly the ICP (care about brand, small team, want to look polished). The personalized email with their extracted signature is the strongest cold email opener in this space.

That one batch answers every pricing, positioning, and channel question faster than any A/B test.

---

*Sources: Freemius State of Micro-SaaS 2025 · Opensense Email Signature Guide · ChartMogul SaaS Conversion Report · G2/Capterra WiseStamp reviews · SaaSFactor Freemium vs Trial · First Page Sage Freemium Conversion Rates*
