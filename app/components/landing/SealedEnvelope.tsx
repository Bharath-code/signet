'use client';
import { useStage } from './useStage';

// The page opens with a press and closes with a seal: a signature card slides
// into an envelope, the flap folds down, the stamp lands. Three loops, then rests.
export function SealedEnvelope() {
  const ref = useStage<HTMLDivElement>({ play: true, loops: 3, anim: 'e-card', startOnView: true, threshold: 0.3 });

  return (
    <div ref={ref} className="mx-auto w-3/5 md:w-full">
      <svg className="stage-svg block h-auto w-full" viewBox="0 0 360 250" role="img" aria-label="A signature card slides into an envelope, the flap closes and a vermilion seal stamps it shut.">
        <defs>
          <clipPath id="env-clip"><rect x="0" y="0" width="360" height="220" /></clipPath>
        </defs>
        <rect x="60" y="110" width="240" height="110" fill="#E9E8DF" />
        <path className="e-open" d="M60 110 L180 45 L300 110 Z" fill="#D8D6CC" />
        <g clipPath="url(#env-clip)">
          <g className="e-card">
            <rect x="84" y="40" width="192" height="112" fill="#FFFFFF" />
            <rect x="98" y="56" width="28" height="28" fill="#1F4D3A" />
            <rect x="136" y="58" width="90" height="9" fill="#131210" />
            <rect x="136" y="73" width="120" height="6" fill="#D8D6CC" />
            <rect x="98" y="96" width="162" height="2" fill="#1F4D3A" />
            <rect x="98" y="108" width="110" height="6" fill="#D8D6CC" />
            <rect x="98" y="124" width="58" height="16" fill="#F2B33D" />
          </g>
        </g>
        <path d="M60 128 L180 182 L300 128 V220 H60 Z" fill="#F3F2EC" />
        <path className="e-flap" d="M60 110 L180 175 L300 110 Z" fill="#D8D6CC" stroke="#F3F2EC" strokeWidth="1" />
        <g className="e-seal">
          <circle cx="180" cy="172" r="20" fill="#E23A1A" />
          <circle cx="180" cy="172" r="15" fill="none" stroke="#F3F2EC" strokeWidth="1" />
          <text x="180" y="179" textAnchor="middle" style={{ fontFamily: 'var(--font-display)' }} fontWeight="800" fontSize="17" fill="#F3F2EC">S</text>
        </g>
        <text x="180" y="244" textAnchor="middle" fontFamily="JetBrains Mono, ui-monospace, monospace" fontSize="9" letterSpacing="2" fill="rgba(243,242,236,.6)">EXTRACTED · NOT GUESSED</text>
      </svg>
    </div>
  );
}
