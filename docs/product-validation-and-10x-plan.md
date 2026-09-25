# Signet Product Validation and 10x Value Plan

**Date:** 2026-06-24  
**Goal:** Define how to validate Signet before overbuilding, identify the 10x value proposition, shape the team tier, and create a path toward a world-class product experience.

## Core Principle

Do not build "world class" in the abstract.

First, validate the exact moment customers will repeat to other people. Then polish that winning path until it feels inevitable.

The danger is building a beautiful product around an unproven assumption. The path is:

```txt
Validate the wow moment
  -> prove usage intent
  -> prove willingness to pay
  -> build only the team/product infrastructure customers actually pull from you
```

## The 10x Value Proposition

The strongest 10x promise is:

> Paste your company URL. Signet creates polished, on-brand signatures for your whole team in minutes, not days.

For individuals, the wow is:

```txt
Website -> branded signature instantly
```

For teams, the holy-shit moment is:

```txt
Paste company URL
  -> Signet extracts brand
  -> add/upload teammates
  -> instantly see everyone with consistent signatures
```

Do not start with Google Workspace OAuth. Start with the illusion of team automation using a CSV/manual team import. If teams still do not care when they see 10 employees generated instantly, OAuth will not save the product.

## What To Validate First

Validate these in order.

### 1. Does URL -> Brand Extraction Feel Magical?

Target signal:

```txt
70%+ of testers say: "this looks like my brand"
```

If this fails, nothing else matters.

The product promise depends on trust in taste. The user has to feel that Signet understood their brand with almost no effort.

### 2. Does the User Want To Use the Signature Immediately?

Target signal:

```txt
30-40% click copy/export or ask for install help
```

This is stronger than email signup. Email capture says "interesting." Copy/export says "I want this in my workflow."

### 3. Does a Team Buyer Care About Central Consistency?

Target signal:

```txt
Founder/marketing/admin says: "Can I do this for my team?"
```

The real business is not one signature. The real business is consistent identity across a team.

### 4. Will Someone Pay Before Workspace Sync Exists?

Offer:

```txt
We will set up your whole team manually for $49-$199.
```

If no one pays for concierge setup, do not build Google Workspace yet.

Real validation is payment, not compliments.

## Where To Validate

Start with people who already feel the pain.

Best early audiences:

- Seed-stage startups with 5-50 employees.
- Agencies doing rebrands/websites for clients.
- Freelancers and consultants with polished personal sites.
- Founders active on LinkedIn/X.
- Marketing managers at B2B SaaS companies.
- Recruiting firms, real estate teams, and sales-heavy service businesses.
- Small agencies that manage multiple client brands.

Avoid initially:

- Enterprise IT.
- Procurement-heavy companies.
- Microsoft 365 / Exchange-heavy organizations.
- Security-first buyers who need SSO, SOC2, audit logs, and admin reviews before they can even test.

Best validation channels:

- Direct LinkedIn DMs to founders and marketing managers.
- Cold email using their current weak/bad signature as the hook.
- Agency partnerships.
- Indie Hackers.
- Product Hunt.
- Hacker News after the demo is tight.
- SEO later, once conversion is proven.

Important: "email signature generator" SEO is crowded. Do not rely on SEO before the product converts through manual outreach.

## How To Validate

Run a 7-day manual validation sprint.

### Outreach Target

Contact 100 people manually.

Prioritize:

- 40 founders / small-team leads.
- 30 agencies / brand consultants.
- 20 freelancers / consultants.
- 10 marketing managers / ops leads.

### Outreach Approach

Do not ask people to imagine the product. Generate something for them.

Message:

```txt
I made a tool that turns your website into a branded email signature in 10 seconds.

I generated one for your company here:
[personalized link]

Does this look close enough to use?
```

Better than asking them to paste their URL: generate it for them first. Remove work.

### Validation Questions

Ask:

1. Would you use this signature?
2. Would you want this for your whole team?
3. How many people need signatures?
4. What would stop you from rolling this out?
5. Would you pay $49 for us to set up your whole team this week?

### Real Validation Signals

Strong signals:

- They copy the signature.
- They ask for team setup.
- They give a work email.
- They book a call.
- They pay.
- They send teammate details.
- They ask if it works with Gmail/Google Workspace.

Weak signals:

- "Cool idea."
- "Looks nice."
- "I might use this later."
- "Let me know when it launches."

## Team Tier Strategy

Do not build Google Workspace first.

Build the team tier in three stages.

### Stage 1: Fake Team Automation

User flow:

```txt
Paste company URL
  -> brand kit extracted
  -> add 3-10 teammates manually or upload CSV
  -> all signatures generated instantly
  -> export HTML pack or copy each signature
```

This validates team value without OAuth.

MVP fields:

- Full name
- Job title
- Email
- Phone
- LinkedIn
- Optional headshot later

Team output:

- One signature per teammate.
- Same brand kit.
- Same layout system.
- Copy/export per teammate.
- Optional "download all HTML" later.

### Stage 2: Concierge Deployment

Charge:

```txt
$49-$199 one-time setup
```

Offer:

> We will generate branded signatures for your team and help install them.

