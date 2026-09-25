// Trigger leads: firms that must replace every employee's signature soon, because
// they just rebranded, changed their name, merged, or opened. Runs a set of Firecrawl
// news searches, keeps the hits that read like one of those events, pulls out the
// new name, and appends unseen rows to outreach/triggers.csv for a human to review.
//
//   npx tsx scripts/triggers.ts                 # last 7 days
//   npx tsx scripts/triggers.ts --days 30       # 1 → past day, ≤7 → week, else month
//   npx tsx scripts/triggers.ts --resolve       # also web-search each new name for its site (+2 credits/row)
//
// Then, per row worth pursuing: check headcount + team page, write outreach/<slug>.txt,
//   npx tsx scripts/outreach.ts --url <site> --roster outreach/<slug>.txt

import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { isUsableLead } from './find-leads';

try { process.loadEnvFile('.env.local'); } catch { /* env may already be set */ }

const arg = (f: string) => { const i = process.argv.indexOf(f); return i >= 0 ? process.argv[i + 1] : undefined; };
const DAYS = Number(arg('--days') ?? 7);
const RESOLVE = process.argv.includes('--resolve');
const OUT = 'outreach/triggers.csv';
const HEADER = 'found,trigger,new_name,headline,article_url,published,site_url,status\n';

// ponytail: phrase queries against general news search, tuned for 5–50 seat
// professional-service firms. Swap in a paid M&A/press feed if the hit rate is thin.
const QUERIES = [
  '"rebrands as" firm',
  '"changes name to" firm',
  '"new name" law firm OR accounting firm OR agency',
  'law firm merger announced',
  'accounting firm merger OR "acquires CPA firm"',
  '"unveils new brand identity"',
  '"launches boutique law firm" OR "opens new law firm"',
];

export type Trigger = 'rebrand' | 'merger' | 'new-firm';

// Order matters: "merges and rebrands as X" is a rebrand — the new name is the job.
export function classifyTrigger(text: string): Trigger | undefined {
  if (/\b(rebrand(s|ed|ing)?|changes? (its )?name|new name|name change|new (brand )?identity|renam(es|ed))\b/i.test(text)) return 'rebrand';
  if (/\b(merg(e|es|er|ed|ing)|combin(e|es|ation)|acquir(es|ed)|joins forces)\b/i.test(text)) return 'merger';
  if (/\b(launch(es|ed)?|opens?|forms?|found(s|ed)?) (a |its )?(new |boutique )?(law|accounting|cpa|advisory|consulting|design|marketing)? ?(firm|practice|agency)\b/i.test(text)) return 'new-firm';
  return undefined;
}

// "Transact Capital Rebrands as Sequel Advisors, Sharpening…" → "Sequel Advisors".
// Capitalised words (plus &, of, and) after the verb, stopped by the first word
// that starts lowercase or by punctuation.
export function newNameFrom(text: string): string | undefined {
  const m = text.match(/\b(?:rebrands?|rebranded|renamed|renames itself|changes (?:its )?name|changed (?:its )?name)\s+(?:as|to)\s+(.+)/i);
  if (!m) return undefined;
  const words: string[] = [];
  for (const w of m[1].split(/\s+/)) {
    const clean = w.replace(/[,.;:!?"')\]]+$/, '');
    if (!/^([A-Z0-9][\w&'.-]*|&|of|and)$/.test(clean)) break;
    words.push(clean);
    if (clean !== w) break; // trailing punctuation ends the name
  }
  while (words.length && /^(&|of|and)$/.test(words[words.length - 1])) words.pop();
  return words.length ? words.join(' ') : undefined;
}

const csv = (v: string | undefined) => `"${(v ?? '').replace(/"/g, '""')}"`;

function hostOf(url: string): string | undefined {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return undefined; }
}

async function main() {
  const { firecrawlClient } = await import('../lib/scrape-site');
  const tbs = DAYS <= 1 ? 'qdr:d' : DAYS <= 7 ? 'qdr:w' : 'qdr:m';

  if (!existsSync(OUT)) writeFileSync(OUT, HEADER);
  const seen = readFileSync(OUT, 'utf8');
  const newsHosts = new Set<string>();
  const rows: { trigger: Trigger; name?: string; title: string; url: string; date?: string }[] = [];

  for (const q of QUERIES) {
    try {
      const res = await firecrawlClient.search(q, { limit: 20, sources: ['news'], tbs });
      let kept = 0;
      for (const r of res.news ?? []) {
        const { title = '', url, snippet = '', date } = r as { title?: string; url?: string; snippet?: string; date?: string };
        if (!url) continue;
        const host = hostOf(url);
        if (host) newsHosts.add(host);
        const trigger = classifyTrigger(`${title} ${snippet}`);
        if (!trigger || seen.includes(url) || rows.some((x) => x.url === url)) continue;
        const name = newNameFrom(title) ?? newNameFrom(snippet);
        // Same event, many outlets: one row per new name.
        if (name && (seen.includes(csv(name)) || rows.some((x) => x.name === name))) continue;
        rows.push({ trigger, name, title, url, date });
        kept++;
      }
      console.log(`"${q}" → ${res.news?.length ?? 0} hits, +${kept}`);
    } catch (e) {
      console.warn(`search failed for "${q}": ${(e as Error).message}`);
    }
  }

  const found = new Date().toISOString().slice(0, 10);
  for (const row of rows) {
    let site: string | undefined;
    if (RESOLVE && row.name) {
      try {
        const res = await firecrawlClient.search(`"${row.name}"`, { limit: 5, sources: ['web'] });
        site = (res.web ?? [])
          .map((r) => (r as { url?: string }).url ?? '')
          .find((u) => isUsableLead(u, newsHosts));
      } catch { /* leave blank; a human fills it */ }
    }
    appendFileSync(OUT, [found, row.trigger, row.name, row.title, row.url, row.date, site, 'new'].map(csv).join(',') + '\n');
  }

  console.log(`\n✓ ${rows.length} new trigger rows → ${OUT}`);
  console.log('Review each row (headcount, team page) before building a roster. Most hits are too big or not a firm.');
}

// Only run when executed directly — importing the parsers for tests must not fire searches.
if (import.meta.url === `file://${process.argv[1]}`) main();
