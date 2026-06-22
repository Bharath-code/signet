# Product Positioning & Customer Intelligence
*Email Signature Generator — AI-native*
*Date: 2026-06-22*

---

## Why This Product Should Exist

**The actual problem:** A company's email signature is infrastructure — it touches every outbound communication — but today deploying it looks like this:

1. Admin finds hex codes by squinting at their own website
2. Manually picks a template that "kinda" matches
3. Fills in fields for 30 employees one by one
4. Emails everyone a PDF and hopes they follow instructions
5. 40% do it wrong. 20% never do it. Nothing is consistent.

This is a $700K ARR category because **the pain is real and boring enough that no one "cool" has touched it.** That's the opportunity.

---

## The "Boring vs AI-native" Split

### What exists today
Newoldstamp, Wisestamp, Exclaimer: pick a template, fill fields manually, deploy via IT ticket. Takes days. Breaks when someone gets promoted.

### What we build
1. Paste `acme.com`
2. AI scrapes site → extracts logo, colors, font, company name automatically
3. In ~10 seconds → polished branded signature, no template picker, no form filling
4. Connect Google Workspace → AI reads company directory (name, title, phone, photo per employee)
5. One Deploy button → every employee's Gmail is live
6. AI CTA banners → auto-writes promo copy, auto-rotates weekly

**The holy-shit moment:** Paste URL → see your branded signature → click deploy → whole company live in under 3 minutes. That demo sells itself.

---

## Why Firecrawl + Gemini Specifically

| Tool | Why you can't skip it |
|---|---|
| **Firecrawl** | Modern websites are React/Next/Vue SPAs — `fetch()` returns empty HTML. Firecrawl renders full JavaScript, handles anti-bot, returns clean structured content + screenshot. Without it you're scraping blank pages. |
| **Gemini (multimodal)** | Logo extraction requires *seeing* the page, not parsing text. Gemini looks at the screenshot and identifies logo, dominant colors, and font visually — the same way a designer would. No other step can reliably do this from HTML alone. |

Together they form the pipeline nobody wants to build themselves. That's the technical moat.

---

## Why Customers Can't Just Use ChatGPT/Claude Themselves

**Solo founder:**
They could ask Claude to write a signature — but they'd need to: know their hex codes, describe their font, copy-paste into Gmail HTML settings, and hope it renders in Outlook. Most people never finish because each micro-step kills momentum. Our product eliminates every step except "paste URL."

**Team (10–50 people):**
Who prompts this for 30 people? Who updates it when someone gets promoted? Who deploys to each Gmail? General AI gives a one-time text output. We give a living system with a deploy button.

**Enterprise (50+ people):**
Not even a question. Nobody is manually AI-prompting 300 employee signatures. The problem is organizational — it needs Google Workspace API, admin controls, role-based templates, audit trails. AI chat cannot do any of that.

---

## Why Customers Switch From Competitors

| From | Leaving pain | What we offer |
|---|---|---|
| Newoldstamp / Wisestamp | Manual brand input, no Workspace sync, IT-dependent, days to ship | URL → deployed in 3 minutes, no IT ticket |
| HubSpot generator | One at a time, no team deploy, generic | Company-wide branded deploy |
| Word / Canva | Inconsistent, not tracked, not email-safe | Outlook-safe HTML, centrally managed |
| Nothing (ignored it) | Embarrassing inconsistency, missed brand impressions | Actually getting it done |

---

## What Makes Us Actually Different

| Competitor claim | What they really do | What we do |
|---|---|---|
| "Beautiful templates" | You pick colors manually | Auto-extracts brand from URL |
| "Easy setup" | Fill 15 form fields per person | Zero fields, URL only |
| "Team management" | Admin uploads a CSV | Google Workspace sync, auto-populates |
| "Deploy to Gmail" | Email employees instructions | One OAuth click, it's live |

The differentiator is **zero configuration.** The demo proves it.

---

## Target Customer Profiles

---

### Profile 1 — The Solo Pro

**Who:** Freelancer, consultant, or 1-person founder. Designer, developer, copywriter, accountant, real estate agent.

**Demographics:**
- Age 25–40
- Earns $60K–$200K/year via client work or early-stage startup
- Has a website (even a basic one)
- Sends 20–80 emails/week to clients and prospects

**Current signature situation:**
Plain text ("Maya | Designer"), nothing, or a badly formatted block from a generic tool they abandoned halfway. Some have a logo pasted as an image that breaks on mobile.

**Pain:**
- Looks less professional than competitors
- Manually maintaining it when details change is annoying
- Doesn't know design well enough to make it look good

