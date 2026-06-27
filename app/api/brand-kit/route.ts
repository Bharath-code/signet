import { NextResponse } from 'next/server';
import { scrapeSite } from '@/lib/scrape-site';
import { extractBrandKit } from '@/lib/extract-brand-kit';
import { NEUTRAL_BRAND_KIT } from '@/lib/brand-kit-schema';
import type { BrandKit, SignatureFields, BrandKitConfidence } from '@/lib/types';

type CacheEntry = { brandKit: BrandKit; contact: Partial<SignatureFields>; confidence: BrandKitConfidence; finalUrl: string; ts: number };
// module-level Map survives across requests in the same Node.js process
const cache = new Map<string, CacheEntry>();
const TTL = 60 * 60 * 1000; // 1 hour

// ─── Rate limiter ────────────────────────────────────────────────────────
// 3 generations/hour, 10/day per IP. Cached responses don't count.
// Only real scrape attempts (the expensive Firecrawl+Gemini path) are metered.
type RateEntry = { hourly: number; daily: number; hourReset: number; dayReset: number };
const rateMap = new Map<string, RateEntry>();
const HOUR_LIMIT = 3;
const DAY_LIMIT = 10;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'local';
}

function checkRate(ip: string): boolean {
  const now = Date.now();
  let entry = rateMap.get(ip);
  if (!entry) {
    entry = { hourly: 0, daily: 0, hourReset: now + HOUR_MS, dayReset: now + DAY_MS };
    rateMap.set(ip, entry);
  }
  if (now > entry.hourReset) { entry.hourly = 0; entry.hourReset = now + HOUR_MS; }
  if (now > entry.dayReset) { entry.daily = 0; entry.dayReset = now + DAY_MS; }
  if (entry.hourly >= HOUR_LIMIT || entry.daily >= DAY_LIMIT) return false;
  entry.hourly++;
  entry.daily++;
  // crude guard: don't let the map grow unbounded
  if (rateMap.size > 10_000) rateMap.clear();
  return true;
}

function normalizeUrl(raw: string) {
  try {
    const u = new URL(raw);
    return `${u.hostname}${u.pathname}`.replace(/\/$/, '').toLowerCase();
  } catch {
    return raw.toLowerCase();
  }
}

export async function POST(req: Request) {
  let url = '';
  try {
    ({ url } = await req.json());
    new URL(url);
  } catch {
    return NextResponse.json({ brandKit: NEUTRAL_BRAND_KIT, contact: {}, fallback: true });
  }

  const key = normalizeUrl(url);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json({ brandKit: cached.brandKit, contact: cached.contact, confidence: cached.confidence, finalUrl: cached.finalUrl, fallback: false, cached: true });
  }

  // Rate-limit check: protects Firecrawl/Gemini budget from bots.
  // Returns neutral fallback (HTTP 200) so the UI always renders.
  const ip = getClientIp(req);
  if (!checkRate(ip)) {
    return NextResponse.json({ brandKit: NEUTRAL_BRAND_KIT, contact: {}, fallback: true, rateLimited: true });
  }

  // Scrape and extract are independent vendors with independent outages (bulkhead).
  // A scrape failure has nothing to salvage; an extract failure still has the scrape.
  let scraped;
  let finalUrl = url;
  try {
    scraped = await scrapeSite(url);
    finalUrl = scraped.finalUrl;
  } catch (err) {
    console.error('scrape failed:', err);
    return NextResponse.json({ brandKit: NEUTRAL_BRAND_KIT, contact: {}, finalUrl, fallback: true, degraded: 'scrape' });
  }

  try {
    const { brandKit, contact, source, confidence } = await extractBrandKit(scraped.html, scraped.screenshotUrl, {
      links: scraped.links,
      markdown: scraped.markdown,
      baseUrl: finalUrl,
      branding: scraped.branding,
      fallbackKit: scraped.fallbackKit,
      htmlSnippets: scraped.htmlSnippets,
      lang: scraped.lang,
      pageTitle: scraped.pageTitle,
    });
    cache.set(key, { brandKit, contact, confidence, finalUrl, ts: Date.now() });
    return NextResponse.json({ brandKit, contact, confidence, finalUrl, fallback: false, source });
  } catch (err) {
    console.error('extraction failed — salvaging scrape metadata:', err);
    // serve the real logo + name from the successful scrape; don't cache (retry extraction next time)
    return NextResponse.json({ brandKit: scraped.fallbackKit, contact: {}, finalUrl, fallback: true, degraded: 'extract' });
  }
}
