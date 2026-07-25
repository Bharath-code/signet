// Deterministic brand-color extraction from the page's own CSS — no model, no
// guessing. Reads CSS custom properties (design tokens) and <meta theme-color>
// out of the scraped HTML. Returns only what it finds with confidence; the
// caller falls back to the vision model for anything missing.
//
// ponytail: regex over inline CSS vars + theme-color only. Colors that live solely
//   in external stylesheets or utility classes (Tailwind) aren't seen here — the
//   vision model (extract-brand-kit) reads those from the screenshot, which is more
//   reliable for brand *intent* than a rendered-pixel histogram (a histogram can't
//   tell a brand color from an incidental link blue; vision sees the logo + hierarchy).

function normHex(raw: string): string | null {
  let h = raw.trim().replace(/^#/, '').toLowerCase();
  if (h.length === 8) h = h.slice(0, 6); // drop alpha
  if (h.length === 4) h = h.slice(0, 3);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return /^[0-9a-f]{6}$/.test(h) ? '#' + h : null;
}

function themeColor(html: string): string | null {
  const tag = html.match(/<meta[^>]*name=["']theme-color["'][^>]*>/i)?.[0];
  const hex = tag?.match(/content=["'](#[0-9a-fA-F]{3,8})["']/)?.[1];
  return hex ? normHex(hex) : null;
}

// The generic web hyperlink blue (azure cluster, hue ~195–245°) is the #1 source
// of bogus "brand accents" — Firecrawl often reports a page's link color as a brand
// color. This flags that cluster so the orchestrator can route to vision instead.
// Tuned to PRESERVE real brand blues/indigos: Stripe indigo #533afd (hue ~248° +
// red-leaning) and Tailwind cyan #06b6d4 (hue ~189°) fall outside the window;
// Framer's #0099ff is caught (a known false positive — vision recovers it).
export function isLinkBlue(raw: string): boolean {
  const hex = normHex(raw);
  if (!hex) return false;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  if (b !== Math.max(r, g, b)) return false; // blue must dominate
  if (b - r < 90) return false;              // and dominate strongly
  if (g < r - 10) return false;              // exclude purple/indigo (red-leaning)
  const hue = 60 * (4 + (r - g) / (b - Math.min(r, g, b)));
  return hue >= 195 && hue <= 245;
}

// RGB max−min spread. ~0 for greys/black/white, high for vivid hues. Mirrors the
// VIVID threshold in brand-from-firecrawl.ts.
const VIVID = 40;
function chroma(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return Math.max(r, g, b) - Math.min(r, g, b);
}

export function brandColorsFromCss(html: string): { primary?: string; secondary?: string } {
  const res: { primary?: string; secondary?: string } = {};
  const all: string[] = [];
  const re = /--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const name = m[1].toLowerCase();
    const hex = normHex(m[2]);
    if (!hex) continue;
    all.push(hex);
    if (!res.primary && /(^|-)(primary|accent|brand)(-|$|[0-9])/.test(name)) res.primary = hex;
    else if (!res.secondary && /(^|-)(secondary|muted|subtle)(-|$|[0-9])/.test(name)) res.secondary = hex;
  }
  // Name-agnostic fallback. Framer emits `--token-<uuid>`, and CSS Modules /
  // styled-components / Tailwind arbitrary values hash their names too, so the
  // semantic match above finds nothing on a large share of modern sites — every
  // color gets parsed, then discarded. Saturation carries the signal the name
  // doesn't: on a real Framer page (moritzlegal.com, measured 2026-07-25) the
  // brand tan #b58159 scores chroma 92 while every neutral in the palette lands
  // under 35, so the max is unambiguous. Link-blue is still rejected here — an
  // unstyled <a> color is not a brand color no matter how saturated.
  //
  // ponytail: highest-chroma token wins, no occurrence weighting. A site whose
  //   brand is muted but which declares one vivid error-red could pick wrong;
  //   weight by how often the token is referenced if the eval shows misses.
  if (!res.primary) {
    const vivid = all.filter((h) => chroma(h) >= VIVID && !isLinkBlue(h));
    if (vivid.length) res.primary = vivid.reduce((a, b) => (chroma(b) > chroma(a) ? b : a));
  }
  if (!res.primary) {
    const theme = themeColor(html);
    if (theme) res.primary = theme;
  }
  return res;
}
