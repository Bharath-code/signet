import { describe, it, expect } from 'vitest';
import { isLikelyImageUrl, isSvgUrl, isPoorLogoUrl, isSocialCardUrl, logoSizeHint, pickEmailLogo } from './logo-url';

describe('isLikelyImageUrl', () => {
  it('accepts image paths (with or without extension)', () => {
    expect(isLikelyImageUrl('https://x.com/logo.svg')).toBe(true);
    expect(isLikelyImageUrl('https://x.com/favicon.ico')).toBe(true);
    expect(isLikelyImageUrl('https://cdn.x.com/assets/brand')).toBe(true); // extensionless CDN logo
  });

  it('rejects the bare homepage the model returns when no logo exists', () => {
    expect(isLikelyImageUrl('https://brittanychiang.com/')).toBe(false);
    expect(isLikelyImageUrl('https://x.com')).toBe(false);
  });

  it('rejects HTML pages and non-http(s) schemes', () => {
    expect(isLikelyImageUrl('https://x.com/about.html')).toBe(false);
    expect(isLikelyImageUrl('data:image/png;base64,AAAA')).toBe(false);
    expect(isLikelyImageUrl('not a url')).toBe(false);
  });
});

describe('isSvgUrl', () => {
  it('detects .svg paths and svg data-URIs, ignoring query strings', () => {
    expect(isSvgUrl('https://x.com/logo.svg')).toBe(true);
    expect(isSvgUrl('https://x.com/logo.svg?v=2')).toBe(true);
    expect(isSvgUrl('data:image/svg+xml,<svg/>')).toBe(true);
    expect(isSvgUrl('https://x.com/logo.png')).toBe(false);
  });
});

describe('logoSizeHint / isPoorLogoUrl', () => {
  it('reads the NxN size convention, taking the smaller side', () => {
    expect(logoSizeHint('https://x.com/favicon-16x16.png')).toBe(16);
    expect(logoSizeHint('https://x.com/android-chrome-512x512.png')).toBe(512);
    expect(logoSizeHint('https://x.com/icon-128.png')).toBeUndefined(); // no NxN — not penalised
  });

  it('flags .ico and sub-48px favicons, not real marks', () => {
    expect(isPoorLogoUrl('https://x.com/favicon.ico')).toBe(true);
    expect(isPoorLogoUrl('https://x.com/favicon-16x16.png')).toBe(true);
    expect(isPoorLogoUrl('https://x.com/favicon-32x32.png')).toBe(true);
    expect(isPoorLogoUrl('https://x.com/android-chrome-512x512.png')).toBe(false);
    expect(isPoorLogoUrl('https://x.com/apple-touch-icon.png')).toBe(false);
  });
});

describe('isSocialCardUrl', () => {
  it('spots the og:image naming conventions seen in the eval', () => {
    for (const u of [
      'https://x.com/og-home-not-x.png', 'https://x.com/static/og/homepage.jpg',
      'https://x.com/images/og/default.png', 'https://x.com/supabase-og.png',
      'https://x.com/og.png', 'https://x.com/opengraph-image.png', 'https://x.com/static/cover.png',
    ]) expect(isSocialCardUrl(u), u).toBe(true);
  });

  it('does not flag real marks that merely contain the letters', () => {
    for (const u of [
      'https://x.com/logo.png', 'https://x.com/fluidicon.png',
      'https://x.com/apple-touch-icon.png', 'https://x.com/android-chrome-512x512.png',
    ]) expect(isSocialCardUrl(u), u).toBe(false);
  });
});

describe('pickEmailLogo', () => {
  it('prefers a raster candidate over an SVG regardless of order', () => {
    expect(pickEmailLogo('https://x.com/a.svg', 'https://x.com/b.png')).toBe('https://x.com/b.png');
  });

  // Regression guard: demoting .ico here once inverted the caller's deliberate
  // square-mark > favicon > og:image ordering, handing 8 of 20 eval sites a wide
  // marketing banner instead of a small correct mark. Position must stay priority.
  it('keeps caller order — a .ico favicon still beats a later og:image card', () => {
    expect(pickEmailLogo('https://x.com/favicon.ico', 'https://x.com/og-home.png'))
      .toBe('https://x.com/favicon.ico');
    expect(pickEmailLogo('https://x.com/favicon-16x16.png', 'https://x.com/images/og/default.png'))
      .toBe('https://x.com/favicon-16x16.png');
  });

  it('treats extensionless CDN URLs as renderable (raster)', () => {
    expect(pickEmailLogo('https://x.com/a.svg', 'https://cdn.x.com/brand')).toBe('https://cdn.x.com/brand');
  });

  it('falls back to SVG only when no raster exists', () => {
    expect(pickEmailLogo('https://x.com/a.svg')).toBe('https://x.com/a.svg');
  });

  it('skips invalid candidates and returns undefined when none are images', () => {
    expect(pickEmailLogo(undefined, 'https://x.com/', 'not a url')).toBeUndefined();
    expect(pickEmailLogo(null, undefined)).toBeUndefined();
  });
});
