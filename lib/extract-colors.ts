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

export function brandColorsFromCss(html: string): { primary?: string; secondary?: string } {
  const res: { primary?: string; secondary?: string } = {};
  const re = /--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const name = m[1].toLowerCase();
    const hex = normHex(m[2]);
    if (!hex) continue;
    if (!res.primary && /(^|-)(primary|accent|brand)(-|$|[0-9])/.test(name)) res.primary = hex;
    else if (!res.secondary && /(^|-)(secondary|muted|subtle)(-|$|[0-9])/.test(name)) res.secondary = hex;
  }
  if (!res.primary) {
    const theme = themeColor(html);
    if (theme) res.primary = theme;
  }
  return res;
}
