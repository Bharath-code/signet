// Brand-extraction eval harness. Runs the REAL pipeline (scrape → extract →
// renderSignature) across a fixed set of sites and emits a visual report so you
// can eyeball brand-match next to each site's own screenshot, and read the two
// numbers the MASTER-PLAN gates on: skip-vision rate and fallback rate.
//
//   npx tsx scripts/eval-extraction.ts                 # default site list
//   npx tsx scripts/eval-extraction.ts --file urls.txt # one URL per line
//   npx tsx scripts/eval-extraction.ts a.com b.com     # explicit URLs
//
// Output → .eval/report.html  (open it; signatures render inline beside screenshots)

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import type { BrandKit, SignatureFields } from '../lib/types';

// Env BEFORE importing the pipeline: scrape-site builds its Firecrawl client from
// process.env at module load, so the libs are imported dynamically inside main().
try { process.loadEnvFile('.env.local'); } catch { /* env may already be set */ }

// A deliberately varied set: big brands, SaaS, personal/portfolio, monochrome
// sites — the mix that surfaces SVG logos, link-blue accents, and empty branding.
const DEFAULT_URLS = [
  'https://stripe.com', 'https://vercel.com', 'https://linear.app', 'https://notion.so',
  'https://figma.com', 'https://github.com', 'https://openai.com', 'https://anthropic.com',
  'https://resend.com', 'https://firecrawl.dev', 'https://posthog.com', 'https://supabase.com',
  'https://railway.app', 'https://cal.com', 'https://tailwindcss.com', 'https://framer.com',
  'https://basecamp.com', 'https://brittanychiang.com', 'https://leerob.com', 'https://paulgraham.com',
];

