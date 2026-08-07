'use client';
import { useState, useCallback, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { DEMO_FIELDS, DEMO_BRAND_KIT, ctaTextForRole } from '@/lib/brand-kit-schema';
import { toEmailSafeFont, DEFAULT_EMAIL_FONT } from '@/lib/email-fonts';
import { brandRoles, type Roles } from '@/lib/render-signature';
import { track } from './track';
import type { BrandKit, SignatureFields, Layout, Visibility, ToggleableField, BrandKitConfidence } from '@/lib/types';

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
  initialRoles?: Roles;     // user-edited colors carried in a shared ?kit= link
  initialUrl?: string;      // pre-fills the URL bar (from ?from= when kit is preloaded)
  initialSiteUrl?: string;  // marks the kit as "extracted" so font/color labels show
};

export function useBrandKit(opts: HookOpts = {}) {
  const [url, setUrl] = useState(opts.initialUrl ?? '');
  const [siteUrl, setSiteUrl] = useState(opts.initialSiteUrl ?? '');
  const [kit, setKit] = useState<BrandKit>(opts.initialKit ?? DEMO_BRAND_KIT);
  const [roles, setRoles] = useState<Roles>(() => opts.initialRoles ?? brandRoles(opts.initialKit ?? DEMO_BRAND_KIT));
  // Whether the user already has a real (extracted or preloaded) kit on screen —
  // a failed/rate-limited generation must not wipe it back to neutral.
  const hadKit = useRef(!!opts.initialKit);
  const [font, setFont] = useState(opts.initialFont ?? (opts.initialKit ? DEFAULT_EMAIL_FONT : DEMO_BRAND_KIT.fontFamily));
  const [fields, setFields] = useState<SignatureFields>(opts.initialFields ?? DEMO_FIELDS);
  const [visibility, setVisibility] = useState<Visibility>(ALL_VISIBLE);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  // 'firecrawl' = deterministic kit (high confidence); 'extract'/'vision' = LLM
  // best-guess; 'degraded' = both LLM paths failed; null = no fetch yet. Drives the
  // soft confidence caption + the skip-vision metric.
  const [source, setSource] = useState<'firecrawl' | 'extract' | 'vision' | 'degraded' | null>(null);
  const [confidence, setConfidence] = useState<BrandKitConfidence | null>(null);

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

  const fetchBrandKit = useCallback(async (target: string) => {
    setLoading(true);
    setNote('');
    try {
      const res = await fetch('/api/brand-kit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      // A degraded-extract response still carries real scraped data (logo, name);
      // rate-limit and scrape failures carry the neutral kit — don't let those
      // overwrite a kit the user already has (and don't mark them "extracted").
      const gotRealKit = !data.fallback || data.degraded === 'extract';
      if (gotRealKit || !hadKit.current) {
        setKit(data.brandKit);
        setRoles(brandRoles(data.brandKit));
        setFont(toEmailSafeFont(data.brandKit.fontFamily));
      }
      if (gotRealKit) {
        hadKit.current = true;
        setSiteUrl(data.finalUrl ?? target);
        setSource(data.source ?? null);
        setConfidence(data.confidence ?? null);
      }
      if (!data.fallback) {
        const c = data.contact ?? {};
        setFields({
          fullName: c.fullName ?? '', jobTitle: c.jobTitle ?? '',
          ctaText: ctaTextForRole(c.jobTitle ?? ''),
          ctaUrl: '',
          email: c.email ?? '', phone: c.phone ?? '',
          website: c.website ?? '', linkedin: c.linkedin ?? '',
          github: c.github ?? '', x: c.x ?? '', discord: c.discord ?? '',
        });
        setVisibility(ALL_VISIBLE);
      }
      // Extraction outcome — the core validation signal (brand-match quality).
      // Fires for both manual generate() and outreach autoGenerate() paths.
      track(data.fallback ? 'extraction_fallback' : 'extraction_success', {
        degraded: data.degraded ?? null,
        rateLimited: !!data.rateLimited,
        hasLogo: !!data.brandKit?.logoUrl,
        // 'firecrawl' = skipped the vision model — the Phase 1 "≥70% skip vision" metric.
        source: data.source ?? null,
      });
      if (data.rateLimited)
        setNote("You've generated several signatures — come back in an hour, or join the waitlist for Pro.");
      else if (data.degraded === 'extract')
        setNote('Pulled your logo and name — colors are our best guess. Adjust them below.');
      else if (data.fallback)
        setNote("Couldn't reach that site — showing a neutral signature. Try another URL.");
      else
        setNote('');
    } catch {
      track('extraction_fallback', { degraded: 'network', rateLimited: false, hasLogo: false });
      setNote('Something went wrong reading that site. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const generate = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    const domain = url.trim();
    if (!domain) return;
    const target = /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
    await fetchBrandKit(target);
  }, [url, fetchBrandKit]);

  // Called on mount when ?from= is present — pre-fills the URL bar and auto-fetches.
  // onComplete fires after the fetch resolves (success or fallback) — used for tracking.
  const autoGenerate = useCallback(async (rawUrl: string, onComplete?: () => void) => {
    const target = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    setUrl(rawUrl.replace(/^https?:\/\//i, ''));
    await fetchBrandKit(target);
    onComplete?.();
  }, [fetchBrandKit]);

  const setField = useCallback((k: keyof SignatureFields) => (e: ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value })), []);

  // <input type="color"> always emits a valid #rrggbb, so no validation needed here.
  const setRole = useCallback((role: keyof Roles) => (hex: string) =>
    setRoles((r) => ({ ...r, [role]: hex })), []);
  const setLogoUrl = useCallback((logoUrl: string) =>
    setKit((k) => ({ ...k, logoUrl })), []);

  return {
    url, setUrl, siteUrl, kit, font, setFont, fields, displayFields, setField,
    roles, setRole, setLogoUrl, source, confidence,
    visibility, toggleField, applyPreset,
    loading, note, generate, autoGenerate,
  };
}
