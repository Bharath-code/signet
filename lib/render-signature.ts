import type { BrandKit, SignatureFields, Layout } from './types';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function details(kit: BrandKit, f: SignatureFields): string {
  const font = esc(kit.fontFamily);
  return `
    <div style="font-family:${font};font-size:14px;color:#222;line-height:1.4">
      <strong style="color:${kit.primaryColor}">${esc(f.fullName)}</strong><br>
      <span style="color:${kit.secondaryColor}">${esc(f.jobTitle)} · ${esc(kit.companyName)}</span><br>
      <a href="mailto:${esc(f.email)}" style="color:${kit.primaryColor};text-decoration:none">${esc(f.email)}</a><br>
      <span style="color:#555">${esc(f.phone)}</span>
    </div>`;
}

function logoCell(kit: BrandKit): string {
  return `<td style="padding-right:16px;vertical-align:top;border-right:3px solid ${kit.primaryColor}">
      <img src="${esc(kit.logoUrl)}" alt="${esc(kit.companyName)}" height="40" style="display:block;border:0">
    </td>`;
}

export function renderSignature(kit: BrandKit, fields: SignatureFields, layout: Layout): string {
  if (layout === 'minimal') {
    return `<table cellpadding="0" cellspacing="0" role="presentation"><tr>
      <td style="border-left:3px solid ${kit.primaryColor};padding-left:12px">${details(kit, fields)}</td>
    </tr></table>`;
  }

  const ctaRow = layout === 'logo-cta'
    ? `<tr><td colspan="2" style="padding-top:12px">
         <a href="#" style="display:inline-block;background:${kit.primaryColor};color:#fff;
            font-family:${esc(kit.fontFamily)};font-size:13px;text-decoration:none;
            padding:8px 16px;border-radius:4px">Visit website</a>
       </td></tr>`
    : '';

  return `<table cellpadding="0" cellspacing="0" role="presentation">
    <tr>${logoCell(kit)}<td style="vertical-align:top">${details(kit, fields)}</td></tr>
    ${ctaRow}
  </table>`;
}
