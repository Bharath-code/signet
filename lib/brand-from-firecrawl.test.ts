import { describe, it, expect } from 'vitest';
import { brandKitFromFirecrawl } from './brand-from-firecrawl';

describe('brandKitFromFirecrawl', () => {
  it('returns empty for undefined/empty branding', () => {
    expect(brandKitFromFirecrawl(undefined)).toEqual({});
    expect(brandKitFromFirecrawl({})).toEqual({
      primaryColor: undefined,
      secondaryColor: undefined,
      logoUrl: undefined,
      fontFamily: undefined,
    });
  });

  it('maps colors, logo, and heading font from a full profile', () => {
    const out = brandKitFromFirecrawl({
      colors: { primary: '#E23A1A', secondary: '#131210' },
      images: { logo: 'https://acme.com/logo.png', favicon: 'https://acme.com/fav.ico' },
      typography: { fontFamilies: { heading: 'Bricolage Grotesque', primary: 'Hanken Grotesk' } },
    });
    expect(out).toEqual({
      primaryColor: '#e23a1a',
      secondaryColor: '#131210',
      logoUrl: 'https://acme.com/logo.png',
      fontFamily: 'Bricolage Grotesque',
    });
  });

  it('prefers a raster favicon over an SVG logo (Gmail does not render SVG)', () => {
    expect(brandKitFromFirecrawl({
      images: { logo: 'https://acme.com/logo.svg', favicon: 'https://acme.com/fav.png' },
    }).logoUrl).toBe('https://acme.com/fav.png');
  });

  it('uses the SVG logo only when no raster candidate exists', () => {
    expect(brandKitFromFirecrawl({ images: { logo: 'https://acme.com/logo.svg' } }).logoUrl)
      .toBe('https://acme.com/logo.svg');
  });

  it('falls back accent→primary, textPrimary→secondary; rgb() → hex', () => {
    const out = brandKitFromFirecrawl({
      colors: { accent: 'rgb(226, 58, 26)', textPrimary: '#000' },
    });
    expect(out.primaryColor).toBe('#e23a1a');
    expect(out.secondaryColor).toBe('#000000');
  });

  it('top-level logo beats ogImage/favicon; font from fonts[] when typography absent', () => {
    const out = brandKitFromFirecrawl({
      logo: 'https://x.com/top.png',
      images: { ogImage: 'https://x.com/og.png', favicon: 'https://x.com/f.ico' },
      fonts: [{ family: 'Inter' }],
    });
    expect(out.logoUrl).toBe('https://x.com/top.png'); // images.logo absent → top-level logo wins
    expect(out.fontFamily).toBe('Inter');
  });

  it('uses favicon when no logo present; ignores og:image (a social card)', () => {
    // og:image is excluded from branding logo candidates — fallbackKitFromMeta
    // handles it only as a last resort. So a favicon wins over an og:image here.
    expect(brandKitFromFirecrawl({ images: { ogImage: 'https://x.com/og.png', favicon: 'https://x.com/f.png' } }).logoUrl)
      .toBe('https://x.com/f.png');
    expect(brandKitFromFirecrawl({ images: { ogImage: 'https://x.com/og.png' } }).logoUrl).toBeUndefined();
  });

  it('never uses colors.link as the accent (avoids bogus link-blue)', () => {
    expect(brandKitFromFirecrawl({ colors: { link: '#1a73e8' } }).primaryColor).toBeUndefined();
  });

  it('rejects a near-grey as the accent (monochrome → no fabricated accent)', () => {
    expect(brandKitFromFirecrawl({ colors: { primary: '#94a3b8' } }).primaryColor).toBeUndefined();
  });

  it('picks the most saturated brand color as the accent', () => {
    expect(brandKitFromFirecrawl({ colors: { primary: '#888a8c', accent: '#06b6d4' } }).primaryColor)
      .toBe('#06b6d4');
  });

  it('drops non-color strings', () => {
    const out = brandKitFromFirecrawl({ colors: { primary: 'not-a-color', secondary: '#abc' } });
    expect(out.primaryColor).toBeUndefined();
    expect(out.secondaryColor).toBe('#aabbcc');
  });
});
