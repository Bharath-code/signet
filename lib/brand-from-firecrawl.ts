// Map Firecrawl's native `branding` format (BrandingProfile) → the visual brand
// kit fields. Deterministic, no LLM: Firecrawl runs a purpose-built brand
// extractor server-side, so this is the most reliable color/logo/font source —
// preferred over CSS-token scraping and the Gemini vision pass. Pure function:
// returns only what it confidently found; the orchestrator fills gaps + validates
// the logo URL (image-scheme check lives in extract-brand-kit to avoid a cycle).
import type { BrandingProfile } from '@mendable/firecrawl-js';
import { pickEmailLogo } from './logo-url';

export type FirecrawlBrand = {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
};

// Accept #hex (3/4/6/8) and rgb()/rgba(); everything else → undefined.
function normHex(raw?: string): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim();
  const rgb = s.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
  if (rgb) {
    const ch = rgb.slice(1, 4).map(Number);
    if (ch.every((n) => n >= 0 && n <= 255))
      return '#' + ch.map((n) => n.toString(16).padStart(2, '0')).join('');
    return undefined;
  }
  let h = s.replace(/^#/, '').toLowerCase();
  if (h.length === 8) h = h.slice(0, 6); // drop alpha
  if (h.length === 4) h = h.slice(0, 3);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return /^[0-9a-f]{6}$/.test(h) ? '#' + h : undefined;
}

// RGB max−min spread. ~0 for greys/black/white; high for vivid brand hues.
const VIVID = 40;
function chroma(hex: string): number {
  const h = hex.slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return Math.max(r, g, b) - Math.min(r, g, b);
}

// Accent = the most saturated *real* brand color. Never colors.link (that's the
// hyperlink color, the #1 source of bogus link-blue accents in the eval) and never
// a near-grey. A monochrome site (no vivid color) returns no accent rather than
// promoting a neutral — the orchestrator then lets the vision pass try.
function pickAccent(c: NonNullable<BrandingProfile['colors']>): string | undefined {
  const cands = [c.primary, c.accent, c.secondary]
    .map((x) => normHex(x))
    .filter((x): x is string => !!x && chroma(x) >= VIVID);
  return cands.length ? cands.reduce((a, b) => (chroma(b) > chroma(a) ? b : a)) : undefined;
}

// First real font-family name Firecrawl reports for headings/primary text.
function pickFont(b: BrandingProfile): string | undefined {
  const t = b.typography;
  const fam =
    t?.fontFamilies?.heading ??
    t?.fontFamilies?.primary ??
    t?.fontStacks?.heading?.[0] ??
    t?.fontStacks?.primary?.[0] ??
    b.fonts?.[0]?.family;
  const v = fam?.trim();
  return v ? v : undefined;
}

export function brandKitFromFirecrawl(b: BrandingProfile | undefined): FirecrawlBrand {
  if (!b) return {};
  const c = b.colors ?? {};
  return {
    // primary = the vivid brand accent; secondary = a dark text/ink color. Final
    // primary/secondary ordering is normalized by orderColors downstream.
    primaryColor: pickAccent(c),
    secondaryColor: normHex(c.textPrimary) ?? normHex(c.secondary) ?? normHex(c.textSecondary),
    // Candidates in priority order: the actual logo, then the square favicon.
    // og:image is excluded — it's a wide social card, handled as a last resort in
    // fallbackKitFromMeta. pickEmailLogo prefers raster over SVG regardless of order.
    logoUrl: pickEmailLogo(b.images?.logo, b.logo, b.images?.favicon),
    fontFamily: pickFont(b),
  };
}
