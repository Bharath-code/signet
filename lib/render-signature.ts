import type { BrandKit, SignatureFields, Layout } from './types';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function details(kit: BrandKit, f: SignatureFields, websiteUrl?: string): string {
  const font = esc(kit.fontFamily);
  const primary = esc(kit.primaryColor);
  const secondary = esc(kit.secondaryColor);

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
  const primary = esc(kit.primaryColor);

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
              style="display:inline-block;background:${primary};color:#fff;
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