type Row = {
  url: string;
  finalUrl: string;
  ok: boolean;
  source: 'firecrawl' | 'extract' | 'vision' | 'degraded' | 'fallback';
  degraded?: string;
  ms: number;
  brandKit?: BrandKit;
  screenshotUrl?: string;
  signatureHtml?: string;
  svgLogo: boolean;
  error?: string;
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Small concurrency pool — Firecrawl's free tier caps parallel jobs low, so keep
// it modest; sequential would make a 20-site run painfully slow to iterate on.
async function mapPool<T, R>(items: T[], limit: number, fn: (x: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const fileIdx = args.indexOf('--file');
  const urls =
    fileIdx !== -1
      ? readFileSync(args[fileIdx + 1], 'utf8').split('\n').map((l) => l.trim()).filter(Boolean)
      : args.filter((a) => !a.startsWith('--'));
  const targets = urls.length ? urls : DEFAULT_URLS;

  const [scrape, extract, render, logo] = await Promise.all([
    import('../lib/scrape-site'), import('../lib/extract-brand-kit'),
    import('../lib/render-signature'), import('../lib/logo-url'),
  ]);

  console.log(`Evaluating ${targets.length} sites…\n`);

  // Concurrency 2: vision-path sites each fire a Gemini call; 3+ in parallel
  // throttles the provider and inflates latency/timeouts beyond what a single
  // rate-limited production request would ever see.
  const rows = await mapPool(targets, 2, async (url): Promise<Row> => {
    const t0 = Date.now();
    try {
      const s = await scrape.scrapeSite(url);
      const { brandKit, contact, source } = await extract.extractBrandKit(s.html, s.screenshotUrl, {
        links: s.links, markdown: s.markdown, baseUrl: s.finalUrl, branding: s.branding, fallbackKit: s.fallbackKit, htmlSnippets: s.htmlSnippets,
      });
      const host = (() => { try { return new URL(s.finalUrl).hostname.replace(/^www\./, ''); } catch { return url; } })();
      const fields: SignatureFields = {
        fullName: contact.fullName ?? brandKit.companyName,
        jobTitle: contact.jobTitle ?? 'Founder',
        email: contact.email ?? `hello@${host}`,
        phone: contact.phone ?? '', website: contact.website ?? s.finalUrl,
        linkedin: contact.linkedin ?? '', github: contact.github ?? '', x: contact.x ?? '', discord: contact.discord ?? '',
      };
      const ms = Date.now() - t0;
      console.log(`✓ ${url.padEnd(34)} ${source.padEnd(9)} ${ms}ms`);
      return {
        url, finalUrl: s.finalUrl, ok: true, source, ms,
        brandKit, screenshotUrl: s.screenshotUrl, svgLogo: logo.isSvgUrl(brandKit.logoUrl),
        signatureHtml: render.renderSignature(brandKit, fields, 'logo', fields.website),
      };
    } catch (err) {
      const ms = Date.now() - t0;
      console.log(`✗ ${url.padEnd(34)} FAILED    ${ms}ms`);
      return { url, finalUrl: url, ok: false, source: 'fallback', ms, svgLogo: false, error: (err as Error).message };
    }
  });

  // ── Scorecard ─────────────────────────────────────────────────────────────
  const ok = rows.filter((r) => r.ok);
  const skipVision = ok.filter((r) => r.source === 'firecrawl').length;
  const fallbacks = rows.length - ok.length;
  const svgLogos = rows.filter((r) => r.svgLogo).length;
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
  const skipRate = pct(skipVision, ok.length);

  console.log('\n── Scorecard ──');
  console.log(`Skip-vision rate : ${skipRate}%  (${skipVision}/${ok.length} successful)   target ≥70%`);
  console.log(`Fallback rate    : ${pct(fallbacks, rows.length)}%  (${fallbacks}/${rows.length})`);
  console.log(`SVG logos        : ${svgLogos}  (would break in Gmail — should be ~0 after hardening)`);
  console.log(`Avg time         : ${Math.round(ok.reduce((a, r) => a + r.ms, 0) / (ok.length || 1))}ms`);

  // ── HTML report ───────────────────────────────────────────────────────────
  const badge = (r: Row) => {
    const color = r.source === 'firecrawl' ? '#1a7f37' : r.source === 'vision' ? '#9a6700' : '#cf222e';
    return `<span style="background:${color};color:#fff;padding:2px 8px;border-radius:3px;font:600 11px monospace">${r.source}</span>`;
  };
  const swatch = (hex: string) =>
    `<span style="display:inline-block;width:16px;height:16px;border:1px solid #ccc;vertical-align:middle;background:${esc(hex)}"></span> <code>${esc(hex)}</code>`;

  const cards = rows.map((r) => `
    <div style="border:1px solid #ddd;border-radius:6px;margin:0 0 20px;overflow:hidden">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#fafafa;border-bottom:1px solid #eee">
        <strong>${esc(r.brandKit?.companyName ?? r.url)}</strong>
        <span>${badge(r)} &nbsp; <code>${r.ms}ms</code> ${r.svgLogo ? '&nbsp;⚠️ SVG logo' : ''} ${r.degraded ? `&nbsp;degraded:${esc(r.degraded)}` : ''}</span>
      </div>
      <div style="display:flex;gap:0;flex-wrap:wrap">
        <div style="flex:1;min-width:340px;border-right:1px solid #eee;background:#f3f3f3">
          ${r.screenshotUrl ? `<img src="${esc(r.screenshotUrl)}" style="width:100%;display:block">` : `<p style="padding:20px;color:#888">no screenshot — ${esc(r.error ?? '')}</p>`}
        </div>
        <div style="flex:1;min-width:340px;padding:18px;background:#fff">
          ${r.signatureHtml ?? '<p style="color:#cf222e">extraction failed</p>'}
          ${r.brandKit ? `<div style="margin-top:16px;font:12px monospace;color:#444;line-height:1.8">
            <div>${swatch(r.brandKit.primaryColor)} &nbsp; ${swatch(r.brandKit.secondaryColor)}</div>
            <div>font: ${esc(r.brandKit.fontFamily)}</div>
            <div style="word-break:break-all">logo: <a href="${esc(r.brandKit.logoUrl)}">${esc(r.brandKit.logoUrl)}</a></div>
          </div>` : ''}
        </div>
      </div>
    </div>`).join('');

  const html = `<!doctype html><meta charset="utf-8"><title>Brand extraction eval</title>
    <body style="max-width:1100px;margin:24px auto;font-family:system-ui;padding:0 16px;color:#111">
    <h1>Brand extraction eval</h1>
    <div style="background:#f6f8fa;border:1px solid #d0d7de;border-radius:6px;padding:14px 18px;margin-bottom:24px;font:14px/1.7 monospace">
      <b>Skip-vision rate:</b> ${skipRate}% (${skipVision}/${ok.length}) &nbsp;<i>target ≥70%</i><br>
      <b>Fallback rate:</b> ${pct(fallbacks, rows.length)}% (${fallbacks}/${rows.length}) &nbsp;·&nbsp;
      <b>SVG logos:</b> ${svgLogos} &nbsp;·&nbsp;
      <b>Avg time:</b> ${Math.round(ok.reduce((a, r) => a + r.ms, 0) / (ok.length || 1))}ms<br>
      <span style="color:#666">Left = the live site (Firecrawl screenshot). Right = our rendered signature. Eyeball brand-match per row.</span>
    </div>
    ${cards}</body>`;

  mkdirSync('.eval', { recursive: true });
  writeFileSync('.eval/report.html', html);
  console.log('\n→ .eval/report.html');
}

main();
