import { describe, it, expect } from 'vitest';
import { themeColorFromHtml, fallbackKitFromMeta } from './scrape-site';
import { NEUTRAL_BRAND_KIT } from './brand-kit-schema';

describe('themeColorFromHtml', () => {
  it('reads a hex theme-color meta tag', () => {
    expect(themeColorFromHtml('<meta name="theme-color" content="#1a73e8">')).toBe('#1a73e8');
  });
  it('ignores non-hex or alpha-hex (schema would reject)', () => {
    expect(themeColorFromHtml('<meta name="theme-color" content="rebeccapurple">')).toBeUndefined();
    expect(themeColorFromHtml('<meta name="theme-color" content="#1a73e8ff">')).toBeUndefined();
  });
  it('returns undefined when absent', () => {
    expect(themeColorFromHtml('<html><body>no meta</body></html>')).toBeUndefined();
  });
});

describe('fallbackKitFromMeta', () => {
  it('salvages name, logo, and color from metadata', () => {
    const kit = fallbackKitFromMeta(
      { ogSiteName: 'Acme Co', ogImage: 'https://acme.com/og.png' },
      '<meta name="theme-color" content="#ff5500">',
    );
    expect(kit.companyName).toBe('Acme Co');
    expect(kit.logoUrl).toBe('https://acme.com/og.png');
    expect(kit.primaryColor).toBe('#ff5500');
  });
  it('falls back to favicon then neutral for logo, never a relative url', () => {
    expect(fallbackKitFromMeta({ favicon: 'https://acme.com/fav.ico' }, '').logoUrl).toBe('https://acme.com/fav.ico');
    expect(fallbackKitFromMeta({ favicon: '/favicon.ico' }, '').logoUrl).toBe(NEUTRAL_BRAND_KIT.logoUrl);
    expect(fallbackKitFromMeta({}, '').logoUrl).toBe(NEUTRAL_BRAND_KIT.logoUrl);
  });
  it('always returns a schema-valid kit (empty metadata → neutral)', () => {
    expect(fallbackKitFromMeta({}, '')).toEqual(NEUTRAL_BRAND_KIT);
  });
});
