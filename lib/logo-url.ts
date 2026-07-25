// Logo URL selection for email signatures. Standalone (no LLM/Firecrawl imports)
// so both the deterministic mapper and the vision orchestrator can use it without
// an import cycle.

// A logo must point at an image. With no logo image on the page, models/metadata
// tend to return the page URL (e.g. "https://site.com/") which renders as a broken
// <img>. Reject the bare homepage and obvious HTML pages; accept any image-y path
// (including extensionless CDN logo URLs).
export function isLikelyImageUrl(raw: string): boolean {
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  if (u.pathname === '' || u.pathname === '/') return false;
  return !/\.(html?|php|aspx?|jsp)$/i.test(u.pathname);
}

// Gmail (the largest webmail client) does not render SVG <img> at all, and several
// others render it inconsistently — an SVG logo silently breaks for most recipients.
// Treat .svg URLs (and svg data-URIs) as a last resort behind any raster candidate.
export function isSvgUrl(raw: string): boolean {
  if (/^data:image\/svg/i.test(raw)) return true;
  try { return /\.svg$/i.test(new URL(raw).pathname); } catch { return false; }
}

// Smallest dimension named in the filename ("favicon-16x16.png" -> 16). Only the
// NxN convention is read; a missing hint returns undefined (not zero), so an
// unlabelled URL is never penalised for lacking one.
export function logoSizeHint(raw: string): number | undefined {
  try {
    const m = new URL(raw).pathname.match(/(\d{2,4})x(\d{2,4})/);
    return m ? Math.min(Number(m[1]), Number(m[2])) : undefined;
  } catch { return undefined; }
}

// Renders, but badly. `.ico` is inconsistent across clients, and the signature
// logo cell is 40px tall — on a 2x display that wants ~80px of source, so a
// 16/32px favicon arrives visibly soft. Both beat no logo at all, so they rank
// behind a real raster mark rather than being rejected.
export function isPoorLogoUrl(raw: string): boolean {
  const size = logoSizeHint(raw);
  if (size !== undefined && size < 48) return true;
  try { return /\.ico$/i.test(new URL(raw).pathname); } catch { return false; }
}

// A wide 1200x630 marketing banner. Callers pass og:image as a last-resort logo
// candidate, so this is not a rejection rule — it exists so the eval can count how
// often we fall back to one. Squeezed into the 84x40 signature cell it reads as a
// screenshot, not a brand mark.
export function isSocialCardUrl(raw: string): boolean {
  try {
    return /(^|[/_-])(og|opengraph|social|cover|twitter-card)([/_.-]|$)/i.test(new URL(raw).pathname);
  } catch { return false; }
}

// Pick the best email-renderable logo from candidates given in priority order:
// the first raster (or extensionless, assumed renderable) wins; SVG is used only
// when nothing else is available; undefined when no candidate is a real image.
//
// Position is priority, and deliberately so — callers order candidates by category
// (square mark > favicon > og:image), and that ordering encodes judgement this
// function cannot reconstruct from a URL. An earlier attempt to also demote .ico and
// tiny favicons here inverted it: with no apple-touch-icon present, a favicon.ico
// lost to an og:image card on 8 of 20 eval sites, which is strictly worse. A soft
// favicon beats a marketing banner. Measure weak logos (isPoorLogoUrl) — don't
// reorder on them without a better candidate to promote.
export function pickEmailLogo(...candidates: (string | null | undefined)[]): string | undefined {
  const valid = candidates.filter((c): c is string => !!c && isLikelyImageUrl(c));
  return valid.find((u) => !isSvgUrl(u)) ?? valid[0];
}
