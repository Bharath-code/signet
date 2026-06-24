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
  markdown: string;
  links: string[];
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

function scrapeOnce(url: string, maxAge: number) {
  return client.scrape(url, {
    // markdown = clean contact text for the LLM; html = logo URLs; links = deterministic
    // social discovery; screenshot = colors/font/logo for the vision pass.
    formats: ['markdown', 'html', 'links', 'screenshot'],
    onlyMainContent: false,   // footers hold socials + contact — keep them
    blockAds: true,
    removeBase64Images: true, // keep payload lean
    proxy: 'auto',            // auto-escalate to stealth on bot walls
    maxAge,
  });
}

export async function scrapeSite(url: string): Promise<ScrapeResult> {
  if (!process.env.FIRECRAWL_API_KEY) throw new Error('FIRECRAWL_API_KEY is not set');
  let doc = await scrapeOnce(url, 60 * 60 * 1000); // serve Firecrawl's cache if <1h old: faster + cheaper
  // Don't build a brand kit out of an error page. On an origin failure (e.g.
  // Cloudflare 525, a 404, a 503 interstitial) Firecrawl still returns 200 with the
  // error page's HTML — extracting it yields the error page's colors/title as the
  // "brand". A transient failure can also get *cached* and re-served for up to maxAge,
  // so on an error status retry once bypassing the cache; the site may have recovered.
  let status = doc.metadata?.statusCode;
  if (typeof status === 'number' && status >= 400) {
    doc = await scrapeOnce(url, 0);
    status = doc.metadata?.statusCode;
  }
  if (typeof status === 'number' && status >= 400) {
    throw new Error(`origin returned HTTP ${status}`);
  }
  const html = (doc.html ?? '').slice(0, 20000);
  const markdown = (doc.markdown ?? '').slice(0, 20000);
  const links = Array.isArray(doc.links) ? doc.links : [];
  const screenshotUrl = doc.screenshot ?? '';
  if (!screenshotUrl) throw new Error('Firecrawl returned no screenshot');
  // use the post-redirect URL so CTA buttons link to the real canonical URL
  const finalUrl = doc.metadata?.url ?? url;
  return { html, markdown, links, screenshotUrl, finalUrl, fallbackKit: fallbackKitFromMeta(doc.metadata ?? {}, html) };
}
