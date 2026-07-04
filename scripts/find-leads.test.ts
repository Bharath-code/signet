import { describe, it, expect } from 'vitest';
import { isUsableLead } from './find-leads';

describe('isUsableLead', () => {
  it('rejects aggregator/social domains', () => {
    expect(isUsableLead('https://www.producthunt.com/posts/foo', new Set())).toBe(false);
    expect(isUsableLead('https://news.ycombinator.com/item?id=1', new Set())).toBe(false);
  });

  it('rejects repo-hosting domains', () => {
    expect(isUsableLead('https://github.com/foo/bar', new Set())).toBe(false);
  });

  it('rejects domains already contacted', () => {
    expect(isUsableLead('https://acme.com/pricing', new Set(['acme.com']))).toBe(false);
  });

  it('rejects malformed urls', () => {
    expect(isUsableLead('not-a-url', new Set())).toBe(false);
  });

  it('accepts a fresh company homepage', () => {
    expect(isUsableLead('https://acme.com/pricing', new Set())).toBe(true);
  });
});
