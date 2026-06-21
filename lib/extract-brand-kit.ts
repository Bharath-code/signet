import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { brandKitSchema } from './brand-kit-schema';
import type { BrandKit } from './types';

const HTML_TRUNCATE = 20_000;

export async function extractBrandKit(html: string, screenshotUrl: string): Promise<BrandKit> {
  const truncatedHtml = html.length > HTML_TRUNCATE ? html.slice(0, HTML_TRUNCATE) + '\n...[truncated]' : html;

  const { object } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: brandKitSchema,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              'You are extracting an email-signature brand kit from a company homepage. ' +
              'Return the company name, the absolute URL of the primary logo image, the primary ' +
              'and secondary brand colors as hex codes, and the main heading font family. ' +
              'Prefer the screenshot for colors/font and the HTML for the exact logo URL. ' +
              'HTML (truncated):\n' + truncatedHtml,
          },
          { type: 'image', image: new URL(screenshotUrl) },
        ],
      },
    ],
  });

  return object;
}
