import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractBrandKit, fcColorsConfident, realPhone, realEmail } from './extract-brand-kit';
import { NEUTRAL_BRAND_KIT } from './brand-kit-schema';
import type { BrandingProfile } from '@mendable/firecrawl-js';

const { mockSearch } = vi.hoisted(() => ({
  mockSearch: vi.fn(),
}));

vi.mock('./scrape-site', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    firecrawlClient: { search: mockSearch },
  };
});

const BRANDING: BrandingProfile = {
  colors: { primary: '#D4FF33', secondary: '#0c0c0c' },
  images: { logo: 'https://example.com/logo.png' },
  typography: { fontFamilies: { heading: 'Inter' } },
};

const CSS_HTML = '<style>:root{--color-primary:#D4FF33;--color-secondary:#0c0c0c}</style>';
const FALLBACK_KIT = { ...NEUTRAL_BRAND_KIT, companyName: 'Existing Corp' };
const SCREENSHOT_URL = 'https://example.com/screenshot.png';
const BASE_URL = 'https://example.com';

describe('deterministic path — contact extraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extracts contact info from scrape JSON mode when deterministic brand kit is complete', async () => {
    mockSearch.mockResolvedValue({ web: [] });

    const result = await extractBrandKit(CSS_HTML, SCREENSHOT_URL, {
      branding: BRANDING,
      fallbackKit: FALLBACK_KIT,
      baseUrl: BASE_URL,
      links: ['https://linkedin.com/in/johndoe'],
      markdown: 'Welcome to Existing Corp. Reach us at john@existingcorp.com',
      fcJson: {
        contactName: 'John Doe',
        contactRole: 'CEO',
        contactEmail: 'john@existingcorp.com',
        contactPhone: '+1 (415) 992-4600',
      },
    });

    expect(result.source).toBe('firecrawl');
    expect(result.brandKit.companyName).toBe('Existing Corp');
    expect(result.brandKit.logoUrl).toBe('https://example.com/logo.png');
    expect(result.brandKit.primaryColor).toBe('#d4ff33');
    expect(result.brandKit.secondaryColor).toBe('#0c0c0c');
    expect(result.brandKit.fontFamily).toBe('Inter');
    expect(result.contact.fullName).toBe('John Doe');
    expect(result.contact.jobTitle).toBe('CEO');
    expect(result.contact.email).toBe('john@existingcorp.com');
    expect(result.contact.phone).toBe('+1 (415) 992-4600');
    expect(result.contact.linkedin).toBe('https://linkedin.com/in/johndoe');
  });

  it('falls back to page title for contact when JSON mode returned nothing', async () => {
    mockSearch.mockResolvedValue({ web: [] });

    const html = CSS_HTML + '\n<p>Contact: jane@example.com</p>';

    const result = await extractBrandKit(html, SCREENSHOT_URL, {
      branding: BRANDING,
      fallbackKit: FALLBACK_KIT,
      baseUrl: BASE_URL,
      markdown: 'Email: jane@example.com',
      htmlSnippets: '<title>Jane Smith | Head of Design</title>\n<p>jane@example.com</p>',
      pageTitle: 'Jane Smith | Head of Design',
    });

    expect(result.source).toBe('firecrawl');
    expect(result.contact.fullName).toBe('Jane Smith');
    expect(result.contact.jobTitle).toBe('Head of Design');
    expect(result.contact.email).toBe('jane@example.com');
    expect(result.contact.phone).toBeUndefined();
  });

  it('prefers JSON-mode contact over HTML fallback when both are available', async () => {
    mockSearch.mockResolvedValue({ web: [] });

    const result = await extractBrandKit(CSS_HTML, SCREENSHOT_URL, {
      branding: BRANDING,
      fallbackKit: FALLBACK_KIT,
      baseUrl: BASE_URL,
      pageTitle: 'Brand Co | Products',
      markdown: 'Reach the team: extracted@existingcorp.com',
      fcJson: {
        contactName: 'Extracted Name',
        contactRole: 'Extracted Role',
        contactEmail: 'extracted@existingcorp.com',
      },
    });

    expect(result.contact.fullName).toBe('Extracted Name');
    expect(result.contact.jobTitle).toBe('Extracted Role');
    expect(result.contact.email).toBe('extracted@existingcorp.com');
  });

  it('corrects job-title-looking company name from search validation', async () => {
    mockSearch.mockResolvedValue({
      web: [{ title: 'Frontend Engineer' }],
    });

    const fbWithJobTitle = { ...NEUTRAL_BRAND_KIT, companyName: 'Frontend Engineer' };

    const result = await extractBrandKit(CSS_HTML, SCREENSHOT_URL, {
      branding: BRANDING,
      fallbackKit: fbWithJobTitle,
      baseUrl: BASE_URL,
      pageTitle: 'Bharathkumar Palanisamy | Frontend Engineer',
    });

    expect(result.source).toBe('firecrawl');
    expect(result.brandKit.companyName).toBe('Bharathkumar Palanisamy');
  });

  it('returns empty contact when both JSON mode and HTML fallback yield nothing', async () => {
    mockSearch.mockResolvedValue({ web: [] });

    const result = await extractBrandKit(CSS_HTML, SCREENSHOT_URL, {
      branding: BRANDING,
      fallbackKit: FALLBACK_KIT,
      baseUrl: BASE_URL,
      markdown: 'No contact info here',
      htmlSnippets: '<title>Just a page</title>',
    });

    expect(result.source).toBe('firecrawl');
    expect(result.contact.fullName).toBeUndefined();
    expect(result.contact.jobTitle).toBeUndefined();
    expect(result.contact.email).toBeUndefined();
    expect(result.contact.phone).toBeUndefined();
    expect(result.brandKit.companyName).toBe('Existing Corp');
  });
});

