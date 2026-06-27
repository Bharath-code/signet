import Firecrawl from '@mendable/firecrawl-js';
import type { BrandingProfile, Document, FormatString } from '@mendable/firecrawl-js';
import { brandKitSchema, NEUTRAL_BRAND_KIT } from './brand-kit-schema';
import { pickEmailLogo } from './logo-url';
import type { BrandKit } from './types';

const client = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

// Shared for use by extract-brand-kit.ts (search, etc.) without a second instance
export { client as firecrawlClient };

// In-process scrape cache: repeat lookups of the same URL within the same process
// return instantly instead of calling Firecrawl again. Survives eval re-runs and
// API route warmup. TTL matches Firecrawl's own maxAge.
const scrapeCache = new Map<string, { result: ScrapeResult; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const CACHE_MAX = 200;
function cachedScrape(url: string): ScrapeResult | undefined {
  const cached = scrapeCache.get(url.toLowerCase());
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.result;
  return undefined;
}
function setCachedScrape(url: string, result: ScrapeResult): void {
  if (scrapeCache.size >= CACHE_MAX) scrapeCache.clear();
  scrapeCache.set(url.toLowerCase(), { result, ts: Date.now() });
}

// Path suffixes on a site that tend to hold brand assets, team photos, or contact info
const BRAND_PATHS = ['/about', '/contact', '/brand', '/press', '/team', '/logo', '/company'];

type ScrapeMeta = {
  ogSiteName?: string;
  title?: string;
  ogImage?: string;
  favicon?: string;
};

export type ScrapeResult = {
  html: string;
  // P1: semantically relevant HTML snippets (headings, meta, logos) for LLM prompt
  // instead of dumping 20K chars of raw HTML
  htmlSnippets: string;
  markdown: string;
  links: string[];
  screenshotUrl: string;
  finalUrl: string;
  branding?: BrandingProfile;
  fallbackKit: BrandKit;
  lang?: string; // P3: <html lang="xx"> for CJK font mapping
  pageTitle?: string; // The page <title> from Firecrawl metadata (used for contact info fallback)
};

// apple-touch-icon is a clean square PNG brand mark on most sites — the best small
// logo for a signature, ahead of a wide og:image social card. Resolves relative
// hrefs against the page URL; returns only absolute http(s) URLs.
export function iconFromHtml(html: string, baseUrl?: string): string | undefined {
  const tags = html.match(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]*>/gi) ?? [];
  for (const tag of tags) {
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    try {
      const u = new URL(href, baseUrl || undefined);
      if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
    } catch { /* relative href with no base — skip */ }
  }
  return undefined;
}

