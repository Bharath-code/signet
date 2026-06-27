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

// Pick the best email-renderable logo from candidates given in priority order:
// the first raster (or extensionless, assumed renderable) wins; SVG is used only
// when nothing else is available; undefined when no candidate is a real image.
export function pickEmailLogo(...candidates: (string | null | undefined)[]): string | undefined {
  const valid = candidates.filter((c): c is string => !!c && isLikelyImageUrl(c));
  return valid.find((u) => !isSvgUrl(u)) ?? valid[0];
}
