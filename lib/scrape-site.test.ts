import { describe, it, expect } from 'vitest';
import { themeColorFromHtml, fallbackKitFromMeta, brandNameFromTitle, iconFromHtml } from './scrape-site';
import { NEUTRAL_BRAND_KIT } from './brand-kit-schema';

describe('iconFromHtml', () => {
  it('extracts apple-touch-icon and resolves relative hrefs against the page', () => {
    expect(iconFromHtml('<link rel="apple-touch-icon" href="/icons/touch.png">', 'https://acme.com/p'))
      .toBe('https://acme.com/icons/touch.png');
    expect(iconFromHtml('<link rel="apple-touch-icon" sizes="180x180" href="https://cdn.acme.com/t.png">'))
      .toBe('https://cdn.acme.com/t.png');
  });
  it('returns undefined when absent, or relative with no base', () => {
    expect(iconFromHtml('<html></html>')).toBeUndefined();
    expect(iconFromHtml('<link rel="apple-touch-icon" href="/t.png">')).toBeUndefined();
  });
});

describe('brandNameFromTitle', () => {
  it('takes the brand (shortest segment) out of a "Brand | Tagline" title', () => {
    expect(brandNameFromTitle('Stripe | Financial Infrastructure to Grow Your Revenue')).toBe('Stripe');
    expect(brandNameFromTitle('The all-in-one workspace – Notion')).toBe('Notion');
    expect(brandNameFromTitle('Acme - Widgets that work')).toBe('Acme');
  });
  it('leaves a separator-free title and hyphenated brands intact', () => {
    expect(brandNameFromTitle('Brittany Chiang')).toBe('Brittany Chiang');
    expect(brandNameFromTitle('Coca-Cola')).toBe('Coca-Cola');
    expect(brandNameFromTitle('')).toBe('');
  });
});

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
  it('prefers apple-touch-icon over favicon and og:image (social card is last resort)', () => {
    const kit = fallbackKitFromMeta(
      { ogImage: 'https://acme.com/og.png', favicon: 'https://acme.com/fav.png' },
      '<link rel="apple-touch-icon" href="https://acme.com/touch.png">',
      'https://acme.com',
    );
    expect(kit.logoUrl).toBe('https://acme.com/touch.png');
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
