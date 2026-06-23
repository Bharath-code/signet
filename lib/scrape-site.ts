import Firecrawl from '@mendable/firecrawl-js';
import { brandKitSchema, NEUTRAL_BRAND_KIT } from './brand-kit-schema';
import type { BrandKit } from './types';

const client = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

type ScrapeMeta = {
  ogSiteName?: string;
  title?: string;
  ogImage?: string;
  favicon?: string;
};

export type ScrapeResult = {
  html: string;
  screenshotUrl: string;
  finalUrl: string;
  // pre-built from Firecrawl metadata alone (no LLM) — used if extraction fails
  fallbackKit: BrandKit;
};

// pull a brand color straight from <meta name="theme-color"> — deterministic, no LLM
export function themeColorFromHtml(html: string): string | undefined {
  const tag = html.match(/<meta[^>]*name=["']theme-color["'][^>]*>/i)?.[0];
  const color = tag?.match(/content=["'](#[0-9a-fA-F]{3,8})["']/)?.[1];
  return color && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color) ? color : undefined;
}

// build the richest brand kit possible from scrape metadata when the LLM is unavailable
export function fallbackKitFromMeta(meta: ScrapeMeta, html: string): BrandKit {
  const httpUrl = (u?: string) => (u && /^https?:\/\//.test(u) ? u : undefined);
  return brandKitSchema.parse({
    companyName: meta.ogSiteName?.trim() || meta.title?.trim() || NEUTRAL_BRAND_KIT.companyName,
    logoUrl: httpUrl(meta.ogImage) || httpUrl(meta.favicon) || NEUTRAL_BRAND_KIT.logoUrl,
    primaryColor: themeColorFromHtml(html) || NEUTRAL_BRAND_KIT.primaryColor,
    secondaryColor: NEUTRAL_BRAND_KIT.secondaryColor,
    fontFamily: NEUTRAL_BRAND_KIT.fontFamily,
  });
}

export async function scrapeSite(url: string): Promise<ScrapeResult> {
  if (!process.env.FIRECRAWL_API_KEY) throw new Error('FIRECRAWL_API_KEY is not set');
  const doc = await client.scrape(url, { formats: ['html', 'screenshot'], onlyMainContent: false });
  const html = (doc.html ?? '').slice(0, 20000);
  const screenshotUrl = doc.screenshot ?? '';
  if (!screenshotUrl) throw new Error('Firecrawl returned no screenshot');
  // use the post-redirect URL so CTA buttons link to the real canonical URL
  const finalUrl = doc.metadata?.url ?? url;
  return { html, screenshotUrl, finalUrl, fallbackKit: fallbackKitFromMeta(doc.metadata ?? {}, html) };
}
