'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { useBrandKit, LAYOUTS } from './useBrandKit';
import { SignaturePreview } from './SignaturePreview';
import { BrandMark } from './Logo';
import { track, setPersonProperty } from './track';
import { encodeKitParam } from '@/lib/kit-codec';
import { joinWaitlist } from '@/lib/waitlist';
import { DEMO_BRAND_KIT, DEMO_FIELDS } from '@/lib/brand-kit-schema';
import { PressStage, type PressMode } from './landing/PressStage';
import { ProcessRail } from './landing/ProcessRail';
import { Registration } from './landing/Registration';
import { InkingLog, KitReceipt } from './landing/InkingLog';
import { SealedEnvelope } from './landing/SealedEnvelope';
import './landing/motion.css';

// Placeholder domains typed into the empty hero field: "any company works",
// said without a sentence of copy. Fictional on purpose.
const SAMPLE_DOMAINS = ['northwind.co', 'halcyon.studio', 'fernbank-legal.com', 'kiln.coffee'];

// Obvious non-URLs get a hint instead of a wasted request.
const urlHint = (v: string) =>
  v.includes('@') ? "That looks like an email. Try the part after the @."
  : !v.includes('.') ? 'Add the ending too, like .com or .io.'
  : '';


// Stripe Payment Link for the $99 concierge team setup. When unset, the Team
// tier stays in waitlist mode — nothing changes.
const CONCIERGE_URL = process.env.NEXT_PUBLIC_CONCIERGE_URL;

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    desc: 'forever',
    features: [
      'Signature built from your live site',
      '1 layout to copy instantly — Logo style',
      'All 3 layouts with a free email',
      'Full field & color customization',
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
      'Save unlimited brand kits',
      'CEO, Sales, Support — separate roles from one URL',
      'Short share links for your team',
      'Priority extraction',
    ],
    cta: 'Reserve my spot',
    href: '#notify',
    highlight: true,
    soon: false,
  },
  CONCIERGE_URL
    ? {
        name: 'Team',
        price: '$99',
        desc: 'one-time setup',
        features: [
          'We generate signatures for your whole team',
          'Built from one URL — everyone on brand',
          'Hands-on install help, every mail client',
          'Done this week, not this quarter',
        ],
        cta: 'Set up my team',
        href: CONCIERGE_URL,
        highlight: false,
        soon: false,
      }
    : {
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
    a: "No. The previews render the moment you arrive — no account, no credit card. Copying the logo layout is instant; dropping your email unlocks the other two layouts and gets you Pro/Team launch updates.",
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
    a: "Yes. Generate, customize, and copy the logo layout with no account, card, or watermark; a free email unlocks all three layouts. Pro adds saved brand kits and per-role signatures from one URL.",
  },
  {
    q: "Can I roll signatures out to my whole team?",
    a: CONCIERGE_URL
      ? "Team Setup is a $99 one-time concierge service: we generate on-brand signatures for your whole team from one URL and help you install them in every mail client — done this week."
      : "Team (coming soon) adds Google Workspace sync and one-click deployment across everyone at once. Join the waitlist to be notified at launch.",
  },
];

