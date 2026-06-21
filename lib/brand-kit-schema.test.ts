import { describe, it, expect } from 'vitest';
import { brandKitSchema, NEUTRAL_BRAND_KIT, DEMO_FIELDS } from './brand-kit-schema';

describe('brandKitSchema', () => {
  it('accepts a valid brand kit', () => {
    const ok = brandKitSchema.safeParse({
      companyName: 'Acme', logoUrl: 'https://x/logo.png',
      primaryColor: '#1a2b3c', secondaryColor: '#ffffff', fontFamily: 'Inter',
    });
    expect(ok.success).toBe(true);
  });

  it('rejects a non-hex primary color', () => {
    const bad = brandKitSchema.safeParse({
      companyName: 'Acme', logoUrl: 'https://x/logo.png',
      primaryColor: 'blue', secondaryColor: '#fff', fontFamily: 'Inter',
    });
    expect(bad.success).toBe(false);
  });

  it('exposes a neutral fallback and demo fields', () => {
    expect(brandKitSchema.safeParse(NEUTRAL_BRAND_KIT).success).toBe(true);
    expect(DEMO_FIELDS.fullName).toBe('Alex Rivera');
  });
});
