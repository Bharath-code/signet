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
import { toEmailSafeFont as fontMatch } from '@/lib/email-fonts';
import { encodeKitParam, decodeKitParam } from '@/lib/kit-codec';
import type { Roles } from '@/lib/render-signature';
import type { SignatureFields, ToggleableField, FieldConfidence } from '@/lib/types';
import type { BrandKit } from '@/lib/types';

// Encode brand kit into a shareable URL. There is no server-side store, so the
// URL is the only state: anything not encoded here is lost when the recipient
// opens the link in another browser.
// `contact` is opt-in. The team link omits it (each teammate fills in their own
// name/title/email); the outreach link includes it, so a lead opens the exact
// signature that was built for them. roles + font always ride along — they hold
// the user's colour/font edits and live outside BrandKit.
// Same ?kit= param the outreach script writes; kit-codec validates on the way in.
// ponytail: layout choice and per-field Shown/Hidden toggles are not encoded;
// add them to kit-codec if a recipient ever reports losing those.
// Always /signature: a teammate has the kit already, so they need the editor,
// not the URL box. Keeping them off /app means a team rollout costs no credits.
// `from` carries the site the kit was read from. It drives the "extracted"
// labels and the paid CTA on the far side, so a copied link behaves like an
// outreach link instead of looking like an unverified demo kit.
function makeShareUrl(
  kit: BrandKit,
  roles: Roles,
  font: string,
  siteUrl: string,
  contact?: Partial<SignatureFields>,
): string {
  const from = siteUrl ? `from=${encodeURIComponent(siteUrl)}&` : '';
  return `${window.location.origin}/signature?${from}kit=${encodeKitParam({ brandKit: kit, contact, roles, font })}`;
}

