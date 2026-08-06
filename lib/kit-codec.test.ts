import { describe, it, expect } from 'vitest';
import { encodeKitParam, decodeKitParam } from './kit-codec';
import type { BrandKit, SignatureFields } from './types';

const kit: BrandKit = {
  companyName: 'Acme Inc',
  logoUrl: 'https://acme.com/logo.png',
  primaryColor: '#e23a1a',
  secondaryColor: '#131210',
  fontFamily: 'Inter, sans-serif',
};

// what useBrandKit produces after extraction — missing fields are '', not undefined
const extractedFields: SignatureFields = {
  fullName: 'Jane Doe', jobTitle: 'CEO', ctaText: 'Book a demo →',
  email: '', phone: '', website: 'https://acme.com/',
  linkedin: '', github: '', x: '', discord: '',
};

// simulate the browser: param goes into a URL, comes back via URLSearchParams
const urlRoundTrip = (param: string): string =>
  new URL(`https://signet.app/app?kit=${param}`).searchParams.get('kit')!;

describe('kit codec', () => {
  it('round-trips a kit with empty-string contact fields (landing handoff)', () => {
    const got = decodeKitParam(urlRoundTrip(encodeKitParam({ brandKit: kit, contact: extractedFields })));
    expect(got).not.toBeNull();
    expect(got!.brandKit).toEqual(kit);
    expect(got!.fields.fullName).toBe('Jane Doe');
    expect(got!.fields.linkedin).toBe('');
  });

  it('round-trips non-ASCII company names through a query string', () => {
    const jp = { ...kit, companyName: '株式会社サンプル' };
    const got = decodeKitParam(urlRoundTrip(encodeKitParam({ brandKit: jp })));
    expect(got?.brandKit.companyName).toBe('株式会社サンプル');
  });

  it('carries edited roles and font (team share)', () => {
    const got = decodeKitParam(urlRoundTrip(encodeKitParam({
      brandKit: kit,
      roles: { ink: '#131210', accent: '#00aa55' },
      font: 'Verdana, Geneva, sans-serif',
    })));
    expect(got?.roles).toEqual({ ink: '#131210', accent: '#00aa55' });
    expect(got?.font).toBe('Verdana, Geneva, sans-serif');
  });

  it('decodes legacy standard-base64 links, including "+ mangled to space"', () => {
    // 'カ日' is chosen so this payload's UTF-8 base64 alignment emits '+' —
    // the exact char URLSearchParams corrupts into a space
    const name = 'カ日';
    const legacy = Buffer.from(
      JSON.stringify({ brandKit: { ...kit, companyName: name }, contact: {} }),
    ).toString('base64');
    expect(legacy).toContain('+');
    expect(decodeKitParam(legacy)?.brandKit.companyName).toBe(name);
    expect(decodeKitParam(legacy.replace(/\+/g, ' '))?.brandKit.companyName).toBe(name);
  });

  it('drops a non-http(s) contact link but keeps the rest of the kit', () => {
    const evil = encodeKitParam({
      brandKit: kit,
      contact: { fullName: 'Ada', linkedin: 'javascript:alert(1)' } as Partial<SignatureFields>,
    });
    const got = decodeKitParam(evil);
    expect(got?.fields.linkedin).toBe('');
    expect(got?.fields.fullName).toBe('Ada');
  });

  it('rejects malformed payloads', () => {
    expect(decodeKitParam('not-base64!!!')).toBeNull();
    expect(decodeKitParam(Buffer.from('{"brandKit":{}}').toString('base64url'))).toBeNull();
  });

  it('round-trips hand-typed editor fields, completing a bare domain', () => {
    const got = decodeKitParam(encodeKitParam({
      brandKit: kit,
      contact: {
        fullName: 'Ada Lovelace', jobTitle: 'Founder',
        email: 'ada@example.com', phone: '+44 20 7946 0000',
        website: 'example.com', linkedin: 'linkedin.com/in/ada',
      } as Partial<SignatureFields>,
    }));
    expect(got?.fields.fullName).toBe('Ada Lovelace');
    expect(got?.fields.email).toBe('ada@example.com');
    expect(got?.fields.phone).toBe('+44 20 7946 0000');
    expect(got?.fields.website).toBe('https://example.com');
    expect(got?.fields.linkedin).toBe('https://linkedin.com/in/ada');
  });

  it('defaults ctaText from the job title when absent', () => {
    const got = decodeKitParam(encodeKitParam({ brandKit: kit, contact: { jobTitle: 'Founder' } }));
    expect(got?.fields.ctaText).toBe('Book a demo →');
  });
});
