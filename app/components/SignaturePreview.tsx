'use client';
import { useState } from 'react';
import { renderSignature, type Roles } from '@/lib/render-signature';
import { track } from './track';
import type { BrandKit, SignatureFields, Layout } from '@/lib/types';

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
  roles?: Roles;
  locked?: boolean; // blurs iframe + shows upgrade overlay; used for 2nd/3rd layout for free users
  hideCopy?: boolean; // suppress copy button entirely (landing page — copy lives in /app)
};

export function SignaturePreview({ kit, fields, layout, label, height, font, siteUrl, proHref, roles, locked, hideCopy }: Props) {
  const html = renderSignature({ ...kit, fontFamily: font }, fields, layout, siteUrl, roles);
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
      <div className="bezel-inner">
        <figcaption className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted">{label}</span>
          {locked ? (
            <a
              href={proHref}
              onClick={() => track('pro_link_clicked', { layout })}
              className="flex items-center gap-1.5 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-accent transition-colors hover:text-ink"
            >
              Unlock with Pro
              <span className="hero-button-trail" aria-hidden>→</span>
            </a>
          ) : !hideCopy ? (
            <button
              onClick={copy}
              className="flex items-center gap-1.5 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
            >
              {copied ? 'Copied ✓' : 'Copy'}
              {!copied && <span className="hero-button-trail" aria-hidden>→</span>}
            </button>
          ) : null}
        </figcaption>
        <div className="relative">
          <iframe
            title={label}
            sandbox="allow-popups"
            style={{ height }}
            className={`block w-full bg-white${locked ? ' pointer-events-none blur-sm' : ''}`}
            srcDoc={frameDoc(html)}
          />
          {locked && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              style={{ background: 'rgba(243,242,236,0.75)' }}
            >
              <span className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted">Pro layout</span>
              <a
                href={proHref}
                onClick={() => track('pro_layout_unlock_clicked', { layout })}
                className="border border-ink px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                Join waitlist to unlock →
              </a>
            </div>
          )}
        </div>
      </div>
    </figure>
  );
}
