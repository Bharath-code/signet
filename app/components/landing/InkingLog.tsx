'use client';
import { useEffect, useState } from 'react';
import type { BrandKit } from '@/lib/types';

// The API answers once, so stages follow the measured median (~8s) and the last
// one holds until the response lands: the roller never claims 100%.
const AT = [0, 1500, 3500, 6000, 9000];
const FILL = [0.12, 0.3, 0.5, 0.7, 0.86];
const SLOW_MS = 20000;

export function InkingLog({ domain }: { domain: string }) {
  const [stage, setStage] = useState(0);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const ts = AT.slice(1).map((ms, i) => setTimeout(() => setStage(i + 1), ms));
    ts.push(setTimeout(() => setSlow(true), SLOW_MS));
    return () => ts.forEach(clearTimeout);
  }, []);

  const lines = [
    `Reading ${domain}`,
    'Looking for your logo',
    'Pulling your palette',
    'Matching your type',
    'Setting three layouts',
  ];

  return (
    <div className="border bg-card p-5 sm:p-7" style={{ borderColor: 'var(--color-line)' }}>
      <div className="relative mb-5 h-2.5 overflow-hidden" style={{ background: 'var(--color-paper-deep)' }} aria-hidden>
        <i className="ink-roller absolute inset-0 block" style={{ background: 'var(--color-ink)', transform: `scaleX(${FILL[stage]})` }} />
      </div>
      <ol className="ink-log flex flex-col gap-2 font-mono text-[0.76rem] leading-normal text-ink" aria-live="polite">
        {lines.slice(0, stage + 1).map((l, i) => (
          <li key={l} className="grid grid-cols-[22px_1fr] gap-1.5" data-wait={i === stage ? '' : undefined}>{l}</li>
        ))}
        {slow && <li className="grid grid-cols-[22px_1fr] gap-1.5" data-wait="">Large sites take longer. Still reading.</li>}
      </ol>
    </div>
  );
}

// What was actually found, shown above the previews once a kit lands: the
// "it understands my brand" evidence, stated as values instead of adjectives.
export function KitReceipt({ kit, font }: { kit: BrandKit; font: string }) {
  const family = font.split(',')[0].replace(/["']/g, '').trim();
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-ink">
      <span className="flex items-center gap-2">
        <span style={{ color: 'var(--color-accent)' }}>✓</span> Logo
        <img src={kit.logoUrl} alt="" className="h-5 w-5 object-contain" />
      </span>
      <span className="flex items-center gap-2">
        <span style={{ color: 'var(--color-accent)' }}>✓</span> Palette
        {[kit.primaryColor, kit.secondaryColor].map((c, i) => (
          <span key={i} className="flex items-center gap-1.5 normal-case tracking-normal">
            <span className="inline-block h-3 w-3 border border-ink" style={{ background: c }} />{c}
          </span>
        ))}
      </span>
      <span className="flex items-center gap-2">
        <span style={{ color: 'var(--color-accent)' }}>✓</span> Type
        <span className="normal-case tracking-normal" style={{ fontFamily: font }}>{family}</span>
      </span>
    </div>
  );
}