const TICKER = ['Zero brand drift', 'Under 10 seconds', 'No template picker', 'No hex codes', 'No IT ticket', 'Your live site is the source of truth'];
// One track must exceed the widest viewport for a seamless -50% loop; repeat
// enough to cover ultrawide (~2560px) displays.
const MARQUEE_ITEMS = Array.from({ length: 5 }, () => TICKER).flat();

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const root = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [navSolid,     setNavSolid]     = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [extractionKey, setExtractionKey] = useState(0);
  const [wlEmail,      setWlEmail]      = useState('');
  const [wlLoading,    setWlLoading]    = useState(false);
  const [wlDone,       setWlDone]       = useState(false);
  const [wlError,      setWlError]      = useState('');
  const [wlSegment,    setWlSegment]    = useState<'self' | 'team' | ''>('');
  const [focused,      setFocused]      = useState(false);
  const [hint,         setHint]         = useState('');
  const [placeholder,  setPlaceholder]  = useState('yourcompany.com');
  const [slide,        setSlide]        = useState(0);
  const formRef  = useRef<HTMLFormElement>(null);
  const pasteRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const pickSegment = (segment: 'self' | 'team') => {
    setWlSegment(segment);
    track('waitlist_segment', { segment });
    setPersonProperty({ waitlist_segment: segment });
  };

  const brand = useBrandKit({
    initialKit: DEMO_BRAND_KIT,
    initialFields: DEMO_FIELDS,
    initialFont: DEMO_BRAND_KIT.fontFamily,
  });

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    clearTimeout(pasteRef.current);
    const h = urlHint(brand.url.trim());
    setHint(h);
    if (h || !brand.url.trim()) return;
    track('url_submitted');
    setSubmitted(true);
    await brand.generate(e);
    setHasGenerated(true);
    setExtractionKey(k => k + 1);
  };

  const handleWaitlist = async (e: FormEvent) => {
    e.preventDefault();
    setWlLoading(true);
    setWlError('');
    const err = await joinWaitlist(wlEmail.trim());
    setWlLoading(false);
    if (err) return setWlError(err);
    setWlDone(true);
    track('waitlist_joined');
  };

  useEffect(() => { track('page_view'); }, []);

  // Types sample domains into the empty field until it is first focused.
  useEffect(() => {
    if (focused || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let d = 0, i = 0, dir = 1;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const w = SAMPLE_DOMAINS[d];
      i += dir;
      setPlaceholder(w.slice(0, i) || '\u200b');
      let wait = dir > 0 ? 70 : 30;
      if (i === w.length) { dir = -1; wait = 1600; }
      if (i === 0) { dir = 1; d = (d + 1) % SAMPLE_DOMAINS.length; wait = 300; }
      t = setTimeout(tick, wait);
    };
    t = setTimeout(tick, 900);
    return () => clearTimeout(t);
  }, [focused]);

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Crisp editorial reveals — slide-up + fade, staggered grids.
  // Registered only under no-preference; when reduced motion is requested the
  // animations simply never run, so .sc-reveal/.sc-stagger stay at their natural
  // opacity:1 (the hidden state lives only in gsap.from, not in CSS).
  // Hero grain parallax: GSAP animates the --grain-y CSS custom property on the
  // hero element from 0% → -25% as the user scrolls through it. The ::after
  // pseudo-element applies --grain-y to transform: translateY(), producing a
  // hardware-accelerated translate3d() that's smooth on iOS.
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

      // Hero grain parallax — GSAP animates the CSS custom property
      if (heroRef.current) {
        gsap.to(heroRef.current, {
          '--grain-y': '-25%',
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.3,
          },
        });
      }
    });
    return () => mm.revert();
  }, []);

  const monoLabel = 'font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted';

  // The Press: attract loop on load, replays with the visitor's domain while a
  // request runs (colours unknown yet, so neutral), rests on their real kit after.
  const liveDomain = brand.url.trim().replace(/\/.*$/, '');
  const host = (u: string) => u.replace(/^https?:\/\//i, '').replace(/^www\./, '').replace(/\/.*$/, '');
  const pressMode: PressMode = brand.loading ? 'live' : focused || hasGenerated ? 'frozen' : 'attract';
  const pressProps = brand.loading
    ? {
        domain: liveDomain,
        company: liveDomain.replace(/^www\./, '').split('.')[0].replace(/^./, (c) => c.toUpperCase()),
        primary: '#5E5A52',
        secondary: '#D8D6CC',
      }
    : hasGenerated && brand.source
      ? {
          domain: host(brand.siteUrl),
          company: brand.kit.companyName,
          primary: brand.kit.primaryColor,
          secondary: brand.kit.secondaryColor,
          logoUrl: brand.kit.logoUrl,
          font: brand.font,
        }
      : {};

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
            <a href="#how"     className={`${monoLabel} hidden transition-colors hover:text-ink sm:inline`}>How</a>
            <a href="#pricing" className={`${monoLabel} hidden transition-colors hover:text-ink sm:inline`}>Pricing</a>
            <a href="#faq"     className={`${monoLabel} hidden transition-colors hover:text-ink sm:inline`}>FAQ</a>
            <Link href="/app" className="hero-button inline-flex items-center gap-2.5 px-5" style={{ height: 40 }}>
              Generate <span className="hero-button-trail" aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </nav>

      <main id="main-content">

      {/* ── HERO — oversized caps, structural rules, demo grid ───────────── */}
      <section ref={heroRef} className="hero-grain px-6 pt-14 pb-16 md:px-10 md:pt-20 md:pb-24">
        <div className="mx-auto max-w-6xl">

          <div className="rise flex items-center justify-between" style={{ animationDelay: '40ms' }}>
            <span className="eyebrow">Brand-consistent email signatures</span>
            <span className={`${monoLabel} hidden md:inline`}>Gmail · Outlook · Apple Mail</span>
          </div>

          <div className="mt-9 grid grid-cols-1 gap-10 md:grid-cols-12 md:items-end">
            <h1
              className="rise font-display font-extrabold uppercase tracking-[-0.03em] text-ink md:col-span-7"
              style={{ animationDelay: '110ms', fontSize: 'clamp(2.6rem, 6.4vw, 5rem)', lineHeight: 0.88 }}
            >
              Your website<br />is the source<br />of truth<span style={{ color: 'var(--color-accent)' }}>.</span>
            </h1>

            {/* THE PRESS — below the form on mobile, beside the H1 on desktop */}
            <div className="rise order-last md:order-none md:col-span-5" style={{ animationDelay: '320ms' }}>
              <PressStage mode={pressMode} {...pressProps} />
            </div>

            <div className="md:col-span-12">
              <div
                className="rise grid grid-cols-1 gap-6 border-t pt-6 md:grid-cols-[1fr_auto] md:items-end"
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
                ref={formRef}
                onSubmit={handleGenerate}
                className="rise mt-7 flex flex-col sm:flex-row"
                style={{ animationDelay: '250ms' }}
                noValidate
              >
                <div className="hero-input-row flex flex-1 items-center gap-3 px-5">
                  <span className="select-none font-mono text-sm text-muted">https://</span>
                  <input
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    name="company-url"
                    spellCheck={false}
                    value={brand.url}
                    onChange={(e) => { setHint(''); brand.setUrl(e.target.value.replace(/^https?:\/\//i, '')); }}
                    onFocus={() => { setFocused(true); setPlaceholder('yourcompany.com'); }}
                    onKeyDown={() => clearTimeout(pasteRef.current)}
                    onPaste={() => {
                      clearTimeout(pasteRef.current);
                      pasteRef.current = setTimeout(() => formRef.current?.requestSubmit(), 400);
                    }}
                    placeholder={placeholder}
                    suppressHydrationWarning
                    aria-label="Company URL"
                    aria-describedby={hint ? 'url-hint' : undefined}
                    aria-invalid={hint ? true : undefined}
                    className="w-full bg-transparent py-3 text-lg text-ink outline-none placeholder:text-muted"
                  />
                </div>
                <button
                  id="hero-cta"
                  type="submit"
                  disabled={brand.loading}
                  className="hero-button inline-flex items-center justify-center gap-3 px-8 disabled:opacity-50"
                >
                  {brand.loading ? 'Reading…' : 'Sign'}
                  {!brand.loading && <span className="hero-button-trail" aria-hidden>→</span>}
                </button>
              </form>

              {hint && <p id="url-hint" className={`${monoLabel} mt-4`} role="alert">{hint}</p>}
              {brand.note && !brand.loading && (
                <p className={`${monoLabel} mt-5`} role="status">{brand.note}</p>
              )}
            </div>
          </div>

          {/* LIVE PREVIEWS — all three shown as previews; copy lives in /app */}
          <div className="mt-14">
            <div className="flex items-center justify-between border-t pb-4 pt-4" style={{ borderColor: 'var(--color-ink)' }}>
              <span className={monoLabel}>
                {hasGenerated ? 'Your signature — three layouts' : 'Preview — three layouts'}
              </span>
              {!(brand.loading && submitted) && (
                <span className={`${monoLabel} tabular-nums md:hidden`} aria-hidden>{slide + 1} / 3</span>
              )}
              {!hasGenerated && !submitted && <span className={`${monoLabel} hidden md:inline`}>Example ↓ paste your URL</span>}
            </div>

            {brand.loading && submitted ? (
              <InkingLog domain={liveDomain} />
            ) : (
              <>
                {hasGenerated && brand.source && (
                  <div className="mb-5"><KitReceipt kit={brand.kit} font={brand.font} /></div>
                )}
                {/* Remount on extraction for the staggered reveal. Mobile: snap-scroll rail. */}
                <div
                  key={extractionKey}
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    const w = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? el.clientWidth;
                    setSlide(Math.min(2, Math.round(el.scrollLeft / (w + 16))));
                  }}
                  className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0"
                >
                  {LAYOUTS.map(({ id, label: name, h }, i) => (
                    <div key={id} className="rise w-[86%] shrink-0 snap-start md:w-auto" style={{ animationDelay: `${i * 60}ms` }}>
                      <SignaturePreview
                        kit={brand.kit}
                        fields={brand.displayFields}
                        layout={id}
                        label={name}
                        height={h}
                        font={brand.font}
                        siteUrl={brand.siteUrl || undefined}
                        hideCopy
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* POST-GENERATION CTA — primary action: open in app (kit pre-loaded) */}
            {hasGenerated && !brand.loading && (
              <div className="mt-8 flex flex-col items-center gap-4 border-t pt-8" style={{ borderColor: 'var(--color-ink)' }}>
                <p className={monoLabel}>Your signature is ready. Copy it free in the app.</p>
                <a
                  href={`/app?kit=${encodeKitParam({ brandKit: brand.kit, contact: brand.fields, roles: brand.roles, font: brand.font })}`}
                  onClick={() => track('landing_open_in_app')}
                  className="hero-button press-shadow inline-flex items-center gap-2.5 px-10"
                  style={{ height: 56 }}
                >
                  Copy my signature — free
                  <span className="hero-button-trail" aria-hidden>→</span>
                </a>
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-muted">
                  1 layout free · No signup · All 3 with your email
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
                          inputMode="email"
                          autoComplete="email"
                          name="email"
                          spellCheck={false}
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

      {/* ── HOW IT WORKS — one drawn rail: paste · read · set · send ─────── */}
      <section id="how" className="px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="sc-reveal flex items-end justify-between border-b pb-6" style={{ borderColor: 'var(--color-ink)' }}>
            <h2
              className="font-display font-extrabold uppercase tracking-[-0.02em] text-ink"
              style={{ fontSize: 'clamp(1.8rem, 5vw, 3.5rem)', lineHeight: 0.94 }}
            >
              From URL<br />to signature
            </h2>
          </div>

          <div className="mt-12">
            <ProcessRail />
          </div>
        </div>
      </section>

      {/* ── REGISTRATION — the team drift problem, snapped into register ── */}
      <section className="px-6 py-24 md:px-10 md:py-32" style={{ background: 'var(--color-paper-deep)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="sc-reveal flex items-end justify-between border-b pb-6" style={{ borderColor: 'var(--color-ink)' }}>
            <h2
              className="font-display font-extrabold uppercase tracking-[-0.02em] text-ink"
              style={{ fontSize: 'clamp(1.8rem, 5vw, 3.5rem)', lineHeight: 0.94 }}
            >
              Brand drift<br />is the default.
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.6fr] md:items-center">
            <div className="flex flex-col gap-6">
              <p className="max-w-[40ch] text-lg leading-relaxed text-ink">
                Four people, four copies of the brand: an old logo, no logo, the wrong blue, plain
                black. Signet builds every signature from one URL, so the whole team prints in register.
              </p>
              <a
                href="#pricing"
                onClick={() => track('team_cta_clicked', { from: 'registration' })}
                className="press-shadow plan-cta-outline inline-flex w-fit items-center gap-2.5 px-6 py-3.5 text-[0.72rem]"
              >
                See team pricing <span aria-hidden>→</span>
              </a>
            </div>
            <Registration />
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

                {plan.soon || plan.href.startsWith('http') ? (
                  <a href={plan.href}
                    onClick={() => track(plan.name === 'Team' ? 'team_cta_clicked' : 'pro_link_clicked')}
                    className={`press-shadow mt-8 flex items-center justify-center py-3.5 text-center text-[0.72rem] ${plan.highlight ? 'plan-cta-primary' : 'plan-cta-outline'}`}>
                    {plan.cta}
                  </a>
                ) : (
                  <Link href={plan.href}
                    onClick={() => track(plan.name === 'Team' ? 'team_cta_clicked' : 'pro_link_clicked')}
                    className={`press-shadow mt-8 flex items-center justify-center py-3.5 text-center text-[0.72rem] ${plan.highlight ? 'plan-cta-primary' : 'plan-cta-outline'}`}>
                    {plan.cta}
                  </Link>
                )}

                {plan.name === 'Team' && CONCIERGE_URL && (
                  <p className="mt-3 text-center font-mono text-[0.62rem] text-muted">
                    After checkout, reply to the receipt email with your team list — name, role, email.
                  </p>
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
        <div className="on-ink sc-reveal mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
            <h2
              className="font-display font-extrabold uppercase tracking-[-0.03em]"
              style={{ fontSize: 'clamp(2.4rem, 7vw, 5rem)', lineHeight: 0.9, color: 'var(--color-paper)' }}
            >
              Stop guessing<br />
              your own<span style={{ color: 'var(--color-accent)' }}> brand.</span>
            </h2>
            <SealedEnvelope />
          </div>

          <div className="mt-10 flex flex-col gap-6 border-t pt-8 md:flex-row md:items-center md:justify-between"
            style={{ borderColor: 'rgba(243,242,236,0.2)' }}>
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.16em]" style={{ color: 'rgba(243,242,236,0.7)' }}>
              Extracted · Not guessed · No IT ticket
            </p>
            <Link
              href="/app"
              onClick={() => track('pro_link_clicked')}
              className="inline-flex items-center justify-center gap-3 px-8 font-mono text-[0.78rem] uppercase tracking-[0.12em] press-shadow"
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
                  inputMode="email"
                  autoComplete="email"
                  name="email"
                  spellCheck={false}
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
            {wlError && <p className="mt-2 font-mono text-[0.7rem] uppercase tracking-[0.16em]" style={{ color: 'var(--color-accent)' }} role="alert">✕ {wlError}</p>}
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
