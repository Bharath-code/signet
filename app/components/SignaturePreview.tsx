'use client';
import { useState } from 'react';
import { renderSignature } from '@/lib/render-signature';
import { track } from './track';
import type { BrandKit, SignatureFields, Layout } from '@/lib/types';

// Build-time admin flag: set NEXT_PUBLIC_SIGNET_COPY=1 in .env.local to swap the
// "Copy with Pro" waitlist CTA for a real clipboard copy. Off (waitlist CTA) for
// real visitors — the gate is deliberate demand-capture. NEXT_PUBLIC_* is inlined
// at build, so a visitor can't flip it; don't set it in production env.
const ADMIN_COPY = process.env.NEXT_PUBLIC_SIGNET_COPY === '1';

const frameDoc = (html: string) =>
  `<!doctype html><meta charset="utf-8">` +
  `<style>html,body{margin:0;height:100%}` +
  `body{display:flex;align-items:center;box-sizing:border-box;` +
  `padding:16px 14px;background:#fff}</style>${html}`;

type Props = {
  kit: BrandKit;
  fields: SignatureFields;
  layout: Layout;
  label: string;
  height: number;
  font: string;
  siteUrl?: string;
  proHref: string;
};

export function SignaturePreview({ kit, fields, layout, label, height, font, siteUrl, proHref }: Props) {
  const html = renderSignature({ ...kit, fontFamily: font }, fields, layout, siteUrl);
  const [copied, setCopied] = useState(false);

  // Gmail's signature editor is contenteditable: it pastes the clipboard's
  // text/html flavor. Writing source as plain text would just show code.
  const copy = async () => {
    const plain = [fields.fullName, fields.jobTitle, fields.email, fields.phone].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        }),
      ]);
    } catch {
      await navigator.clipboard.writeText(html); // older browsers: source string
    }
    track('signature_copied');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <figure className="bezel">
      {/* Inner core renders the actual email output on white (always white — it's the real email sig) */}
      <div className="bezel-inner">
        <figcaption className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted">{label}</span>
          {ADMIN_COPY ? (
            <button
              onClick={copy}
              className="flex items-center gap-1.5 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
            >
              {copied ? 'Copied ✓' : 'Copy'}
              {!copied && <span className="hero-button-trail" aria-hidden>→</span>}
            </button>
          ) : (
            <a
              href={proHref}
              onClick={() => track('pro_link_clicked')}
              className="flex items-center gap-1.5 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
            >
              Copy with Pro
              <span className="hero-button-trail" aria-hidden>→</span>
            </a>
          )}
        </figcaption>
        <iframe
          title={label}
          sandbox="allow-popups"
          style={{ height }}
          className="block w-full bg-white"
          srcDoc={frameDoc(html)}
        />
      </div>
    </figure>
  );
}
