// Single codec for the ?kit= URL param. Three writers (landing handoff, /app
// team-share, outreach script) and one reader previously each rolled their own
// encode — which drifted (empty-string fields the reader rejected, unencoded
// base64 whose '+' URLSearchParams mangles into a space). Every writer and the
// reader now go through this pair, and the round-trip is unit-tested.
import { z } from 'zod';
import { brandKitSchema, ctaTextForRole } from './brand-kit-schema';
import type { BrandKit, SignatureFields } from './types';
import type { Roles } from './render-signature';

// Isomorphic base64url helpers. This module runs both server-side (Node) and
// client-side (browser bundle) — Node's native Buffer supports the 'base64url'
// encoding, but the lightweight Buffer shim Next/Turbopack injects into client
// bundles does not, and throws "Unknown encoding: base64url" there. btoa/atob
// are native globals in both environments (Node 18+), so use those instead.
function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromStandardBase64(input: string): string {
  const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

const hex = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);

// Only accept http(s) — blocks javascript:/data: in href sinks.
const httpUrl = z.string().url().refine((u) => /^https?:\/\//i.test(u), 'must be http(s)');
// Editor fields are typed by hand, so a link field often arrives as a bare
// domain ("company.com" — that is literally the placeholder). Add the scheme
// before .url() sees it, otherwise a valid signature encodes into a link that
// fails to decode.
const urlish = z.preprocess(
  // Only a string with no scheme at all is completed. "javascript:alert(1)"
  // keeps its scheme and still fails httpUrl below.
  (v) => (typeof v === 'string' && v !== '' && !/^[a-z][a-z0-9+.-]*:/i.test(v) ? `https://${v}` : v),
  httpUrl,
);

// Extraction leaves missing fields as '' (not undefined) — treat '' as "absent"
// rather than failing .url()/.email() validation on it.
// .catch('') keeps the failure per-field: one unparseable value drops that field
// instead of voiding the whole kit and dumping the recipient on a neutral demo.
const orBlank = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([z.literal(''), schema]).optional().default('').catch('');
const shortStr = (max: number) => z.string().max(max).optional().default('').catch('');

const contactSchema = z.object({
  fullName:  shortStr(120),
  jobTitle:  shortStr(120),
  ctaText:   shortStr(80),
  email:     orBlank(z.string().email().max(254)),
  phone:     shortStr(40),
  website:   orBlank(urlish),
  linkedin:  orBlank(urlish),
  github:    orBlank(urlish),
  x:         shortStr(80),   // x.com handles aren't always full URLs in older extractions
  discord:   shortStr(120),
});

// User-edited color roles + email-safe font, so a shared kit carries edits
// (the extracted kit alone loses them — roles/font live outside BrandKit).
const rolesSchema = z.object({ ink: hex, accent: hex });

export type KitPayload = {
  brandKit: BrandKit;
  contact?: Partial<SignatureFields>;
  roles?: Roles;
  font?: string;
};

export type DecodedKit = {
  brandKit: BrandKit;
  fields: SignatureFields;
  roles?: Roles;
  font?: string;
};

// base64url: no '+', '/', '=' — safe in a query string without further escaping.
export function encodeKitParam({ brandKit, contact = {}, roles, font }: KitPayload): string {
  // Strip blank fields so the payload stays small and old decoders stay happy.
  const compact = Object.fromEntries(
    Object.entries(contact).filter(([, v]) => v != null && v !== ''),
  );
  const payload: Record<string, unknown> = { brandKit, contact: compact };
  if (roles) payload.roles = roles;
  if (font) payload.font = font;
  return toBase64Url(JSON.stringify(payload));
}

// Accepts base64url (current), standard base64 (already-sent outreach links),
// and standard base64 whose '+' a query-string round-trip turned into a space.
export function decodeKitParam(raw: string): DecodedKit | null {
  try {
    const normalized = raw.replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(fromStandardBase64(normalized));
    const brandKit = brandKitSchema.parse(json.brandKit);
    const c = contactSchema.parse(json.contact ?? {});
    const roles = rolesSchema.safeParse(json.roles);
    const font = z.string().max(60).safeParse(json.font);
    const fields: SignatureFields = {
      fullName: c.fullName, jobTitle: c.jobTitle,
      ctaText: c.ctaText || ctaTextForRole(c.jobTitle),
      email: c.email, phone: c.phone, website: c.website,
      linkedin: c.linkedin, github: c.github, x: c.x, discord: c.discord,
    };
    return {
      brandKit,
      fields,
      roles: roles.success ? roles.data : undefined,
      font: font.success && font.data ? font.data : undefined,
    };
  } catch {
    return null; // malformed → caller falls back
  }
}
