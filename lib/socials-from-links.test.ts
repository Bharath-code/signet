import { describe, it, expect } from 'vitest';
import { socialsFromLinks } from './extract-brand-kit';

describe('socialsFromLinks', () => {
  it('prefers the GitHub profile over a repo link (fewest path segments)', () => {
    const out = socialsFromLinks([
      'https://github.com/Bharath-code/loopkit',
      'https://github.com/Bharath-code',
    ]);
    expect(out.github).toBe('https://github.com/Bharath-code');
  });

  it('prefers a LinkedIn /in/ profile over a company page', () => {
    const out = socialsFromLinks([
      'https://linkedin.com/company/acme',
      'https://linkedin.com/in/alex',
    ]);
    expect(out.linkedin).toBe('https://linkedin.com/in/alex');
  });

  it('picks an X handle, not intent/share links', () => {
    const out = socialsFromLinks([
      'https://x.com/intent/tweet?text=hi',
      'https://x.com/iam_pbk',
    ]);
    expect(out.x).toBe('https://x.com/iam_pbk');
  });

  it('matches twitter.com and discord; ignores unrelated/unsafe links', () => {
    const out = socialsFromLinks([
      'https://twitter.com/someone',
      'https://discord.gg/abc123',
      'javascript:alert(1)',
      'https://example.com/blog',
    ]);
    expect(out.x).toBe('https://twitter.com/someone');
    expect(out.discord).toBe('https://discord.gg/abc123');
  });

  it('returns nothing when no socials are present', () => {
    expect(socialsFromLinks(['https://example.com', 'mailto:a@b.com'])).toEqual({});
  });
});
