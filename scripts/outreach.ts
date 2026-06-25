// Build a personalized outreach batch: gather recently-launched sites, run each
// through the real brand-kit pipeline, and emit a ready signature + draft email.
//
//   npx tsx scripts/outreach.ts                           # 50 latest Show HN sites
//   npx tsx scripts/outreach.ts --limit 20
//   npx tsx scripts/outreach.ts --file urls.txt           # one URL per line instead of HN
//   npx tsx scripts/outreach.ts --screenshot              # also render outreach/<slug>.png per target
//
// Output → outreach/index.html (gallery) + outreach/outreach.csv (tracker)
//          + outreach/*.png when --screenshot is passed (paste straight into email client)

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import type { SignatureFields } from '../lib/types';

// Load env BEFORE importing the pipeline: scrape-site.ts builds its Firecrawl
// client from process.env at module-load, and static imports are hoisted above
// this line — so the libs are pulled in dynamically inside main(), after env is set.
try { process.loadEnvFile('.env.local'); } catch { /* env may already be set */ }

const flag = (f: string) => process.argv.includes(f);
const arg = (f: string) => { const i = process.argv.indexOf(f); return i >= 0 ? process.argv[i + 1] : undefined; };
const LIMIT = Number(arg('--limit') ?? 50);
const FILE = arg('--file');
const SCREENSHOT = flag('--screenshot');
// Set SIGNET_URL in .env.local (e.g. https://signet.app) for production links.
// Falls back to localhost for local testing.
const SIGNET_URL = process.env.SIGNET_URL ?? 'http://localhost:3000';

// Repo-hosting domains: their brand = the platform's, not the project's.
const REPO_HOSTS = /^(github|gitlab|codeberg|gitea|bitbucket|npmjs|pypi|crates)\./;

// Show HN = founders who just shipped a product. Free, no auth, fresh daily.
async function showHnUrls(limit: number): Promise<string[]> {
  const res = await fetch(`https://hn.algolia.com/api/v1/search_by_date?tags=show_hn&hitsPerPage=${limit * 2}`);
  const { hits } = (await res.json()) as { hits: { url?: string }[] };
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const h of hits) {
    if (!h.url) continue;
    let host: string;
    try { host = new URL(h.url).hostname; } catch { continue; }
    if (seen.has(host)) continue; // one per domain
    // Skip repo-hosting URLs — they extract the platform's brand, not the project's
    if (REPO_HOSTS.test(host.replace(/^www\./, ''))) continue;
    seen.add(host);
    urls.push(h.url);
    if (urls.length >= limit) break;
  }
  return urls;
}

function fileUrls(path: string, limit: number): string[] {
  return readFileSync(path, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean).slice(0, limit);
}

const domain = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } };

// Encode the pre-generated kit into the URL so the page loads instantly —
// no re-scrape, no API call, signature renders on first paint.
function signetLink(url: string, brandKit: object, contact: object): string {
  const kit = Buffer.from(JSON.stringify({ brandKit, contact })).toString('base64');
  return `${SIGNET_URL}/app?from=${encodeURIComponent(url)}&kit=${kit}`;
}

function draftEmail(company: string, name: string | undefined, url: string, brandKit: object, contact: object): string {
  const hi = name ? name.split(' ')[0] : 'there';
  const link = signetLink(url, brandKit, contact);
  return `Subject: your branded email signature (${company})

Hi ${hi},

Quick one — I built a tool that reads any site and generates a branded email
signature in ~10 seconds, so I ran ${domain(url)} through it.

Here's yours: ${link}

Logo, colors, and font are all pulled from your site. No signup, free to try.

— Bharath`;
}

type Row = { company: string; name: string; email: string; url: string; sig: string; mail: string };

type Pipeline = {
  scrapeSite: typeof import('../lib/scrape-site').scrapeSite;
  extractBrandKit: typeof import('../lib/extract-brand-kit').extractBrandKit;
  renderSignature: typeof import('../lib/render-signature').renderSignature;
};

