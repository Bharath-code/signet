'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { useBrandKit, LAYOUTS } from './useBrandKit';
import { SignaturePreview } from './SignaturePreview';
import { track } from './track';
import type { BrandKit, SignatureFields } from '@/lib/types';

/* ─── Demo data (initial state for hero previews) ──────────────────────── */

const ACME_KIT: BrandKit = {
  companyName: 'Acme Corp',
  logoUrl: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="34"><rect width="96" height="34" rx="3" fill="#1d4ed8"/><text x="48" y="22" font-family="system-ui,sans-serif" font-size="13" fill="white" text-anchor="middle" font-weight="bold">ACME</text></svg>`
  )}`,
  primaryColor: '#1d4ed8',
  secondaryColor: '#475569',
  fontFamily: 'system-ui, sans-serif',
};

const ACME_PERSON: SignatureFields = {
  fullName: 'Alex Chen',
  jobTitle: 'Head of Design',
  email: 'alex@acmecorp.com',
  phone: '+1 415 555 0101',
};

/* ─── How-it-works — asymmetric 2×2 bento (not stacked rows) ───────────── */

const STEPS = [
  { n: '01', title: 'Paste your URL',  body: 'Drop in your company website. No setup, no credentials.' },
  { n: '02', title: 'Brand extracted', body: 'Logo, colors, and fonts — read from your site automatically.' },
  { n: '03', title: 'Pick a layout',   body: 'Three polished options, all on-brand. Pick one or all.' },
  { n: '04', title: 'Install',         body: 'Copy HTML → Gmail Signature → paste. Done.' },
];