type FieldDef = { key: keyof SignatureFields; label: string; type?: string; placeholder?: string };
const TABS: { id: string; label: string; fields: FieldDef[] }[] = [
  {
    id: 'details', label: 'Details',
    fields: [
      { key: 'fullName', label: 'Full name' },
      { key: 'jobTitle', label: 'Job title' },
      { key: 'ctaText', label: 'Button text', placeholder: 'Visit website →' },
      { key: 'ctaUrl', label: 'Button link', placeholder: 'calendly.com/you/30min' },
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
// ctaText/ctaUrl are also excluded — always editable, not show/hide toggles.
const isToggleable = (k: keyof SignatureFields): k is ToggleableField =>
  k !== 'fullName' && k !== 'jobTitle' && k !== 'ctaText' && k !== 'ctaUrl';

const label = 'font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted';
const field =
  'w-full bg-transparent border-b border-line py-2 text-ink ' +
  'placeholder:text-muted focus:border-accent transition-colors';
// No baked-in text color: callers that share this background (accent) also share
// text-paper explicitly, so a conditional text-color override never has to fight
// a class already in `btn` for specificity (Tailwind doesn't respect string order).
const btn =
  'inline-flex items-center justify-center gap-2 px-6 py-3 font-mono text-[0.72rem] uppercase tracking-[0.12em] ' +
  'transition-colors disabled:opacity-50';

// 'studio' = /app, the self-serve product: paste a URL, we scrape it.
// 'concierge' = /signature, the outreach landing page: the kit arrives in ?kit=,
// so the page has no scrape capability at all and costs zero credits to open.
// The paid CTA leads; the waitlist is the fallback for people who aren't ready.
type Mode = 'studio' | 'concierge';

export default function SignatureDemo({ mode = 'studio' }: { mode?: Mode }) {
  const concierge = mode === 'concierge';
  // Read params FIRST so we can pass preloaded kit to useBrandKit as initial state.
  const searchParams = useSearchParams();
  const fromParam = searchParams.get('from');
  const kitParam = searchParams.get('kit');
  const preloaded = kitParam ? decodeKitParam(kitParam) : null;

  const brand = useBrandKit({
    initialKit: preloaded?.brandKit,
    initialFields: preloaded?.fields,
    initialFont: preloaded?.font ?? (preloaded ? fontMatch(preloaded.brandKit.fontFamily) : undefined),
    initialRoles: preloaded?.roles,
    // If kit is preloaded we already have the result — mark siteUrl so extracted labels show.
    initialUrl: fromParam?.replace(/^https?:\/\//i, '') ?? '',
    initialSiteUrl: preloaded && fromParam ? fromParam : '',
  });

  const extracted = !!brand.siteUrl;
  // Soft confidence: only Firecrawl's deterministic branding is trustworthy as-read.
  // Anything LLM-derived ('extract'/'vision') or degraded is a best guess the user
  // should sanity-check. Honest-degradation principle.
  const colorConfidence = !extracted
    ? 'Demo colors · paste your URL above'
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
  const [linkCopied, setLinkCopied] = useState<'team' | 'filled' | null>(null);

  const tab = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  const copyShareLink = async (kind: 'team' | 'filled') => {
    const url = makeShareUrl(
      brand.kit, brand.roles, brand.font, brand.siteUrl,
      kind === 'filled' ? brand.fields : undefined,
    );
    await navigator.clipboard.writeText(url);
    setLinkCopied(kind);
    track('team_link_copied', { kind });
    setTimeout(() => setLinkCopied(null), 2000);
  };

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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark size={24} />
          <span className="font-display text-lg font-extrabold tracking-tight text-ink">Signet</span>
        </Link>
        <Link href="/" className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink">
          ← Home
        </Link>
      </div>
    </nav>
    {/* max-w-7xl, wider than the landing page's 6xl: this is the studio, and the
        preview column has to carry two signatures side by side at xl. */}
    <main className="mx-auto w-full max-w-7xl px-6 py-16 md:px-10 md:py-24">
      {/* hero */}
      <header className="rise max-w-3xl" style={{ animationDelay: '40ms' }}>
        <span className="eyebrow">{concierge ? 'Made for you' : 'Email signature studio'}</span>
        <h1
          className="mt-7 font-display font-extrabold uppercase leading-[0.9] tracking-[-0.03em] text-ink"
          style={{ fontSize: 'clamp(2.6rem, 7vw, 5rem)' }}
        >
          Your signature,<br />perfectly <span style={{ color: 'var(--color-accent)', whiteSpace: 'nowrap' }}>on-brand.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          {preloaded || concierge ? (
            <>
              We already read your site. Your logo, your colors, and your typeface are
              below — <span className="text-ink">edit anything and copy it</span>.
            </>
          ) : (
            <>
              Paste your website. We read your logo, your colors, and your typeface, and
              build a signature that looks like your design team made it — in
              <span className="text-ink"> ten seconds</span>.
            </>
          )}
        </p>
      </header>

      {/* url input — hidden when ?kit= carried the result in. ponytail: a preloaded
          visitor needs no scrape, and the scrape is the only paid call in the app,
          so the outreach funnel costs zero credits however often they regenerate.
          The link below reopens the box under the normal per-IP rate limit. */}
      {concierge ? null : preloaded ? (
        <p className="rise mt-10 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-muted" style={{ animationDelay: '140ms' }}>
          <Link href="/app" className="text-ink underline underline-offset-4">Use a different site →</Link>
        </p>
      ) : (
      <form
        onSubmit={(e) => { track('url_submitted'); void brand.generate(e); }}
        className="rise mt-10 flex max-w-2xl flex-col sm:flex-row"
        style={{ animationDelay: '140ms' }}
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
      )}
      {brand.note && <p className="mt-3 text-sm text-muted" role="status">{brand.note}</p>}

      {/* studio: editor (left) + live preview (right, sticky on desktop) so every
          edit is visible without scrolling — the magic moment stays on screen. */}
      {/* Equal halves up to xl, then 2/5 + 3/5. The wider preview column exists so
          the two secondary signatures can sit side by side and still clear the
          ~340px each needs before an email address and a phone number clip
          (measured 2026-08-06). Below xl the pair stacks, so the extra width buys
          nothing there — and taking it would clip the FORM's own inputs instead. */}
      <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 md:items-start xl:grid-cols-5">
      <div className="xl:col-span-2">

      {/* divider */}
      <div
        className="rise flex items-center gap-4"
        style={{ animationDelay: '240ms' }}
      >
        <span className={label}>Edit your signature</span>
        <span className="h-px flex-1 bg-line" />
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
      <div
        className="rise mt-6 flex gap-1 border-b border-line"
        style={{ animationDelay: '300ms' }}
        role="tablist"
        aria-label="Signature fields"
        onKeyDown={(e) => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault();
          const i = TABS.findIndex((t) => t.id === activeTab);
          const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length];
          setActiveTab(next.id);
          document.getElementById(`tab-${next.id}`)?.focus();
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            aria-controls="tabpanel-fields"
            tabIndex={activeTab === t.id ? 0 : -1}
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
      <div
        key={activeTab}
        id="tabpanel-fields"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
        className="tab-content mt-6 grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2"
      >
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
                    className="flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
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
            <span className="mt-2 block font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted">
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
                <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted">{roleLabel}</span>
              </label>
            ))}
            <span className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted">
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
              <img src={brand.kit.logoUrl} alt="" width={84} height={32} className="h-8 max-w-[84px] shrink-0 border border-line object-contain" />
            )}
            <input
              type="url"
              value={brand.kit.logoUrl}
              onChange={(e) => brand.setLogoUrl(e.target.value)}
              placeholder="https://…/logo.png"
              suppressHydrationWarning
              autoComplete="off"
              spellCheck={false}
              className={field}
            />
          </div>
          {brand.confidence && extracted && (
            <span className="mt-1 block font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted">
              {confidenceLabel(brand.confidence.logoUrl)}
            </span>
          )}
        </div>
      </div>

      </div>
      {/* preview column — sticky on desktop so it stays visible while editing */}
      <div className="md:sticky md:top-20 xl:col-span-3">

      {/* preview cards — show skeleton during initial extraction, real cards once loaded */}
      <div className="rise space-y-5" style={{ animationDelay: '380ms' }}>
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
            {/* Secondary skeletons — same breakpoint as the real previews below */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
            {/* Featured = logo-cta: the only layout with the CTA button, so the
                "Button text" field actually drives something the visitor can see. */}
            {LAYOUTS.filter((l) => l.id === 'logo-cta').map(({ id, label: name, h }) => (
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
                />
              </div>
            ))}
            {/* Side by side only from xl up. Below that the studio column is too
                narrow to give each card the ~340px an email address and a phone
                number need, so they stack instead of clipping mid-string. */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {LAYOUTS.filter((l) => l.id !== 'logo-cta').map(({ id, label: name, h }) => (
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
                />
              ))}
            </div>
          </>
        )}
      </div>

      </div>
      </div>

      {/* team rollout — one section, two asks (instant link copy + future auto-deploy
          email capture), instead of two competing boxed CTAs. Only shown after a real
          extraction: inviting a team rollout of the demo kit would be dishonest. */}
      {(extracted || (concierge && !!preloaded)) && (
        <section className="rise mt-16 border-t border-line pt-10" style={{ animationDelay: '460ms' }}>
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-md">
              <span className="eyebrow">Roll it out to your team</span>
              <h2 className="mt-4 font-display text-2xl text-ink md:text-3xl">
                Everyone, on brand, from one URL.
              </h2>
              <p className="mt-2 text-muted">
                {concierge ? (
                  <>
                    We set every teammate up for you — one flat fee, no sign-in, no IT
                    ticket. Prefer to do it yourself? Copy a link below instead.
                  </>
                ) : (
                  <>
                    Copy the link with these details to send someone their finished
                    signature, or the blank team link so each teammate adds their own name.
                    Want it fully automated (one sign-in, every signature deployed for
                    you)? Leave your email below.
                  </>
                )}
              </p>
            </div>
            <div className="flex w-full max-w-sm flex-col gap-6">
              <div>
                {/* concierge: the paid ask leads and is the only filled button, so the
                    page measures willingness to pay, not interest. */}
                {concierge && process.env.NEXT_PUBLIC_CONCIERGE_URL && (
                  <a
                    href={process.env.NEXT_PUBLIC_CONCIERGE_URL}
                    onClick={() => track('team_cta_clicked', { placement: 'concierge_primary' })}
                    className={`${btn} mb-6 w-full bg-accent text-paper hover:bg-accent-deep`}
                  >
                    Set up my whole team — $99
                  </a>
                )}
                <span className={label}>{concierge ? 'Or do it yourself' : 'Share with your team'}</span>
                <button
                  onClick={() => copyShareLink('filled')}
                  className={`${btn} mt-2 w-full ${linkCopied === 'filled' ? 'bg-accent text-paper' : 'border border-line text-ink hover:border-accent hover:text-accent'}`}
                >
                  {linkCopied === 'filled' ? '✓ Copied' : 'Copy link with these details'}
                </button>
                <button
                  onClick={() => copyShareLink('team')}
                  className={`${btn} mt-2 w-full ${linkCopied === 'team' ? 'bg-accent text-paper' : 'border border-line text-ink hover:border-accent hover:text-accent'}`}
                >
                  {linkCopied === 'team' ? '✓ Copied' : 'Copy blank team link'}
                </button>
                {!concierge && process.env.NEXT_PUBLIC_CONCIERGE_URL && (
                  <a
                    href={process.env.NEXT_PUBLIC_CONCIERGE_URL}
                    onClick={() => track('team_cta_clicked', { placement: 'demo_rollout' })}
                    className="mt-3 block text-sm text-accent-deep underline underline-offset-4 hover:text-accent"
                  >
                    Or let us do it — $99 one-time team setup →
                  </a>
                )}
              </div>
              {sent ? (
                <p className="text-accent-deep" role="status">Thanks — we&rsquo;ll be in touch about team deploy.</p>
              ) : (
                <form onSubmit={submitWaitlist} noValidate>
                  <label>
                    <span className={label}>{concierge ? 'Not ready? Send me the details' : 'Work email — notify me at launch'}</span>
                    <div className="mt-2 flex items-end gap-3">
                      <input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        name="email"
                        spellCheck={false}
                        required
                        placeholder="you@work.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={sending}
                        suppressHydrationWarning
                        aria-label="Work email address"
                        className={`${field} flex-1`}
                      />
                      {/* concierge: the $99 button owns the one vermilion stamp on this
                          page (One Stamp rule), so the fallback ask goes quiet. */}
                      <button
                        disabled={sending}
                        className={`${btn} ${concierge ? 'border border-line text-ink hover:border-accent hover:text-accent' : 'bg-accent text-paper hover:bg-accent-deep'}`}
                      >
                        {sending ? 'Saving…' : 'Notify me'}
                      </button>
                    </div>
                  </label>
                  {sendErr && <p className="mt-2 text-sm text-accent-deep" role="alert">{sendErr}</p>}
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      {/* copy hint + install guide — all three layouts are free to copy, no gate */}
      <p className="mt-10 border-t border-line pt-10 text-[0.72rem] text-muted">
        All three are yours. Click <span className="text-ink">Copy</span> on any layout above, then drop it into your mail client:
      </p>
      <InstallInstructions />

      <footer className="mt-16 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted">
        No template picker · No IT ticket · No filling forms
      </footer>
    </main>
    </>
  );
}
