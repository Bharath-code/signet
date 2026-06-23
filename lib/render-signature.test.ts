import { describe, it, expect } from 'vitest';
import { renderSignature, ensureReadable, contrastRatio } from './render-signature';
import type { BrandKit, SignatureFields } from './types';

const kit: BrandKit = {
  companyName: 'Acme', logoUrl: 'https://x/logo.png',
  primaryColor: '#1a2b3c', secondaryColor: '#aabbcc', fontFamily: 'Inter',
};
const fields: SignatureFields = {
  fullName: 'Alex Rivera', jobTitle: 'Head of Sales',
  email: 'alex@company.com', phone: '+1 (555) 012-3456',
};

describe('renderSignature', () => {
  for (const layout of ['minimal', 'logo', 'logo-cta'] as const) {
    it(`${layout}: uses table layout, brand color, and all fields`, () => {
      const html = renderSignature(kit, fields, layout);
      expect(html).toContain('<table');
      expect(html).toContain('#1a2b3c');           // primary color present
      expect(html).toContain('Alex Rivera');
      expect(html).toContain('Head of Sales');
      expect(html).toContain('alex@company.com');
      expect(html).toContain('+1 (555) 012-3456');
      expect(html).toContain('Inter');              // font applied
    });
  }

  it('logo and logo-cta include the logo image', () => {
    expect(renderSignature(kit, fields, 'logo')).toContain('https://x/logo.png');
    expect(renderSignature(kit, fields, 'logo-cta')).toContain('https://x/logo.png');
  });

  it('logo-cta includes the CTA button copy', () => {
    expect(renderSignature(kit, fields, 'logo-cta')).toContain('Visit website');
  });

  it('minimal does NOT include the logo image', () => {
    expect(renderSignature(kit, fields, 'minimal')).not.toContain('https://x/logo.png');
  });

  it('darkens a too-light brand color to AA contrast on white', () => {
    const fixed = ensureReadable('#ffee00');           // bright yellow — fails on white
    expect(contrastRatio(fixed, '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });

  it('leaves an already-dark color unchanged', () => {
    expect(ensureReadable('#1a2b3c')).toBe('#1a2b3c');
    expect(contrastRatio('#1a2b3c', '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });

  it('uses the contrast-safe color for text, never the raw light color', () => {
    const light = { ...kit, primaryColor: '#ffee00' };
    const html = renderSignature(light, fields, 'logo-cta');
    expect(html).toContain(ensureReadable('#ffee00')); // name/email/CTA use the darkened color
    expect(html).not.toContain('color:#ffee00');        // raw light color never colors text
  });

  it('escapes a malicious color value (no attribute breakout)', () => {
    const evil = { ...kit, primaryColor: '#1a2b3c" onmouseover="x' };
    const html = renderSignature(evil, fields, 'minimal');
    expect(html).not.toContain('onmouseover="x"');   // raw double-quote breakout did not survive
    expect(html).toContain('&quot;');                  // the quote was escaped
  });
});
