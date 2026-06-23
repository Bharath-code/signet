'use client';

import { useEffect, useState } from 'react';
import { register, getFeatureFlag, onFeatureFlags } from './track';

type MarkProps = { size?: number; variant?: 'light' | 'dark' };

/* B · "Block Monogram" — ink square, S, vermilion baseline bar. */
export function SignetMark({ size = 26, variant = 'light' }: MarkProps) {
  const box = variant === 'dark' ? 'var(--color-paper)' : 'var(--color-ink)';
  const letter = variant === 'dark' ? 'var(--color-ink)' : 'var(--color-paper)';
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label="Signet">
      <rect x="2" y="2" width="36" height="36" fill={box} />
      <text
        x="20" y="20"
        fontFamily="var(--font-display)" fontWeight="800" fontSize="24"
        fill={letter} textAnchor="middle" dominantBaseline="central"
      >
        S
      </text>
      <rect x="2" y="33" width="36" height="5" fill="var(--color-accent)" />
    </svg>
  );
}

/* C · "Seal Ring" — concentric rings + vermilion core, letterless stamp. */
export function SealRingMark({ size = 26, variant = 'light' }: MarkProps) {
  const stroke = variant === 'dark' ? 'var(--color-paper)' : 'var(--color-ink)';
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label="Signet">
      <circle cx="20" cy="20" r="18" fill="none" stroke={stroke} strokeWidth="2.4" />
      <circle cx="20" cy="20" r="11" fill="none" stroke={stroke} strokeWidth="1.8" />
      <circle cx="20" cy="20" r="4.5" fill="var(--color-accent)" />
    </svg>
  );
}

export type LogoVariant = 'control' | 'ring'; // control = Block Monogram (baseline)
const STORAGE_KEY = 'signet_logo_variant';
const FLAG_KEY = 'logo-mark'; // PostHog experiment flag, variant keys: control | ring

/* Assignment: PostHog feature flag `logo-mark` when configured, else a stable
   local 50/50 split (keeps dev / no-keys working). Persisted per visitor and
   reported as the `logo_variant` super property so the conversion funnel
   splits by variant. Flags load async, so we re-resolve via onFeatureFlags. */
export function useLogoVariant(): LogoVariant {
  const [variant, setVariant] = useState<LogoVariant>('control'); // SSR-stable default
  useEffect(() => {
    const apply = (v: LogoVariant) => {
      try { localStorage.setItem(STORAGE_KEY, v); } catch { /* storage may be blocked */ }
      register({ logo_variant: v });
      setVariant(v);
    };
    const resolve = () => {
      const flag = getFeatureFlag(FLAG_KEY);
      if (flag === 'control' || flag === 'ring') { apply(flag); return; }
      let v = localStorage.getItem(STORAGE_KEY) as LogoVariant | null;
      if (v !== 'control' && v !== 'ring') v = Math.random() < 0.5 ? 'control' : 'ring';
      apply(v);
    };
    resolve();
    return onFeatureFlags(resolve);
  }, []);
  return variant;
}

/* Renders the assigned A/B mark. `variant` controls light/dark background. */
export function BrandMark({ size = 26, variant = 'light' }: MarkProps) {
  const mark = useLogoVariant();
  return mark === 'ring'
    ? <SealRingMark size={size} variant={variant} />
    : <SignetMark size={size} variant={variant} />;
}
