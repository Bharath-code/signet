import { describe, it, expect } from 'vitest';
import { isLikelyImageUrl, isSvgUrl, pickEmailLogo } from './logo-url';

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

describe('pickEmailLogo', () => {
  it('prefers a raster candidate over an SVG regardless of order', () => {
    expect(pickEmailLogo('https://x.com/a.svg', 'https://x.com/b.png')).toBe('https://x.com/b.png');
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
