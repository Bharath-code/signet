'use client';
import { renderSignature } from '@/lib/render-signature';
import { track } from './track';
import type { BrandKit, SignatureFields, Layout } from '@/lib/types';

const frameDoc = (html: string) =>
  `<!doctype html><meta charset="utf-8">` +
  `<style>html,body{margin:0;height:100%}` +
  `body{display:flex;align-items:center;box-sizing:border-box;` +
  `padding:18px 20px;background:#fff}</style>${html}`;

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
  return (
    <figure className="bezel">
      {/* Inner core renders the actual email output on white (always white — it's the real email sig) */}
      <div className="bezel-inner">
        <figcaption className="flex items-center justify-between border-b border-line/70 px-4 py-3">
          <span className="text-[0.68rem] uppercase tracking-[0.18em] text-muted">{label}</span>
          <a
            href={proHref}
            onClick={() => track('pro_link_clicked')}
            className="flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
          >
            Copy with Pro
            <span className="hero-button-trail" style={{ background: 'rgba(9,9,11,0.08)', width: 20, height: 20 }}>→</span>
          </a>
        </figcaption>
        <iframe
          title={label}
          sandbox="allow-popups"
          style={{ height }}
          className="block w-full bg-white"
          srcDoc={frameDoc(renderSignature({ ...kit, fontFamily: font }, fields, layout, siteUrl))}
        />
      </div>
    </figure>
  );
}