import { describe, it, expect } from 'vitest';
import { brandColorsFromCss, isLinkBlue } from './extract-colors';

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
