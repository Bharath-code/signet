import { describe, it, expect } from 'vitest';
import { renderSignature, ensureReadable, contrastRatio, safeHref } from './render-signature';
import type { BrandKit, SignatureFields } from './types';

const kit: BrandKit = {
  companyName: 'Acme', logoUrl: 'https://x/logo.png',
  primaryColor: '#1a2b3c', secondaryColor: '#aabbcc', fontFamily: 'Inter',
};
const fields: SignatureFields = {
  fullName: 'Alex Rivera', jobTitle: 'Head of Sales',
  email: 'alex@company.com', phone: '+1 (555) 012-3456',
  website: '', linkedin: '', github: '', x: '', discord: '',
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

  it('routes the dark color to text and the vivid color to the raw border accent', () => {
    // vivid+light primary, dark secondary — roles are assigned by property, not label
    const k = { ...kit, primaryColor: '#ffee00', secondaryColor: '#334155' };
    const html = renderSignature(k, fields, 'logo-cta');
    expect(html).not.toContain('color:#ffee00');   // light color never colors text
    expect(html).toContain('color:#334155');         // dark color is the readable ink
    expect(html).toContain('solid #ffee00');         // vivid color is the raw structural accent
  });

  it('is invariant to primary/secondary order — the model swap cannot change the look', () => {
    const a = { ...kit, primaryColor: '#0c0c0c', secondaryColor: '#d4ff33' };
    const b = { ...kit, primaryColor: '#d4ff33', secondaryColor: '#0c0c0c' };
    expect(renderSignature(a, fields, 'logo-cta')).toBe(renderSignature(b, fields, 'logo-cta'));
  });

  it('black + lime brand: dark text, raw lime as the structural accent', () => {
    const k = { ...kit, primaryColor: '#0c0c0c', secondaryColor: '#d4ff33' };
    const html = renderSignature(k, fields, 'logo');
    expect(html).toContain('color:#0c0c0c');   // dark color is the readable ink
    expect(html).toContain('solid #d4ff33');     // lime shows raw — not darkened to olive
  });

  it('escapes a malicious color value (no attribute breakout)', () => {
    const evil = { ...kit, primaryColor: '#1a2b3c" onmouseover="x' };
    const html = renderSignature(evil, fields, 'minimal');
    expect(html).not.toContain('onmouseover="x"');   // raw double-quote breakout did not survive
    expect(html).toContain('&quot;');                  // the quote was escaped
  });

  it('renders visible links as text links; website shows its domain', () => {
    const withLinks: SignatureFields = {
      ...fields, website: 'acme.com', linkedin: 'https://linkedin.com/in/alex', github: '', x: '', discord: '',
    };
    const html = renderSignature(kit, withLinks, 'minimal');
    expect(html).toContain('>acme.com<');            // website renders as domain text
    expect(html).toContain('href="https://acme.com/"');
    expect(html).toContain('>LinkedIn<');            // social renders as platform name
  });

  it('drops a javascript: link instead of rendering it (href is an executable sink)', () => {
    const evil: SignatureFields = { ...fields, website: 'javascript:alert(1)' };
    const html = renderSignature(kit, evil, 'minimal');
    expect(html).not.toContain('javascript:');       // unsafe scheme never reaches href
  });
});

describe('safeHref', () => {
  it('allows http(s) and adds https to bare domains', () => {
    expect(safeHref('https://x.com/a')).toBe('https://x.com/a');
    expect(safeHref('acme.com')).toBe('https://acme.com/');
  });
  it('blocks non-http schemes', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeHref('data:text/html,x')).toBeNull();
    expect(safeHref('')).toBeNull();
  });
});
