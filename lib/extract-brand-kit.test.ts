import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractBrandKit } from './extract-brand-kit';
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
      markdown: 'Welcome to Existing Corp',
      fcJson: {
        contactName: 'John Doe',
        contactRole: 'CEO',
        contactEmail: 'john@example.com',
        contactPhone: '+1234567890',
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
    expect(result.contact.email).toBe('john@example.com');
    expect(result.contact.phone).toBe('+1234567890');
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
      fcJson: {
        contactName: 'Extracted Name',
        contactRole: 'Extracted Role',
        contactEmail: 'extracted@example.com',
      },
    });

    expect(result.contact.fullName).toBe('Extracted Name');
    expect(result.contact.jobTitle).toBe('Extracted Role');
    expect(result.contact.email).toBe('extracted@example.com');
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
      fcJson: {
        companyName: 'Json Co',
        logoUrl: 'https://example.com/logo.png',
        primaryColor: '#e23a1a',
        secondaryColor: '#131210',
        fontFamily: 'Inter',
        contactEmail: 'founder@example.com',
      },
    });

    expect(result.source).toBe('extract');
    expect(result.brandKit.companyName).toBe('Json Co');
    expect(result.brandKit.primaryColor).toBe('#e23a1a');
    expect(result.contact.email).toBe('founder@example.com');
  });
});
