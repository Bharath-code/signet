import { describe, it, expect } from 'vitest';
import { isLikelyImageUrl } from './extract-brand-kit';

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