async function build(url: string, p: Pipeline): Promise<Row | null> {
  try {
    const { scrapeSite, extractBrandKit, renderSignature } = p;
    const s = await scrapeSite(url);
    const { brandKit, contact } = await extractBrandKit(s.html, s.screenshotUrl, {
      links: s.links, markdown: s.markdown, baseUrl: s.finalUrl, fallbackLogoUrl: s.fallbackKit.logoUrl,
    });
    const fields: SignatureFields = {
      fullName: contact.fullName ?? brandKit.companyName,
      jobTitle: contact.jobTitle ?? '',
      email: contact.email ?? '', phone: contact.phone ?? '',
      website: contact.website ?? s.finalUrl,
      linkedin: contact.linkedin ?? '', github: contact.github ?? '',
      x: contact.x ?? '', discord: contact.discord ?? '',
    };
    return {
      company: brandKit.companyName, name: contact.fullName ?? '', email: contact.email ?? '', url: s.finalUrl,
      sig: renderSignature(brandKit, fields, 'logo', s.finalUrl),
      mail: draftEmail(brandKit.companyName, contact.fullName, s.finalUrl, brandKit, contact),
    };
  } catch (e) {
    console.warn(`skip ${url}: ${(e as Error).message}`);
    return null;
  }
}

// ponytail: 4-wide pool, not a queue lib — keeps Firecrawl/Gemini from being hammered.
async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = []; let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]); }
  }));
  return out;
}

// Render each signature to a standalone PNG — paste-ready for email clients.
// Each PNG is 680×auto, white background, 24px padding — exactly what goes in a
// cold-email body alongside the draft text.
async function screenshotSignatures(rows: Row[]): Promise<void> {
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.default.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 760, height: 200, deviceScaleFactor: 2 }); // 2x for crisp logos

  for (const r of rows) {
    const slug = r.url.replace(/[^a-z0-9]+/gi, '-').slice(0, 48);
    const html = `<!doctype html><meta charset="utf-8">
      <body style="margin:0;background:#fff;padding:24px;display:inline-block">${r.sig}</body>`;
    // 'load' fires after all images either load or fail — unlike 'networkidle0' it
    // won't hang indefinitely when an external logo returns a slow 404.
    await page.setContent(html, { waitUntil: 'load', timeout: 10_000 });
    const el = await page.$('body');
    if (el) await el.screenshot({ path: `outreach/${slug}.png` as `${string}.png` });
    process.stdout.write('.');
  }

  await browser.close();
  console.log(`\n✓ ${rows.length} PNGs → outreach/*.png`);
}

const cell = (s: string) => `"${s.replace(/"/g, '""')}"`;

function gallery(rows: Row[]): string {
  const cards = rows.map((r) => `
    <section style="border:1px solid #ddd;border-radius:8px;padding:24px;margin:16px 0">
      <h2 style="font:600 18px sans-serif;margin:0 0 4px">${r.company}</h2>
      <a href="${r.url}" style="font:13px monospace;color:#666">${domain(r.url)}</a>
      <div style="background:#fff;border:1px solid #eee;border-radius:6px;padding:20px;margin:12px 0">${r.sig}</div>
      <textarea readonly style="width:100%;height:170px;font:13px monospace;padding:10px;border:1px solid #ddd;border-radius:6px">${r.mail}</textarea>
    </section>`).join('');
  return `<!doctype html><meta charset="utf-8"><title>Outreach batch</title>
    <body style="max-width:680px;margin:40px auto;padding:0 16px;background:#fafafa">
    <h1 style="font:700 24px sans-serif">${rows.length} targets — screenshot each signature, paste the email</h1>${cards}`;
}

async function main() {
  const urls = FILE ? fileUrls(FILE, LIMIT) : await showHnUrls(LIMIT);
  console.log(`Processing ${urls.length} sites…`);
  const [scrape, extract, render] = await Promise.all([
    import('../lib/scrape-site'), import('../lib/extract-brand-kit'), import('../lib/render-signature'),
  ]);
  const p: Pipeline = { scrapeSite: scrape.scrapeSite, extractBrandKit: extract.extractBrandKit, renderSignature: render.renderSignature };
  const rows = (await pool(urls, 4, (u) => build(u, p))).filter((r): r is Row => r !== null);

  mkdirSync('outreach', { recursive: true });
  writeFileSync('outreach/index.html', gallery(rows));
  const csv = ['company,name,email,url,replied,signed_up',
    ...rows.map((r) => [r.company, r.name, r.email, r.url, '', ''].map(cell).join(','))].join('\n');
  writeFileSync('outreach/outreach.csv', csv);

  console.log(`✓ ${rows.length}/${urls.length} built → open outreach/index.html, track in outreach/outreach.csv`);

  if (SCREENSHOT && rows.length) {
    console.log('Rendering PNGs…');
    await screenshotSignatures(rows);
  }
}

main();
