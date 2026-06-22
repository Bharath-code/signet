'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { useBrandKit, LAYOUTS } from './useBrandKit';
import { SignaturePreview } from './SignaturePreview';
import type { BrandKit, SignatureFields } from '@/lib/types';

/* ─── Demo data (initial state for hero previews) ──────────────────────── */

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

/* ─── Constants ─────────────────────────────────────────────────────────── */

const STEPS = [
  { n: '01', title: 'Paste your URL',  body: 'Drop in your company website. No setup, no credentials.' },
  { n: '02', title: 'Brand extracted', body: 'Logo, colors, and fonts — read from your site automatically.' },
  { n: '03', title: 'Pick a layout',   body: 'Three polished options, all on-brand. Pick one or all.' },
  { n: '04', title: 'Copy & install',  body: 'Copy the HTML. Paste into Gmail. Done.' },
];

const OLD_WAY_FIELDS = [
  'Full name', 'Job title', 'Email', 'Phone', 'Company',
  'Website', 'Logo URL', 'Primary color', 'Secondary color',
  'Font family', 'LinkedIn URL', 'Twitter URL', 'Office address',
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
    soon: false,
  },
  {
    name: 'Pro',
    price: '$12',
    desc: '/ month',
    features: ['Unlimited brand kits', 'All layouts', 'No Signet footer', 'Font picker'],
    cta: 'Start Pro',
    href: '#notify',
    highlight: true,
    soon: false,
  },
  {
    name: 'Team',
    price: 'Soon',
    desc: '',
    features: ['Google Workspace sync', 'One-click team deploy', 'Admin controls'],
    cta: 'Join the waitlist',
    href: '#notify',
    highlight: false,
    soon: true,
  },
];

