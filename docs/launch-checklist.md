# Signet — Revenue Launch Checklist

**Product:** Signet — paste a website URL, get on-brand email signatures instantly. Next.js app on Vercel, Firecrawl + Gemini extraction, Resend waitlist, PostHog analytics.
**State (audited 2026-07-10):** App is built and deployed. 94/94 tests pass. The code is NOT the blocker. There is no way to take money and zero outreach emails have been sent.
**Total time to first possible dollar: ~1 focused day.**

Legend:
- 🧑 **You** — needs your identity, accounts, or a decision. An agent can't do this for you.
- 🤖 **Agent** — paste the quoted prompt into Claude Code.
- 🤝 **Together** — agent prepares, you click the final button.

---

## Phase 0 — Close out the engineering (30 min, then STOP building)

- [x] Build passes, 94/94 tests, app live — **done**
- [ ] 🤝 **Merge PR #2** (feat/firecrawl-json-mode → main) so the live site gets the 1-call extraction. *(5 min)*
  > Prompt: "Merge PR #2 into main after confirming tests and build pass, then confirm the Vercel production deploy picks it up."
  **You'll know it worked when:** the PR shows "Merged" and the production URL still generates a signature.
- [ ] 🧑 **Verify production env** — open your live site, run one real URL through it, and hit `/api/health`. Confirm Firecrawl + Gemini report `ok` and the waitlist form works. *(10 min)*
  **You'll know it worked when:** `/api/health` returns `ok` for both providers and a test email lands in your waitlist.
- [ ] 🧑 **Declare a code freeze.** Nothing else gets built until 100 outreach emails are sent and scored. This is the MASTER-PLAN Phase 0 gate — it exists precisely to stop what has been happening for 3 weeks.

## Phase 1 — Make it possible to pay you (~1 hour)

The $99 concierge offer ("we generate and install your whole team's signatures") is the willingness-to-pay experiment. It needs a payment link, not a billing system.

- [ ] 🧑 **Create a Stripe account** (or use existing) and create one **Payment Link**: "Signet Team Setup — $99 one-time". A Payment Link is a hosted checkout page Stripe gives you a URL for — no code, no webhooks needed at this stage. *(20 min, Stripe takes ~2.9% + 30¢ per charge)*
  **You'll know it worked when:** opening the link in an incognito window shows a $99 checkout page.
- [ ] 🤖 **Wire the link into the app** — replace the dead-end team CTA with the real payment link. *(15 min)*
  > Prompt: "In app/components, the team/concierge CTA currently points at #notify. Add an env var NEXT_PUBLIC_CONCIERGE_URL and point the team-setup CTA at it when set, keeping #notify as fallback. Fire the existing team_cta_clicked PostHog event on click."
  **You'll know it worked when:** clicking "Team Setup" on the live site opens the Stripe checkout.
- [ ] 🧑 **Make one real test purchase and refund it** in the Stripe dashboard. *(10 min)*
  **You'll know it worked when:** you see the payment and the refund in Stripe.

## Phase 2 — Send the outreach (the actual launch — start TODAY)

Everything exists: 57 YC founder URLs (`docs/cold-email-urls.txt`), 10 profiled leads with angles (`docs/cold-email-leads.md`), drafts for BlindPay/Mercura/Vantel, and `scripts/outreach.ts` which renders the prospect's own brand as a signature — the pitch IS the product.

- [ ] 🧑 **Send email #1 to BlindPay today.** It is flagged as ready. *(15 min)*
  **You'll know it worked when:** it's in your Sent folder. Not drafted — sent.
- [ ] 🤖 **Fix the two flagged leads** *(30 min)*
  > Prompt: "Mercura and Vantel outreach are flagged for domain/title extraction issues in scripts/outreach.ts output. Diagnose and regenerate their preview links and drafts."
- [ ] 🧑 **Send 10 emails/day for 10 working days** = the 100-email Phase 0 batch. Batch of 10 takes ~45 min/day. Every email carries a personalized `?from=` preview link.
  **You'll know it worked when:** 100 sent, tracked in a simple sheet: sent / replied / brand-match feedback / copy intent / team interest / paid.
- [ ] 🧑 **Every interested reply → 15-minute call.** Segment "just me" vs "my team of N". Teams get the $99 concierge link on the call.

## Phase 3 — Score and decide (day 12–14)

- [ ] 🧑 Score against the MASTER-PLAN gate:

| Metric | Weak | Promising | Strong |
|---|---:|---:|---:|
| Reply rate | <5% | 5–15% | >15% |
| Brand-match approval | <50% | 50–70% | >70% |
| Copy/export intent | <15% | 15–30% | >30% |
| Team interest | <5% | 5–15% | >15% |
| Paid setups | 0 | 1–2 | 3+ |

- [ ] **Promising+ on replies & copy intent** → build Phase 2 fake-team (CSV → N signatures), keep selling concierge.
- [ ] **Team interest strong, brand-match <70%** → Phase 1 extraction accuracy sprint.
- [ ] **Weak across the board** → pivot to agency client-pack wedge before writing more code.

## After first dollar

- [ ] 🤖 Error tracking (Sentry free tier) so a broken extraction doesn't silently kill outreach conversions.
- [ ] 🧑 Fulfil concierge setups manually; document every step — that document is the Phase 4 product spec.
- [ ] 🧑 Product Hunt / Show HN launch kit (already drafted in `docs/superpowers/`) — fire after first paying customer, not before.

---

**The one rule:** every day that ends with code written but zero emails sent is a day the launch didn't happen.
