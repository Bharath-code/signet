import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractBrandKit, clearExtractCache } from './extract-brand-kit';
import { NEUTRAL_BRAND_KIT } from './brand-kit-schema';
import type { BrandingProfile } from '@mendable/firecrawl-js';

const { mockExtract, mockSearch } = vi.hoisted(() => ({
  mockExtract: vi.fn(),
  mockSearch: vi.fn(),
}));

vi.mock('./scrape-site', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    firecrawlClient: { extract: mockExtract, search: mockSearch },
  };
});

// Shared helpers
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
    clearExtractCache();
  });

  it('extracts contact info from /extract when deterministic brand kit is complete', async () => {
    mockExtract.mockResolvedValue({
      success: true,
      data: {
        contactName: 'John Doe',
        contactRole: 'CEO',
        contactEmail: 'john@example.com',
        contactPhone: '+1234567890',
      },
    });
    mockSearch.mockResolvedValue({ web: [] });

    const result = await extractBrandKit(CSS_HTML, SCREENSHOT_URL, {
      branding: BRANDING,
      fallbackKit: FALLBACK_KIT,
      baseUrl: BASE_URL,
      links: ['https://linkedin.com/in/johndoe'],
      markdown: 'Welcome to Existing Corp',
    });

    // Deterministic path used
    expect(result.source).toBe('firecrawl');

    // Brand kit intact
    expect(result.brandKit.companyName).toBe('Existing Corp');
    expect(result.brandKit.logoUrl).toBe('https://example.com/logo.png');
    expect(result.brandKit.primaryColor).toBe('#d4ff33');
    expect(result.brandKit.secondaryColor).toBe('#0c0c0c');
    expect(result.brandKit.fontFamily).toBe('Inter');

    // Contact info from /extract
    expect(result.contact.fullName).toBe('John Doe');
    expect(result.contact.jobTitle).toBe('CEO');
    expect(result.contact.email).toBe('john@example.com');
    expect(result.contact.phone).toBe('+1234567890');

    // Deterministic socials also present
    expect(result.contact.linkedin).toBe('https://linkedin.com/in/johndoe');

    // /extract was called
    expect(mockExtract).toHaveBeenCalledTimes(1);
  });

  it('falls back to page title for contact when /extract returns null', async () => {
    mockExtract.mockResolvedValue({ success: false, data: null });
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

    // Contact from HTML/title fallback
    expect(result.contact.fullName).toBe('Jane Smith');
    expect(result.contact.jobTitle).toBe('Head of Design');
    expect(result.contact.email).toBe('jane@example.com');
    expect(result.contact.phone).toBeUndefined();
  });

  it('prefers /extract contact over HTML fallback when both are available', async () => {
    mockExtract.mockResolvedValue({
      success: true,
      data: {
        contactName: 'Extracted Name',
        contactRole: 'Extracted Role',
        contactEmail: 'extracted@example.com',
      },
    });
    mockSearch.mockResolvedValue({ web: [] });

    const result = await extractBrandKit(CSS_HTML, SCREENSHOT_URL, {
      branding: BRANDING,
      fallbackKit: FALLBACK_KIT,
      baseUrl: BASE_URL,
      pageTitle: 'Brand Co | Products',
    });

    // /extract contact wins over HTML fallback
    expect(result.contact.fullName).toBe('Extracted Name');
    expect(result.contact.jobTitle).toBe('Extracted Role');
    expect(result.contact.email).toBe('extracted@example.com');
  });

  it('corrects job-title-looking company name from search validation', async () => {
    // /extract returns nothing
    mockExtract.mockResolvedValue({ success: false, data: null });

    // searchValidateCompanyName: input = 'Bharathkumar Palanisamy', search returns
    // a title where brandNameFromTitle picks 'Frontend Engineer' as shortest segment.
    // Since 'Frontend Engineer' ≠ 'Bharathkumar Palanisamy', it returns 'Frontend Engineer'.
    // Single-word title ensures 'Frontend Engineer' IS the shortest (no segmentation).
    mockSearch.mockResolvedValue({
      web: [{ title: 'Frontend Engineer' }],
    });

    // fallbackKit company name = 'Frontend Engineer' triggers the correction
    const fbWithJobTitle = { ...NEUTRAL_BRAND_KIT, companyName: 'Frontend Engineer' };

    const result = await extractBrandKit(CSS_HTML, SCREENSHOT_URL, {
      branding: BRANDING,
      fallbackKit: fbWithJobTitle,
      baseUrl: BASE_URL,
      pageTitle: 'Bharathkumar Palanisamy | Frontend Engineer',
    });

    expect(result.source).toBe('firecrawl');

    // searchName returned 'Frontend Engineer', but preferCompanyNameFromTitle
    // corrects it using the page title
    expect(result.brandKit.companyName).toBe('Bharathkumar Palanisamy');
  });

  it('returns empty contact when both /extract and HTML fallback yield nothing', async () => {
    mockExtract.mockResolvedValue({ success: false, data: null });
    mockSearch.mockResolvedValue({ web: [] });

    const result = await extractBrandKit(CSS_HTML, SCREENSHOT_URL, {
      branding: BRANDING,
      fallbackKit: FALLBACK_KIT,
      baseUrl: BASE_URL,
      markdown: 'No contact info here',
      htmlSnippets: '<title>Just a page</title>',
    });

    expect(result.source).toBe('firecrawl');

    // No contact should be set (pageTitle not provided, no /extract data)
    expect(result.contact.fullName).toBeUndefined();
    expect(result.contact.jobTitle).toBeUndefined();
    expect(result.contact.email).toBeUndefined();
    expect(result.contact.phone).toBeUndefined();

    // Brand kit still intact
    expect(result.brandKit.companyName).toBe('Existing Corp');
  });
});
