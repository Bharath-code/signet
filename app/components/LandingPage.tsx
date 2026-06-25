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

// Encode extracted kit + fields into a base64 URL param for the /app handoff.
// Compatible with the decodeKitParam() Buffer.from decode in SignatureDemo.
function encodeKit(kit: BrandKit, fields: SignatureFields): string {
  const json = JSON.stringify({ brandKit: kit, contact: fields });
  const bytes = new TextEncoder().encode(json);
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  return btoa(binary);
}

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
  website: 'acmecorp.com',
  linkedin: 'https://linkedin.com/in/alexchen',
  github: '',
  x: '',
  discord: '',
};

const STEPS = [
  { n: '01', title: 'Paste your URL',  body: 'Drop in your company website. No setup, no credentials, no login.' },
  { n: '02', title: 'Brand extracted', body: 'Logo, colors, and fonts — read directly from your live site in under 10 seconds.' },
  { n: '03', title: 'Customize',       body: 'Toggle fields on or off — LinkedIn, phone, X, GitHub. Edit colors, font, logo. Role presets (Sales, Founder, Engineer) flip the right fields in one click.' },
  { n: '04', title: 'Install',         body: 'Copy HTML → paste into Gmail, Outlook, or Apple Mail signature settings. Live in under a minute.' },
];


const PLANS = [
  {
    name: 'Free',
    price: '$0',
    desc: 'forever',
    features: [
      'Signature built from your live site',
      '1 layout to copy — Logo style',
      'Full field & color customization',
      'Small "Made with Signet" credit',
    ],
    cta: 'Generate yours',
    href: '/app',
    highlight: false,
    soon: false,
  },
  {
    name: 'Pro',
    price: '$12',
    desc: '/ month',
    features: [
      'All 3 layouts — Logo, Text, Minimal',
      'Save unlimited brand kits',
      'CEO, Sales, Support — separate roles from one URL',
      'No "Made with Signet" footer',
      'Priority extraction',
    ],
    cta: 'Reserve my spot',
    href: '#notify',
    highlight: true,
    soon: false,
  },
  {
    name: 'Team',
    price: 'Soon',
    desc: '',
    features: [
      'Everything in Pro',
      'Google Workspace sync',
      'One-click deploy to your whole team',
      'Brand admin controls',
      'New-hire auto-setup',
    ],
    cta: 'Join the waitlist',
    href: '#notify',
    highlight: false,
    soon: true,
  },
];

// Single source of truth — drives both the rendered <details> list and the
// FAQPage JSON-LD, so structured data can never drift from visible content.
const FAQS = [
  {
    q: "How does Signet build my signature?",
    a: "Paste your company URL. Signet reads your logo, colors, and fonts straight from your live site and renders a finished signature — no template picker, no hex codes, no manual entry.",
  },
  {
    q: "Do I need to sign up or enter a card?",
    a: "No. The previews render the moment you arrive — no account, no credit card. You only leave an email if you want to be notified when Pro or Team launches.",
  },
  {
    q: "Which email clients does it work with?",
    a: "The output is table-based HTML with inline styles, built to render correctly in Gmail, Outlook, and Apple Mail. Copy the HTML and paste it into your client's signature settings.",
  },
  {
    q: "Can I customize what appears in the signature?",
    a: "Yes — after extraction, you control every field. Toggle LinkedIn, phone, X, GitHub, Discord, and email on or off. Edit your name, title, colors, font, and logo URL. Role presets (Sales, Engineer, Founder, Creator) flip the right fields in one click.",
  },
  {
    q: "What if it can't read my site perfectly?",
    a: "Signet keeps what it finds — your real logo and company name — and fills the rest with editable approximations, so you always get a working signature you can fine-tune rather than an error.",
  },
  {
    q: "Is it really free?",
    a: "Yes. The Free plan lets you generate, customize, and copy one layout (the logo layout) with a small \"Made with Signet\" footer — no account, no credit card. Pro removes the footer, unlocks all three layouts, and lets you save unlimited brand kits.",
  },
  {
    q: "Can I roll signatures out to my whole team?",
    a: "Team (coming soon) adds Google Workspace sync and one-click deployment across everyone at once. Join the waitlist to be notified at launch.",
  },
];

