// Usage: npx tsx scripts/preview-one.ts <url>
// Renders all 3 layouts and saves outreach/preview-{layout}.png

import { mkdirSync } from 'node:fs';
import type { SignatureFields } from '../lib/types';

try { process.loadEnvFile('.env.local'); } catch {}

async function main() {
  const url = process.argv[2];
  if (!url) { console.error('Usage: npx tsx scripts/preview-one.ts <url>'); process.exit(1); }

  const [scrape, extract, render, pup] = await Promise.all([
    import('../lib/scrape-site'), import('../lib/extract-brand-kit'),
    import('../lib/render-signature'), import('puppeteer'),
  ]);

  console.log(`Scraping ${url}…`);
  const s = await scrape.scrapeSite(url);
  const { brandKit, contact } = await extract.extractBrandKit(s.html, s.screenshotUrl, {
    links: s.links, markdown: s.markdown, baseUrl: s.finalUrl, fallbackLogoUrl: s.fallbackKit.logoUrl,
  });

  console.log('brand kit:', JSON.stringify(brandKit, null, 2));
  console.log('contact:  ', JSON.stringify(contact, null, 2));

  const fields: SignatureFields = {
    fullName: contact.fullName  ?? brandKit.companyName,
    jobTitle: contact.jobTitle  ?? '',
    email:    contact.email     ?? '',
    phone:    contact.phone     ?? '',
    website:  contact.website   ?? s.finalUrl,
    linkedin: contact.linkedin  ?? '',
    github:   contact.github    ?? '',
    x:        contact.x         ?? '',
    discord:  contact.discord   ?? '',
  };

  mkdirSync('outreach', { recursive: true });
  const browser = await pup.default.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 760, height: 400, deviceScaleFactor: 2 });

  for (const layout of ['minimal', 'logo', 'logo-cta'] as const) {
    const sig = render.renderSignature(brandKit, fields, layout, fields.website);
    const html = `<!doctype html><meta charset="utf-8">
      <body style="margin:0;background:#fff;padding:28px;display:inline-block">${sig}</body>`;
    await page.setContent(html, { waitUntil: 'load', timeout: 10_000 });
    const el = await page.$('body');
    await el!.screenshot({ path: `outreach/preview-${layout}.png` as `${string}.png` });
    console.log(`✓ outreach/preview-${layout}.png`);
  }

  await browser.close();
}

main();
