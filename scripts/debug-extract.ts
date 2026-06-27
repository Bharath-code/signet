// Usage: npx tsx scripts/debug-extract.ts <url>
// Local log of the deterministic color/logo layers BEFORE any LLM runs, so you
// can see exactly which source produced each value (Firecrawl branding vs inline
// CSS vs scrape meta). No Gemini call. ponytail: read-only dump, no framework.

import { brandKitFromFirecrawl } from '../lib/brand-from-firecrawl';
import { brandColorsFromCss, isLinkBlue } from '../lib/extract-colors';

try { process.loadEnvFile('.env.local'); } catch {}

async function main() {
  const url = process.argv[2];
  if (!url) { console.error('Usage: npx tsx scripts/debug-extract.ts <url>'); process.exit(1); }

  const { scrapeSite } = await import('../lib/scrape-site');
  console.log(`\nScraping ${url} …\n`);
  const s = await scrapeSite(url);

  const fc = brandKitFromFirecrawl(s.branding);
  const css = brandColorsFromCss(s.html);

  // What external stylesheets did the page link to? (these are what we CAN'T see)
  const cssLinks = [...s.html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)]
    .map((m) => m[1]);
  // Inline <style> blocks we CAN see
  const inlineStyleCount = (s.html.match(/<style[\s>]/gi) ?? []).length;

  console.log('─── Firecrawl branding.colors (raw, server-side) ───');
  console.log(JSON.stringify(s.branding?.colors ?? null, null, 2));

  console.log('\n─── brandKitFromFirecrawl (fc) ───');
  console.log(JSON.stringify(fc, null, 2));

  console.log('\n─── brandColorsFromCss (inline CSS vars + theme-color) ───');
  console.log(JSON.stringify(css, null, 2));
  if (css.primary) console.log(`   css.primary isLinkBlue? ${isLinkBlue(css.primary)}`);

  console.log('\n─── what det.* resolves to (the kit before vision) ───');
  const detPrimary = fc.primaryColor ?? (css.primary && !isLinkBlue(css.primary) ? css.primary : undefined) ?? fc.secondaryColor;
  const detSecondary = fc.secondaryColor ?? css.secondary;
  console.log(`   primaryColor:   ${detPrimary}   ${detPrimary === detSecondary ? '⚠️  SAME AS SECONDARY' : ''}`);
  console.log(`   secondaryColor: ${detSecondary}`);
  console.log(`   logoUrl:        ${fc.logoUrl ?? s.fallbackKit.logoUrl}`);

  console.log('\n─── visibility into CSS ───');
  console.log(`   inline <style> blocks in returned HTML: ${inlineStyleCount}`);
  console.log(`   EXTERNAL stylesheets we currently DON'T fetch: ${cssLinks.length}`);
  cssLinks.slice(0, 8).forEach((h) => console.log(`     · ${h}`));
}

main();
