import { NextResponse } from 'next/server';
import { scrapeSite } from '@/lib/scrape-site';
import { extractBrandKit } from '@/lib/extract-brand-kit';
import { NEUTRAL_BRAND_KIT } from '@/lib/brand-kit-schema';
import type { BrandKit, SignatureFields } from '@/lib/types';

type CacheEntry = { brandKit: BrandKit; contact: Partial<SignatureFields>; finalUrl: string; ts: number };
// ponytail: module-level Map survives across requests in the same Node.js process
const cache = new Map<string, CacheEntry>();
const TTL = 60 * 60 * 1000; // 1 hour

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
    return NextResponse.json({ brandKit: cached.brandKit, contact: cached.contact, finalUrl: cached.finalUrl, fallback: false, cached: true });
  }

  let finalUrl = url;
  try {
    const scraped = await scrapeSite(url);
    finalUrl = scraped.finalUrl;
    const { brandKit, contact } = await extractBrandKit(scraped.html, scraped.screenshotUrl);
    cache.set(key, { brandKit, contact, finalUrl, ts: Date.now() });
    return NextResponse.json({ brandKit, contact, finalUrl, fallback: false });
  } catch (err) {
    console.error('brand-kit extraction failed:', err);
    return NextResponse.json({ brandKit: NEUTRAL_BRAND_KIT, contact: {}, finalUrl, fallback: true });
  }
}
