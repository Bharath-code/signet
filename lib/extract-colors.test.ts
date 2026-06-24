import { describe, it, expect } from 'vitest';
import { brandColorsFromCss } from './extract-colors';

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