**Trigger moment:**
- Got a new client and feels embarrassed about the signature
- Just redesigned their website and the old signature doesn't match
- Saw a competitor's polished signature and felt the gap

**What they care about:**
Speed, looks professional, done and forgotten. They don't want to think about this ever again.

**WTP:** $8–15/month without hesitation if it looks great in 2 minutes.

**Quote archetype:**
> "I've been meaning to fix my signature for 6 months. I just never had 3 hours to figure out the HTML."

---

### Profile 2 — The Marketing Manager (Team Buyer)

**Who:** Head of Marketing, Brand Manager, or Chief of Staff at a 15–80 person company.

**Demographics:**
- Age 28–42
- Works at a funded startup or established SMB
- Owns "brand consistency" as a job responsibility
- Has tried to solve this before and failed to finish

**Current situation:**
Some employees use an old template from 2019. New hires copy from a colleague (who copied from someone else). Sales team added personal flair ("⭐ TOP PERFORMER 2024"). CEO's signature has a typo in the phone number.

**Pain:**
- Inconsistency looks unprofessional in outbound sales chains where 3 people CC'd have 3 different formats
- Old marketing team set up the last solution; nobody knows how to update it
- Every rebrand means re-doing everyone's signature manually

**Trigger moment:**
- CEO notices inconsistent signatures in a prospect email chain and mentions it in all-hands
- New sales hire starts Monday; someone needs to set up their signature
- Company just rebranded; everything needs updating across 25 people

**What they care about:**
Central control, no IT dependency, "one source of truth" for the brand. Wants to set it up once and forget it. Needs to be able to update a promo banner without touching IT.

**Buying behavior:**
Searches Google, tries 2–3 tools, evaluates on "can I actually deploy this to the whole team without emailing everyone." Often makes decision in a single 20-minute session.

**WTP:** $8–12/seat/month (signs off up to $400/month without needing CFO approval).

**Quote archetype:**
> "I spent 2 hours on Wisestamp and gave up. I need something where I paste our URL and it just... works for everyone."

---

### Profile 3 — The Agency or Consultant

**Who:** Marketing agency, brand consultancy, or freelance designer managing multiple client brands.

**Demographics:**
- Manages 5–20 client accounts
- Delivers brand rollouts as a service
- Currently does signature design manually in Canva or Figma, exports HTML, sends instructions clients ignore

**Current situation:**
Every new client is a custom project. Hours spent per client on a deliverable that should take minutes. Clients implement it wrong. Follow-up support eats time.

**Pain:**
- Low-margin task that can't be delegated easily
- Client can't maintain it themselves after handoff
- "Can you update everyone's signature with the new logo?" = another unplanned hour

**What they care about:**
Speed to deliver per client, ability to white-label or brand the tool, way to hand off ongoing management to the client.

**Trigger moment:**
A client rebrand requires updating 18 employee signatures by end of week.

**WTP:** Happily pays $29–49/month if it cuts a 4-hour deliverable to 20 minutes. Would pay agency plan pricing for bulk brand kits.

**Quote archetype:**
> "I charge $200 for this deliverable. It takes me 3 hours. I need that to be 20 minutes."

---

### Profile 4 — The IT Admin / Ops Lead (Enterprise, Future)

**Who:** IT Manager or Ops Lead at a 100–500 person company.

**Demographics:**
- Owns Google Workspace or Microsoft 365 administration
- Gets recurring requests from marketing to "update signatures company-wide"
- Currently uses Exclaimer or custom scripts

**Current situation:**
Signature management is a recurring IT ticket that marketing opens every quarter. The current tool (Exclaimer, CodeTwo) works but costs $3–5/seat/month and requires IT setup. Marketing can't touch it without filing a ticket.

**Pain:**
- Time wasted on low-complexity tasks (updating a phone number for 200 people)
- Marketing doesn't have direct control; every change goes through IT
- Onboarding new employees requires manual action

**What they care about:**
Security (SSO, audit logs), reliability, hands-off after setup. Wants marketing to own it, not IT.

**WTP:** $2–5/seat/month at scale (100+ seats = $200–$500/month). Needs procurement process, usually annual billing.

**Note:** Don't target this segment until you have Google Workspace sync, SSO, and SOC2 on the roadmap.

---

## Scenarios & User Journeys

---

### Scenario A — "The Rebrand Crisis"

**Situation:** A 22-person e-commerce brand just updated their logo and brand colors after raising a seed round. Their existing signatures (cobbled together over 2 years) still show the old logo and teal color.