describe('vision-unavailable merge path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('serves a real kit from fcJson with source extract when vision fails and kit is incomplete', async () => {
    mockSearch.mockResolvedValue({ web: [] });

    // No branding, no CSS vars, neutral fallback → deterministic kit incomplete
    // → vision path runs; GOOGLE_GENERATIVE_AI_API_KEY is unset in vitest, so
    // generateObject throws and geminiResult stays undefined (the outage case).
    const result = await extractBrandKit('<html></html>', SCREENSHOT_URL, {
      fallbackKit: NEUTRAL_BRAND_KIT,
      baseUrl: BASE_URL,
      markdown: 'Contact founder@existingcorp.com',
      fcJson: {
        companyName: 'Json Co',
        logoUrl: 'https://example.com/logo.png',
        primaryColor: '#e23a1a',
        secondaryColor: '#131210',
        fontFamily: 'Inter',
        contactEmail: 'founder@existingcorp.com',
      },
    });

    expect(result.source).toBe('extract');
    expect(result.brandKit.companyName).toBe('Json Co');
    expect(result.brandKit.primaryColor).toBe('#e23a1a');
    expect(result.contact.email).toBe('founder@existingcorp.com');
  });
});

// Regression: moritzlegal.com (measured 2026-07-25). Firecrawl's branding LLM
// failed, it degraded to computed styles, and reported the page's unstyled
// browser-default link color as primary — with confidence.colors = 0.
describe('fcColorsConfident + link-blue gating of Firecrawl colors', () => {
  const LOW_CONFIDENCE = { colors: 0, buttons: 0, overall: 0 };

  it('reads Firecrawl self-reported color confidence', () => {
    expect(fcColorsConfident(undefined)).toBe(true);                                  // absent → assume ok
    expect(fcColorsConfident({} as BrandingProfile)).toBe(true);
    expect(fcColorsConfident({ confidence: { colors: 0.8 } } as unknown as BrandingProfile)).toBe(true);
    expect(fcColorsConfident({ confidence: LOW_CONFIDENCE } as unknown as BrandingProfile)).toBe(false);
  });

  it('drops a link-blue primary when Firecrawl reports zero color confidence', async () => {
    const result = await extractBrandKit('<html></html>', SCREENSHOT_URL, {
      fallbackKit: NEUTRAL_BRAND_KIT,
      baseUrl: BASE_URL,
      branding: {
        colors: { primary: '#0000ee', secondary: '#000000' },
        images: { logo: 'https://example.com/logo.png' },
        confidence: LOW_CONFIDENCE,
      } as unknown as BrandingProfile,
    });

    // Falls through to fc.secondaryColor → monochrome, which is what the site is.
    expect(result.brandKit.primaryColor).not.toBe('#0000ee');
    expect(result.brandKit.primaryColor).toBe('#000000');
  });

  it('keeps a saturated blue when Firecrawl IS confident (real tech-brand blues)', async () => {
    const result = await extractBrandKit('<html></html>', SCREENSHOT_URL, {
      fallbackKit: NEUTRAL_BRAND_KIT,
      baseUrl: BASE_URL,
      branding: {
        colors: { primary: '#0000ee', secondary: '#000000' },
        images: { logo: 'https://example.com/logo.png' },
        confidence: { colors: 0.9, buttons: 0.9, overall: 0.9 },
      } as unknown as BrandingProfile,
    });

    expect(result.brandKit.primaryColor).toBe('#0000ee');
  });
});

