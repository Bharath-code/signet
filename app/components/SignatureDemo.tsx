'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBrandKit, LAYOUTS } from './useBrandKit';
import { SignaturePreview } from './SignaturePreview';
import { BrandMark } from './Logo';
import { track } from './track';
import type { SignatureFields } from '@/lib/types';

const FIELDS: { key: keyof SignatureFields; label: string; type?: string }[] = [
  { key: 'fullName', label: 'Full name' },
  { key: 'jobTitle', label: 'Job title' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone' },
];

const EMAIL_FONTS: { label: string; value: string }[] = [
  { label: 'Georgia',    value: 'Georgia, serif' },
  { label: 'Arial',      value: 'Arial, Helvetica, sans-serif' },
  { label: 'Verdana',    value: 'Verdana, Geneva, sans-serif' },
  { label: 'Trebuchet',  value: 'Trebuchet MS, sans-serif' },
  { label: 'Times',      value: 'Times New Roman, serif' },
];

const label = 'text-[0.68rem] uppercase tracking-[0.18em] text-muted';
const field =
  'w-full bg-transparent border-b border-line py-2 text-ink ' +
  'placeholder:text-muted focus:border-accent transition-colors';
const btn =
  'inline-flex items-center justify-center gap-2 px-6 py-3 font-mono text-[0.72rem] uppercase tracking-[0.12em] ' +
  'text-paper transition-colors disabled:opacity-50';

export default function SignatureDemo() {
  const brand = useBrandKit();
  const [sent, setSent] = useState(false);

  useEffect(() => {
    track('page_view', '/app');
  }, []);

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
      {brand.note && <p className="mt-3 text-sm text-muted">{brand.note}</p>}

      {/* divider */}
      <div
        className="rise mt-16 flex items-center gap-4"
        style={{ animationDelay: '240ms' }}
      >
        <span className={label}>Live preview</span>
        <span className="h-px flex-1 bg-line" />
        <span className={`${label} hidden sm:inline`}>edit any field</span>
      </div>

      {/* personal fields */}
      <div
        className="rise mt-8 grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2"
        style={{ animationDelay: '300ms' }}
      >
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className={label}>{f.label}</span>
            <input
              type={f.type ?? 'text'}
              value={brand.fields[f.key]}
              onChange={brand.setField(f.key)}
              suppressHydrationWarning
              className={`${field} mt-1`}
            />
          </label>
        ))}
        {/* font picker spans full width */}
        <div className="col-span-full">
          <span className={label}>Font</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {EMAIL_FONTS.map((f) => (
              <button
                key={f.value}
                onClick={() => brand.setFont(f.value)}
                style={{ fontFamily: f.value }}
                className={`border px-3 py-1.5 text-sm transition-colors ${
                  brand.font === f.value
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line text-muted hover:border-ink hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* preview cards */}
      <div
        className="rise mt-10 grid grid-cols-1 gap-5 md:grid-cols-3"
        style={{ animationDelay: '380ms' }}
      >
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
            proHref="/#notify"
          />
        ))}
      </div>

      {/* copy hint */}
      <p className="mt-4 text-[0.72rem] text-muted">
        Upgrade to Pro to copy any layout into Gmail Settings → Signature → paste.
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
            <p className="text-accent-deep">Thanks — we&rsquo;ll be in touch about team deploy.</p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
              className="flex w-full max-w-sm items-end gap-3"
            >
              <label className="flex-1">
                <span className={label}>Work email</span>
                <input
                  type="email"
                  required
                  placeholder="you@work.com"
                  suppressHydrationWarning
                  className={`${field} mt-1`}
                />
              </label>
              <button className={`${btn} bg-accent hover:bg-accent-deep`}>Notify me</button>
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
