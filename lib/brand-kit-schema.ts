import { z } from 'zod';
import type { BrandKit, SignatureFields } from './types';

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
  logoUrl: 'https://placehold.co/120x40/eeeeee/333333?text=Logo',
  primaryColor: '#333333',
  secondaryColor: '#777777',
  fontFamily: 'Georgia, serif',
};

export const DEMO_FIELDS: SignatureFields = {
  fullName: 'Alex Rivera',
  jobTitle: 'Head of Sales',
  email: 'alex@company.com',
  phone: '+1 (555) 012-3456',
};
