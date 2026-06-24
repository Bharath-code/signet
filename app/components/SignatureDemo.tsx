'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBrandKit, LAYOUTS, PRESETS } from './useBrandKit';
import { SignaturePreview } from './SignaturePreview';
import { BrandMark } from './Logo';
import { track } from './track';
import { EMAIL_FONTS, toEmailSafeFont } from '@/lib/email-fonts';
import type { SignatureFields, ToggleableField } from '@/lib/types';

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
  const brand = useBrandKit();
  // Surface the auto-match only after a real extraction (siteUrl is set on generate).
  const extracted = !!brand.siteUrl;
  const matchedFont = toEmailSafeFont(brand.kit.fontFamily);
  const brandFontName = brand.kit.fontFamily.split(',')[0].trim();
  const [activeTab, setActiveTab] = useState('details');
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');

  const tab = TABS.find((t) => t.id === activeTab) ?? TABS[0];

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
          {brand.loading ? 'Reading…' : 'Generate'}
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
      <div className="mt-6 grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
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
                  className={`flex items-center gap-1.5 border px-3 py-1.5 text-sm transition-colors ${
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
            </span>
          )}
        </div>
        {/* brand colors — extracted defaults, editable. Each swatch opens the native
            color picker (which includes hex entry); the hex label tracks it live. */}
        <div className="col-span-full">
          <span className={label}>Brand colors</span>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            {([['Text', 'ink'], ['Accent', 'accent']] as const).map(([roleLabel, key]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2 border border-line px-3 py-1.5">
                <span className="relative inline-flex h-4 w-4 border border-line" style={{ background: brand.roles[key] }}>
                  <input
                    type="color"
                    value={brand.roles[key]}
                    onChange={(e) => brand.setRole(key)(e.target.value)}
                    aria-label={`${roleLabel} color`}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </span>
                <span className="font-mono text-xs text-ink">{brand.roles[key].toUpperCase()}</span>
                <span className="text-[0.62rem] uppercase tracking-[0.16em] text-muted">{roleLabel}</span>
              </label>
            ))}
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted">Extracted · editable</span>
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
        </div>
      </div>

      {/* preview cards — feature the with-logo layout at realistic email width,
          two alternates below. (Real signatures are 400–600px; a 3-up grid
          squeezed them.) Mobile already stacks full-width. */}
      <div className="rise mt-10 space-y-5" style={{ animationDelay: '380ms' }}>
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
            />
          ))}
        </div>
      </div>

      {/* copy hint */}
      <p className="mt-4 text-[0.72rem] text-muted">
        {process.env.NEXT_PUBLIC_SIGNET_COPY === '1'
          ? 'Click Copy on any layout, then paste into Gmail Settings → Signature.'
          : 'Upgrade to Pro to copy any layout into Gmail Settings → Signature → paste.'}
      </p>

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
