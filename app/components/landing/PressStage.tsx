'use client';
import { useState } from 'react';
import { useStage } from './useStage';

export type PressMode = 'attract' | 'live' | 'frozen';

type Props = {
  mode: PressMode;
  domain?: string;
  company?: string;
  primary?: string;
  secondary?: string;
  logoUrl?: string;
  font?: string;
};

const mono = 'JetBrains Mono, ui-monospace, monospace';
const serif = 'Georgia, "Times New Roman", serif';
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

// The hero's one orchestrated moment: a URL is typed, the site is read, logo,
// palette and type lift off and set into a signature, which is sealed.
// attract = on-load loop (3x, then rests); live = loops while a real request runs;
// frozen = final frame (field focused, or a result is on screen).
export function PressStage({
  mode,
  domain = 'northwind.co',
  company = 'Northwind',
  primary = '#1F4D3A',
  secondary = '#F2B33D',
  logoUrl,
  font = serif,
}: Props) {
  const [held, setHeld] = useState(false);
  const [ended, setEnded] = useState(false);
  const ref = useStage<HTMLDivElement>({
    play: mode !== 'frozen',
    loops: mode === 'attract' ? 3 : undefined,
    anim: 'p-stage',
    onDone: () => setEnded(true),
  });
  const d = clip(domain, 16);
  const name = clip(company, 18);
  const initial = company.trim().charAt(0).toUpperCase() || 'N';

  return (
    // `held` sits on the outer div: React rewrites className on toggle, which would
    // wipe the `run` class useStage adds to the inner one.
    <div className={`relative ${held ? 'held' : ''}`}>
      <div ref={ref}>
      <svg
        className="stage-svg block h-auto w-full"
        viewBox="0 0 760 380"
        role="img"
        aria-label={`A URL is typed, the site is read, the logo, two colours and the typeface lift off and set into ${company}'s email signature, which is then sealed.`}
      >
        <g className="p-stage">
          <rect x="20" y="20" width="320" height="40" fill="#FFFFFF" stroke="#131210" strokeWidth="1.5" />
          <text x="32" y="45" fontFamily={mono} fontSize="12" fill="#5E5A52">https://</text>
          <text x="98" y="45" fontFamily={mono} fontSize="13" fill="#131210">{d}</text>
          <rect className="p-cover" x="96" y="26" width="166" height="28" fill="#FFFFFF" />
          <rect className="p-caret" x={100 + d.length * 7.8} y="31" width="2" height="18" fill="#E23A1A" />
          <rect className="p-btn" x="266" y="20" width="74" height="40" fill="#131210" />
          <text x="279" y="44" fontFamily={mono} fontSize="10" letterSpacing="1.5" fill="#F3F2EC">SIGN →</text>

          <rect x="20" y="80" width="320" height="280" fill="#FFFFFF" stroke="#D8D6CC" />
          <rect x="20.5" y="80.5" width="319" height="20" fill="#E9E8DF" />
          <rect x="28" y="87" width="6" height="6" fill="#D8D6CC" />
          <rect x="38" y="87" width="6" height="6" fill="#D8D6CC" />
          <rect x="48" y="87" width="6" height="6" fill="#D8D6CC" />
          <rect x="36" y="112" width="22" height="22" fill={primary} />
          <text x="47" y="128" textAnchor="middle" fontFamily={serif} fontWeight="700" fontSize="14" fill="#F3F2EC">{initial}</text>
          <text x="66" y="128" fontFamily={font} fontWeight="600" fontSize="14" fill={primary}>{clip(company, 14)}</text>
          <rect x="226" y="121" width="24" height="4" fill="#D8D6CC" />
          <rect x="258" y="121" width="24" height="4" fill="#D8D6CC" />
          <rect x="290" y="121" width="30" height="4" fill="#D8D6CC" />
          <rect x="36" y="148" width="288" height="112" fill={primary} />
          <text x="52" y="186" fontFamily={font} fontWeight="600" fontSize="18" fill="#F3F2EC">Built with care, shipped fast.</text>
          <rect x="52" y="198" width="180" height="4" fill="#F3F2EC" opacity=".4" />
          <rect x="52" y="208" width="130" height="4" fill="#F3F2EC" opacity=".4" />
          <rect x="52" y="224" width="80" height="22" fill={secondary} />
          <text x="60" y="239" fontFamily={font} fontWeight="600" fontSize="10" fill="#131210">Get started</text>
          <rect x="36" y="278" width="288" height="4" fill="#E9E8DF" />
          <rect x="36" y="290" width="236" height="4" fill="#E9E8DF" />
          <rect x="36" y="302" width="262" height="4" fill="#E9E8DF" />
          <rect x="36" y="322" width="84" height="22" fill="none" stroke="#D8D6CC" />
          <rect x="128" y="322" width="84" height="22" fill="none" stroke="#D8D6CC" />

          <rect className="p-hit p-h1" x="31" y="107" width="32" height="32" fill="none" stroke="#E23A1A" strokeWidth="1.5" strokeDasharray="4 3" />
          <rect className="p-hit p-h2" x="46" y="166" width="262" height="28" fill="none" stroke="#E23A1A" strokeWidth="1.5" strokeDasharray="4 3" />
          <rect className="p-hit p-h3" x="47" y="219" width="90" height="32" fill="none" stroke="#E23A1A" strokeWidth="1.5" strokeDasharray="4 3" />
          <g className="p-scan">
            <rect x="21" y="100" width="318" height="38" fill="#E23A1A" opacity=".07" />
            <rect x="21" y="137" width="318" height="2" fill="#E23A1A" />
          </g>

          <g className="p-card">
            <rect x="412" y="122" width="340" height="190" fill="#131210" />
            <rect x="406" y="116" width="340" height="190" fill="#FFFFFF" stroke="#131210" strokeWidth="1.5" />
          </g>
          <g className="p-in54">
            <rect x="424" y="136" width="44" height="44" fill={logoUrl ? '#FFFFFF' : primary} />
            {logoUrl ? (
              <image href={logoUrl} x="426" y="138" width="40" height="40" preserveAspectRatio="xMidYMid meet" />
            ) : (
              <text x="446" y="167" textAnchor="middle" fontFamily={serif} fontWeight="700" fontSize="26" fill="#F3F2EC">{initial}</text>
            )}
            <rect x="694" y="134" width="16" height="16" fill={primary} />
            <rect x="714" y="134" width="16" height="16" fill={secondary} stroke="#131210" strokeWidth="1" />
          </g>
          <text className="p-name" x="482" y="156" fontFamily={font} fontWeight="600" fontSize="22" fill="#131210">Ada Park</text>
          <text className="p-title" x="482" y="175" fontFamily={font} fontSize="11.5" fill="#5E5A52">Head of Partnerships, {name}</text>
          <line className="p-rule" x1="424" y1="196" x2="728" y2="196" stroke={primary} strokeWidth="2" />
          <text className="p-contact" x="424" y="219" fontFamily={mono} fontSize="10" fill="#5E5A52">ada@{d} · +1 415 555 0142</text>
          <g className="p-cta">
            <rect x="424" y="234" width="116" height="28" fill={secondary} />
            <text x="436" y="252" fontFamily={font} fontWeight="600" fontSize="11" fill="#131210">Book a call →</text>
          </g>
          <text x="406" y="344" fontFamily={mono} fontSize="9.5" letterSpacing="1.4" fill="#5E5A52">TABLE HTML · INLINE CSS · GMAIL-SAFE</text>

          <g className="p-chip c-logo">
            <rect x="36" y="112" width="22" height="22" fill={primary} />
            <text x="47" y="128" textAnchor="middle" fontFamily={serif} fontWeight="700" fontSize="14" fill="#F3F2EC">{initial}</text>
          </g>
          <rect className="p-chip c-a" x="300" y="156" width="16" height="16" fill={primary} stroke="#F3F2EC" strokeWidth="1.5" />
          <rect className="p-chip c-b" x="136" y="226" width="16" height="16" fill={secondary} stroke="#131210" strokeWidth="1" />
          <g className="p-chip c-type">
            <rect x="258" y="166" width="38" height="28" fill="#FFFFFF" stroke="#131210" />
            <text x="264" y="187" fontFamily={font} fontWeight="600" fontSize="18" fill="#131210">Aa</text>
          </g>

          <g className="p-seal">
            <circle cx="716" cy="290" r="28" fill="#E23A1A" />
            <circle cx="716" cy="290" r="22" fill="none" stroke="#F3F2EC" strokeWidth="1" />
            <text x="716" y="298" textAnchor="middle" style={{ fontFamily: 'var(--font-display)' }} fontWeight="800" fontSize="22" fill="#F3F2EC">S</text>
          </g>
        </g>
      </svg>

      <ol className="p-caps mt-3 grid grid-cols-5 font-mono text-[0.6rem] uppercase tracking-[0.12em]" aria-hidden>
        {['Paste', 'Read', 'Lift', 'Set', 'Seal'].map((c) => (
          <li key={c} className="pt-2">{c}</li>
        ))}
      </ol>
      </div>

      {mode === 'attract' && !ended && (
        <button
          type="button"
          onClick={() => setHeld((h) => !h)}
          aria-pressed={held}
          className="absolute right-0 top-0 px-2 py-1 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted hover:text-ink motion-reduce:hidden"
        >
          {held ? 'Play' : 'Pause'} <span className="sr-only">animation</span>
        </button>
      )}
    </div>
  );
}