const OLD_WAY_FIELDS = [
  'Full name', 'Job title', 'Email', 'Phone', 'Company',
  'Website', 'Logo URL', 'Primary color', 'Secondary color',
  'Font family', 'LinkedIn', 'Twitter', 'Office address',
];

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    desc: 'forever',
    features: ['1 brand kit', '3 signature layouts', 'Copy HTML', '"Made with Signet" footer'],
    cta: 'Generate yours →',
    href: '/app',
    highlight: false,
    soon: false,
  },
  {
    name: 'Pro',
    price: '$12',
    desc: '/ month',
    features: ['Unlimited brand kits', 'All layouts', 'No Signet footer', 'Font picker'],
    cta: 'Generate yours →',
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
    initialFont: 'system-ui, sans-serif',
  });

  const handleGenerate = async (e: FormEvent) => {
    track('url_submitted');
    await brand.generate(e);
    setHasGenerated(true);
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
      track('waitlist_joined');
    } catch {
      setWlError('Something went wrong — try again.');
    } finally {
      setWlLoading(false);
    }
  };

  // Hero input: magnetic micro-physics (high-end §5.B) — track pointer pull,
  // never via React state. Pure DOM mutation in rAF so it can't jank.
  useEffect(() => {
    const btn = document.getElementById('hero-cta');
    if (!btn) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onMove = (e: MouseEvent) => {
      const r = btn.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) * 0.15;
      const dy = (e.clientY - cy) * 0.25;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const onLeave = () => { btn.style.transform = ''; };
    btn.addEventListener('mousemove', onMove);
    btn.addEventListener('mouseleave', onLeave);
    return () => {
      btn.removeEventListener('mousemove', onMove);
      btn.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  useEffect(() => { track('page_view'); }, []);

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Choreographed scene reveals (high-end §5.C): blur-up with stagger.
  // GSAP animates transform + opacity + filter blur.
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.sc-reveal').forEach(el => {
        gsap.from(el, {
          y: 32, opacity: 0, filter: 'blur(8px)', duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>('.sc-stagger').forEach(container => {
        const kids = Array.from(container.children);
        if (!kids.length) return;
        gsap.from(kids, {
          y: 24, opacity: 0, filter: 'blur(6px)', duration: 0.8, ease: 'power3.out', stagger: 0.1,
          scrollTrigger: { trigger: container, start: 'top 88%', once: true },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root}>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:px-4 focus:py-2 focus:text-sm"
        style={{ background: 'var(--color-accent)', color: '#fff' }}
      >
        Skip to content
      </a>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        data-solid={navSolid ? 'true' : 'false'}
        className="sticky top-0 z-50 flex h-14 items-center justify-between px-6 transition-all duration-300 md:px-10"
        style={navSolid
          ? { background: 'rgba(250,250,250,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--color-line)' }
          : { background: 'transparent', borderBottom: '1px solid transparent' }
        }
      >
        <Link
          href="/"
          className="font-display text-[1.05rem] font-bold tracking-tight text-ink transition-colors"
        >
          Signet
        </Link>
        <Link
          href="/app"
          id="hero-cta-nav"
          className="hero-button inline-flex items-center gap-2.5 rounded-full px-5 text-[0.72rem] font-medium uppercase tracking-[0.1em] transition-transform hover:opacity-95"
          style={{ height: 40 }}
        >
          Generate yours →
        </Link>
      </nav>

      <main id="main-content">

      {/* ── HERO (demo IS the hero · centered manifesto layout) ──────────── */}
      <section
        ref={heroRef}
        className="relative px-6 pt-24 pb-24 md:px-10 md:pt-32 md:pb-40"
        style={{ background: 'var(--color-paper)' }}
      >
        <div className="mx-auto w-full max-w-4xl text-center">

          {/* ONE eyebrow per 3 sections — this is the only one on the page */}
          <span className="eyebrow rise" style={{ animationDelay: '40ms' }}>
            Brand signatures, automated
          </span>

          <h1
            className="rise mt-8 font-display font-bold leading-[0.98] tracking-[-0.04em] text-ink"
            style={{ animationDelay: '110ms', fontSize: 'clamp(3rem, 8vw, 6rem)' }}
          >
            Your mark on every email.
          </h1>

          <p
            className="rise mx-auto mt-7 max-w-[48ch] text-lg leading-relaxed text-muted"
            style={{ animationDelay: '180ms' }}
          >
            Paste your company URL. Watch your logo, colors, and fonts
            appear as a polished signature in 9 seconds.
          </p>

          {/* URL INPUT — the hero element, Double-Bezel button-in-button */}
          <form
            onSubmit={handleGenerate}
            className="rise mx-auto mt-12 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-stretch"
            style={{ animationDelay: '260ms' }}
            noValidate
          >
            <div className="hero-input-row flex flex-1 items-center gap-2 rounded-full px-5">
              <span className="select-none text-sm text-muted">https://</span>
              <input
                type="text"
                value={brand.url}
                onChange={(e) => brand.setUrl(e.target.value.replace(/^https?:\/\//i, ''))}
                placeholder="yourcompany.com"
                suppressHydrationWarning
                aria-label="Company URL"
                className="w-full bg-transparent py-3 text-lg text-ink outline-none placeholder:text-muted"
              />
            </div>
            <button
              id="hero-cta"
              type="submit"
              disabled={brand.loading}
              className="hero-button inline-flex items-center justify-center gap-2.5 rounded-full px-7 text-base disabled:opacity-50"
            >
              {brand.loading ? 'Reading…' : 'Generate yours'}
              {!brand.loading && (
                <span className="hero-button-trail" aria-hidden>→</span>
              )}
            </button>
          </form>

          {brand.loading && (
            <p className="rise mt-6 flex items-center justify-center gap-2 text-sm text-muted">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full" style={{ background: 'var(--color-accent)' }} />
              Reading your site…
            </p>
          )}
          {brand.note && !brand.loading && (
            <p className="mt-6 text-sm text-muted" role="status">{brand.note}</p>
          )}

          {/* LIVE PREVIEWS — Double-Bezel cards, above the fold on desktop */}
          <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
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
            <p className="mt-5 text-xs text-muted">↑ Example signature. Paste your URL to see yours.</p>
          )}

          {/* POST-GENERATION EMAIL CAPTURE */}
          {hasGenerated && !brand.loading && (
            <div className="mt-12 border-t border-line pt-10">
              {wlDone ? (
                <p className="flex items-center justify-center gap-2.5 text-sm text-ink">
                  <span aria-hidden>✓</span> You&rsquo;re on the list. We&rsquo;ll be in touch.
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
                      className="min-w-[220px] flex-1 rounded-full px-4 py-3 text-sm outline-none"
                      style={{ background: 'var(--color-card)', border: '1px solid var(--color-line)', color: 'var(--color-ink)' }}
                    />
                    <button
                      type="submit"
                      disabled={wlLoading}
                      className="hero-button inline-flex items-center justify-center gap-2.5 rounded-full px-6 text-sm disabled:opacity-50"
                    >
                      {wlLoading ? 'Saving…' : 'Save my kit'}
                      {!wlLoading && <span className="hero-button-trail" aria-hidden>→</span>}
                    </button>
                  </div>
                  {wlError && <p className="mt-2 text-xs text-muted" role="alert">{wlError}</p>}
                </form>
              )}
            </div>
          )}

          <a href="#how" className="mt-10 inline-block text-xs text-muted transition-colors hover:text-ink">
            See how it works ↓
          </a>
        </div>
      </section>

      {/* ── HOW IT WORKS — asymmetric 2×2 bento, no section eyebrow ─────── */}
      <section
        id="how"
        className="px-6 py-24 md:px-10 md:py-40"
        style={{ background: 'var(--color-paper)' }}
      >
        <div className="mx-auto max-w-5xl">

          <div className="sc-reveal mb-12">
            <h2
              className="font-display font-semibold leading-tight tracking-[-0.03em] text-ink"
              style={{ fontSize: 'clamp(1.9rem, 4vw, 3.25rem)' }}
            >
              From URL to signature.<br />Under 3 minutes.
            </h2>
          </div>

          {/* 2×2 bento — never stacked border-b rows */}
          <div className="sc-stagger grid grid-cols-1 gap-5 md:grid-cols-2">
            {STEPS.map(s => (
              <div key={s.n} className="bezel">
                <div className="bezel-inner p-8">
                  <span
                    className="font-display font-semibold leading-none tracking-tight text-ink/15"
                    style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)' }}
                  >
                    {s.n}
                  </span>
                  <h3
                    className="mt-4 font-display font-semibold tracking-tight text-ink"
                    style={{ fontSize: 'clamp(1.1rem, 2vw, 1.5rem)' }}
                  >
                    {s.title}
                  </h3>
                  <p className="mt-2 max-w-[36ch] text-sm leading-relaxed text-muted">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── BEFORE/AFTER — split-screen asymmetric, no section eyebrow ───── */}
      <section
        className="px-6 py-24 md:px-10 md:py-40"
        style={{ background: 'var(--color-paper-deep)' }}
      >
        <div className="mx-auto max-w-5xl">

          <div className="sc-reveal mb-12">
            <h2
              className="font-display font-semibold leading-tight tracking-[-0.03em] text-ink"
              style={{ fontSize: 'clamp(1.9rem, 4vw, 3.25rem)' }}
            >
              One URL. Or fifteen fields.
            </h2>
          </div>

          <div className="sc-stagger grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* OLD WAY — tilted card, muted */}
            <div className="bezel" style={{ transform: 'rotate(-1.2deg)' }}>
              <div className="bezel-inner p-7">
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
            </div>

            {/* WITH SIGNET — clean Double-Bezel, single accent pop on the field */}
            <div className="bezel" style={{ transform: 'rotate(0.8deg)' }}>
              <div className="bezel-inner p-7">
                <p className="mb-5 text-[0.65rem] uppercase tracking-[0.18em] text-muted">
                  With Signet — paste your URL
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-[0.7rem] text-muted">https://</span>
                  <span className="flex h-10 flex-1 items-center border bg-paper px-3 text-[0.8rem] text-muted rounded-full"
                    style={{ borderColor: 'var(--color-accent)' }}>
                    yourcompany.com
                  </span>
                  <span
                    className="flex h-10 items-center gap-1.5 rounded-full px-4 text-[0.8rem] font-medium"
                    style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
                  >
                    Generate
                    <span className="hero-button-trail" aria-hidden style={{ width: 20, height: 20 }}>→</span>
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
                      <span className="h-5 w-5 rounded" style={{ background: '#1d4ed8' }} />
                      <span className="h-5 w-5 rounded" style={{ background: '#475569' }} />
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-[0.7rem] text-muted">Font</span>
                    <span className="h-7 flex-1 border border-line bg-paper" />
                  </div>
                </div>
                <p className="mt-5 text-[0.72rem] text-ink">Done. In 9 seconds.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── PRICING — elevated middle card (Double-Bezel with shadow lift) ─ */}
      <section id="pricing" className="px-6 py-24 md:px-10 md:py-40">
        <div className="mx-auto max-w-5xl">

          <div className="sc-reveal mb-12">
            <h2
              className="font-display font-semibold tracking-[-0.03em] text-ink"
              style={{ fontSize: 'clamp(1.9rem, 4vw, 3.25rem)' }}
            >
              Start free. Scale when you&rsquo;re ready.
            </h2>
          </div>

          <div className="sc-stagger grid grid-cols-1 gap-5 md:grid-cols-3 md:items-center">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className="bezel"
                style={plan.highlight ? { transform: 'scale(1.04)' } : undefined}
              >
                <div className="bezel-inner p-8">
                  <div className="flex items-start justify-between">
                    <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted">{plan.name}</span>
                    {plan.highlight && (
                      <span className="rounded-full px-2.5 py-0.5 text-[0.58rem] uppercase tracking-wider"
                        style={{ background: 'var(--color-accent)', color: '#fff' }}>
                        Popular
                      </span>
                    )}
                    {plan.soon && (
                      <span className="rounded-full px-2.5 py-0.5 text-[0.58rem] uppercase tracking-wider"
                        style={{ background: 'var(--color-paper-deep)', color: 'var(--color-muted)' }}>
                        Coming soon
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex items-baseline gap-1.5">
                    <span className="font-display font-semibold leading-none tracking-tight text-ink"
                      style={{ fontSize: 'clamp(2rem, 4vw, 2.6rem)' }}>
                      {plan.price}
                    </span>
                    {plan.desc && <span className="text-xs text-muted">{plan.desc}</span>}
                  </div>

                  <ul className="mt-7 space-y-3.5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-muted">
                        <span className="shrink-0 text-[0.7rem] text-ink">–</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {plan.soon ? (
                    <a href={plan.href} onClick={() => track('pro_link_clicked')}
                      className="plan-cta-outline mt-8 flex items-center justify-center gap-2.5 rounded-full py-3.5 text-center text-[0.72rem] font-medium uppercase tracking-[0.1em]">
                      {plan.cta}
                    </a>
                  ) : (
                    <Link href={plan.href} onClick={() => track('pro_link_clicked')}
                      className={`mt-8 flex items-center justify-center gap-2.5 rounded-full py-3.5 text-center text-[0.72rem] font-medium uppercase tracking-[0.1em] ${
                        plan.highlight ? 'plan-cta-primary' : 'plan-cta-outline'
                      }`}>
                      {plan.cta}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── FINAL CTA + NOTIFY — full-bleed accent-tint (no eyebrow) ─────── */}
      <section
        id="notify"
        className="px-6 py-24 text-center md:px-10 md:py-40"
        style={{ background: 'var(--color-paper-deep)' }}
      >
        <div className="sc-reveal mx-auto max-w-2xl">
          <h2
            className="font-display font-semibold leading-[1.05] tracking-[-0.04em] text-ink"
            style={{ fontSize: 'clamp(2.2rem, 6vw, 4.5rem)' }}
          >
            Your brand deserves<br />
            <em style={{ color: 'var(--color-accent)', fontStyle: 'normal' }}>to be in every email.</em>
          </h2>
          <p className="mt-5 text-sm text-muted">9 seconds. No credit card. No IT ticket.</p>
          <Link
            href="/app"
            onClick={() => track('pro_link_clicked')}
            className="hero-button group mt-10 inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 text-sm font-medium"
          >
            Generate yours free
            <span className="hero-button-trail" aria-hidden>→</span>
          </Link>

          <div className="mx-auto mt-16 max-w-md border-t border-line pt-10">
            <p className="text-sm text-muted">Want Pro or Team features? Get notified when they launch.</p>
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
                  className="min-w-[200px] flex-1 rounded-full px-4 py-3 text-sm outline-none"
                  style={{ background: 'var(--color-card)', border: '1px solid var(--color-line)', color: 'var(--color-ink)' }}
                />
                <button
                  type="submit"
                  disabled={wlLoading}
                  className="hero-button inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3 text-sm font-medium disabled:opacity-50"
                >
                  {wlLoading ? 'Saving…' : 'Notify me'}
                  {!wlLoading && <span className="hero-button-trail" aria-hidden>→</span>}
                </button>
              </form>
            )}
            {wlError && <p className="mt-2 text-xs text-muted" role="alert">{wlError}</p>}
          </div>
        </div>
      </section>

      </main>

      <footer className="border-t border-line px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <Link href="/" className="font-display font-bold text-ink">Signet</Link>
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted">
            No template picker · No hex codes · No IT ticket
          </p>
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted">© 2026 Signet</p>
        </div>
      </footer>

    </div>
  );
}