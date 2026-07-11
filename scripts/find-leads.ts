// Source candidate cold-email URLs beyond the hand-picked 10 in
// docs/cold-email-leads.md — run a handful of ICP-matched Firecrawl searches,
// strip aggregator/social noise, dedupe against domains already contacted,
// and write a plain URL list that `scripts/outreach.ts --file` already
// knows how to consume (personalizes + renders a signature per lead).
//
//   npx tsx scripts/find-leads.ts                    # up to 100 → docs/cold-email-urls.txt
//   npx tsx scripts/find-leads.ts --limit 50
//   npx tsx scripts/find-leads.ts --out leads.txt
//
// Then: npx tsx scripts/outreach.ts --file docs/cold-email-urls.txt --limit 100

import { writeFileSync, readFileSync, existsSync } from 'node:fs';

try { process.loadEnvFile('.env.local'); } catch { /* env may already be set */ }

const arg = (f: string) => { const i = process.argv.indexOf(f); return i >= 0 ? process.argv[i + 1] : undefined; };
const LIMIT = Number(arg('--limit') ?? 100);
const OUT = arg('--out') ?? 'docs/cold-email-urls.txt';

// ICP from MASTER-PLAN.md: funded, email-heavy, brand-critical B2B startups,
// ~5-50 people (small enough that "5 people, 5 different signatures" lands).
// ponytail: hand-picked query strings against general web search, not a real
// YC/Crunchbase directory API — swap in one if hit-rate here proves too noisy.
const QUERIES = [
  'Y Combinator W25 startup B2B SaaS',
  'Y Combinator S25 startup B2B SaaS',
  'seed funded B2B startup fintech 2026',
  'seed funded B2B startup legal tech 2026',
  'seed funded B2B startup insurance AI 2026',
  'new B2B sales tool startup launched 2026',
  'Product Hunt B2B SaaS launch this week',
];

// These surface constantly in search results but are never the lead's own
// site — the founder's homepage is the target, not the article about them.
const BLOCKED_DOMAINS =
  /^(ycombinator|producthunt|twitter|x|reddit|linkedin|medium|github|techcrunch|crunchbase|wikipedia|youtube|google|facebook|instagram|news\.ycombinator)\.com$|\.(reddit|wikipedia)\.org$/i;
// Same repo-hosting filter as outreach.ts's Show HN path — their brand, not the project's.
const REPO_HOSTS = /^(github|gitlab|codeberg|gitea|bitbucket|npmjs|pypi|crates|nuget|rubygems|packagist|pub\.dev|hex\.pm)\./;

function domain(url: string): string | null {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
}

function resultUrl(r: unknown): string | undefined {
  const o = r as { url?: string; metadata?: { url?: string } };
  return o.url ?? o.metadata?.url;
}

// Pure + exported so find-leads.test.ts can check it without hitting the network.
export function isUsableLead(url: string, seen: Set<string>): boolean {
  const d = domain(url);
  if (!d) return false;
  if (seen.has(d)) return false;
  if (BLOCKED_DOMAINS.test(d) || REPO_HOSTS.test(d)) return false;
  return true;
}

// Skip anyone already in the existing lead doc or a prior outreach run.
function alreadyContacted(): Set<string> {
  const seen = new Set<string>();
  for (const path of ['docs/cold-email-leads.md', 'outreach/outreach.csv']) {
    if (!existsSync(path)) continue;
    for (const m of readFileSync(path, 'utf8').matchAll(/https?:\/\/[^\s)"'`]+/g)) {
      const d = domain(m[0]);
      if (d) seen.add(d);
    }
  }
  return seen;
}

async function main() {
  const { firecrawlClient } = await import('../lib/scrape-site');
  const seen = alreadyContacted();
  const urls: string[] = [];

  for (const query of QUERIES) {
    if (urls.length >= LIMIT) break;
    try {
      const res = await firecrawlClient.search(query, { limit: 20, sources: ['web'] });
      let added = 0;
      for (const r of res.web ?? []) {
        const url = resultUrl(r);
        if (!url || !isUsableLead(url, seen)) continue;
        seen.add(domain(url)!);
        urls.push(url);
        added++;
        if (urls.length >= LIMIT) break;
      }
      console.log(`"${query}" → ${res.web?.length ?? 0} results, +${added} usable (${urls.length} total)`);
    } catch (e) {
      console.warn(`search failed for "${query}": ${(e as Error).message}`);
    }
  }

  writeFileSync(OUT, urls.join('\n') + '\n');
  console.log(`\n✓ ${urls.length} leads → ${OUT}`);
  console.log(`Next: npx tsx scripts/outreach.ts --file ${OUT} --limit ${urls.length}`);
}

// Only run when executed directly — importing isUsableLead for tests must not fire searches.
if (import.meta.url === `file://${process.argv[1]}`) main();
