# Concierge Team Setup — Pitch, Copy & Delivery

$99 one-time. Manual fulfillment (see `CLAUDE.md` / `docs/launch-checklist.md`) — no team-generation code exists yet. This doc is the pitch script + copy + intake/delivery process so it can be sold consistently across the call, the landing page, and outbound email.

---

## What we need from them (intake)

Ask for this on the call or via a follow-up email — nothing today captures it automatically:

1. **Company URL** — the source of truth for logo, colors, font (same as the free demo).
2. **Team roster** — name, role/title, email, phone (optional) per person. CSV or a plain list, however they have it.
3. **Fields to include** — do they want LinkedIn/X/GitHub links, a CTA (booking link, latest launch), phone by default?
4. **Any brand exceptions** — e.g. "ignore the site's blue, our brand color is X" (rare, but ask — it's cheaper than a revision round).

## How we deliver

1. Run their URL through the existing pipeline once to confirm the brand kit looks right (logo, 2 colors, font) — this is literally the free demo, just done by us.
2. Generate one signature per teammate off that kit, swapping in their name/role/email/phone.
3. Send back an install doc: copy-paste HTML per person + steps for Gmail, Outlook, Apple Mail.
4. Offer to hop on a 10-minute screenshare for the first install if they want it live.

Turnaround promise: **this week**, not "in the queue."

---

## Positioning — why they should pick us over the alternatives

Grounded in `MARKET-DOMINATION-PLAN.md` and `competitor-analysis-and-market-domination-plan.md`. Use this to frame the call, not recite it.

**How they're comparing us, whether they say so or not:**

1. **WiseStamp / Exclaimer** — "software I have to set up." Platform fees ($19–189/mo), template pickers, hex codes, admin config. The cost they feel isn't price, it's *setup labor*.
2. **SyncSignature** — the closest real threat: no platform fee, $2/seat, but still manual — upload your logo, pick your colors.
3. **Free tools** (HubSpot/Canva/Gmail native) — "good enough," zero cost, zero brand fidelity.

**Why we win the comparison:**

- **Zero setup labor** — no logo upload, no hex codes, no template choice. What costs competitors' users an afternoon costs ours ten seconds.
- **No platform fee** — the ICP is 5–50 seat teams WiseStamp's base fee prices out irrationally. We only charge per-seat (or, today, one flat concierge fee).
- **Output quality is the product** — competitors' "AI" is marketing copy; ours has to actually look like a design team made it (Swiss/editorial, real brand colors), which most generators don't clear.
- **Concierge removes the last friction** — even "no setup" competitors still leave the team-roster compiling and per-person install to the customer. We do that too.

**How to impress them:**

1. **Let the demo talk first, always.** Never describe the product before they've seen their own site rendered — this is why cold outreach opens with a live preview link, not a pitch.
2. **Extract live on the call if you can** — paste their site (or a competitor's) and narrate nothing. More convincing than any deck.
3. **Name the specific pain, not the category** — "you've told the team three times to update their signatures, half haven't" beats "email signature management."
4. **Contrast price out loud, with numbers.** "WiseStamp would run ~$29/mo base plus per-seat for 10 people; we're a flat $99 once." Concrete beats "affordable."
5. **Close on turnaround, not features.** "Done this week" beats every incumbent's onboarding cycle — a real gap, not fluff.

---

## Sales call script

Use after a warm reply or when segmenting "just me" vs. "my team of N" (`docs/launch-checklist.md:46`).

**Open** — anchor on the demo they already saw:
> "You saw how it built your signature from just your URL. Team Setup is the same thing, done for everyone on your team, so nobody's stuck hand-editing colors in Outlook."

**Qualify:**
> "How many people would need signatures, and are they mostly Gmail, Outlook, or Apple Mail?"

**Explain the ask (intake):**
> "I just need your site URL and a list of your team — name, role, email, and phone if you want it in there. CSV, spreadsheet, whatever's easiest."

**Explain delivery:**
> "I'll build the brand kit from your site — same logo/color/font extraction you saw in the demo — then generate one signature per person and send you copy-paste HTML with install steps for whichever mail clients your team uses. Done this week."

**Price + close:**
> "It's a $99 flat one-time fee, no subscription. I can send the payment link now and start as soon as it clears."

**If they hesitate on price:** don't discount — ask what's blocking them. This is the willingness-to-pay signal (`docs/launch-checklist.md` Phase 3 gate); a discount defeats the test.

---

## Landing page copy

Already live in `app/components/LandingPage.tsx` (Team pricing card + FAQ, gated behind `NEXT_PUBLIC_CONCIERGE_URL`). Current copy is on-brand — editorial, no hype (`PRODUCT.md` voice). Reference, not a rewrite:

- Card: **Team — $99, one-time setup** — "Built from one URL — everyone on brand" / "Hands-on install help, every mail client" / "Done this week, not this quarter."
- FAQ: *"Can I roll signatures out to my whole team?"* → *"Team Setup is a $99 one-time concierge service: we generate on-brand signatures for your whole team from one URL and help you install them in every mail client — done this week."*

If you want a stronger intake hint directly on the page, add one line under the card's feature list (small print, not a form — no intake UI exists yet):

> *"After checkout, reply to the receipt email with your team list — name, role, email — and we'll build the set."*

---

## Outbound / post-purchase email

Sent manually for now — no webhook automation while in the validation phase. Check checkout for new payments and send this by hand immediately after.

**Subject:** Your Signet Team Setup — one thing I need from you

> Thanks for setting up Team Setup. To build your team's signatures I just need:
>
> 1. Your team list — name, role, email (and phone if you want it on the signature). A spreadsheet or plain list is fine.
> 2. Anything I should know about your brand that the site might not show (e.g. a color you use that isn't on the homepage).
>
> Reply with that and I'll have signatures + install instructions back to you this week.

**Follow-up on delivery:**

> Signatures are ready — attached is copy-paste HTML for each person, plus install steps for Gmail, Outlook, and Apple Mail. Happy to jump on a quick call if anyone wants help installing live.

---

## Cold outreach (first-touch, pre-purchase)

Existing templates in `docs/cold-email-leads.md` lead with the free single-user demo, not the $99 tier — correct sequencing (prove magic moment free → team upsell only after interest, per `PRODUCT.md`'s show-don't-tell principle). Don't put Team Setup pricing in the first cold email; it belongs in the reply/call once they've seen their own signature rendered.
