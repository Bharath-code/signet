import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { brandKitSchema } from './brand-kit-schema';
import type { BrandKit, SignatureFields } from './types';

const HTML_TRUNCATE = 20_000;

export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash';

const hex = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'must be hex color');

const combinedSchema = z.object({
  companyName: z.string().min(1),
  logoUrl: z.string().url(),
  primaryColor: hex,
  secondaryColor: hex,
  fontFamily: z.string().min(1),
  contactName: z.string().optional(),
  contactRole: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
});

export type ExtractResult = {
  brandKit: BrandKit;
  contact: Partial<SignatureFields>;
};

export async function extractBrandKit(html: string, screenshotUrl: string): Promise<ExtractResult> {
  const truncatedHtml = html.length > HTML_TRUNCATE ? html.slice(0, HTML_TRUNCATE) + '\n...[truncated]' : html;

  const { object } = await generateObject({
    model: google(GEMINI_MODEL),
    schema: combinedSchema,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              'You are extracting an email-signature brand kit from a personal or company website. ' +
              'Extract: company/site name, absolute logo URL, primary & secondary brand colors (hex), ' +
              'main heading font family. Also extract any contact info visible on the page: ' +
              'the owner\'s full name, job title/role, email address, and phone number. ' +
              'Prefer the screenshot for colors/font and the HTML for logo URL and contact details. ' +
              'Leave contact fields empty if not found — do not guess. ' +
              'HTML (truncated):\n' + truncatedHtml,
          },
          { type: 'image', image: new URL(screenshotUrl) },
        ],
      },
    ],
  });

  const { contactName, contactRole, contactEmail, contactPhone, ...brandFields } = object;

  // validate brand fields through original schema so callers keep the same guarantee
  const brandKit = brandKitSchema.parse(brandFields);

  const contact: Partial<SignatureFields> = {};
  if (contactName) contact.fullName = contactName;
  if (contactRole) contact.jobTitle = contactRole;
  if (contactEmail) contact.email = contactEmail;
  if (contactPhone) contact.phone = contactPhone;

  return { brandKit, contact };
}