**Current state:** Marketing manager opens Wisestamp. Spends 45 minutes picking a template and manually entering hex codes. Realizes they'd have to do this for 22 people. Closes the tab and puts it on the backlog.

**With us:**
1. Pastes `[company].com` → signature with new logo and colors appears in 10 seconds
2. Selects the layout that matches their brand
3. Clicks "Connect Google Workspace" → OAuth flow
4. Directory loads: 22 employees with names, titles, photos
5. Clicks Deploy
6. All 22 Gmail accounts updated

**Time to done:** 4 minutes  
**Without us:** Backlogged for 3 months

---

### Scenario B — "Monday Morning New Hire"

**Situation:** A 14-person SaaS startup onboards a new account executive. First call is Tuesday morning.

**Current state:** Head of Marketing sends the new hire a Canva link and says "use this template, fill in your info, export as PNG, then follow these 7 steps to install in Gmail." The AE sends their first email with "Sent from iPhone."

**With us:**
1. New hire added to Google Workspace
2. System auto-detects new directory entry (future: webhook trigger)
3. OR: Marketing Manager logs in, sees "1 new team member without signature"
4. Clicks Generate → Deploy
5. AE's signature is live before their first external email

**Time to done:** 2 minutes after hire is added to Workspace  
**Without us:** Never done, or done wrong

---

### Scenario C — "The Solo Pitch"

**Situation:** Priya, a freelance UX consultant, just landed a discovery call with a $20K potential client. She's about to send a follow-up email with her portfolio.

**Current state:** Her signature is "Priya | UX" in Arial. No logo, no phone, no website link. Looks like a student project next to the agency she's competing with.

**With us:**
1. Opens the tool on her laptop between calls
2. Pastes her portfolio site URL
3. Signature generates with her logo, brand colors, name, title, LinkedIn
4. Copies the HTML, pastes into Gmail signature settings
5. Sends the follow-up

**Time to done:** 3 minutes  
**Without us:** Sends the email with the amateur signature, or spends 2 hours watching YouTube tutorials about Gmail HTML

---

### Scenario D — "The Agency Delivery"

**Situation:** A brand agency just finished a full rebrand for a client — new logo, new colors, new typography. Deliverable includes "email signature rollout for 8 employees."

**Current state:** Designer exports the signature as a Figma file. Client's IT person has to manually implement it. Agency sends a 12-step PDF. Client comes back 3 days later saying "it looks broken in Outlook."

**With us:**
1. Agency pastes client's new website URL
2. Signature generates from the freshly-launched brand
3. Agency previews all 3 layouts, picks the right one
4. Exports HTML for each employee (or connects client's Workspace directly)
5. Delivers as part of brand rollout package

**Time to done:** 15 minutes per client  
**Without us:** 3–4 hours + support back-and-forth

---

### Scenario E — "The CEO Discovery"

**Situation:** CEO of a 30-person B2B company is cc'd on a sales email chain going out to a Series B target. She notices three different signature formats across her team's emails. One has the 2021 logo. One has no logo. One has "🔥 CRUSHING Q4 🔥" in the banner.

**Current state:** She mentions it in all-hands. Marketing manager gets the task. Puts it in Jira. Closes the ticket 6 weeks later with "evaluated 3 tools, none were easy enough."

**With us:**
Marketing manager gets the Jira ticket → searches "email signature for teams" → finds us → pastes URL → 10 seconds later sees exactly what they wanted → buys Team plan → deploys before end of day → closes the Jira ticket same afternoon.

**Time to done:** 20 minutes from Jira assignment to deployed  
**Without us:** 6-week cycle, or abandoned

---

## The Landing Page

**Yes, build it. It's the most valuable asset right now.**

Not because you need a marketing site — because the **demo video is the product.** A 30-second screen recording of:

```
paste acme.com → 10 seconds → three branded signatures appear →
click Deploy → "30 employees updated"
```

...sells better than any copy.

**Above the fold only:**
1. Demo GIF/video — autoplay, no controls, looping
2. One line: *"Paste your URL. Your whole team has branded signatures in 3 minutes."*
3. One CTA: "Try it free →"

**Below the fold:**
- Pricing (Free / Pro $12 / Team $8/seat)
- 3 logos of companies using it
- The 5 scenarios above, condensed to one-liners
- "Why AI?" explainer (Firecrawl + Gemini, human language)

**Don't build:**
- Feature comparison tables
- Testimonials (don't have them yet)
- Blog
- Integration badges
- FAQ

Ship the page in one session, then get 10 real users on it.
