import { NextResponse } from 'next/server';
import { scrapeSite } from '@/lib/scrape-site';
import { extractBrandKit } from '@/lib/extract-brand-kit';
import { NEUTRAL_BRAND_KIT } from '@/lib/brand-kit-schema';

export async function POST(req: Request) {
  let url = '';
  try {
    ({ url } = await req.json());
    new URL(url); // throws if not a valid URL
  } catch {
    return NextResponse.json({ brandKit: NEUTRAL_BRAND_KIT, fallback: true });
  }
  try {
    const { html, screenshotUrl } = await scrapeSite(url);
    const brandKit = await extractBrandKit(html, screenshotUrl);
    return NextResponse.json({ brandKit, fallback: false });
  } catch (err) {
    console.error('brand-kit extraction failed:', err);
    return NextResponse.json({ brandKit: NEUTRAL_BRAND_KIT, fallback: true });
  }
}