const TICKER = ['Zero brand drift', 'Under 10 seconds', 'No template picker', 'No hex codes', 'No IT ticket', 'Your live site is the source of truth'];
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wlEmail.trim())) {
      setWlError('Enter a valid email address.');
      return;
    }
    setWlLoading(true);
    setWlError('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: wlEmail.trim() }),
      });
      if (!res.ok) throw new Error('failed');
      setWlDone(true);
      track('waitlist_joined');
    } catch {
      setWlError("Couldn't save your email — try again.");
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
  // Registered only under no-preference; when reduced motion is requested the
  // animations simply never run, so .sc-reveal/.sc-stagger stay at their natural
  // opacity:1 (the hidden state lives only in gsap.from, not in CSS).
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
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
    });
    return () => mm.revert();
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
          <div className="flex items-center gap-4 sm:gap-7">
            <a href="#how"     className={`${monoLabel} transition-colors hover:text-ink`}>How</a>
            <a href="#pricing" className={`${monoLabel} transition-colors hover:text-ink`}>Pricing</a>
            <a href="#faq"     className={`${monoLabel} transition-colors hover:text-ink`}>FAQ</a>
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
            <span className="eyebrow">Brand-consistent email signatures</span>
            <span className={`${monoLabel} hidden md:inline`}>Gmail · Outlook · Apple Mail</span>
          </div>

          <h1
            className="rise mt-9 font-display font-extrabold uppercase tracking-[-0.03em] text-ink"
            style={{ animationDelay: '110ms', fontSize: 'clamp(2.8rem, 9vw, 6rem)', lineHeight: 0.88 }}
          >
            Your website<br />is the source<br />of truth<span style={{ color: 'var(--color-accent)' }}>.</span>
          </h1>

          <div
            className="rise mt-10 grid grid-cols-1 gap-6 border-t pt-6 md:grid-cols-[1fr_auto] md:items-end"
            style={{ animationDelay: '180ms', borderColor: 'var(--color-ink)' }}
          >
            <p className="max-w-[46ch] text-lg leading-relaxed text-muted">
              Your team sends thousands of emails a day. Half have the wrong logo. Signet reads
              your live site — logo, colors, fonts — and builds every signature from the same
              source. No template picker. No hex codes. No <span className="text-ink">drift</span>.
            </p>
            <span className={`${monoLabel} md:text-right`}>Free · No signup</span>
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

          {/* LIVE PREVIEWS — all three shown as previews; copy lives in /app */}
          <div className="mt-14">
            <div className="flex items-center justify-between border-t pb-4 pt-4" style={{ borderColor: 'var(--color-ink)' }}>
              <span className={monoLabel}>
                {hasGenerated ? 'Your signature — three layouts' : 'Preview — three layouts'}
              </span>
              {!hasGenerated && <span className={monoLabel}>Example ↓ paste your URL</span>}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {LAYOUTS.map(({ id, label: name, h }) => (
                <SignaturePreview
                  key={id}
                  kit={brand.kit}
                  fields={brand.displayFields}
                  layout={id}
                  label={name}
                  height={h}
                  font={brand.font}
                  siteUrl={brand.siteUrl || undefined}
                  proHref="#notify"
                  hideCopy
                />
              ))}
            </div>

            {/* POST-GENERATION CTA — primary action: open in app (kit pre-loaded) */}
            {hasGenerated && !brand.loading && (
              <div className="mt-8 flex flex-col items-center gap-4 border-t pt-8" style={{ borderColor: 'var(--color-ink)' }}>
                <p className={monoLabel}>Your signature is ready. Copy it free in the app.</p>
                <a
                  href={`/app?kit=${encodeKit(brand.kit, brand.fields)}`}
                  onClick={() => track('landing_open_in_app')}
                  className="hero-button inline-flex items-center gap-2.5 px-10"
                  style={{ height: 56 }}
                >
                  Copy my signature — free
                  <span className="hero-button-trail" aria-hidden>→</span>
                </a>
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-muted">
                  1 layout free · No signup · 2 more with Pro
                </p>

                {/* SECONDARY: waitlist */}
                <div className="mt-4 w-full max-w-xl border-t pt-6" style={{ borderColor: 'var(--color-line)' }}>
                  {wlDone ? (
                    renderSegmentAsk(false)
                  ) : (
                    <form onSubmit={handleWaitlist} noValidate>
                      <p className={`${monoLabel} mb-3`}>
                        Want Pro? We&rsquo;ll notify you at launch.
                      </p>
                      <div className="flex flex-col gap-0 sm:flex-row">
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
                          {wlLoading ? 'Saving…' : 'Notify me'}
                          {!wlLoading && <span className="hero-button-trail" aria-hidden>→</span>}
                        </button>
                      </div>
                      {wlError && <p className={`${monoLabel} mt-2`} role="alert">{wlError}</p>}
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
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

      {/* ── BEFORE / AFTER — the brand drift problem vs. extraction ─────── */}
      <section className="px-6 py-24 md:px-10 md:py-32" style={{ background: 'var(--color-paper-deep)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="sc-reveal flex items-end justify-between border-b pb-6" style={{ borderColor: 'var(--color-ink)' }}>
            <h2
              className="font-display font-extrabold uppercase tracking-[-0.02em] text-ink"
              style={{ fontSize: 'clamp(1.8rem, 5vw, 3.5rem)', lineHeight: 0.94 }}
            >
              Brand drift<br />is the default.
            </h2>
            <span className={`${monoLabel} hidden md:inline`}>§ 02 — The problem</span>
          </div>

          <div className="sc-stagger mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* BRAND DRIFT — show the actual team inconsistency problem */}
            <div className="border bg-card p-7" style={{ borderColor: 'var(--color-line)' }}>
              <p className={`${monoLabel} mb-6`}>Every template tool — your team right now</p>
              <div className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
                {[
                  { person: 'CEO',        logo: 'Old logo (2022)', color: '#1a56db', colorNote: 'last rebrand' },
                  { person: 'Sales lead', logo: 'No logo',         color: '#1e40af', colorNote: 'close enough?' },
                  { person: 'Engineer',   logo: 'Current logo',    color: '#2563eb', colorNote: 'different shade' },
                  { person: 'Support',    logo: 'No logo',         color: '#000000', colorNote: 'just black' },
                ].map(row => (
                  <div key={row.person} className="grid grid-cols-3 gap-2 py-2.5 text-[0.72rem]">
                    <span className="font-mono text-muted">{row.person}</span>
                    <span className="text-muted">{row.logo}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 shrink-0 border border-line" style={{ background: row.color }} />
                      <span className="font-mono text-[0.64rem] text-muted">{row.colorNote}</span>
                    </span>
                  </div>
                ))}
              </div>
              <p className={`${monoLabel} mt-6`} style={{ color: 'var(--color-accent)' }}>
                Four employees. Four different brands.
              </p>
            </div>

            {/* WITH SIGNET — source of truth extraction */}
            <div className="border-2 bg-card p-7" style={{ borderColor: 'var(--color-ink)' }}>
              <p className="mb-6 font-mono text-[0.7rem] uppercase tracking-[0.16em]" style={{ color: 'var(--color-accent)' }}>
                With Signet — one URL, everyone consistent
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
                  <span className="w-28 shrink-0 font-mono text-[0.68rem] text-muted">Logo</span>
                  <span className="font-mono text-[0.78rem] text-ink">Current · from your live site</span>
                </div>
                <div className="flex items-center gap-3 py-2.5">
                  <span className="w-28 shrink-0 font-mono text-[0.68rem] text-muted">Brand color</span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-4 w-4" style={{ background: '#1d4ed8' }} />
                    <span className="ml-1 font-mono text-[0.78rem] text-ink">Exact — read from CSS</span>
                  </span>
                </div>
                <div className="flex items-center gap-3 py-2.5">
                  <span className="w-28 shrink-0 font-mono text-[0.68rem] text-muted">Font</span>
                  <span className="font-mono text-[0.78rem] text-ink">Matched to email-safe equiv.</span>
                </div>
                <div className="flex items-center gap-3 py-2.5">
                  <span className="w-28 shrink-0 font-mono text-[0.68rem] text-muted">Result</span>
                  <span className="font-mono text-[0.78rem] text-ink">CEO, sales, support — all identical.</span>
                </div>
              </div>
              <p className="mt-6 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink">No discipline required. Brand-correct by default.</p>
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
              No IT team<br />required.
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
                    <span className="px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-[0.14em]" style={{ background: 'var(--color-accent)', color: '#fff' }}>
                      Popular
                    </span>
                  )}
                  {plan.soon && (
                    <span className="px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-[0.14em]" style={{ border: '1px solid var(--color-line)', color: 'var(--color-muted)' }}>
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

      {/* ── FAQ — native <details>, content stays in the DOM for crawlers ── */}
      <section id="faq" className="px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-4xl">
          <div className="sc-reveal flex items-end justify-between border-b pb-6" style={{ borderColor: 'var(--color-ink)' }}>
            <h2
              className="font-display font-extrabold uppercase tracking-[-0.02em] text-ink"
              style={{ fontSize: 'clamp(1.8rem, 5vw, 3.5rem)', lineHeight: 0.94 }}
            >
              Questions,<br />answered
            </h2>
            <span className={`${monoLabel} hidden md:inline`}>§ 04 — FAQ</span>
          </div>

          <div className="sc-stagger mt-4">
            {FAQS.map((f, i) => (
              <details key={f.q} className="faq-item border-b" style={{ borderColor: 'var(--color-line)' }}>
                <summary className="flex cursor-pointer items-start gap-4 py-6">
                  <span className="mt-1.5 shrink-0 font-mono text-[0.7rem] text-muted">{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1 font-display text-lg font-bold tracking-tight text-ink md:text-xl">{f.q}</span>
                  <span className="faq-marker mt-1 shrink-0 font-mono text-xl leading-none text-ink" aria-hidden>+</span>
                </summary>
                <p className="max-w-[62ch] pb-6 pl-10 text-sm leading-relaxed text-muted md:text-base">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: FAQS.map(f => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            }),
          }}
        />
      </section>

      {/* ── FINAL CTA — inverted black block, deliberate editorial close ─── */}
      <section
        id="notify"
        className="px-6 py-28 md:px-10 md:py-36"
        style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
      >
        <div className="sc-reveal mx-auto max-w-4xl">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em]" style={{ color: 'var(--color-accent)' }}>
            ✶ Brand compliance without IT
          </span>
          <h2
            className="mt-6 font-display font-extrabold uppercase tracking-[-0.03em]"
            style={{ fontSize: 'clamp(2.4rem, 8vw, 6rem)', lineHeight: 0.9, color: 'var(--color-paper)' }}
          >
            Stop guessing<br />
            your own<span style={{ color: 'var(--color-accent)' }}> brand.</span>
          </h2>

          <div className="mt-10 flex flex-col gap-6 border-t pt-8 md:flex-row md:items-center md:justify-between"
            style={{ borderColor: 'rgba(243,242,236,0.2)' }}>
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.16em]" style={{ color: 'rgba(243,242,236,0.7)' }}>
              Extracted · Not guessed · No IT ticket
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