const lbl = 'text-[0.65rem] uppercase tracking-[0.18em] text-muted';

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const root     = useRef<HTMLDivElement>(null);
  const heroRef  = useRef<HTMLElement>(null);
  const [navSolid,     setNavSolid]     = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [wlEmail,      setWlEmail]      = useState('');
  const [wlLoading,    setWlLoading]    = useState(false);
  const [wlDone,       setWlDone]       = useState(false);
  const [wlError,      setWlError]      = useState('');

  const brand = useBrandKit({
    initialKit: ACME_KIT,
    initialFields: ACME_PERSON,
    initialFont: 'Georgia, serif',
  });

  const handleGenerate = async (e: FormEvent) => {
    await brand.generate(e);
    setHasGenerated(true);
    requestAnimationFrame(() => {
      heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleWaitlist = async (e: FormEvent) => {
    e.preventDefault();
    setWlLoading(true);
    setWlError('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: wlEmail }),
      });
      if (!res.ok) throw new Error('failed');
      setWlDone(true);
    } catch {
      setWlError('Something went wrong — try again.');
    } finally {
      setWlLoading(false);
    }
  };

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

      {/* Skip link */}
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
          ? { background: 'rgba(249,246,240,0.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--color-line)' }
          : { background: 'transparent', borderBottom: '1px solid transparent' }
        }
      >
        <Link
          href="/"
          className="font-display text-[1.05rem] font-semibold tracking-tight text-ink transition-colors"
        >
          Signet
        </Link>
        <div className="flex items-center gap-5">
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-paper transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-ink)' }}
          >
            Try it free
          </Link>
        </div>
      </nav>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <main id="main-content">

      {/* ── HERO (the demo IS the hero) ─────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative px-6 pt-24 pb-20 md:px-10 md:pt-40 md:pb-32"
        style={{ background: 'var(--color-paper)' }}
      >
        <div className="mx-auto w-full max-w-4xl text-center">

          <span
            className="rise block text-[0.64rem] uppercase tracking-[0.2em]"
            style={{ animationDelay: '40ms', color: 'var(--color-accent)' }}
          >
            Brand signatures, automated
          </span>

          <h1
            className="rise mt-7 font-display leading-[0.98] tracking-[-0.04em] text-ink"
            style={{
              animationDelay: '110ms',
              fontSize: 'clamp(3rem, 9vw, 8rem)',
            }}
          >
            Your mark on every email.
          </h1>

          <p
            className="rise mx-auto mt-6 max-w-[48ch] text-base leading-relaxed"
            style={{ animationDelay: '180ms', color: 'var(--color-muted)' }}
          >
            Paste your company URL. Watch your logo, colors, and fonts
            appear as a polished signature in 9 seconds.
          </p>

          {/* URL INPUT — the hero element */}
          <form
            onSubmit={handleGenerate}
            className="rise mx-auto mt-12 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-stretch"
            style={{ animationDelay: '260ms' }}
            noValidate
          >
            <div className="hero-input-row flex flex-1 items-center gap-2 px-5">
              <span className="select-none text-sm text-muted">https://</span>
              <input
                type="text"
                value={brand.url}
                onChange={(e) => brand.setUrl(e.target.value.replace(/^https?:\/\//i, ''))}
                placeholder="yourcompany.com"
                suppressHydrationWarning
                aria-label="Company URL"
                className="w-full bg-transparent py-4 text-lg text-ink outline-none placeholder:text-muted"
              />
            </div>
            <button
              type="submit"
              disabled={brand.loading}
              className="hero-button px-8 text-base disabled:opacity-50"
            >
              {brand.loading ? 'Reading…' : 'Generate →'}
            </button>
          </form>

          {/* Loading / note — ink/muted, not amber */}
          {brand.loading && (
            <p className="rise mt-5 flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--color-muted)' }}>
              <span className="inline-block h-2 w-2 animate-pulse rounded-full" style={{ background: 'var(--color-ink)' }} />
              Reading your site…
            </p>
          )}
          {brand.note && !brand.loading && (
            <p className="mt-5 text-sm text-muted" role="status">
              {brand.note}
            </p>
          )}

          {/* LIVE PREVIEWS — above the fold on desktop */}
          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
            {LAYOUTS.map(({ id, label: name, h }) => (
              <SignaturePreview
                key={id}
                kit={brand.kit}
                fields={brand.fields}
                layout={id}
                label={name}
                height={h}
                font={brand.font}
                siteUrl={brand.siteUrl || undefined}
                proHref="#notify"
              />
            ))}
          </div>

          {!hasGenerated && (
            <p className="mt-4 text-xs text-muted">
              ↑ Example signature. Paste your URL to see yours.
            </p>
          )}

          {/* POST-GENERATION EMAIL CAPTURE */}
          {hasGenerated && !brand.loading && (
            <div className="mt-10 border-t border-line pt-8">
              {wlDone ? (
                <p className="flex items-center justify-center gap-2.5 text-sm text-ink">
                  <span aria-hidden>✓</span>
                  You&rsquo;re on the list. We&rsquo;ll be in touch.
                </p>
              ) : (
                <form onSubmit={handleWaitlist} noValidate>
                  <p className="mb-3 text-sm text-muted">
                    Like what you see? Save your kit — enter your email and
                    we&rsquo;ll notify you when Pro is ready.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <input
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={wlEmail}
                      onChange={(e) => setWlEmail(e.target.value)}
                      disabled={wlLoading}
                      suppressHydrationWarning
                      aria-label="Work email address"
                      className="min-w-[220px] flex-1 px-4 py-3 text-sm outline-none"
                      style={{
                        background: 'var(--color-card)',
                        border: '1px solid var(--color-line)',
                        color: 'var(--color-ink)',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={wlLoading}
                      className="px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
                    >
                      {wlLoading ? 'Saving…' : 'Save my kit →'}
                    </button>
                  </div>
                  {wlError && (
                    <p className="mt-2 text-xs text-muted" role="alert">
                      {wlError}
                    </p>
                  )}
                </form>
              )}
            </div>
          )}

          <a href="#how" className="mt-8 inline-block text-xs text-muted transition-colors hover:text-ink">
            See how it works ↓
          </a>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section
        id="how"
        className="px-6 py-20 md:px-10 md:py-32"
        style={{ background: 'var(--color-paper)' }}
      >
        <div className="mx-auto max-w-5xl">

          <div className="sc-reveal mb-4 border-b border-line pb-6">
            <span className={lbl}>How it works</span>
            <h2
              className="mt-3 font-display leading-tight tracking-[-0.03em] text-ink"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
            >
              From URL to signature.<br />Under 3 minutes.
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

      {/* ── BEFORE / AFTER (visual) ─────────────────────────────────────── */}
      <section
        className="px-6 py-20 md:px-10 md:py-32"
        style={{ background: 'var(--color-paper-deep)' }}
      >
        <div className="mx-auto max-w-5xl">

          <div className="sc-reveal mb-10 border-b border-line pb-6">
            <span className={lbl}>The difference</span>
            <h2
              className="mt-3 font-display leading-tight tracking-[-0.03em] text-ink"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
            >
              One URL. Or fifteen fields.
            </h2>
          </div>

          <div className="sc-stagger grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* OLD WAY */}
            <div className="border border-line bg-card p-6">
              <div className="mb-5 flex items-center gap-1.5">
                {['#fc5753','#fdbc40','#33c748'].map(bg => (
                  <span key={bg} className="block h-2.5 w-2.5 rounded-full" style={{ background: bg }} />
                ))}
              </div>
              <p className="mb-5 text-[0.65rem] uppercase tracking-[0.18em] text-muted">
                The old way — fill every field
              </p>
              <div className="space-y-2.5">
                {OLD_WAY_FIELDS.map(f => (
                  <div key={f} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 truncate text-[0.7rem] text-muted">{f}</span>
                    <span className="h-7 flex-1 border border-line bg-paper" />
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[0.72rem] text-muted">Per employee. Every time.</p>
            </div>

            {/* WITH SIGNET — one amber instance: the card border */}
            <div className="border-2 p-6" style={{ borderColor: 'var(--color-accent)', background: 'var(--color-card)' }}>
              <div className="mb-5 flex items-center gap-1.5">
                {['#fc5753','#fdbc40','#33c748'].map(bg => (
                  <span key={bg} className="block h-2.5 w-2.5 rounded-full" style={{ background: bg }} />
                ))}
              </div>
              <p className="mb-5 text-[0.65rem] uppercase tracking-[0.18em] text-muted">
                With Signet — paste your URL
              </p>
              <div className="flex items-center gap-3">
                <span className="text-[0.7rem] text-muted">https://</span>
                <span className="flex h-10 flex-1 items-center border border-line bg-paper px-3 text-[0.8rem] text-muted">
                  yourcompany.com
                </span>
                <span
                  className="flex h-10 items-center px-5 text-[0.8rem] font-medium"
                  style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
                >
                  Generate →
                </span>
              </div>
              <div className="mt-5 space-y-2.5">
                <div className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-[0.7rem] text-muted">Logo</span>
                  <span className="h-7 flex-1 border border-line bg-paper" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-[0.7rem] text-muted">Colors</span>
                  <span className="flex h-7 flex-1 items-center gap-1 px-1">
                    <span className="h-5 w-5" style={{ background: '#b23a20' }} />
                    <span className="h-5 w-5" style={{ background: '#6f6857' }} />
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-[0.7rem] text-muted">Font</span>
                  <span className="h-7 flex-1 border border-line bg-paper" />
                </div>
              </div>
              <p className="mt-5 text-[0.72rem] text-ink">
                Done. In 9 seconds.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-20 md:px-10 md:py-32">
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
                  i < 2 ? 'border-b border-line md:border-b-0 md:border-r' : '',
                ].join(' ')}
                style={{
                  background: plan.highlight ? 'var(--color-card)' : undefined,
                  opacity: plan.soon ? 0.7 : 1,
                }}
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
                  {plan.soon && (
                    <span
                      className="px-2 py-0.5 text-[0.58rem] uppercase tracking-wider"
                      style={{ background: 'var(--color-paper-deep)', color: 'var(--color-muted)' }}
                    >
                      Coming soon
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
                  {plan.desc && <span className="text-xs text-muted">{plan.desc}</span>}
                </div>

                <ul className="mt-8 space-y-3.5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-muted">
                      <span className="shrink-0 text-[0.7rem] text-ink">–</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.soon ? (
                  <a
                    href={plan.href}
                    className="plan-cta-outline mt-10 block py-3.5 text-center text-[0.72rem] font-medium uppercase tracking-[0.1em]"
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <Link
                    href={plan.href}
                    className={`mt-10 block py-3.5 text-center text-[0.72rem] font-medium uppercase tracking-[0.1em] ${
                      plan.highlight ? 'plan-cta-primary' : 'plan-cta-outline'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── FINAL CTA + NOTIFY ──────────────────────────────────────────── */}
      <section
        id="notify"
        className="border-t border-line px-6 py-20 text-center md:px-10 md:py-32"
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
            9 seconds. No credit card. No IT ticket.
          </p>
          <Link
            href="/app"
            className="group mt-10 inline-flex items-center gap-2.5 px-10 py-4 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
          >
            Generate yours free
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>

          {/* Notify form for Pro / Team interest */}
          <div className="mx-auto mt-16 max-w-md border-t border-line pt-10">
            <p className="text-sm text-muted">
              Want Pro or Team features? Get notified when they launch.
            </p>
            {wlDone ? (
              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-ink">
                <span aria-hidden>✓</span> You&rsquo;re on the list.
              </p>
            ) : (
              <form onSubmit={handleWaitlist} noValidate className="mt-4 flex flex-wrap justify-center gap-3">
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={wlEmail}
                  onChange={(e) => setWlEmail(e.target.value)}
                  disabled={wlLoading}
                  suppressHydrationWarning
                  aria-label="Work email address"
                  className="min-w-[200px] flex-1 px-4 py-3 text-sm outline-none"
                  style={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-line)',
                    color: 'var(--color-ink)',
                  }}
                />
                <button
                  type="submit"
                  disabled={wlLoading}
                  className="px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
                >
                  {wlLoading ? 'Saving…' : 'Notify me →'}
                </button>
              </form>
            )}
            {wlError && (
              <p className="mt-2 text-xs text-muted" role="alert">
                {wlError}
              </p>
            )}
          </div>
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
            No template picker · No hex codes · No IT ticket
          </p>
          <p className={lbl}>© 2026 Signet</p>
        </div>
      </footer>

    </div>
  );
}
