import type { BrandKit, SignatureFields, Layout } from './types';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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

function details(kit: BrandKit, f: SignatureFields, websiteUrl?: string): string {
  const font = esc(kit.fontFamily);
  const primary = esc(ensureReadable(kit.primaryColor));
  const secondary = esc(ensureReadable(kit.secondaryColor));

  // For personal sites the AI often extracts the person's own name as companyName.
  // When that happens, show the domain instead so the name doesn't repeat.
  const isPersonalSite = kit.companyName.trim() &&
    f.fullName.toLowerCase().startsWith(kit.companyName.toLowerCase().trim().split(' ')[0]);
  const domain = websiteUrl ? (() => { try { return new URL(websiteUrl).hostname.replace(/^www\./, ''); } catch { return null; } })() : null;
  const subtitle = isPersonalSite && domain
    ? `${esc(f.jobTitle)} · ${esc(domain)}`
    : `${esc(f.jobTitle)} · ${esc(kit.companyName)}`;

  const emailLine = f.email
    ? `<a href="mailto:${esc(f.email)}" style="color:${primary};text-decoration:none">${esc(f.email)}</a><br>`
    : '';
  const phoneLine = f.phone
    ? `<span style="color:#555">${esc(f.phone)}</span>`
    : '';

  return `
    <div style="font-family:${font};font-size:14px;color:#222;line-height:1.6">
      <strong style="color:${primary}">${esc(f.fullName)}</strong><br>
      <span style="color:${secondary}">${subtitle}</span><br>
      ${emailLine}${phoneLine}
    </div>`;
}

function logoCell(kit: BrandKit): string {
  const primary = esc(kit.primaryColor);
  return `<td style="padding-right:12px;vertical-align:top;border-right:3px solid ${primary}">
      <img src="${esc(kit.logoUrl)}" alt="${esc(kit.companyName)}" height="40" style="display:block;border:0;max-height:40px;max-width:84px;width:auto;height:auto">
    </td>`;
}

export function renderSignature(kit: BrandKit, fields: SignatureFields, layout: Layout, websiteUrl?: string): string {
  const primary = esc(kit.primaryColor);                          // raw — structural accent (border)
  const primaryReadable = esc(ensureReadable(kit.primaryColor));  // text/CTA — contrast-safe on white

  if (layout === 'minimal') {
    return `<table cellpadding="0" cellspacing="0" role="presentation"><tr>
      <td style="border-left:3px solid ${primary};padding-left:16px">${details(kit, fields, websiteUrl)}</td>
    </tr></table>`;
  }

  const ctaHref = websiteUrl ? esc(websiteUrl) : '#';
  const ctaRow = layout === 'logo-cta'
    ? `<tr>
         <td></td>
         <td style="padding-top:12px">
           <a href="${ctaHref}" target="_blank" rel="noopener noreferrer"
              style="display:inline-block;background:${primaryReadable};color:#fff;
              font-family:${esc(kit.fontFamily)};font-size:13px;text-decoration:none;
              padding:8px 18px;border-radius:4px">Visit website →</a>
         </td>
       </tr>`
    : '';

  return `<table cellpadding="0" cellspacing="0" role="presentation">
    <tr>${logoCell(kit)}<td style="vertical-align:top;padding-left:12px">${details(kit, fields, websiteUrl)}</td></tr>
    ${ctaRow}
  </table>`;
}