describe('realPhone', () => {
  it('drops invented placeholder numbers', () => {
    // The one actually observed from Firecrawl JSON mode on moritzlegal.com.
    expect(realPhone('+1 (555) 555-5555')).toBeUndefined();
    expect(realPhone('555-0143')).toBeUndefined();          // NANP reserved-fiction range
    expect(realPhone('(415) 555-2671')).toBeUndefined();    // Hollywood 555 exchange
    expect(realPhone('123-456-7890')).toBeUndefined();      // keypad walk
    expect(realPhone('000-000-0000')).toBeUndefined();      // repeated digit
    expect(realPhone('1111111111')).toBeUndefined();
    expect(realPhone('12345')).toBeUndefined();             // too short
    expect(realPhone('1234567890123456')).toBeUndefined();  // past E.164
    expect(realPhone(undefined)).toBeUndefined();
    expect(realPhone('')).toBeUndefined();
  });

  it('keeps real numbers, preserving the original formatting', () => {
    expect(realPhone('+1 (415) 992-4600')).toBe('+1 (415) 992-4600');
    expect(realPhone('+44 20 7946 0958')).toBe('+44 20 7946 0958');
    expect(realPhone('+91 80 4123 5678')).toBe('+91 80 4123 5678');
    expect(realPhone('  212-736-3100  ')).toBe('212-736-3100');   // trimmed, not reformatted
    expect(realPhone('+49 30 901820')).toBe('+49 30 901820');
  });

  it('does not apply the 555 rule to non-NANP numbers', () => {
    // +44 555-shaped digits are a real UK-length number, not Hollywood fiction.
    expect(realPhone('+44 1555 662000')).toBe('+44 1555 662000');
  });
});

describe('realEmail', () => {
  const PAGE = '<a href="mailto:founder@acme.com">Contact</a> or press@acme.com';

  it('rejects reserved and placeholder addresses outright', () => {
    expect(realEmail('you@example.com')).toBeUndefined();
    expect(realEmail('a@b.test')).toBeUndefined();
    expect(realEmail('a@b.invalid')).toBeUndefined();
    expect(realEmail('your@acme.com')).toBeUndefined();
    expect(realEmail('youremail@acme.com')).toBeUndefined();
    expect(realEmail('firstname.lastname@acme.com')).toBeUndefined();
    expect(realEmail('john.doe@acme.com')).toBeUndefined();
    expect(realEmail('name@acme.com')).toBeUndefined();
    expect(realEmail('not-an-email')).toBeUndefined();
    expect(realEmail('missing@tld')).toBeUndefined();
    expect(realEmail(undefined)).toBeUndefined();
  });

  it('drops an address the scraped page never mentions', () => {
    // The moritzlegal.com failure mode: plausible shape, correct domain, invented.
    expect(realEmail('contact@acme.com', PAGE)).toBeUndefined();
    expect(realEmail('founder@acme.com', PAGE)).toBe('founder@acme.com');
    expect(realEmail('press@acme.com', PAGE)).toBe('press@acme.com');
  });

  it('sees through mailto and entity obfuscation', () => {
    expect(realEmail('hi@acme.com', 'mailto:hi%40acme.com')).toBe('hi@acme.com');
    expect(realEmail('hi@acme.com', 'hi&#64;acme.com')).toBe('hi@acme.com');
    expect(realEmail('HI@Acme.com', PAGE.replace('founder', 'hi'))).toBe('HI@Acme.com');
  });

  it('skips the presence check when no page text is supplied', () => {
    expect(realEmail('founder@acme.com')).toBe('founder@acme.com');
    expect(realEmail('mailto:founder@acme.com')).toBe('founder@acme.com');
  });
});

