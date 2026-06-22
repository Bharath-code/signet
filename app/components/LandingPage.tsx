'use client';

import { useEffect, useRef, useState } from 'react';
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

const TICKER = [
  'Generated in 9 seconds',
  'Zero configuration',
  'No template picker',
  'Your brand, not a template',
  '3 minutes to deploy',
  'Auto-extracted',
  'No IT ticket',
  'No hex codes',
];

const STEPS = [
  { n: '01', title: 'Paste your URL',   body: 'Drop in your company website. No setup, no credentials.' },
  { n: '02', title: 'Brand extracted',  body: 'Logo, colors, and fonts — read from your site automatically.' },
  { n: '03', title: 'Pick a layout',    body: 'Three polished options, all on-brand. Pick one or all.' },
  { n: '04', title: 'Deploy',           body: 'Connect Google Workspace. One click. Every inbox updated.' },
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

const lbl = 'text-[0.65rem] uppercase tracking-[0.18em] text-muted';

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const root     = useRef<HTMLDivElement>(null);
  const demoRef  = useRef<HTMLElement>(null);
  const [navSolid, setNavSolid] = useState(false);
  const [typed,    setTyped]    = useState('');

  /* Scroll-aware nav */
  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > window.innerHeight * 0.72);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Typewriter for demo URL bar — starts when demo enters view */
  useEffect(() => {
    const section = demoRef.current;
    if (!section) return;
    const URL_TEXT = 'acmecorp.com';
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        let i = 0;
        const tick = setInterval(() => {
          i++;
          setTyped(URL_TEXT.slice(0, i));
          if (i >= URL_TEXT.length) clearInterval(tick);
        }, 65);
      },
      { threshold: 0.25 }
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, []);

  /* GSAP scroll reveals */
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {

      gsap.utils.toArray<HTMLElement>('.sc-reveal').forEach(el => {
        gsap.from(el, {
          y: 20, opacity: 0, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>('.sc-stagger').forEach(container => {
        const kids = Array.from(container.children);
        if (!kids.length) return;
        gsap.from(kids, {
          y: 16, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1,
          scrollTrigger: { trigger: container, start: 'top 90%', once: true },
        });
      });

      /* Step rows slide in from left */
      gsap.utils.toArray<HTMLElement>('.sc-step').forEach((el, i) => {
        gsap.from(el, {
          x: -24, opacity: 0, duration: 0.65, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          delay: i * 0.06,
        });
      });

    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root}>

      {/* Skip link — keyboard / screen reader users jump to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:px-4 focus:py-2 focus:text-sm"
        style={{ background: 'var(--color-accent)', color: 'var(--color-ink)' }}
      >
        Skip to content
      </a>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        data-solid={navSolid ? 'true' : 'false'}
        className="sticky top-0 z-50 flex h-14 items-center justify-between px-6 transition-all duration-300 md:px-10"
        style={navSolid
          ? { background: 'rgba(249,246,240,0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--color-line)' }
          : { background: 'var(--color-ink)', borderBottom: '1px solid rgba(249,246,240,0.08)' }
        }
      >
        <Link
          href="/"
          className="font-display text-[1.05rem] font-semibold tracking-tight transition-colors"
          style={{ color: navSolid ? 'var(--color-ink)' : 'var(--color-paper)' }}
        >
          Signet
        </Link>
        <div className="flex items-center gap-5">
          <a
            href="#pricing"
            className="nav-link hidden text-[0.65rem] uppercase tracking-[0.18em] transition-colors sm:block"
          >
            Pricing
          </a>
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.1em] transition-all"
            style={navSolid
              ? { background: 'var(--color-ink)', color: 'var(--color-paper)' }
              : { background: 'var(--color-accent)', color: 'var(--color-ink)' }
            }
          >
            Try it free
          </Link>
        </div>
      </nav>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <main id="main-content">

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section
        className="relative flex min-h-[100svh] flex-col justify-center px-6 pb-24 pt-24 md:px-10 md:pb-32"
        style={{ background: 'var(--color-ink)' }}
      >
        <div className="mx-auto w-full max-w-5xl">
          <span
            className="rise block text-[0.64rem] uppercase tracking-[0.2em]"
            style={{ color: 'rgba(249,246,240,0.32)', animationDelay: '40ms' }}
          >
            AI Brand Signatures
          </span>

          <h1
            className="rise mt-6 font-display leading-[1.0] tracking-[-0.04em]"
            style={{
              animationDelay: '110ms',
              fontSize: 'clamp(3rem, 10vw, 9rem)',
              color: 'var(--color-paper)',
            }}
          >
            Your mark on<br />
            <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>every email.</em>
          </h1>

          <p
            className="rise mt-8 max-w-[46ch] text-lg leading-relaxed"
            style={{ animationDelay: '210ms', color: 'rgba(249,246,240,0.46)' }}
          >
            Paste your company URL. We extract your logo, colors, and fonts —
            then generate polished signatures for your whole team.
            Deploy to Google Workspace in one click.
          </p>

          <div
            className="rise mt-10 flex flex-wrap items-center gap-4"
            style={{ animationDelay: '310ms' }}
          >
            <Link
              href="/app"
              className="group inline-flex items-center gap-2.5 px-8 py-4 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-accent)', color: 'var(--color-ink)' }}
            >
              Generate yours free
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <a href="#how" className="btn-ghost-dark px-6 py-4 text-sm">
              See how it works ↓
            </a>
          </div>
        </div>

        {/* Bottom decorative rule — signals content below */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'rgba(249,246,240,0.06)' }}
        />
      </section>

      {/* ── MARQUEE TICKER ──────────────────────────────────────────────── */}
      <div
        className="overflow-hidden border-b border-line py-3"
        style={{ background: 'var(--color-paper-deep)' }}
        aria-hidden="true"
      >
        <div
          style={{
            display: 'flex',
            width: 'max-content',
            animation: 'marquee 28s linear infinite',
          }}
        >
          {[0, 1].map(copy => (
            <div
              key={copy}
              style={{ display: 'flex', alignItems: 'center', gap: '2rem', paddingRight: '2rem', flexShrink: 0 }}
            >
              {TICKER.map(item => (
                <span key={item} style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexShrink: 0 }}>
                  <span className="whitespace-nowrap text-[0.63rem] uppercase tracking-[0.18em] text-muted">
                    {item}
                  </span>
                  <span style={{ color: 'var(--color-accent)', fontSize: '0.5rem' }}>✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── DEMO ────────────────────────────────────────────────────────── */}
      <section ref={demoRef} className="px-6 py-20 md:px-10" style={{ background: 'var(--color-paper)' }}>
        <div className="mx-auto max-w-5xl">

          <div className="sc-reveal mb-6 flex items-end justify-between gap-4">
            <div>
              <span className={lbl}>Live output</span>
              <p className="mt-1.5 text-sm text-muted">
                Generated from{' '}
                <span className="font-medium text-ink">acmecorp.com</span>{' '}
                in 9 seconds — logo, colors, font, all automatic.
              </p>
            </div>
          </div>

          {/* Browser shell */}
          <div
            className="sc-reveal overflow-hidden border border-line"
            style={{ boxShadow: '0 2px 0 rgba(28,25,23,0.04), 0 28px 72px -20px rgba(28,25,23,0.14)' }}
          >
            {/* Chrome bar */}
            <div
              className="flex items-center gap-3 border-b border-line px-4 py-2.5"
              style={{ background: 'var(--color-paper-deep)' }}
            >
              <div className="flex shrink-0 gap-1.5">
                {['#fc5753','#fdbc40','#33c748'].map(bg => (
                  <span key={bg} className="block h-2.5 w-2.5 rounded-full" style={{ background: bg }} />
                ))}
              </div>

              <div
                className="flex flex-1 items-center gap-1 border border-line px-3 py-[5px]"
                style={{ background: 'var(--color-paper)', borderRadius: 3 }}
              >
                <span className="select-none text-[0.67rem]" style={{ color: 'rgba(120,113,108,0.5)' }}>https://</span>
                <span className="min-w-[7rem] text-[0.67rem] text-muted">
                  {typed}
                  {typed.length < 'acmecorp.com'.length && (
                    <span className="animate-pulse" style={{ color: 'var(--color-accent)' }}>|</span>
                  )}
                </span>
              </div>

              <span
                className="hidden shrink-0 text-[0.63rem] uppercase tracking-[0.15em] sm:block"
                style={{ color: '#4ade80' }}
              >
                ✓ Generated
              </span>
            </div>

            {/* Signature cards */}
            <div className="sc-stagger grid grid-cols-1 divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
              {LAYOUTS.map(({ id, label: name, h }) => (
                <div key={id} style={{ background: '#fff' }}>
                  <div className="border-b border-line px-4 py-2.5" style={{ background: 'var(--color-card)' }}>
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
      <section
        id="how"
        className="px-6 pb-24 pt-20 md:px-10"
        style={{ background: 'var(--color-paper)' }}
      >
        <div className="mx-auto max-w-5xl">

          <div className="sc-reveal mb-4 border-b border-line pb-6">
            <span className={lbl}>How it works</span>
            <h2
              className="mt-3 font-display leading-tight tracking-[-0.03em] text-ink"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
            >
              From URL to deployed.<br />Under 3 minutes.
            </h2>
          </div>

          {STEPS.map(s => (
            <div
              key={s.n}
              className="sc-step flex items-start gap-6 border-b border-line py-9 md:gap-14 md:py-11"
            >
              <span
                className="select-none font-display leading-none tracking-tight"
                style={{
                  fontSize: 'clamp(4rem, 10vw, 8rem)',
                  color: 'var(--color-line)',
                  minWidth: 'clamp(3.5rem, 7vw, 6rem)',
                  lineHeight: 1,
                }}
              >
                {s.n}
              </span>
              <div className="flex-1 pt-2 md:pt-3">
                <h3
                  className="font-display tracking-tight text-ink"
                  style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)' }}
                >
                  {s.title}
                </h3>
                <p className="mt-2 max-w-[40ch] text-sm leading-relaxed text-muted">
                  {s.body}
                </p>
              </div>
            </div>
          ))}

        </div>
      </section>

      {/* ── CONTRAST ────────────────────────────────────────────────────── */}
      <section
        className="px-6 py-24 md:px-10"
        style={{ background: 'var(--color-ink)' }}
      >
        <div className="mx-auto max-w-5xl">

          <div className="sc-reveal border-b pb-6" style={{ borderColor: 'rgba(249,246,240,0.08)' }}>
            <span className="text-[0.65rem] uppercase tracking-[0.18em]" style={{ color: 'rgba(249,246,240,0.28)' }}>
              Why Signet
            </span>
            <h2
              className="mt-3 font-display leading-tight tracking-[-0.03em]"
              style={{ color: 'var(--color-paper)', fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
            >
              The old way is broken.
            </h2>
          </div>

          <div className="sc-stagger mt-0 grid grid-cols-1 gap-0 md:grid-cols-2">
            <div className="border-b py-12 md:border-b-0 md:border-r md:pr-14" style={{ borderColor: 'rgba(249,246,240,0.08)' }}>
              <p className="mb-8 text-[0.65rem] uppercase tracking-[0.18em]" style={{ color: 'rgba(249,246,240,0.25)' }}>
                Before
              </p>
              <ul className="space-y-5">
                {BEFORE.map(item => (
                  <li key={item} className="flex items-start gap-3.5" style={{ color: 'rgba(249,246,240,0.35)' }}>
                    <span className="mt-0.5 shrink-0 text-xs">✗</span>
                    <span className="text-[0.9rem] leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="py-12 md:pl-14">
              <p className="mb-8 text-[0.65rem] uppercase tracking-[0.18em]" style={{ color: 'var(--color-accent)' }}>
                With Signet
              </p>
              <ul className="space-y-5">
                {AFTER.map(item => (
                  <li key={item} className="flex items-start gap-3.5" style={{ color: 'var(--color-paper)' }}>
                    <span className="mt-0.5 shrink-0 text-xs" style={{ color: 'var(--color-accent)' }}>✓</span>
                    <span className="text-[0.9rem] leading-snug">{item}</span>
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

          <div className="sc-reveal border-b border-line pb-6">
            <span className={lbl}>Pricing</span>
            <h2
              className="mt-3 font-display tracking-[-0.03em] text-ink"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
            >
              Start free. Scale when you&rsquo;re ready.
            </h2>
          </div>

          <div className="sc-stagger grid grid-cols-1 border border-line md:grid-cols-3">
            {PLANS.map((plan, i) => (
              <div
                key={plan.name}
                className={[
                  'p-8',
                  plan.highlight ? '' : '',
                  i < 2 ? 'border-b border-line md:border-b-0 md:border-r' : '',
                ].join(' ')}
                style={{ background: plan.highlight ? 'var(--color-card)' : undefined }}
              >
                <div className="flex items-start justify-between">
                  <span className={lbl}>{plan.name}</span>
                  {plan.highlight && (
                    <span
                      className="px-2 py-0.5 text-[0.58rem] uppercase tracking-wider"
                      style={{ background: 'var(--color-accent)', color: 'var(--color-ink)' }}
                    >
                      Popular
                    </span>
                  )}
                </div>

                <div className="mt-5 flex items-baseline gap-1.5">
                  <span
                    className="font-display leading-none tracking-tight text-ink"
                    style={{ fontSize: 'clamp(2rem, 4vw, 2.6rem)' }}
                  >
                    {plan.price}
                  </span>
                  <span className="text-xs text-muted">{plan.desc}</span>
                </div>

                <ul className="mt-8 space-y-3.5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-muted">
                      <span className="shrink-0 text-[0.7rem]" style={{ color: 'var(--color-accent)' }}>–</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`mt-10 block py-3.5 text-center text-[0.72rem] font-medium uppercase tracking-[0.1em] ${
                    plan.highlight ? 'plan-cta-primary' : 'plan-cta-outline'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
      <section
        className="border-t border-line px-6 py-28 text-center md:px-10"
        style={{ background: 'var(--color-paper-deep)' }}
      >
        <div className="sc-reveal mx-auto max-w-2xl">
          <span className={lbl}>Ready?</span>
          <h2
            className="mt-4 font-display leading-[1.07] tracking-[-0.04em] text-ink"
            style={{ fontSize: 'clamp(2.2rem, 6vw, 4.5rem)' }}
          >
            Your brand deserves<br />
            <em style={{ color: 'var(--color-accent)' }}>to be in every email.</em>
          </h2>
          <p className="mt-5 text-sm text-muted">
            10 seconds. No credit card. No IT ticket.
          </p>
          <Link
            href="/app"
            className="group mt-10 inline-flex items-center gap-2.5 px-10 py-4 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
          >
            Generate yours free
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>

      </main>{/* ── end main ── */}

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-line px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <Link href="/" className="font-display font-semibold text-ink">
            Signet
          </Link>
          <p className={lbl}>
            No template picker · No IT ticket · No filling forms
          </p>
          <p className={`${lbl}`}>© 2026 Signet</p>
        </div>
      </footer>

    </div>
  );
}
