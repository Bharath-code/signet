import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { scrapeSite } from '@/lib/scrape-site';
import { extractBrandKit } from '@/lib/extract-brand-kit';
import { NEUTRAL_BRAND_KIT } from '@/lib/brand-kit-schema';
import { redis, getClientIp } from '@/lib/redis';
import type { BrandKit, SignatureFields, BrandKitConfidence } from '@/lib/types';

type CacheEntry = { brandKit: BrandKit; contact: Partial<SignatureFields>; confidence: BrandKitConfidence; finalUrl: string; ts: number };
// module-level Map survives across requests in the same Node.js process
const cache = new Map<string, CacheEntry>();
const TTL = 60 * 60 * 1000; // 1 hour

// ─── Rate limiter ────────────────────────────────────────────────────────
// 10 generations/hour, 25/day per IP (launch-week bump; was 3/10).
// Cached responses don't count. Only real scrape attempts are metered.
type RateEntry = { hourly: number; daily: number; hourReset: number; dayReset: number };
const rateMap = new Map<string, RateEntry>();
const HOUR_LIMIT = 10;
const DAY_LIMIT = 25;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
// Site-wide ceiling across every IP, so a botnet under the per-IP limits still
// can't drain the Firecrawl balance (~5 credits per generation). Set it from the
// plan: BRAND_KIT_DAILY_CAP=200 ≈ 1,000 credits/day.
const GLOBAL_DAY_LIMIT = parseInt(process.env.BRAND_KIT_DAILY_CAP ?? '', 10) || 200;

// Durable limiters. One shared counter across every lambda instance, so the
// quota below is the real ceiling — the in-process Map version multiplied it by
// the instance count. ephemeralCache short-circuits an already-blocked IP
// without a round trip.
const limiters = redis
  ? {
      hour: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(HOUR_LIMIT, '1 h'), prefix: 'bk:h', ephemeralCache: new Map(), analytics: false }),
      day: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(DAY_LIMIT, '24 h'), prefix: 'bk:d', ephemeralCache: new Map(), analytics: false }),
      global: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(GLOBAL_DAY_LIMIT, '24 h'), prefix: 'bk:g', analytics: false }),
    }
  : null;

async function checkRateDurable(ip: string): Promise<boolean> {
  if (!limiters) return checkRate(ip);
  try {
    const [h, d] = await Promise.all([limiters.hour.limit(ip), limiters.day.limit(ip)]);
    if (!h.success || !d.success) return false;
    // After the per-IP check, so a blocked IP can't burn the shared budget.
    const g = await limiters.global.limit('all');
    if (!g.success) console.warn(`global daily cap (${GLOBAL_DAY_LIMIT}) reached`);
    return g.success;
  } catch (err) {
    // ponytail: Redis outage falls back to the per-instance Map. It fails open
    // to a looser ceiling rather than blocking every generation — the global cap
    // is not enforced during an outage. Swap to
    // `return false` if protecting the credit balance outranks availability.
    console.error('rate limiter unavailable, using in-process fallback:', err);
    return checkRate(ip);
  }
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
  // L1: same-instance Map (free). L2: Redis, shared by every instance — this is
  // what stops a repeat URL from re-scraping after a cold start (~5 credits).
  let cached = cache.get(key);
  if (cached && Date.now() - cached.ts >= TTL) cached = undefined;
  if (!cached && redis) {
    try {
      const hit = await redis.get<CacheEntry>(`bk:kit:${key}`);
      if (hit) { cached = hit; cache.set(key, hit); }
    } catch (err) {
      console.error('cache read failed, treating as miss:', err);
    }
  }
  if (cached) {
    return NextResponse.json({ brandKit: cached.brandKit, contact: cached.contact, confidence: cached.confidence, finalUrl: cached.finalUrl, fallback: false, cached: true });
  }

  // Rate-limit check: protects Firecrawl/Gemini budget from bots.
  // Returns neutral fallback (HTTP 200) so the UI always renders.
  const ip = getClientIp(req);
  if (!(await checkRateDurable(ip))) {
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
      htmlSnippets: scraped.htmlSnippets, cssVars: scraped.cssVars,
      lang: scraped.lang,
      pageTitle: scraped.pageTitle,
      fcJson: scraped.fcJson,
    });
    const entry: CacheEntry = { brandKit, contact, confidence, finalUrl, ts: Date.now() };
    cache.set(key, entry);
    if (redis) await redis.set(`bk:kit:${key}`, entry, { ex: TTL / 1000 }).catch((err) => console.error('cache write failed:', err));
    return NextResponse.json({ brandKit, contact, confidence, finalUrl, fallback: false, source });
  } catch (err) {
    console.error('extraction failed — salvaging scrape metadata:', err);
    // serve the real logo + name from the successful scrape; don't cache (retry extraction next time)
    return NextResponse.json({ brandKit: scraped.fallbackKit, contact: {}, finalUrl, fallback: true, degraded: 'extract' });
  }
}