Use this to learn:

- Who owns signatures internally.
- Whether marketing or ops buys.
- How companies currently deploy signatures.
- Whether users can install themselves.
- What breaks in Gmail, Outlook, and Apple Mail.
- What "team management" really means for small teams.

Document every manual step. That document becomes the product roadmap.

### Stage 3: Google Workspace Sync

Only build after:

```txt
5-10 teams ask for it or pay for team setup
```

Initial Google Workspace MVP scope:

- Google OAuth.
- Admin consent.
- Read users from Google Directory API.
- Map name/title/email/photo where available.
- Generate one signature per user.
- Admin review screen.

Do not promise one-click deploy until Gmail API permissions and admin consent flow are verified.

Future Workspace scope:

- Push signature to Gmail.
- Detect new hires.
- Brand-lock layouts.
- Campaign banners.
- Analytics.
- Role-based templates.

## Initial Team Tier Offer

Start with:

```txt
Team Setup - $99 one-time beta
```

Promise:

> We generate branded signatures for your whole team and help you install them.

Later transition to:

```txt
Team - $29/mo + $3/user
```

Includes:

- Central brand kit.
- Team members.
- Shared templates.
- Updates.
- No Signet footer.
- Priority support.

Do not sell serious recurring team management until there is a real team workflow.

## World-Class UX Principles

To make Signet feel premium:

- First screen must be the product, not a pitch.
- No template picker before the user sees value.
- No signup before generation.
- No empty state; previews render instantly.
- Show extraction confidence:
  - Logo found
  - Colors found
  - Font matched
  - Links found
- Let users edit only after AI gives a strong default.
- One-click copy must work beautifully.
- Give Gmail/Outlook install instructions immediately after copy.
- For teams, show "10 teammates generated" visually.
- Use taste as proof. The product surface must feel as polished as the signature it promises.

## The Actual Holy-Shit Flow

Build toward this:

```txt
1. User lands.
2. User types acme.com.
3. In under 10 seconds, user sees 3 beautiful signatures.
4. User clicks "Generate for team."
5. User adds/pastes 5 teammate names.
6. User instantly sees 5 matching signatures.
7. User clicks "Set this up for my team."
8. User pays or books setup.
```

This is much stronger than "join waitlist for Google Workspace."

## What To Build Next

Priority order:

1. Fix production build failure.
2. Make copy/export real and honest.
3. Improve Firecrawl branding extraction so Gemini is optional.
4. Add team CSV/manual teammate generator.
5. Add "done-for-you team setup" paid CTA.
6. Run 100 manual validations.
7. Build Google Workspace only after paid team pull.

## 7-Day Validation Sprint

### Day 1: Fix the Demo

- Ensure build passes.
- Ensure copy/export promise is honest.
- Prepare 3-5 polished demo examples.
- Add tracking for:
  - URL submitted
  - extraction succeeded
  - signature copied
  - team CTA clicked
  - waitlist joined

### Day 2: Create Personalized Links

- Pick 30 companies.
- Generate signatures for them.
- Create personalized outreach links using `?from=company.com`.
- Screenshot their generated result.

### Day 3-5: Manual Outreach

- Send 20-30 messages/day.
- Prioritize founders, agencies, and marketing managers.
- Ask for blunt feedback.
- Ask whether they want it for their team.

### Day 6: Team Setup Calls

- Book calls with interested users.
- Offer $49-$199 setup.
- Watch them try to install/copy.
- Record blockers.

### Day 7: Decision Review

Evaluate:

- How many replied?
- How many said it matched their brand?
- How many copied or asked how to use it?
- How many asked for team setup?
- How many were willing to pay?

Decision:

```txt
If 5+ strong team signals:
  build manual/CSV team generator

If 2+ paid setup customers:
  build team beta

If mostly individuals:
  improve solo copy/export + agency wedge

If extraction quality is weak:
  fix brand extraction before adding features
```

## Validation Scorecard

Use this scorecard after the sprint.

| Metric | Weak | Promising | Strong |
|---|---:|---:|---:|
| Reply rate | <5% | 5-15% | >15% |
| Brand match approval | <50% | 50-70% | >70% |
| Copy/export intent | <15% | 15-30% | >30% |
| Team interest | <5% | 5-15% | >15% |
| Paid setup conversion | 0 | 1-2 | 3+ |

## What Not To Build Yet

Do not build yet:

- Full Google Workspace deployment.
- Microsoft 365.
- SSO.
- SOC2.
- Admin roles.
- Billing complexity.
- Large template marketplace.
- Advanced analytics.
- Campaign banner automation.
- AI headshots.
- Mobile app.

These are downstream features. The current question is much simpler:

> Do teams want this badly enough to pay before it is fully automated?

## Final Call

Signet can become great, but the next goal is not "world class."

The next goal is:

> Prove that 10 teams want consistent branded signatures badly enough to pay before OAuth exists.

If yes, build Team.

If no, sharpen the individual/agency wedge first.

The money is not in generating one signature. The money is in:

- team consistency
- brand control
- onboarding
- rebrands
- campaign updates
- reducing manual signature maintenance

Build the product around that truth.

