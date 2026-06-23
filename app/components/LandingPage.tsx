'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { useBrandKit, LAYOUTS } from './useBrandKit';
import { SignaturePreview } from './SignaturePreview';
import { BrandMark } from './Logo';
import { track, setPersonProperty } from './track';
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
    cta: 'Generate yours',
    href: '/app',
    highlight: false,
    soon: false,
  },
  {
    name: 'Pro',
    price: '$12',
    desc: '/ month',
    features: ['Unlimited brand kits', 'All layouts', 'No Signet footer', 'Font picker'],
    cta: 'Generate yours',
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

const TICKER = ['On-brand', 'Nine seconds', 'No template picker', 'No hex codes', 'No IT ticket'];
// One track must exceed the widest viewport for a seamless -50% loop; repeat
// enough to cover ultrawide (~2560px) displays.
const MARQUEE_ITEMS = Array.from({ length: 5 }, () => TICKER).flat();

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const root = useRef<HTMLDivElement>(null);
  const [navSolid,     setNavSolid]     = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [wlEmail,      setWlEmail]      = useState('');
  const [wlLoading,    setWlLoading]    = useState(false);
  const [wlDone,       setWlDone]       = useState(false);
  const [wlError,      setWlError]      = useState('');
  const [wlSegment,    setWlSegment]    = useState<'self' | 'team' | ''>('');

  const pickSegment = (segment: 'self' | 'team') => {
    setWlSegment(segment);
    track('waitlist_segment', { segment });
    setPersonProperty({ waitlist_segment: segment });
  };

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

  useEffect(() => { track('page_view'); }, []);

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Crisp editorial reveals — slide-up + fade, staggered grids.
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.sc-reveal').forEach(el => {
        gsap.from(el, {
          y: 28, opacity: 0, duration: 0.85, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>('.sc-stagger').forEach(container => {
        const kids = Array.from(container.children);
        if (!kids.length) return;
        gsap.from(kids, {
          y: 20, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08,
          scrollTrigger: { trigger: container, start: 'top 88%', once: true },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const monoLabel = 'font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted';

  // Post-signup segmentation: who's this for? Drives the self-vs-team
  // pricing decision. `dark` themes it for the bone-on-ink footer.
  const renderSegmentAsk = (dark: boolean) => {
    const label = dark
      ? { color: 'rgba(243,242,236,0.7)' }
      : undefined;
    const btn = dark
      ? { border: '1.5px solid rgba(243,242,236,0.35)', color: 'var(--color-paper)' }
      : { border: '1.5px solid var(--color-ink)', color: 'var(--color-ink)' };
    if (wlSegment) {
      return (
        <p className={dark ? 'mt-4 text-sm' : 'flex items-center gap-2.5 text-sm text-ink'} style={dark ? { color: 'var(--color-paper)' } : undefined}>
          <span aria-hidden style={{ color: 'var(--color-accent)' }}>✓</span> You&rsquo;re on the list — we&rsquo;ll tailor it to {wlSegment === 'team' ? 'your team' : 'you'}.
        </p>
      );
    }
    return (
      <div className={dark ? 'mt-4' : ''}>
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] mb-3" style={label}>
          You&rsquo;re in. One quick thing — who&rsquo;s this for?
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={() => pickSegment('self')}
            className="h-11 px-5 text-sm transition-opacity hover:opacity-70" style={btn}>
            Just me
          </button>
          <button type="button" onClick={() => pickSegment('team')}
            className="h-11 px-5 text-sm transition-opacity hover:opacity-70" style={btn}>
            My team
          </button>
        </div>
      </div>
    );
  };

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
        className="sticky top-0 z-50 border-b transition-colors duration-300"
        style={navSolid
          ? { background: 'rgba(243,242,236,0.86)', backdropFilter: 'blur(10px)', borderColor: 'var(--color-ink)' }
          : { background: 'transparent', borderColor: 'var(--color-line)' }
        }
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:px-10">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size={26} />
            <span className="font-display text-lg font-extrabold tracking-tight text-ink">Signet</span>
          </Link>
          <div className="flex items-center gap-7">
            <a href="#how"     className={`${monoLabel} hidden transition-colors hover:text-ink sm:inline`}>How</a>
            <a href="#pricing" className={`${monoLabel} hidden transition-colors hover:text-ink sm:inline`}>Pricing</a>
            <Link href="/app" className="hero-button inline-flex items-center gap-2.5 px-5" style={{ height: 40 }}>
              Generate <span className="hero-button-trail" aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </nav>

      <main id="main-content">

      {/* ── HERO — oversized caps, structural rules, demo grid ───────────── */}
      <section className="px-6 pt-14 pb-16 md:px-10 md:pt-20 md:pb-24">
        <div className="mx-auto max-w-6xl">

          <div className="rise flex items-center justify-between" style={{ animationDelay: '40ms' }}>
            <span className="eyebrow">Brand signatures, automated</span>
            <span className={`${monoLabel} hidden md:inline`}>Est. 2026 — Email identity</span>
          </div>

          <h1
            className="rise mt-9 font-display font-extrabold uppercase tracking-[-0.03em] text-ink"
            style={{ animationDelay: '110ms', fontSize: 'clamp(2.8rem, 11vw, 9rem)', lineHeight: 0.88 }}
          >
            Your mark<br />on every<br />email<span style={{ color: 'var(--color-accent)' }}>.</span>
          </h1>

          <div
            className="rise mt-10 grid grid-cols-1 gap-6 border-t pt-6 md:grid-cols-[1fr_auto] md:items-end"
            style={{ animationDelay: '180ms', borderColor: 'var(--color-ink)' }}
          >
            <p className="max-w-[46ch] text-lg leading-relaxed text-muted">
              Paste your company URL. Watch your logo, colors, and fonts become a
              polished signature in <span className="text-ink">nine seconds</span> — no
              template picker, no hex codes.
            </p>
            <span className={`${monoLabel} md:text-right`}>[ Validation demo ]</span>
          </div>

          {/* URL INPUT — sharp bar + flush ink button */}
          <form
            onSubmit={handleGenerate}
            className="rise mt-7 flex flex-col sm:flex-row"
            style={{ animationDelay: '250ms' }}
            noValidate
          >
            <div className="hero-input-row flex flex-1 items-center gap-3 px-5">
              <span className="select-none font-mono text-sm text-muted">https://</span>
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
              className="hero-button inline-flex items-center justify-center gap-3 px-8 disabled:opacity-50"
            >
              {brand.loading ? 'Reading…' : 'Generate'}
              {!brand.loading && <span className="hero-button-trail" aria-hidden>→</span>}
            </button>
          </form>

          {brand.loading && (
            <p className={`${monoLabel} mt-5 flex items-center gap-2`}>
              <span className="inline-block h-2 w-2 animate-pulse rounded-full" style={{ background: 'var(--color-accent)' }} />
              Reading your site…
            </p>
          )}
          {brand.note && !brand.loading && (
            <p className={`${monoLabel} mt-5`} role="status">{brand.note}</p>
          )}

          {/* LIVE PREVIEWS — strict 3-col grid of framed white cards */}
          <div className="mt-14">
            <div className="flex items-center justify-between border-t pb-4 pt-4" style={{ borderColor: 'var(--color-ink)' }}>
              <span className={monoLabel}>Live preview — three layouts</span>
              {!hasGenerated && <span className={monoLabel}>Example ↓ paste a URL</span>}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
          </div>

          {/* POST-GENERATION EMAIL CAPTURE */}
          {hasGenerated && !brand.loading && (
            <div className="mt-12 border-t pt-9" style={{ borderColor: 'var(--color-line)' }}>
              {wlDone ? (
                renderSegmentAsk(false)
              ) : (
                <form onSubmit={handleWaitlist} noValidate>
                  <p className={`${monoLabel} mb-3`}>
                    Like it? Save your kit — we&rsquo;ll notify you when Pro ships.
                  </p>
                  <div className="flex flex-col gap-0 sm:flex-row sm:max-w-xl">
                    <input
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={wlEmail}
                      onChange={(e) => setWlEmail(e.target.value)}
                      disabled={wlLoading}
                      suppressHydrationWarning
                      aria-label="Work email address"
                      className="h-12 flex-1 px-4 text-sm outline-none"
                      style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-ink)', color: 'var(--color-ink)' }}
                    />
                    <button
                      type="submit"
                      disabled={wlLoading}
                      className="hero-button inline-flex items-center justify-center gap-2.5 px-6 disabled:opacity-50"
                      style={{ height: 48 }}
                    >
                      {wlLoading ? 'Saving…' : 'Save my kit'}
                      {!wlLoading && <span className="hero-button-trail" aria-hidden>→</span>}
                    </button>
                  </div>
                  {wlError && <p className={`${monoLabel} mt-2`} role="alert">{wlError}</p>}
                </form>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── MARQUEE — black strip, bone mono, vermilion ticks ────────────── */}
      <div
        className="overflow-hidden border-y py-3"
        style={{ background: 'var(--color-ink)', borderColor: 'var(--color-ink)' }}
        aria-hidden
      >
        <div className="marquee">
          {[0, 1].map((copy) => (
            <div key={copy} className="marquee-track">
              {MARQUEE_ITEMS.map((t, i) => (
                <span key={`${copy}-${i}`} className="marquee-item">
                  {t}
                  <span className="marquee-star">✶</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS — tabular 4-step grid with hairline rules ───────── */}
      <section id="how" className="px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="sc-reveal flex items-end justify-between border-b pb-6" style={{ borderColor: 'var(--color-ink)' }}>
            <h2
              className="font-display font-extrabold uppercase tracking-[-0.02em] text-ink"
              style={{ fontSize: 'clamp(1.8rem, 5vw, 3.5rem)', lineHeight: 0.94 }}
            >
              From URL<br />to signature
            </h2>
            <span className={`${monoLabel} hidden md:inline`}>§ 01 — Process</span>
          </div>

          <div className="sc-stagger grid grid-cols-1 gap-px md:grid-cols-4" style={{ background: 'var(--color-line)' }}>
            {STEPS.map(s => (
              <div key={s.n} className="bg-paper p-7 md:p-8">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-medium" style={{ color: 'var(--color-accent)' }}>{s.n}</span>
                  <span className="font-mono text-[0.65rem] text-muted">/ 04</span>
                </div>
                <h3 className="mt-12 font-display text-xl font-bold tracking-tight text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BEFORE / AFTER — orthogonal split, hairline field rows ───────── */}
      <section className="px-6 py-24 md:px-10 md:py-32" style={{ background: 'var(--color-paper-deep)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="sc-reveal flex items-end justify-between border-b pb-6" style={{ borderColor: 'var(--color-ink)' }}>
            <h2
              className="font-display font-extrabold uppercase tracking-[-0.02em] text-ink"
              style={{ fontSize: 'clamp(1.8rem, 5vw, 3.5rem)', lineHeight: 0.94 }}
            >
              One URL.<br />Or fifteen fields.
            </h2>
            <span className={`${monoLabel} hidden md:inline`}>§ 02 — The difference</span>
          </div>

          <div className="sc-stagger mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* OLD WAY */}
            <div className="border bg-card p-7" style={{ borderColor: 'var(--color-line)' }}>
              <p className={`${monoLabel} mb-6`}>The old way — fill every field</p>
              <div className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
                {OLD_WAY_FIELDS.map(f => (
                  <div key={f} className="flex items-center gap-3 py-2">
                    <span className="w-28 shrink-0 truncate font-mono text-[0.68rem] text-muted">{f}</span>
                    <span className="h-6 flex-1 border" style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper)' }} />
                  </div>
                ))}
              </div>
              <p className={`${monoLabel} mt-6`}>Per employee. Every time.</p>
            </div>

            {/* WITH SIGNET */}
            <div className="border-2 bg-card p-7" style={{ borderColor: 'var(--color-ink)' }}>
              <p className="mb-6 font-mono text-[0.7rem] uppercase tracking-[0.16em]" style={{ color: 'var(--color-accent)' }}>
                With Signet — paste your URL
              </p>
              <div className="flex">
                <span className="flex flex-1 items-center gap-2 border px-3 py-2.5 font-mono text-[0.78rem] text-muted"
                  style={{ borderColor: 'var(--color-ink)', background: 'var(--color-paper)' }}>
                  https://yourcompany.com
                </span>
                <span className="flex items-center gap-1.5 px-4 py-2.5 font-mono text-[0.72rem] uppercase tracking-[0.1em]"
                  style={{ background: 'var(--color-accent)', color: '#fff' }}>
                  Go →
                </span>
              </div>
              <div className="mt-6 divide-y" style={{ borderColor: 'var(--color-line)' }}>
                <div className="flex items-center gap-3 py-2.5">
                  <span className="w-24 shrink-0 font-mono text-[0.68rem] text-muted">Logo</span>
                  <span className="font-mono text-[0.78rem] text-ink">✓ extracted</span>
                </div>
                <div className="flex items-center gap-3 py-2.5">
                  <span className="w-24 shrink-0 font-mono text-[0.68rem] text-muted">Colors</span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-4 w-4" style={{ background: '#1d4ed8' }} />
                    <span className="h-4 w-4" style={{ background: '#475569' }} />
                    <span className="ml-1 font-mono text-[0.78rem] text-ink">✓ extracted</span>
                  </span>
                </div>
                <div className="flex items-center gap-3 py-2.5">
                  <span className="w-24 shrink-0 font-mono text-[0.68rem] text-muted">Font</span>
                  <span className="font-mono text-[0.78rem] text-ink">✓ extracted</span>
                </div>
              </div>
              <p className="mt-6 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink">Done. In nine seconds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING — aligned 3-col, Pro framed in ink + vermilion bar ───── */}
      <section id="pricing" className="px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="sc-reveal flex items-end justify-between border-b pb-6" style={{ borderColor: 'var(--color-ink)' }}>
            <h2
              className="font-display font-extrabold uppercase tracking-[-0.02em] text-ink"
              style={{ fontSize: 'clamp(1.8rem, 5vw, 3.5rem)', lineHeight: 0.94 }}
            >
              Start free.<br />Scale when ready.
            </h2>
            <span className={`${monoLabel} hidden md:inline`}>§ 03 — Pricing</span>
          </div>

          <div className="sc-stagger mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`flex flex-col bg-card p-8 ${plan.highlight ? 'border-2' : 'border'}`}
                style={{ borderColor: plan.highlight ? 'var(--color-ink)' : 'var(--color-line)' }}
              >
                {plan.highlight && <div className="-mx-8 -mt-8 mb-7 h-1.5" style={{ background: 'var(--color-accent)' }} />}

                <div className="flex items-center justify-between">
                  <span className={monoLabel}>{plan.name}</span>
                  {plan.highlight && (
                    <span className="px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-[0.14em]" style={{ background: 'var(--color-accent)', color: '#fff' }}>
                      Popular
                    </span>
                  )}
                  {plan.soon && (
                    <span className="px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-[0.14em]" style={{ border: '1px solid var(--color-line)', color: 'var(--color-muted)' }}>
                      Soon
                    </span>
                  )}
                </div>

                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="font-display font-extrabold leading-none tracking-tight text-ink" style={{ fontSize: 'clamp(2.2rem, 4vw, 2.8rem)' }}>
                    {plan.price}
                  </span>
                  {plan.desc && <span className="font-mono text-xs text-muted">{plan.desc}</span>}
                </div>

                <ul className="mt-7 flex-1 space-y-3">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-muted">
                      <span className="mt-1 shrink-0 font-mono text-[0.7rem]" style={{ color: 'var(--color-accent)' }}>—</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.soon ? (
                  <a href={plan.href} onClick={() => track('pro_link_clicked')}
                    className="plan-cta-outline mt-8 flex items-center justify-center py-3.5 text-center text-[0.72rem]">
                    {plan.cta}
                  </a>
                ) : (
                  <Link href={plan.href} onClick={() => track('pro_link_clicked')}
                    className={`mt-8 flex items-center justify-center py-3.5 text-center text-[0.72rem] ${plan.highlight ? 'plan-cta-primary' : 'plan-cta-outline'}`}>
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA — inverted black block, deliberate editorial close ─── */}
      <section
        id="notify"
        className="px-6 py-28 md:px-10 md:py-36"
        style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
      >
        <div className="sc-reveal mx-auto max-w-4xl">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em]" style={{ color: 'var(--color-accent)' }}>
            ✶ Ship your signature
          </span>
          <h2
            className="mt-6 font-display font-extrabold uppercase tracking-[-0.03em]"
            style={{ fontSize: 'clamp(2.4rem, 8vw, 6rem)', lineHeight: 0.9, color: 'var(--color-paper)' }}
          >
            Your brand belongs<br />
            in every<span style={{ color: 'var(--color-accent)' }}> email.</span>
          </h2>

          <div className="mt-10 flex flex-col gap-6 border-t pt-8 md:flex-row md:items-center md:justify-between"
            style={{ borderColor: 'rgba(243,242,236,0.2)' }}>
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.16em]" style={{ color: 'rgba(243,242,236,0.7)' }}>
              Nine seconds · No credit card · No IT ticket
            </p>
            <Link
              href="/app"
              onClick={() => track('pro_link_clicked')}
              className="inline-flex items-center justify-center gap-3 px-8 font-mono text-[0.78rem] uppercase tracking-[0.12em] transition-colors"
              style={{ height: 64, background: 'var(--color-accent)', color: '#fff' }}
            >
              Generate yours free
              <span className="hero-button-trail" aria-hidden>→</span>
            </Link>
          </div>

          {/* WAITLIST */}
          <div className="mt-16 border-t pt-10" style={{ borderColor: 'rgba(243,242,236,0.2)' }}>
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.16em]" style={{ color: 'rgba(243,242,236,0.7)' }}>
              Want Pro or Team? Get notified at launch.
            </p>
            {wlDone ? (
              renderSegmentAsk(true)
            ) : (
              <form onSubmit={handleWaitlist} noValidate className="mt-4 flex flex-col sm:flex-row sm:max-w-xl">
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={wlEmail}
                  onChange={(e) => setWlEmail(e.target.value)}
                  disabled={wlLoading}
                  suppressHydrationWarning
                  aria-label="Work email address"
                  className="h-12 flex-1 bg-transparent px-4 text-sm outline-none"
                  style={{ border: '1.5px solid rgba(243,242,236,0.35)', color: 'var(--color-paper)' }}
                />
                <button
                  type="submit"
                  disabled={wlLoading}
                  className="inline-flex items-center justify-center gap-2.5 px-6 font-mono text-[0.72rem] uppercase tracking-[0.12em] disabled:opacity-50"
                  style={{ height: 48, background: 'var(--color-paper)', color: 'var(--color-ink)' }}
                >
                  {wlLoading ? 'Saving…' : 'Notify me'}
                  {!wlLoading && <span className="hero-button-trail" aria-hidden>→</span>}
                </button>
              </form>
            )}
            {wlError && <p className="mt-2 font-mono text-[0.7rem] uppercase tracking-[0.16em]" style={{ color: 'rgba(243,242,236,0.7)' }} role="alert">{wlError}</p>}
          </div>
        </div>
      </section>

      </main>

      <footer className="px-6 py-8 md:px-10" style={{ borderTop: '1px solid var(--color-line)' }}>
        <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size={22} />
            <span className="font-display font-extrabold text-ink">Signet</span>
          </Link>
          <p className={monoLabel}>No template picker · No hex codes · No IT ticket</p>
          <p className={monoLabel}>© 2026 Signet</p>
        </div>
      </footer>

    </div>
  );
}
