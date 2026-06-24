import type { BrandKit, SignatureFields, Layout } from './types';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// href is an executable sink (unlike <img src>), and esc() does NOT stop
// `javascript:`/`data:` URLs (they need no quotes). Validate the scheme here and
// drop anything that isn't http(s). Bare domains ("acme.com") get https:// added.
export function safeHref(raw: string): string | null {
  if (!raw) return null;
  const parse = (s: string) => { try { return new URL(s); } catch { return null; } };
  const u = parse(raw.trim()) ?? parse('https://' + raw.trim());
  if (!u) return null;
  return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
}

type RGB = [number, number, number];

function parseHex(hex: string): RGB | null {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
}

const toHex = (rgb: RGB): string =>
  '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

function relativeLuminance([r, g, b]: RGB): number {
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

export function contrastRatio(a: string, b: string): number {
  const ra = parseHex(a), rb = parseHex(b);
  if (!ra || !rb) return 1;
  const la = relativeLuminance(ra), lb = relativeLuminance(rb);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// Darken a brand color until it clears WCAG AA (4.5:1) against white, so colored
// text and white-on-color buttons stay legible when the extracted color is light.
// Structural accents (borders) keep the raw color — only readable sinks use this.
export function ensureReadable(hex: string, ratio = 4.5): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex; // malformed → leave as-is; esc() still guards the sink
  let cur = rgb;
  // contrast against white (#fff) = 1.05 / (luminance + 0.05)
  for (let i = 0; i < 40 && 1.05 / (relativeLuminance(cur) + 0.05) < ratio; i++) {
    cur = cur.map((v) => v * 0.9) as RGB;
  }
  return toHex(cur);
}

// max-min channel spread; ~0 for greys/black/white, high for vivid hues.
function chromaHex(hex: string): number {
  const rgb = parseHex(hex);
  return rgb ? Math.max(...rgb) - Math.min(...rgb) : -1;
}

// Map the two brand colors to roles by *property*, not by their primary/secondary
// label — so the model's (sometimes uncertain) ordering can't flip the look. The
// darker color is the readable ink (text, button bg); the more saturated is the
// single structural stamp (borders). For a black+lime brand: black text, lime border.
export function brandRoles(kit: BrandKit): { ink: string; accent: string } {
  const a = kit.primaryColor, b = kit.secondaryColor;
  const ra = parseHex(a), rb = parseHex(b);
  if (!ra || !rb) return { ink: a, accent: a }; // malformed → esc() still guards sinks
  const ink = relativeLuminance(ra) <= relativeLuminance(rb) ? a : b;
  const accent = chromaHex(a) >= chromaHex(b) ? a : b;
  return { ink, accent };
}

function details(kit: BrandKit, f: SignatureFields): string {
  const font = esc(kit.fontFamily);
  const ink = esc(ensureReadable(brandRoles(kit).ink));

  // Line 2 = role + org. On a personal site the AI extracts the person's own name
  // as companyName, so appending it would repeat the name — drop it and show the
  // role alone (the website already has its own link in the row below).
  const isPersonalSite = kit.companyName.trim() &&
    f.fullName.toLowerCase().startsWith(kit.companyName.toLowerCase().trim().split(' ')[0]);
  const subtitle = [f.jobTitle, isPersonalSite ? '' : kit.companyName]
    .filter(Boolean).map(esc).join(' · ');

  const emailLine = f.email
    ? `<a href="mailto:${esc(f.email)}" style="color:${ink};text-decoration:none">${esc(f.email)}</a><br>`
    : '';
  const phoneLine = f.phone
    ? `<span style="color:#555">${esc(f.phone)}</span>`
    : '';

  // Each link is scheme-validated at its sink; website shows its domain, socials
  // their platform name. An invalid/unsafe URL is silently dropped, never rendered.
  const linkDefs: [string, string][] = [
    ['Website', f.website], ['LinkedIn', f.linkedin],
    ['GitHub', f.github], ['X', f.x], ['Discord', f.discord],
  ];
  const links = linkDefs
    .map(([label, raw]): string => {
      const href = safeHref(raw);
      if (!href) return '';
      const text = label === 'Website' ? (() => { try { return new URL(href).hostname.replace(/^www\./, ''); } catch { return label; } })() : label;
      return `<a href="${esc(href)}" style="color:${ink};text-decoration:none">${esc(text)}</a>`;
    })
    .filter(Boolean);
  const linkLine = links.length
    ? `<div style="margin-top:4px;font-size:13px">${links.join('<span style="color:#bbb"> · </span>')}</div>`
    : '';

  return `
    <div style="font-family:${font};font-size:14px;color:#222;line-height:1.6">
      <strong style="color:${ink}">${esc(f.fullName)}</strong><br>
      <span style="color:${ink}">${subtitle}</span><br>
      ${emailLine}${phoneLine}${linkLine}
    </div>`;
}

function logoCell(kit: BrandKit): string {
  const accent = esc(brandRoles(kit).accent);
  return `<td style="padding-right:12px;vertical-align:top;border-right:3px solid ${accent}">
      <img src="${esc(kit.logoUrl)}" alt="${esc(kit.companyName)}" height="40" style="display:block;border:0;max-height:40px;max-width:84px;width:auto;height:auto">
    </td>`;
}

export function renderSignature(kit: BrandKit, fields: SignatureFields, layout: Layout, websiteUrl?: string): string {
  const { ink, accent: accentRaw } = brandRoles(kit);
  const accent = esc(accentRaw);                // raw — the single structural stamp (border)
  const inkReadable = esc(ensureReadable(ink)); // CTA button bg — contrast-safe for white text

  if (layout === 'minimal') {
    return `<table cellpadding="0" cellspacing="0" role="presentation"><tr>
      <td style="border-left:3px solid ${accent};padding-left:16px">${details(kit, fields)}</td>
    </tr></table>`;
  }

  const ctaHref = websiteUrl ? esc(websiteUrl) : '#';
  const ctaRow = layout === 'logo-cta'
    ? `<tr>
         <td></td>
         <td style="padding-top:12px">
           <a href="${ctaHref}" target="_blank" rel="noopener noreferrer"
              style="display:inline-block;background:${inkReadable};color:#fff;
              font-family:${esc(kit.fontFamily)};font-size:13px;text-decoration:none;
              padding:8px 18px;border-radius:4px">Visit website →</a>
         </td>
       </tr>`
    : '';

  return `<table cellpadding="0" cellspacing="0" role="presentation">
    <tr>${logoCell(kit)}<td style="vertical-align:top;padding-left:12px">${details(kit, fields)}</td></tr>
    ${ctaRow}
  </table>`;
}