// pull a brand color straight from <meta name="theme-color"> — deterministic, no LLM
export function themeColorFromHtml(html: string): string | undefined {
  const tag = html.match(/<meta[^>]*name=["']theme-color["'][^>]*>/i)?.[0];
  const color = tag?.match(/content=["'](#[0-9a-fA-F]{3,8})["']/)?.[1];
  return color && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color) ? color : undefined;
}

// Homepage <title>s are usually "Brand | Tagline" or "Tagline – Brand". The brand
// name is the shortest separator-delimited segment (taglines are long); splitting
// only on pipe/colon/dash/middot and space-padded hyphens keeps "Coca-Cola" intact.
export function brandNameFromTitle(title: string): string {
  const parts = title.split(/\s*[|·:–—]\s*|\s+-\s+/).map((p) => p.trim()).filter(Boolean);
  return parts.length ? parts.reduce((a, b) => (b.length < a.length ? b : a)) : '';
}

// Extract only semantically meaningful HTML for the LLM prompt instead of
// dumping 20K chars of raw page HTML. Reduces noise and improves extraction.
const SNIPPET_PATTERNS = [
  /<title[^>]*>.*?<\/title>/gi,
  /<meta[^>]*property="og:[^"]*"[^>]*\/?>/gi,
  /<meta[^>]*name="description"[^>]*\/?>/gi,
  /<meta[^>]*name="theme-color"[^>]*\/?>/gi,
  /<h1[^>]*>[\s\S]*?<\/h1>/gi,
  /<h2[^>]*>[\s\S]*?<\/h2>/gi,
  /<img[^>]*(?:logo|brand)[^>]*>/gi,
  /<link[^>]*rel="(?:icon|apple-touch-icon|shortcut icon)"[^>]*>/gi,
  /class="[^"]*(?:logo|brand|header|nav)[^"]*"/gi,
  /style="[^"]*--(?:primary|accent|brand|color)[^"]*"/gi,
  /<footer[^>]*>[\s\S]{0,1500}<\/footer>/gi,
  /<address[^>]*>[\s\S]{0,800}<\/address>/gi,
];
export function relevantHtmlSnippets(html: string): string {
  const matches = new Set<string>();
  for (const p of SNIPPET_PATTERNS) {
    for (const m of html.matchAll(p)) {
      matches.add(m[0].length > 500 ? m[0].slice(0, 500) + '…' : m[0]);
    }
  }
  return [...matches].join('\n').slice(0, 5000);
}

// build the richest brand kit possible from scrape metadata when the LLM is unavailable
export function fallbackKitFromMeta(meta: ScrapeMeta, html: string, baseUrl?: string): BrandKit {
  const httpUrl = (u?: string) => (u && /^https?:\/\//.test(u) ? u : undefined);
  return brandKitSchema.parse({
    // Clean both sources — some sites stuff the full tagline into og:site_name too.
    companyName: brandNameFromTitle(meta.ogSiteName ?? '') || brandNameFromTitle(meta.title ?? '') || NEUTRAL_BRAND_KIT.companyName,
    // Logo precedence: square brand mark (apple-touch-icon) > favicon > og:image
    // (a wide social card — poor signature logo, so last). pickEmailLogo also keeps
    // a raster ahead of any SVG candidate, since Gmail won't render SVG.
    logoUrl: pickEmailLogo(iconFromHtml(html, baseUrl), httpUrl(meta.favicon), httpUrl(meta.ogImage)) || NEUTRAL_BRAND_KIT.logoUrl,
    primaryColor: themeColorFromHtml(html) || NEUTRAL_BRAND_KIT.primaryColor,
    secondaryColor: NEUTRAL_BRAND_KIT.secondaryColor,
    fontFamily: NEUTRAL_BRAND_KIT.fontFamily,
  });
}

const SCRAPE_FORMATS: FormatString[] = ['branding', 'markdown', 'html', 'links', 'screenshot'];
const EXTRA_FORMATS: FormatString[] = ['branding', 'html', 'links'];

const PROXY_TIERS = ['auto', 'stealth', 'enhanced'] as const;
type ProxyTier = typeof PROXY_TIERS[number];

function scrapeOnce(url: string, maxAge: number, mobile = false, proxy: ProxyTier = 'auto') {
  return client.scrape(url, {
    formats: mobile ? (['markdown', 'html', 'links', 'screenshot'] as FormatString[]) : SCRAPE_FORMATS,
    onlyMainContent: false,
    blockAds: true,
    removeBase64Images: true,
    proxy,
    waitFor: parseInt(process.env.FIRECRAWL_WAIT_FOR ?? '', 10) || 3000,
    maxAge,
    ...(mobile ? { mobile: true, viewport: { width: 390, height: 844 } as const } : {}),
  });
}

function scrapeExtra(url: string) {
  return client.scrape(url, {
    formats: EXTRA_FORMATS,
    onlyMainContent: false,
    blockAds: true,
    removeBase64Images: true,
    proxy: 'auto',
    waitFor: parseInt(process.env.FIRECRAWL_WAIT_FOR ?? '', 10) || 3000,
    maxAge: 60 * 60 * 1000,
  });
}

function isBrandPage(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return BRAND_PATHS.some(p => path === p || path.startsWith(p + '/') || path.startsWith(p + '.'));
  } catch { return false; }
}

function mergeBranding(...brandings: (BrandingProfile | undefined)[]): BrandingProfile | undefined {
  for (const b of brandings) {
    if (b?.colors?.primary || b?.images?.logo) return b;
  }
  return brandings.find(Boolean);
}

function pickScreenshot(...shots: (string | undefined)[]): string {
  for (const s of shots) { if (s) return s; }
  return '';
}

export async function scrapeSite(url: string): Promise<ScrapeResult> {
  if (!process.env.FIRECRAWL_API_KEY) throw new Error('FIRECRAWL_API_KEY is not set');

  // In-process cache hit — avoids Firecrawl API call entirely
  const cached = cachedScrape(url);
  if (cached) return cached;

  // Step 1: scrape the submitted URL (primary page)
  let doc = await scrapeOnce(url, 60 * 60 * 1000);
  let status = doc.metadata?.statusCode;
  if (typeof status === 'number' && status >= 400) {
    doc = await scrapeOnce(url, 0);
    status = doc.metadata?.statusCode;
  }
  if (typeof status === 'number' && status >= 400) {
    throw new Error(`origin returned HTTP ${status}`);
  }

  // Step 2: if the screenshot failed, retry with stealth → enhanced proxy
  // tiers before giving up (some sites block auto-tier scrapers)
  if (!doc.screenshot) {
    for (const tier of ['stealth', 'enhanced'] as const) {
      const retry = await scrapeOnce(url, 0, false, tier).catch(() => null);
      if (retry?.screenshot) {
        doc = retry;
        break;
      }
    }
  }

  // Step 3: if Firecrawl's branding is thin, try mobile viewport and/or
  // brand-relevant pages discovered via /map
  const brandingComplete = (b?: BrandingProfile) => !!(b?.colors?.primary && b?.images?.logo);
  const needsBetter = !brandingComplete(doc.branding);
  let extraDocs: Document[] = [];

  if (needsBetter) {
    // Try mobile viewport for JS-heavy SPAs that render differently
    const mobileDoc = await scrapeOnce(url, 60 * 60 * 1000, true).catch(() => null);
    if (mobileDoc && (mobileDoc.branding?.colors?.primary || mobileDoc.branding?.images?.logo)) {
      extraDocs.push(mobileDoc);
    }

    // Early bail: if the primary or mobile scrape now yields a complete profile
    // (logo + primary color), skip the costly /map + brand-page fan-out (3 calls).
    if (!brandingComplete(doc.branding) && !brandingComplete(mobileDoc?.branding)) {
      // Discover brand-relevant pages via Firecrawl /map
      const mapResult = await client.map(url, {
        search: 'about contact brand team company logo press',
        limit: 15,
      }).catch(() => ({ links: [] }));

      const brandUrls = mapResult.links
        ?.map(l => (l as { url: string }).url ?? '')
        .filter(u => u && u !== url && isBrandPage(u))
        .slice(0, 2) ?? [];

      if (brandUrls.length) {
        const extra = await Promise.all(
          brandUrls.map(u => scrapeExtra(u).catch(() => null as Document | null))
        );
        extraDocs.push(...extra.filter(Boolean as unknown as (d: Document | null) => d is Document));
      }
    }
  }

  // Step 4: merge primary + extra page data
  let branding = doc.branding;
  let combinedHtml = doc.html ?? '';
  let combinedMarkdown = doc.markdown ?? '';
  const linkSet = new Set<string>((doc.links ?? []).map(l => l.toLowerCase()));

  for (const extra of extraDocs) {
    branding = mergeBranding(branding, extra.branding);
    if (extra.html) combinedHtml += '\n' + extra.html;
    if (extra.markdown) combinedMarkdown += '\n\n' + extra.markdown;
    for (const l of extra.links ?? []) {
      if (!linkSet.has(l.toLowerCase())) { linkSet.add(l.toLowerCase()); }
    }
  }

  const finalUrl = doc.metadata?.url ?? url;
  const html = combinedHtml.slice(0, 60000);
  const markdown = combinedMarkdown.slice(0, 60000);
  const links = [...linkSet];
  const screenshotUrl = pickScreenshot(doc.screenshot, ...extraDocs.map(d => d.screenshot));
  if (!screenshotUrl) throw new Error('Firecrawl returned no screenshot');

  const lang = html.match(/<html[^>]*\slang=["']([a-z]{2,3})["']/i)?.[1];

  const result: ScrapeResult = {
    html,
    htmlSnippets: relevantHtmlSnippets(html),
    markdown,
    links,
    screenshotUrl,
    finalUrl,
    branding,
    fallbackKit: fallbackKitFromMeta(doc.metadata ?? {}, html, finalUrl),
    lang,
    pageTitle: doc.metadata?.title,
  };
  setCachedScrape(url, result);
  return result;
}
