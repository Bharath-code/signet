import { describe, it, expect } from 'vitest';
import { brandColorsFromCss, isLinkBlue, isDefaultLinkBlue } from './extract-colors';

describe('isDefaultLinkBlue', () => {
  it('flags only the browser default anchor colors', () => {
    for (const c of ['#0000ee', '#0000EE', '#00e', '#0000ff']) expect(isDefaultLinkBlue(c), c).toBe(true);
  });
  it('spares real brand blues that share the hue window', () => {
    for (const c of ['#4066f2' /* Mercura */, '#1a73e8', '#0066ff', '#533afd']) expect(isDefaultLinkBlue(c), c).toBe(false);
  });
  it('handles an absent value', () => {
    expect(isDefaultLinkBlue(undefined)).toBe(false);
  });
});

describe('isLinkBlue', () => {
  it('flags generic web link blues', () => {
    for (const c of ['#0000ee', '#1a73e8', '#4285f4', '#0075de', '#005cc5', '#00a3ff', '#0072f5', '#0066ff'])
      expect(isLinkBlue(c), c).toBe(true);
  });
  it('preserves real brand colors that are not link-blue', () => {
    for (const c of ['#533afd' /* Stripe indigo */, '#06b6d4' /* Tailwind cyan */, '#553f83' /* Railway purple */,
                     '#ff4c00' /* Firecrawl orange */, '#72e3ad' /* Supabase green */, '#131210' /* ink */])
      expect(isLinkBlue(c), c).toBe(false);
  });
});

describe('brandColorsFromCss', () => {
  it('refuses a semantic token whose value is the browser default link blue', () => {
    const html = '<style>:root{--brand-primary:#0000ee;--surface:#b58159}</style>';
    expect(brandColorsFromCss(html).primary).toBe('#b58159');
  });

  it('reads semantic CSS tokens', () => {
    const html = '<style>:root{--color-primary:#D4FF33;--color-secondary:#0c0c0c}</style>';
    expect(brandColorsFromCss(html)).toEqual({ primary: '#d4ff33', secondary: '#0c0c0c' });
  });

  it('matches accent/brand names and normalizes shorthand + alpha hex', () => {
    expect(brandColorsFromCss('--brand-500:#1d4ed8;').primary).toBe('#1d4ed8');
    expect(brandColorsFromCss('--accent:#0f0;').primary).toBe('#00ff00');     // #rgb → #rrggbb
    expect(brandColorsFromCss('--primary:#1d4ed8ff;').primary).toBe('#1d4ed8'); // 8-digit → drop alpha
  });

  it('falls back to <meta theme-color> for primary when no tokens', () => {
    const html = '<meta name="theme-color" content="#0a0a0a">';
    expect(brandColorsFromCss(html)).toEqual({ primary: '#0a0a0a' });
  });

  it('ignores non-brand vars and returns empty when nothing matches', () => {
    expect(brandColorsFromCss('--spacing:#fff is not a thing; --z-index:10;')).toEqual({});
    expect(brandColorsFromCss('<div>no css here</div>')).toEqual({});
  });
});

describe('brandColorsFromCss — name-agnostic fallback', () => {
  // Real Framer output (moritzlegal.com, 2026-07-25): every token name is a UUID,
  // so the semantic name match finds nothing and the palette would be discarded.
  const FRAMER = `<style>:root{
    --token-195f2633-a593-4e74-a233-9144ab7e04f4: #0f0e0d;
    --token-e6c91d2f-4677-4f44-8b1b-58d70da702bb: #fff;
    --token-df5d1f2f-8c66-4d93-b03e-7f33f99d3bc0: #706d66;
    --token-68d5eedc-4747-40b4-8132-1a7e989977c0: #fff7ed;
    --token-33c274b3-5346-483a-9f42-906fa34ce48b: #b58159;
    --token-a8898783-aa6a-4e3e-bc1e-52df6de9904e: #000;
    --token-4d35cd96-5fbb-481a-848d-d541ec63209c: #f5e6d3;
    --token-9cc8765a-ecdd-49b2-9925-bfc5fd0fb44d: #050505;
    --token-a4012dd8-ce87-498e-9b8d-d7a15b502485: #fbf6ed;
    --token-6f8e9cd6-ad9c-45d5-87cb-b7f1fd31d01d: #ecf8fe;
    --token-570d9acf-9899-4d80-be6c-2cdf18f97cc7: #f1f2f2;
    --token-93a47330-11ee-4a17-a39a-2c821bb0f886: #e6e7e8;
  }</style>`;

  it('recovers the brand color from opaque (hashed/UUID) token names', () => {
    expect(brandColorsFromCss(FRAMER).primary).toBe('#b58159');
  });

  it('still prefers a semantically named token when one exists', () => {
    const css = '<style>:root{--brand-accent:#D4FF33;--token-abc:#ff0000}</style>';
    expect(brandColorsFromCss(css).primary).toBe('#d4ff33');
  });

  it('ignores neutral-only palettes rather than promoting a near-grey', () => {
    const css = '<style>:root{--token-a:#fff;--token-b:#111;--token-c:#f1f2f2;--token-d:#706d66}</style>';
    expect(brandColorsFromCss(css).primary).toBeUndefined();
  });

  it('does not promote a link-blue token', () => {
    const css = '<style>:root{--token-a:#0000ee;--token-b:#fff;--token-c:#111}</style>';
    expect(brandColorsFromCss(css).primary).toBeUndefined();
  });

  it('falls back to theme-color only when no vivid token exists', () => {
    const css = '<meta name="theme-color" content="#E23A1A"><style>:root{--token-a:#fff}</style>';
    expect(brandColorsFromCss(css).primary).toBe('#e23a1a');
  });
});
