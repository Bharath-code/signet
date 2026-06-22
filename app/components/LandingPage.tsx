'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { renderSignature } from '@/lib/render-signature';
import type { BrandKit, SignatureFields, Layout } from '@/lib/types';

/* ─── Demo data ─────────────────────────────────────────────────────────── */

const ACME_KIT: BrandKit = {
  companyName: 'Acme Corp',
  logoUrl: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="34"><rect width="96" height="34" rx="3" fill="#b23a20"/><text x="48" y="22" font-family="Georgia,serif" font-size="13" fill="white" text-anchor="middle" font-weight="bold">ACME</text></svg>`
  )}`,
  primaryColor: '#b23a20',
  secondaryColor: '#6f6857',
  fontFamily: 'Georgia, serif',
};

const ACME_PERSON: SignatureFields = {
  fullName: 'Alex Chen',
  jobTitle: 'Head of Design',
  email: 'alex@acmecorp.com',
  phone: '+1 415 555 0101',
};

const LAYOUTS: { id: Layout; label: string; h: number }[] = [
  { id: 'minimal',  label: 'Minimal',    h: 110 },
  { id: 'logo',     label: 'With logo',  h: 148 },
  { id: 'logo-cta', label: 'Logo + CTA', h: 188 },
];

const frameDoc = (html: string) =>
  `<!doctype html><meta charset="utf-8">` +
  `<style>html,body{margin:0;height:100%}` +
  `body{display:flex;align-items:center;box-sizing:border-box;` +
  `padding:16px 20px;background:#fff}</style>${html}`;

/* ─── Constants ─────────────────────────────────────────────────────────── */

const lbl = 'text-[0.67rem] uppercase tracking-[0.18em] text-muted';

const STEPS = [
  { n: '01', title: 'Paste your URL',    body: 'Drop in your company website. No setup, no credentials.' },
  { n: '02', title: 'Brand extracted',   body: 'Logo, colors, and fonts — read from your site automatically.' },
  { n: '03', title: 'Pick a layout',     body: 'Three polished options, all on-brand. Pick one or all.' },
  { n: '04', title: 'Deploy',            body: 'Connect Google Workspace. One click. Every inbox updated.' },
];

const BEFORE = [
  'Find your hex codes (manually)',
  'Pick a template that almost fits',
  'Fill in every field for every employee',
  'Email everyone a PDF and hope',
  '40% do it wrong. 20% never bother.',
];

