'use client';
import { useState } from 'react';
import { renderSignature } from '@/lib/render-signature';
import { DEMO_FIELDS, NEUTRAL_BRAND_KIT } from '@/lib/brand-kit-schema';
import type { BrandKit, SignatureFields, Layout } from '@/lib/types';

const LAYOUTS: { id: Layout; label: string }[] = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'logo', label: 'With logo' },
  { id: 'logo-cta', label: 'Logo + CTA' },
];

const FIELDS: { key: keyof SignatureFields; label: string; type?: string }[] = [
  { key: 'fullName', label: 'Full name' },
  { key: 'jobTitle', label: 'Job title' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone' },
];

// preview-only chrome: pad + vertically center the signature inside its card.
// renderSignature stays the true email output; this wrapper is just presentation.
const frameDoc = (html: string) =>
  `<!doctype html><meta charset="utf-8">` +
  `<style>html,body{margin:0;height:100%}` +
  `body{display:flex;align-items:center;box-sizing:border-box;` +
  `padding:18px 20px;background:#fff}</style>${html}`;

const label = 'text-[0.68rem] uppercase tracking-[0.18em] text-muted';
const field =
  'w-full bg-transparent border-b border-line py-2 text-ink outline-none ' +
  'placeholder:text-muted/60 focus:border-accent transition-colors';

export default function SignatureDemo() {
  const [url, setUrl] = useState('');
  const [kit, setKit] = useState<BrandKit>(NEUTRAL_BRAND_KIT);
  const [fields, setFields] = useState<SignatureFields>(DEMO_FIELDS);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setNote('');
    try {
      const res = await fetch('/api/brand-kit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      setKit(data.brandKit);
      if (data.fallback)
        setNote("Couldn't read that site — showing a neutral signature. Try another URL.");
    } catch {
      setNote('Something went wrong reading that site. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const set =
    (k: keyof SignatureFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((f) => ({ ...f, [k]: e.target.value }));

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 md:px-10 md:py-24">
      {/* hero */}
      <header className="rise max-w-3xl" style={{ animationDelay: '40ms' }}>
        <span className={`${label} text-accent`}>Email signature studio</span>
        <h1 className="mt-5 font-display text-[2.7rem] leading-[1.04] tracking-[-0.02em] text-ink md:text-[4.25rem]">
          Your signature,{' '}
          <em className="font-display italic text-accent">perfectly on-brand</em>,
          <br className="hidden md:block" /> in ten seconds.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Paste your website. We read your logo, your colors, and your typeface — and
          build a signature that looks like it came from your design team.
        </p>
      </header>

      {/* url input */}
      <form
        onSubmit={generate}
        className="rise mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-stretch"
        style={{ animationDelay: '140ms' }}
      >
        <div className="flex flex-1 items-center border-b-2 border-ink/80 focus-within:border-accent transition-colors">
          <span className="pr-1 text-muted select-none">https://</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="yourcompany.com"
            suppressHydrationWarning
            className="w-full bg-transparent py-3 text-lg text-ink outline-none placeholder:text-muted/60"
          />
        </div>
        <button
          disabled={loading}
          className="group inline-flex items-center justify-center gap-2 bg-ink px-7 py-3 font-medium text-paper transition-colors hover:bg-accent disabled:opacity-50"
        >
          {loading ? 'Reading…' : 'Generate'}
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
      </form>
      {note && <p className="mt-3 text-sm text-accent-deep">{note}</p>}

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
              value={fields[f.key]}
              onChange={set(f.key)}
              suppressHydrationWarning
              className={`${field} mt-1`}
            />
          </label>
        ))}
      </div>

      {/* preview cards */}
      <div
        className="rise mt-10 grid grid-cols-1 gap-5 md:grid-cols-3"
        style={{ animationDelay: '380ms' }}
      >
        {LAYOUTS.map(({ id, label: name }) => (
          <figure
            key={id}
            className="overflow-hidden border border-line bg-card shadow-[0_1px_0_rgba(24,22,15,0.04),0_18px_40px_-28px_rgba(24,22,15,0.45)]"
          >
            <figcaption className="flex items-center justify-between border-b border-line/70 px-4 py-3">
              <span className={label}>{name}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            </figcaption>
            <iframe
              title={name}
              sandbox=""
              className="block h-[168px] w-full bg-white"
              srcDoc={frameDoc(renderSignature(kit, fields, id))}
            />
          </figure>
        ))}
      </div>

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
              <button className="bg-accent px-5 py-2.5 font-medium text-paper transition-colors hover:bg-accent-deep">
                Notify me
              </button>
            </form>
          )}
        </div>
      </section>

      <footer className="mt-16 text-[0.68rem] uppercase tracking-[0.18em] text-muted/70">
        No template picker · No IT ticket · No filling forms
      </footer>
    </main>
  );
}
