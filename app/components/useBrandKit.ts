'use client';
import { useState, useCallback } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { DEMO_FIELDS, NEUTRAL_BRAND_KIT } from '@/lib/brand-kit-schema';
import type { BrandKit, SignatureFields, Layout } from '@/lib/types';

export const LAYOUTS: { id: Layout; label: string; h: number }[] = [
  { id: 'minimal', label: 'Minimal', h: 140 },
  { id: 'logo', label: 'With logo', h: 160 },
  { id: 'logo-cta', label: 'Logo + CTA', h: 200 },
];

export function toEmailSafeFont(extracted: string): string {
  const f = extracted.toLowerCase();
  if (/georgia|merriweather|playfair|lora|cormorant|fraunces/.test(f)) return 'Georgia, serif';
  if (/times/.test(f)) return 'Times New Roman, serif';
  if (/verdana/.test(f)) return 'Verdana, Geneva, sans-serif';
  if (/trebuchet|nunito|raleway/.test(f)) return 'Trebuchet MS, sans-serif';
  return 'Arial, Helvetica, sans-serif';
}

type HookOpts = {
  initialKit?: BrandKit;
  initialFields?: SignatureFields;
  initialFont?: string;
};

export function useBrandKit(opts: HookOpts = {}) {
  const [url, setUrl] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [kit, setKit] = useState<BrandKit>(opts.initialKit ?? NEUTRAL_BRAND_KIT);
  const [font, setFont] = useState(opts.initialFont ?? 'Georgia, serif');
  const [fields, setFields] = useState<SignatureFields>(opts.initialFields ?? DEMO_FIELDS);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

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
      setSiteUrl(data.finalUrl ?? target);
      setFont(toEmailSafeFont(data.brandKit.fontFamily));
      if (data.contact && Object.keys(data.contact).length > 0) {
        setFields({
          fullName: data.contact.fullName ?? '',
          jobTitle: data.contact.jobTitle ?? '',
          email: data.contact.email ?? '',
          phone: data.contact.phone ?? '',
        });
      }
      if (data.rateLimited)
        setNote("You've generated several signatures — come back in an hour, or join the waitlist for Pro.");
      else if (data.fallback)
        setNote("Couldn't read that site — showing a neutral signature. Try another URL.");
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

  return {
    url, setUrl, siteUrl, kit, font, setFont, fields, setField,
    loading, note, generate,
  };
}