const AFTER = [
  'Paste your URL',
  'We read your brand automatically',
  'Zero fields to fill',
  'One deploy button',
  'Whole team live in 3 minutes',
];

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    desc: 'forever',
    features: ['1 brand kit', '3 signature layouts', 'Copy HTML', '"Made with Signet" footer'],
    cta: 'Get started free',
    href: '/app',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$12',
    desc: '/ month',
    features: ['Unlimited brand kits', 'All layouts', 'No Signet footer', 'Font picker'],
    cta: 'Start Pro',
    href: '/app',
    highlight: true,
  },
  {
    name: 'Team',
    price: '$8',
    desc: '/ seat / mo',
    features: ['Everything in Pro', 'Google Workspace sync', 'One-click team deploy', 'Admin controls'],
    cta: 'Contact us',
    href: 'mailto:hello@signet.so',
    highlight: false,
  },
];

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Scroll reveals — single elements
      gsap.utils.toArray<HTMLElement>('.sc-reveal').forEach(el => {
        gsap.from(el, {
          y: 22, opacity: 0, duration: 0.75, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        });
      });

      // Scroll reveals — staggered children
      gsap.utils.toArray<HTMLElement>('.sc-stagger').forEach(container => {
        const kids = Array.from(container.children);
        if (!kids.length) return;
        gsap.from(kids, {
          y: 18, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1,
          scrollTrigger: { trigger: container, start: 'top 90%', once: true },
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={root}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-line/60 bg-paper/90 px-6 backdrop-blur-sm md:px-10">
        <Link href="/" className="font-display text-[1.05rem] font-semibold tracking-tight text-ink">
          Signet
        </Link>
        <div className="flex items-center gap-5">
          <a href="#pricing" className={`${lbl} hidden transition-colors hover:text-ink sm:block`}>
            Pricing
          </a>
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 bg-ink px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-paper transition-colors hover:bg-accent"
          >
            Try it free
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="flex min-h-[88svh] flex-col justify-center px-6 pb-16 pt-20 md:px-10 md:pt-28">
        <div className="mx-auto w-full max-w-5xl">
          <span
            className={`rise block ${lbl} text-accent`}
            style={{ animationDelay: '40ms' }}
          >
            AI Brand Signatures
          </span>

          <h1
            className="rise mt-5 font-display leading-[1.01] tracking-[-0.03em] text-ink"
            style={{
              animationDelay: '120ms',
              fontSize: 'clamp(2.8rem, 8vw, 7.5rem)',
            }}
          >
            Your mark on<br />
            <em className="text-accent">every email.</em>
          </h1>

          <p
            className="rise mt-8 max-w-[50ch] text-lg leading-relaxed text-muted md:text-xl"
            style={{ animationDelay: '220ms' }}
          >
            Paste your company URL. We extract your logo, colors, and fonts —
            then generate polished signatures for your whole team.
            Deploy to Google Workspace in one click.
          </p>

          <div
            className="rise mt-10 flex flex-wrap items-center gap-4"
            style={{ animationDelay: '320ms' }}
          >
            <Link
              href="/app"
              className="group inline-flex items-center gap-2 bg-ink px-8 py-4 font-medium text-paper transition-colors hover:bg-accent"
            >
              Generate yours free
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <a
              href="#how"
              className="text-sm text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              See how it works ↓
            </a>
          </div>
        </div>
      </section>

      {/* ── DEMO ────────────────────────────────────────────────────────── */}
      <section className="bg-card px-6 py-20 md:px-10">
        <div className="mx-auto max-w-5xl">

          <div className="sc-reveal">
            <span className={lbl}>Live output</span>
            <p className="mt-2 text-sm text-muted">
              Generated from{' '}
              <span className="font-medium text-ink">acmecorp.com</span>{' '}
              in 9 seconds. Logo, colors, and font extracted automatically.
            </p>
          </div>

          {/* Browser shell */}
          <div className="sc-reveal mt-6 overflow-hidden border border-line shadow-[0_2px_0_rgba(24,22,15,0.04),0_24px_64px_-20px_rgba(24,22,15,0.16)]">

            {/* Chrome bar */}
            <div className="flex items-center gap-3 border-b border-line bg-paper-deep px-4 py-2.5">
              <div className="flex shrink-0 gap-1.5">
                {['#fc5753','#fdbc40','#33c748'].map(bg => (
                  <span key={bg} className="block h-2.5 w-2.5 rounded-full" style={{ background: bg }} />
                ))}
              </div>
              <div className="flex flex-1 items-center gap-1 rounded-sm border border-line bg-paper px-3 py-1">
                <span className="text-[0.7rem] text-muted/60 select-none">https://</span>
                <span className="text-[0.7rem] text-muted">acmecorp.com</span>
              </div>
              <span
                className={`${lbl} hidden shrink-0 sm:block`}
                style={{ color: '#4ade80' }}
              >
                ✓ Generated
              </span>
            </div>

            {/* Signature cards */}
            <div className="sc-stagger grid grid-cols-1 divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
              {LAYOUTS.map(({ id, label: name, h }) => (
                <div key={id} className="bg-card">
                  <div className="border-b border-line px-4 py-2.5">
                    <span className={lbl}>{name}</span>
                  </div>
                  <iframe
                    title={name}
                    sandbox="allow-popups"
                    style={{ height: h, display: 'block', width: '100%' }}
                    srcDoc={frameDoc(renderSignature(ACME_KIT, ACME_PERSON, id))}
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── STEPS ───────────────────────────────────────────────────────── */}
      <section id="how" className="px-6 py-24 md:px-10">
        <div className="mx-auto max-w-5xl">

          <div className="sc-reveal">
            <span className={lbl}>How it works</span>
            <h2 className="mt-3 font-display text-3xl leading-tight tracking-[-0.02em] text-ink md:text-4xl">
              From URL to deployed.<br />Under 3 minutes.
            </h2>
          </div>

          <div className="sc-stagger mt-14 grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
            {STEPS.map(s => (
              <div key={s.n}>
                <span
                  className="block font-display text-[2.6rem] leading-none tracking-tight"
                  style={{ color: 'var(--color-line)' }}
                >
                  {s.n}
                </span>
                <h3 className="mt-4 text-sm font-semibold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── CONTRAST ────────────────────────────────────────────────────── */}
      <section
        className="px-6 py-24 md:px-10"
        style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
      >
        <div className="mx-auto max-w-5xl">

          <div className="sc-reveal">
            <span className={lbl} style={{ color: 'rgba(246,243,236,0.35)' }}>
              Why Signet
            </span>
            <h2 className="mt-3 font-display text-3xl leading-tight tracking-[-0.02em] md:text-4xl">
              The old way is broken.
            </h2>
          </div>

          <div className="sc-stagger mt-14 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-20">
            <div>
              <p className={lbl} style={{ color: 'rgba(246,243,236,0.3)', marginBottom: '1.25rem' }}>
                Before
              </p>
              <ul className="space-y-4">
                {BEFORE.map(item => (
                  <li key={item} className="flex items-start gap-3" style={{ color: 'rgba(246,243,236,0.4)' }}>
                    <span className="mt-px shrink-0 text-xs">✗</span>
                    <span className="text-[0.93rem] leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className={`${lbl} mb-5 text-accent`}>With Signet</p>
              <ul className="space-y-4">
                {AFTER.map(item => (
                  <li key={item} className="flex items-start gap-3" style={{ color: 'var(--color-paper)' }}>
                    <span className="mt-px shrink-0 text-xs text-accent">✓</span>
                    <span className="text-[0.93rem] leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-24 md:px-10">
        <div className="mx-auto max-w-5xl">

          <div className="sc-reveal">
            <span className={lbl}>Pricing</span>
            <h2 className="mt-3 font-display text-3xl tracking-[-0.02em] text-ink md:text-4xl">
              Start free. Scale when you&rsquo;re ready.
            </h2>
          </div>

          <div className="sc-stagger mt-12 grid grid-cols-1 border border-line md:grid-cols-3">
            {PLANS.map((plan, i) => (
              <div
                key={plan.name}
                className={[
                  'p-8',
                  plan.highlight ? 'bg-card' : '',
                  i < 2 ? 'border-b border-line md:border-b-0 md:border-r' : '',
                ].join(' ')}
              >
                <div className="flex items-start justify-between">
                  <span className={lbl}>{plan.name}</span>
                  {plan.highlight && (
                    <span className="bg-accent px-2 py-0.5 text-[0.58rem] uppercase tracking-wider text-paper">
                      Popular
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="font-display text-[2.4rem] leading-none tracking-tight text-ink">
                    {plan.price}
                  </span>
                  <span className="text-xs text-muted">{plan.desc}</span>
                </div>

                <ul className="mt-8 space-y-3">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-muted">
                      <span className="shrink-0 text-accent">–</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={[
                    'mt-10 block py-3 text-center text-[0.75rem] font-medium uppercase tracking-[0.1em] transition-colors',
                    plan.highlight
                      ? 'bg-ink text-paper hover:bg-accent'
                      : 'border border-line text-muted hover:border-ink hover:text-ink',
                  ].join(' ')}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="border-t border-line px-6 py-28 md:px-10">
        <div className="sc-reveal mx-auto max-w-3xl text-center">
          <h2
            className="font-display leading-[1.07] tracking-[-0.03em] text-ink"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}
          >
            Your brand deserves<br />to be in every email.
          </h2>
          <p className="mt-5 text-muted">
            10 seconds. No credit card. No IT ticket.
          </p>
          <Link
            href="/app"
            className="group mt-10 inline-flex items-center gap-2 bg-ink px-10 py-4 font-medium text-paper transition-colors hover:bg-accent"
          >
            Generate yours free
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-line px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <Link href="/" className="font-display font-semibold text-ink">
            Signet
          </Link>
          <p className={lbl}>
            No template picker · No IT ticket · No filling forms
          </p>
          <p className={`${lbl} text-muted`}>© 2026 Signet</p>
        </div>
      </footer>

    </div>
  );
}
