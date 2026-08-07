import { z } from 'zod';
import type { BrandKit, SignatureFields } from './types';
import { SITE_URL } from './site';

const hex = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'must be hex color');

export const brandKitSchema = z.object({
  companyName: z.string().min(1),
  logoUrl: z.string().url(),
  primaryColor: hex,
  secondaryColor: hex,
  fontFamily: z.string().min(1),
}) satisfies z.ZodType<BrandKit>;

export const NEUTRAL_BRAND_KIT: BrandKit = {
  companyName: 'Your Company',
  // Self-hosted (public/logo-placeholder.png) — copied fallback signatures must
  // not hotlink a third party forever.
  logoUrl: `${SITE_URL}/logo-placeholder.png`,
  primaryColor: '#333333',
  secondaryColor: '#777777',
  fontFamily: 'Georgia, serif',
};

// Pre-fetch seed kit — vivid and real-looking so the landing hero and the studio
// both render a convincing signature before any URL is submitted (instant-proof
// principle). Never shown as "extracted"; only as the pre-interaction demo state.
export const DEMO_BRAND_KIT: BrandKit = {
  companyName: 'Acme Corp',
  logoUrl: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="34"><rect width="96" height="34" rx="3" fill="#1d4ed8"/><text x="48" y="22" font-family="system-ui,sans-serif" font-size="13" fill="white" text-anchor="middle" font-weight="bold">ACME</text></svg>`
  )}`,
  primaryColor: '#1d4ed8',
  secondaryColor: '#475569',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

export function ctaTextForRole(jobTitle: string): string {
  const t = jobTitle.toLowerCase();
  if (/founder|ceo|owner|co-?founder/.test(t)) return 'Book a demo →';
  if (/sales|account|bd|business.?dev/.test(t)) return 'Schedule a call →';
  if (/market|growth|content/.test(t)) return 'Read the case study →';
  if (/dev|engineer|architect/.test(t)) return 'See the project →';
  return 'Visit website →';
}

export const DEMO_FIELDS: SignatureFields = {
  fullName: 'Alex Rivera',
  jobTitle: 'Head of Sales',
  ctaText: 'Schedule a call →',
  ctaUrl: '',
  email: 'alex@company.com',
  phone: '+1 (555) 012-3456',
  website: 'company.com',
  linkedin: 'https://linkedin.com/in/alexrivera',
  github: '',
  x: '',
  discord: '',
};
