'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useBrandKit, LAYOUTS, PRESETS } from './useBrandKit';
import { SignaturePreview } from './SignaturePreview';
import { InstallInstructions } from './InstallInstructions';
import { BrandMark } from './Logo';
import { track } from './track';
import { EMAIL_FONTS, toEmailSafeFont } from '@/lib/email-fonts';
import { brandKitSchema } from '@/lib/brand-kit-schema';
import { toEmailSafeFont as fontMatch } from '@/lib/email-fonts';
import { z } from 'zod';
import type { SignatureFields, ToggleableField, FieldConfidence } from '@/lib/types';
import type { BrandKit } from '@/lib/types';

// Only accept http(s) — blocks javascript:/data: in href sinks.
const httpUrl = z.string().url().refine((u) => /^https?:\/\//i.test(u), 'must be http(s)');
const shortStr = (max: number) => z.string().max(max).optional().default('');

const contactSchema = z.object({
  fullName:  shortStr(120),
  jobTitle:  shortStr(120),
  email:     z.string().email().max(254).optional().default(''),
  phone:     shortStr(40),
  website:   httpUrl.optional().default(''),
  linkedin:  httpUrl.optional().default(''),
  github:    httpUrl.optional().default(''),
  x:         shortStr(80),   // x.com handles aren't always full URLs in older extractions
  discord:   shortStr(120),
});

// Decode the ?kit= param written by the outreach script.
// Both brandKit and contact are validated through schemas — malformed or
// malicious payloads (javascript: URIs, oversized strings) are rejected here
// before they reach any sink in renderSignature. renderSignature also runs
// esc() + safeHref() as a second layer, but the boundary check is the right place.
function decodeKitParam(raw: string): { brandKit: BrandKit; fields: SignatureFields } | null {
  try {
    const json = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    const brandKit = brandKitSchema.parse(json.brandKit);
    const c = contactSchema.parse(json.contact ?? {});
    const fields: SignatureFields = {
      fullName: c.fullName, jobTitle: c.jobTitle,
      email: c.email, phone: c.phone, website: c.website,
      linkedin: c.linkedin, github: c.github, x: c.x, discord: c.discord,
    };
    return { brandKit, fields };
  } catch {
    return null; // malformed → fall back to live fetch
  }
}

type FieldDef = { key: keyof SignatureFields; label: string; type?: string; placeholder?: string };
const TABS: { id: string; label: string; fields: FieldDef[] }[] = [
  {
    id: 'details', label: 'Details',
    fields: [
      { key: 'fullName', label: 'Full name' },
      { key: 'jobTitle', label: 'Job title' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'phone', label: 'Phone' },
    ],
  },
  {
    id: 'links', label: 'Links',
    fields: [
      { key: 'website', label: 'Website', placeholder: 'company.com' },
      { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/…' },
      { key: 'github', label: 'GitHub', placeholder: 'github.com/…' },
      { key: 'x', label: 'X', placeholder: 'x.com/…' },
      { key: 'discord', label: 'Discord', placeholder: 'discord.gg/…' },
    ],
  },
];

const confidenceLabel = (c?: FieldConfidence): string | null => {
  if (!c) return null;
  switch (c) {
    case 'exact': return 'From site';
    case 'high': return 'From site';
    case 'medium': return 'Best guess';
    case 'low': return 'Default';
  }
};

// name + title always render; everything else is a visibility toggle.
const isToggleable = (k: keyof SignatureFields): k is ToggleableField =>
  k !== 'fullName' && k !== 'jobTitle';

const label = 'text-[0.68rem] uppercase tracking-[0.18em] text-muted';
const field =
  'w-full bg-transparent border-b border-line py-2 text-ink ' +
  'placeholder:text-muted focus:border-accent transition-colors';
const btn =
  'inline-flex items-center justify-center gap-2 px-6 py-3 font-mono text-[0.72rem] uppercase tracking-[0.12em] ' +
  'text-paper transition-colors disabled:opacity-50';

export default function SignatureDemo() {
  // Read params FIRST so we can pass preloaded kit to useBrandKit as initial state.
  const searchParams = useSearchParams();
  const fromParam = searchParams.get('from');
  const kitParam = searchParams.get('kit');
  const preloaded = kitParam ? decodeKitParam(kitParam) : null;

  const brand = useBrandKit({
    initialKit: preloaded?.brandKit,
    initialFields: preloaded?.fields,
    initialFont: preloaded ? fontMatch(preloaded.brandKit.fontFamily) : undefined,
    // If kit is preloaded we already have the result — mark siteUrl so extracted labels show.
    initialUrl: fromParam?.replace(/^https?:\/\//i, '') ?? '',
    initialSiteUrl: preloaded && fromParam ? fromParam : '',
  });

  const isUnlocked = process.env.NEXT_PUBLIC_SIGNET_COPY === '1';
  const isOutreach = !!fromParam;
  const extracted = !!brand.siteUrl;
  // Soft confidence: only Firecrawl's deterministic branding is trustworthy as-read.
  // Anything LLM-derived ('extract'/'vision') or degraded is a best guess the user
  // should sanity-check. Honest-degradation principle.
  const colorConfidence = !extracted
    ? 'Extracted · editable'
    : brand.source === 'firecrawl'
      ? 'Read from your site · editable'
      : 'Best guess · adjust below';
  const matchedFont = toEmailSafeFont(brand.kit.fontFamily);
  const brandFontName = brand.kit.fontFamily.split(',')[0].trim();
  const [activeTab, setActiveTab] = useState('details');
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');

  const tab = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  // If kit was NOT preloaded, auto-fetch it from the ?from= URL.
  // useRef guards against React strict-mode double-fire.
  const didAutoGenerate = useRef(false);
  useEffect(() => {
    if (fromParam && !preloaded && !didAutoGenerate.current) {
      didAutoGenerate.current = true;
      track('outreach_click', { url: fromParam });
      void brand.autoGenerate(fromParam, () => track('outreach_generated', { url: fromParam }));
    } else if (fromParam && preloaded) {
      // Kit was preloaded — no API call needed, track immediately.
      track('outreach_click', { url: fromParam, preloaded: true });
      track('outreach_generated', { url: fromParam, preloaded: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    track('page_view', '/app');
  }, []);

  const submitWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setSendErr('Enter a valid email address.');
      return;
    }
    setSending(true);
    setSendErr('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error('failed');
      setSent(true);
      track('waitlist_joined');
    } catch {
      setSendErr("Couldn't save your email — try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-50 border-b"
      style={{ background: 'rgba(243,242,236,0.86)', backdropFilter: 'blur(10px)', borderColor: 'var(--color-line)' }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark size={24} />
          <span className="font-display text-lg font-extrabold tracking-tight text-ink">Signet</span>
        </Link>
        <Link href="/" className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink">
          ← Home
        </Link>
      </div>
    </nav>
    <main className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10 md:py-24">
      {/* hero */}
      <header className="rise max-w-3xl" style={{ animationDelay: '40ms' }}>
        <span className="eyebrow">Email signature studio</span>
        <h1
          className="mt-7 font-display font-extrabold uppercase leading-[0.9] tracking-[-0.03em] text-ink"
          style={{ fontSize: 'clamp(2.6rem, 7vw, 5rem)' }}
        >
          Your signature,<br />perfectly <span style={{ color: 'var(--color-accent)', whiteSpace: 'nowrap' }}>on-brand.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Paste your website. We read your logo, your colors, and your typeface, and
          build a signature that looks like your design team made it — in
          <span className="text-ink"> ten seconds</span>.
        </p>
      </header>

      {/* url input */}
      <form
        onSubmit={(e) => { track('url_submitted'); void brand.generate(e); }}
        className="rise mt-10 flex max-w-2xl flex-col sm:flex-row"
        style={{ animationDelay: '140ms' }}
      >
        <div className="hero-input-row flex flex-1 items-center gap-3 px-5">
          <span className="select-none font-mono text-sm text-muted">https://</span>
          <input
            value={brand.url}
            onChange={(e) => brand.setUrl(e.target.value.replace(/^https?:\/\//i, ''))}
            placeholder="yourcompany.com"
            suppressHydrationWarning
            aria-label="Company URL"
            className="w-full bg-transparent py-3 text-lg text-ink outline-none placeholder:text-muted"
          />
        </div>
        <button disabled={brand.loading} className="hero-button inline-flex items-center justify-center gap-2.5 px-8 disabled:opacity-50">
          {brand.loading ? <span className="loading-pulse">Reading site</span> : 'Generate'}
          {!brand.loading && <span className="hero-button-trail" aria-hidden>→</span>}
        </button>
      </form>
      {brand.note && <p className="mt-3 text-sm text-muted" role="status">{brand.note}</p>}

      {/* divider */}
      <div
        className="rise mt-16 flex items-center gap-4"
        style={{ animationDelay: '240ms' }}
      >
        <span className={label}>Live preview</span>
        <span className="h-px flex-1 bg-line" />
        <span className={`${label} hidden sm:inline`}>edit any field</span>
      </div>

      {/* role presets — flip the visibility toggles for a profession in one click */}
      <div className="rise mt-8 flex flex-wrap items-center gap-2" style={{ animationDelay: '280ms' }}>
        <span className={`${label} mr-1`}>Role preset</span>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => { brand.applyPreset(p.show); track('preset_applied', p.name); }}
            className="border border-line px-3 py-1 text-xs text-muted transition-colors hover:border-ink hover:text-ink"
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* tabs */}
      <div className="rise mt-6 flex gap-1 border-b border-line" style={{ animationDelay: '300ms' }} role="tablist" aria-label="Signature fields">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => setActiveTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.14em] transition-colors ${
              activeTab === t.id ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* active-tab fields, each toggleable field carries a Shown/Hidden switch */}
      <div key={activeTab} className="tab-content mt-6 grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
        {tab.fields.map((f) => {
          const toggleable = isToggleable(f.key);
          const visible = toggleable ? brand.visibility[f.key as ToggleableField] : true;
          return (
            <label key={f.key} className="block">
              <span className="flex items-center justify-between">
                <span className={label}>{f.label}</span>
                {toggleable && (
                  <button
                    type="button"
                    onClick={() => brand.toggleField(f.key as ToggleableField)}
                    aria-pressed={visible}
                    aria-label={`${visible ? 'Hide' : 'Show'} ${f.label} in signature`}
                    className="flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
                  >
                    <span
                      aria-hidden
                      className="inline-block h-2.5 w-2.5 border border-ink"
                      style={{ background: visible ? 'var(--color-ink)' : 'transparent' }}
                    />
                    {visible ? 'Shown' : 'Hidden'}
                  </button>
                )}
              </span>
              <input
                type={f.type ?? 'text'}
                value={brand.fields[f.key]}
                onChange={brand.setField(f.key)}
                placeholder={f.placeholder}
                suppressHydrationWarning
                className={`${field} mt-1 ${toggleable && !visible ? 'opacity-40' : ''}`}
              />
            </label>
          );
        })}
      </div>

      {/* style: font + colors (brand-level, not per-tab) */}
      <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-6">
        {/* font picker spans full width */}
        <div className="col-span-full">
          <span className={label}>Font</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {EMAIL_FONTS.map((f) => {
              const matched = extracted && f.value === matchedFont;
              return (
                <button
                  key={f.value}
                  onClick={() => brand.setFont(f.value)}
                  aria-pressed={brand.font === f.value}
                  style={{ fontFamily: f.value }}
                  className={`font-btn flex items-center gap-1.5 border px-3 py-1.5 text-sm transition-colors ${
                    brand.font === f.value
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line text-muted hover:border-ink hover:text-ink'
                  }`}
                >
                  {matched && (
                    <span aria-hidden className="inline-block h-1.5 w-1.5" style={{ background: 'var(--color-accent)' }} />
                  )}
                  {f.label}
                  {matched && <span className="sr-only"> (closest match to your brand font)</span>}
                </button>
              );
            })}
          </div>
          {extracted && (
            <span className="mt-2 block font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted">
              Pre-selected — closest email-safe match to {brandFontName}
              {brand.confidence && <span> · {confidenceLabel(brand.confidence.fontFamily)}</span>}
            </span>
          )}
        </div>
        {/* brand colors — extracted defaults, editable. Each swatch opens the native
            color picker (which includes hex entry); the hex label tracks it live. */}
        <div className="col-span-full">
          <span className={label}>Brand colors</span>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            {([['Text', 'ink', 'primaryColor' as const], ['Accent', 'accent', 'secondaryColor' as const]] as const).map(([roleLabel, key, confKey]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2 border border-line px-3 py-1.5 transition-colors">
                <span className="relative inline-flex h-4 w-4 border border-line" style={{ background: brand.roles[key], transition: 'background 0.2s var(--ease-fluid, ease)' }}>
                  <input
                    type="color"
                    value={brand.roles[key]}
                    onChange={(e) => brand.setRole(key)(e.target.value)}
                    aria-label={`${roleLabel} color`}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </span>
                <span key={brand.roles[key]} className="font-mono text-xs text-ink">{brand.roles[key].toUpperCase()}</span>
                <span className="text-[0.62rem] uppercase tracking-[0.16em] text-muted">{roleLabel}</span>
              </label>
            ))}
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted">
              {brand.confidence
                ? `${confidenceLabel(brand.confidence.primaryColor)} / ${confidenceLabel(brand.confidence.secondaryColor)}`
                : colorConfidence}
            </span>
          </div>
        </div>
        {/* logo — extracted, editable. URL only: email clients strip data-URI images,
            so a hosted URL is the correct input (and we have no upload storage). */}
        <div className="col-span-full">
          <span className={label}>Logo URL</span>
          <div className="mt-2 flex items-center gap-3">
            {brand.kit.logoUrl && (
              <img src={brand.kit.logoUrl} alt="" className="h-8 max-w-[84px] shrink-0 border border-line object-contain" />
            )}
            <input
              type="url"
              value={brand.kit.logoUrl}
              onChange={(e) => brand.setLogoUrl(e.target.value)}
              placeholder="https://…/logo.png"
              suppressHydrationWarning
              className={field}
            />
          </div>
          {brand.confidence && extracted && (
            <span className="mt-1 block font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted">
              {confidenceLabel(brand.confidence.logoUrl)}
            </span>
          )}
        </div>
      </div>

      {/* preview cards — show skeleton during initial extraction, real cards once loaded */}
      <div className="rise mt-10 space-y-5" style={{ animationDelay: '380ms' }}>
        {brand.loading && !brand.siteUrl ? (
          <>
            {/* Primary skeleton — wide layout */}
            <div className="skeleton-card mx-auto w-full max-w-2xl">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <div className="skeleton-line skeleton-line--med" />
                <div className="skeleton-line skeleton-line--short" style={{ width: '54px' }} />
              </div>
              <div className="flex items-center gap-4 p-4">
                <div className="h-10 w-10 shrink-0" style={{ background: 'var(--color-line)', animation: 'skeleton-shimmer 1.6s var(--ease-fluid) infinite' }} />
                <div className="flex flex-1 flex-col gap-2.5">
                  <div className="skeleton-line skeleton-line--short" />
                  <div className="skeleton-line skeleton-line--med" />
                  <div className="skeleton-line skeleton-line--long" />
                </div>
              </div>
            </div>
            {/* Secondary skeletons — smaller side-by-side */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {[1, 2].map((i) => (
                <div key={i} className="skeleton-card">
                  <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <div className="skeleton-line skeleton-line--short" />
                    <div className="skeleton-line" style={{ width: '44px' }} />
                  </div>
                  <div className="flex flex-col gap-2.5 p-4">
                    <div className="skeleton-line skeleton-line--short" />
                    <div className="skeleton-line skeleton-line--med" />
                    <div className="skeleton-line skeleton-line--long" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {LAYOUTS.filter((l) => l.id === 'logo').map(({ id, label: name, h }) => (
              <div key={id} className="mx-auto w-full max-w-2xl">
                <SignaturePreview
                  kit={brand.kit}
                  fields={brand.displayFields}
                  layout={id}
                  label={name}
                  height={h}
                  font={brand.font}
                  siteUrl={brand.siteUrl || undefined}
                  roles={brand.roles}
                  proHref="/#notify"
                />
              </div>
            ))}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {LAYOUTS.filter((l) => l.id !== 'logo').map(({ id, label: name, h }) => (
                <SignaturePreview
                  key={id}
                  kit={brand.kit}
                  fields={brand.displayFields}
                  layout={id}
                  label={name}
                  height={h}
                  font={brand.font}
                  siteUrl={brand.siteUrl || undefined}
                  roles={brand.roles}
                  proHref="/#notify"
                  locked={!isUnlocked}
                />
              ))}
            </div>
            {(isOutreach || !isUnlocked) && (
              <p className="text-center font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted">
                1 of 3 layouts · <a href="/#notify" className="text-ink underline-offset-2 hover:underline">Join waitlist</a> to unlock all
              </p>
            )}
          </>
        )}
      </div>

      {/* copy hint + install guide — featured layout is free to copy */}
      <p className="mt-4 text-[0.72rem] text-muted">
        Click <span className="text-ink">Copy</span> on the layout above, then drop it into your mail client:
      </p>
      <InstallInstructions />

      {/* email CTA */}
      <section
        className="rise mt-20 border-t border-line pt-10"
        style={{ animationDelay: '460ms' }}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md">
            <h2 className="font-display text-2xl text-ink md:text-3xl">
              Want this live for your whole team?
            </h2>
            <p className="mt-2 text-muted">
              One sign-in. Every teammate&rsquo;s signature deployed in about two minutes.
            </p>
          </div>
          {sent ? (
            <p className="text-accent-deep" role="status">Thanks — we&rsquo;ll be in touch about team deploy.</p>
          ) : (
            <form onSubmit={submitWaitlist} noValidate className="w-full max-w-sm">
              <div className="flex items-end gap-3">
                <label className="flex-1">
                  <span className={label}>Work email</span>
                  <input
                    type="email"
                    required
                    placeholder="you@work.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={sending}
                    suppressHydrationWarning
                    aria-label="Work email address"
                    className={`${field} mt-1`}
                  />
                </label>
                <button disabled={sending} className={`${btn} bg-accent hover:bg-accent-deep disabled:opacity-50`}>
                  {sending ? 'Saving…' : 'Notify me'}
                </button>
              </div>
              {sendErr && <p className="mt-2 text-sm text-accent-deep" role="alert">{sendErr}</p>}
            </form>
          )}
        </div>
      </section>

      <footer className="mt-16 text-[0.68rem] uppercase tracking-[0.18em] text-muted">
        No template picker · No IT ticket · No filling forms
      </footer>
    </main>
    </>
  );
}
