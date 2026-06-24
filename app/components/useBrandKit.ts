'use client';
import { useState, useCallback } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { DEMO_FIELDS, NEUTRAL_BRAND_KIT } from '@/lib/brand-kit-schema';
import { toEmailSafeFont, DEFAULT_EMAIL_FONT } from '@/lib/email-fonts';
import { brandRoles, type Roles } from '@/lib/render-signature';
import type { BrandKit, SignatureFields, Layout, Visibility, ToggleableField } from '@/lib/types';

export const LAYOUTS: { id: Layout; label: string; h: number }[] = [
  { id: 'minimal', label: 'Minimal', h: 140 },
  { id: 'logo', label: 'With logo', h: 160 },
  { id: 'logo-cta', label: 'Logo + CTA', h: 200 },
];

export const ALL_VISIBLE: Visibility = {
  email: true, phone: true, website: true,
  linkedin: true, github: true, x: true, discord: true,
};

// Role presets — the answer to "different roles show different things". Each lists
// the fields ON; everything else is hidden. Applied over whatever was extracted.
export const PRESETS: { name: string; show: ToggleableField[] }[] = [
  { name: 'Sales', show: ['email', 'phone', 'website', 'linkedin'] },
  { name: 'Engineer', show: ['email', 'website', 'github', 'linkedin'] },
  { name: 'Founder', show: ['email', 'phone', 'website', 'linkedin', 'x'] },
  { name: 'Creator', show: ['email', 'website', 'x', 'discord'] },
];

const presetVisibility = (show: ToggleableField[]): Visibility =>
  Object.fromEntries(
    (Object.keys(ALL_VISIBLE) as ToggleableField[]).map((k) => [k, show.includes(k)]),
  ) as Visibility;

type HookOpts = {
  initialKit?: BrandKit;
  initialFields?: SignatureFields;
  initialFont?: string;
};

export function useBrandKit(opts: HookOpts = {}) {
  const [url, setUrl] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [kit, setKit] = useState<BrandKit>(opts.initialKit ?? NEUTRAL_BRAND_KIT);
  // Text/Accent colors: auto-derived from the extracted kit, then user-editable.
  // Held separately from the kit so an edit isn't re-derived away on the next render.
  const [roles, setRoles] = useState<Roles>(() => brandRoles(opts.initialKit ?? NEUTRAL_BRAND_KIT));
  const [font, setFont] = useState(opts.initialFont ?? DEFAULT_EMAIL_FONT);
  const [fields, setFields] = useState<SignatureFields>(opts.initialFields ?? DEMO_FIELDS);
  const [visibility, setVisibility] = useState<Visibility>(ALL_VISIBLE);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

  const toggleField = useCallback((k: ToggleableField) =>
    setVisibility((v) => ({ ...v, [k]: !v[k] })), []);
  const applyPreset = useCallback((show: ToggleableField[]) =>
    setVisibility(presetVisibility(show)), []);

  // Fields actually rendered: a hidden toggle blanks its value, so the pure
  // renderer (which skips empty fields) needs no visibility logic of its own.
  const displayFields: SignatureFields = { ...fields };
  for (const k of Object.keys(ALL_VISIBLE) as ToggleableField[]) {
    if (!visibility[k]) displayFields[k] = '';
  }

  const generate = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    const domain = url.trim();
    if (!domain) return;
    const target = /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
    setLoading(true);
    setNote('');
    try {
      const res = await fetch('/api/brand-kit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      setKit(data.brandKit);
      setRoles(brandRoles(data.brandKit)); // fresh extraction → re-derive Text/Accent defaults
      setSiteUrl(data.finalUrl ?? target);
      setFont(toEmailSafeFont(data.brandKit.fontFamily));
      // Always replace fields on a real generate — never merge onto the demo
      // defaults (Alex Rivera…), or stale values linger when a site yields none.
      if (!data.fallback) {
        const c = data.contact ?? {};
        setFields({
          fullName: c.fullName ?? '', jobTitle: c.jobTitle ?? '',
          email: c.email ?? '', phone: c.phone ?? '',
          website: c.website ?? '', linkedin: c.linkedin ?? '',
          github: c.github ?? '', x: c.x ?? '', discord: c.discord ?? '',
        });
        setVisibility(ALL_VISIBLE); // fresh extraction → show everything we found
      }
      if (data.rateLimited)
        setNote("You've generated several signatures — come back in an hour, or join the waitlist for Pro.");
      else if (data.degraded === 'extract')
        setNote('Pulled your logo and name — colors are our best guess. Adjust them below.');
      else if (data.fallback)
        setNote("Couldn't reach that site — showing a neutral signature. Try another URL.");
      else
        setNote('');
    } catch {
      setNote('Something went wrong reading that site. Try again.');
    } finally {
      setLoading(false);
    }
  }, [url]);

  const setField = useCallback((k: keyof SignatureFields) => (e: ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value })), []);

  // <input type="color"> always emits a valid #rrggbb, so no validation needed here.
  const setRole = useCallback((role: keyof Roles) => (hex: string) =>
    setRoles((r) => ({ ...r, [role]: hex })), []);
  const setLogoUrl = useCallback((logoUrl: string) =>
    setKit((k) => ({ ...k, logoUrl })), []);

  return {
    url, setUrl, siteUrl, kit, font, setFont, fields, displayFields, setField,
    roles, setRole, setLogoUrl,
    visibility, toggleField, applyPreset,
    loading, note, generate,
  };
}
