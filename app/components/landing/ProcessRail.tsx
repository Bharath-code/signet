'use client';
import type { ReactNode } from 'react';
import { useStage } from './useStage';

const mono = 'JetBrains Mono, ui-monospace, monospace';
const serif = 'Georgia, "Times New Roman", serif';

// Icons drawn around (0,0) so both rail orientations can place them.
const ICONS: ReactNode[] = [
  <g key="paste">
    <rect x="-16" y="-8" width="32" height="16" fill="none" stroke="#131210" strokeWidth="1.5" />
    <text x="-11" y="4" fontFamily={mono} fontSize="9" fill="#131210">://</text>
  </g>,
  <g key="read">
    <circle cx="-3" cy="-3" r="10" fill="none" stroke="#131210" strokeWidth="1.5" />
    <line x1="4" y1="4" x2="12" y2="12" stroke="#131210" strokeWidth="2" />
  </g>,
  <text key="set" y="8" textAnchor="middle" fontFamily={serif} fontWeight="600" fontSize="21" fill="#131210">Aa</text>,
  <g key="send">
    <rect x="-16" y="-11" width="32" height="22" fill="none" stroke="#131210" strokeWidth="1.5" />
    <polyline points="-16,-11 0,2 16,-11" fill="none" stroke="#131210" strokeWidth="1.5" />
  </g>,
];

const STEPS = [
  { label: 'PASTE', sub: 'your company URL' },
  { label: 'READ', sub: 'logo, palette, type' },
  { label: 'SET', sub: 'three layouts' },
  { label: 'SEND', sub: 'into Gmail or Outlook' },
];

const LABEL = 'Four steps: paste your company URL, Signet reads your logo, palette and type, sets three layouts, and you send from Gmail or Outlook.';

export function ProcessRail() {
  const ref = useStage<HTMLDivElement>({ play: true, startOnView: true, threshold: 0.4 });

  return (
    <div ref={ref}>
      <svg className="stage-svg hidden h-auto w-full sm:block" viewBox="0 0 764 150" role="img" aria-label={LABEL}>
        <line x1="82" y1="60" x2="682" y2="60" stroke="#D8D6CC" strokeWidth="2" />
        <line className="r-line" x1="82" y1="60" x2="682" y2="60" stroke="#131210" strokeWidth="2" />
        {STEPS.map((s, i) => {
          const x = 82 + i * 200;
          return (
            <g key={s.label}>
              <rect className={`r-node r-n${i + 1}`} x={x - 28} y="32" width="56" height="56" fill="#FFFFFF" />
              <g transform={`translate(${x} 60)`}>{ICONS[i]}</g>
              <text x={x} y="116" textAnchor="middle" fontFamily={mono} fontSize="11" letterSpacing="2" fill="#131210">{s.label}</text>
              <text x={x} y="136" textAnchor="middle" fontFamily="Hanken Grotesk, system-ui, sans-serif" fontSize="12.5" fill="#5E5A52">{s.sub}</text>
            </g>
          );
        })}
        <circle className="r-pen" cx="82" cy="60" r="5" fill="#E23A1A" />
      </svg>

      <svg className="stage-svg block h-auto w-full max-w-sm sm:hidden" viewBox="0 0 300 430" role="img" aria-label={LABEL}>
        <line x1="48" y1="48" x2="48" y2="378" stroke="#D8D6CC" strokeWidth="2" />
        <line className="rv-line" x1="48" y1="48" x2="48" y2="378" stroke="#131210" strokeWidth="2" />
        {STEPS.map((s, i) => {
          const y = 48 + i * 110;
          return (
            <g key={s.label}>
              <rect className={`r-node r-n${i + 1}`} x="20" y={y - 28} width="56" height="56" fill="#FFFFFF" />
              <g transform={`translate(48 ${y})`}>{ICONS[i]}</g>
              <text x="96" y={y - 3} fontFamily={mono} fontSize="12" letterSpacing="2" fill="#131210">{s.label}</text>
              <text x="96" y={y + 17} fontFamily="Hanken Grotesk, system-ui, sans-serif" fontSize="14" fill="#5E5A52">{s.sub}</text>
            </g>
          );
        })}
        <circle className="rv-pen" cx="48" cy="48" r="5" fill="#E23A1A" />
      </svg>
    </div>
  );
}