describe('low-confidence accent routes to vision instead of defaulting to ink', () => {
  it('leaves primaryColor unresolved rather than silently taking fc.secondaryColor', async () => {
    // moritzlegal.com shape: failed branding run, link-blue primary, ink secondary,
    // and no CSS token to recover from. Taking #000000 here would mark the kit
    // complete and skip vision — shipping a black bar for a site with a real accent.
    const result = await extractBrandKit('<html></html>', SCREENSHOT_URL, {
      fallbackKit: NEUTRAL_BRAND_KIT,
      baseUrl: BASE_URL,
      branding: {
        colors: { primary: '#0000ee', secondary: '#000000' },
        images: { logo: 'https://example.com/logo.png' },
        confidence: { colors: 0, buttons: 0, overall: 0 },
      } as unknown as BrandingProfile,
    });
    // Vision is unavailable in tests, so this degrades — the point is that it did
    // NOT short-circuit to the deterministic black kit tagged 'firecrawl'.
    expect(result.source).not.toBe('firecrawl');
  });

  it('still takes fc.secondaryColor for a genuinely monochrome site when confident', async () => {
    const result = await extractBrandKit(CSS_HTML, SCREENSHOT_URL, {
      fallbackKit: FALLBACK_KIT,
      baseUrl: BASE_URL,
      markdown: 'Existing Corp',
      branding: {
        colors: { secondary: '#0c0c0c' },
        images: { logo: 'https://example.com/logo.png' },
        typography: { fontFamilies: { heading: 'Inter' } },
        confidence: { colors: 0.9, buttons: 0.9, overall: 0.9 },
      } as unknown as BrandingProfile,
    });
    expect(result.brandKit.primaryColor).toBe('#d4ff33'); // CSS token still wins
  });
});

describe('a vivid CSS brand token outranks a link-blue Firecrawl accent', () => {
  // moritzlegal.com, measured 2026-07-26: Firecrawl returned #0000ee at
  // confidence 0.9 while the page's own Framer tokens carried #b58159.
  const FRAMER_VARS = '--token-33c274b3: #b58159;--token-a889: #000;--token-e6c9: #fff';

  it('prefers the CSS token even when Firecrawl reports high confidence', async () => {
    const result = await extractBrandKit('<html></html>', SCREENSHOT_URL, {
      fallbackKit: FALLBACK_KIT,
      baseUrl: BASE_URL,
      cssVars: FRAMER_VARS,
      branding: {
        colors: { primary: '#0000ee', secondary: '#000000' },
        images: { logo: 'https://example.com/logo.png' },
        typography: { fontFamilies: { heading: 'Inter' } },
        confidence: { colors: 0.9, buttons: 0.9, overall: 0.9 },
      } as unknown as BrandingProfile,
    });
    expect(result.brandKit.primaryColor).toBe('#b58159');
  });

  it('keeps a non-link-blue Firecrawl accent ahead of the CSS token', async () => {
    const result = await extractBrandKit('<html></html>', SCREENSHOT_URL, {
      fallbackKit: FALLBACK_KIT,
      baseUrl: BASE_URL,
      cssVars: FRAMER_VARS,
      branding: {
        colors: { primary: '#e23a1a', secondary: '#000000' },
        images: { logo: 'https://example.com/logo.png' },
        typography: { fontFamilies: { heading: 'Inter' } },
        confidence: { colors: 0.9, buttons: 0.9, overall: 0.9 },
      } as unknown as BrandingProfile,
    });
    expect(result.brandKit.primaryColor).toBe('#e23a1a');
  });
});
