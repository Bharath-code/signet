import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { brandKitSchema, NEUTRAL_BRAND_KIT } from './brand-kit-schema';
import { safeHref } from './render-signature';
import { brandColorsFromCss } from './extract-colors';
import type { BrandKit, SignatureFields } from './types';

const HTML_TRUNCATE = 20_000;

export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash';
// Optional second model tried only if the primary throws (e.g. "high demand" 503).
// Empty = no fallback. Set to a known-good model ID — like GEMINI_MODEL, IDs churn,
// so this is env-driven rather than hardcoded.
export const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL ?? '';

// A logo must point at an image. With no logo image on the page, the model tends to
// return the page URL (e.g. "https://site.com/") which renders as a broken <img>.
// Reject the bare homepage and obvious HTML pages; accept any image-y path.
export function isLikelyImageUrl(raw: string): boolean {
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  if (u.pathname === '' || u.pathname === '/') return false;
  return !/\.(html?|php|aspx?|jsp)$/i.test(u.pathname);
}

const hex = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'must be hex color');

const combinedSchema = z.object({
  companyName: z.string().min(1),
  logoUrl: z.string().url(),
  primaryColor: hex,
  secondaryColor: hex,
  fontFamily: z.string().min(1),
  contactName: z.string().optional(),
  contactRole: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  website: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  x: z.string().optional(),
  discord: z.string().optional(),
});

// Only accept a social URL if it's http(s) AND its host matches the platform —
// guards the new <a href> sink against hallucinated or hostile URLs.
function safeSocial(raw: string | undefined, hostMatch: RegExp): string | undefined {
  const href = raw ? safeHref(raw) : null;
  if (!href) return undefined;
  try { return hostMatch.test(new URL(href).hostname) ? href : undefined; }
  catch { return undefined; }
}

const SOCIAL_HOSTS = {
  linkedin: /(^|\.)linkedin\.com$/,
  github: /(^|\.)github\.com$/,
  x: /(^|\.)(x|twitter)\.com$/,
  discord: /(^|\.)(discord\.gg|discord\.com|discordapp\.com)$/,
} as const;

const pathSegments = (href: string): string[] => {
  try { return new URL(href).pathname.replace(/\/+$/, '').split('/').filter(Boolean); }
  catch { return []; }
};

// Pick the most profile-like URL among candidates for a platform, so a repo or
// post link never beats the person's actual profile.
function pickProfile(platform: keyof typeof SOCIAL_HOSTS, candidates: string[]): string | undefined {
  if (!candidates.length) return undefined;
  if (platform === 'linkedin') return candidates.find((h) => /\/in\//.test(h)) ?? candidates[0];
  if (platform === 'github') {
    // profile = one path segment (github.com/user); repos add more.
    return [...candidates].sort((a, b) => pathSegments(a).length - pathSegments(b).length)[0];
  }
  if (platform === 'x') {
    const bad = /^(intent|share|i|home|search|hashtag)$/i;
    return candidates.find((h) => pathSegments(h).length === 1 && !bad.test(pathSegments(h)[0])) ?? candidates[0];
  }
  return candidates[0];
}

// Deterministic social discovery from Firecrawl's link list — more reliable than
// asking the LLM to read truncated HTML.
export function socialsFromLinks(links: string[]): Partial<Record<keyof typeof SOCIAL_HOSTS, string>> {
  const buckets: Record<keyof typeof SOCIAL_HOSTS, string[]> = { linkedin: [], github: [], x: [], discord: [] };
  for (const raw of links) {
    const href = safeHref(raw);
    if (!href) continue;
    let host: string;
    try { host = new URL(href).hostname; } catch { continue; }
    for (const [k, re] of Object.entries(SOCIAL_HOSTS) as [keyof typeof SOCIAL_HOSTS, RegExp][]) {
      if (re.test(host)) buckets[k].push(href);
    }
  }
  const out: Partial<Record<keyof typeof SOCIAL_HOSTS, string>> = {};
  for (const k of Object.keys(buckets) as (keyof typeof SOCIAL_HOSTS)[]) {
    const pick = pickProfile(k, buckets[k]);
    if (pick) out[k] = pick;
  }
  return out;
}

// chroma = max-min channel spread; ~0 for greys/black/white, high for vivid hues.
function colorRank(hex: string): { chroma: number; lum: number } {
  const h = hex.replace(/^#/, '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  if ([r, g, b].some(Number.isNaN)) return { chroma: -1, lum: 0 };
  return { chroma: Math.max(r, g, b) - Math.min(r, g, b), lum: r + g + b };
}

// Stable primary/secondary order: more saturated wins; tie-break darker wins.
export function orderColors(a: string, b: string): [string, string] {
  const ra = colorRank(a), rb = colorRank(b);
  if (ra.chroma !== rb.chroma) return ra.chroma > rb.chroma ? [a, b] : [b, a];
  return ra.lum <= rb.lum ? [a, b] : [b, a];
}

export type ExtractOpts = { links?: string[]; markdown?: string; baseUrl?: string; fallbackLogoUrl?: string };

export type ExtractResult = {
  brandKit: BrandKit;
  contact: Partial<SignatureFields>;
};

export async function extractBrandKit(html: string, screenshotUrl: string, opts: ExtractOpts = {}): Promise<ExtractResult> {
  const truncatedHtml = html.length > HTML_TRUNCATE ? html.slice(0, HTML_TRUNCATE) + '\n...[truncated]' : html;
  const markdown = opts.markdown ? opts.markdown.slice(0, HTML_TRUNCATE) : '';

  const messages = [
    {
      role: 'user' as const,
      content: [
        {
          type: 'text' as const,
          text:
            'You are extracting an email-signature brand kit from a personal or company website. ' +
            'Extract: company/site name, absolute logo URL, two brand colors (hex) — ' +
            'primaryColor = the dominant, most saturated brand/accent color; ' +
            'secondaryColor = a supporting color (often a dark or neutral) — ' +
            'main heading font family. Also extract any contact info visible on the page: ' +
            'the owner\'s full name, job title/role, email address, and phone number. ' +
            'Also extract profile/social URLs if present: website (main site), ' +
            'linkedin, github, x (x.com/twitter.com), discord — as absolute URLs. ' +
            'Prefer the screenshot for colors/font and the HTML for logo URL and contact details. ' +
            'Leave any field empty if not found — do not guess. ' +
            (markdown ? 'PAGE TEXT (markdown):\n' + markdown + '\n\n' : '') +
            'HTML (truncated):\n' + truncatedHtml,
        },
        { type: 'image' as const, image: new URL(screenshotUrl) },
      ],
    },
  ];
  const runModel = (modelId: string) =>
    generateObject({
      model: google(modelId),
      schema: combinedSchema,
      temperature: 0, // deterministic: same site → same colors, no run-to-run drift
      messages,
    });

  // Model overload ("high demand" 503) hits a specific model — a different model is
  // usually still available, so fall back rather than just retrying the busy one.
  let object;
  try {
    ({ object } = await runModel(GEMINI_MODEL));
  } catch (err) {
    if (!GEMINI_FALLBACK_MODEL || GEMINI_FALLBACK_MODEL === GEMINI_MODEL) throw err;
    console.warn(`Gemini ${GEMINI_MODEL} failed (${(err as Error).message.slice(0, 80)}); retrying with ${GEMINI_FALLBACK_MODEL}`);
    ({ object } = await runModel(GEMINI_FALLBACK_MODEL));
  }

  const {
    contactName, contactRole, contactEmail, contactPhone,
    website, linkedin, github, x, discord,
    ...brandFields
  } = object;

  // Colors, in order of trust: the page's own CSS tokens (deterministic) win;
  // the vision model fills whatever the CSS didn't expose. Labels here don't drive
  // the look — renderSignature assigns ink/accent by color property — but keep the
  // chroma order stable so the BrandKit a caller inspects doesn't churn run-to-run.
  const css = brandColorsFromCss(html);
  const [gp, gs] = orderColors(brandFields.primaryColor, brandFields.secondaryColor);
  const primaryColor = css.primary ?? gp;
  const secondaryColor = css.secondary ?? gs;

  // Logo, in order of trust: the model's URL if it points at an image; else the
  // scrape's og:image/favicon; else the neutral placeholder. Stops the page URL the
  // model returns for logo-less sites from rendering as a broken <img>.
  const logoUrl = isLikelyImageUrl(brandFields.logoUrl)
    ? brandFields.logoUrl
    : opts.fallbackLogoUrl && isLikelyImageUrl(opts.fallbackLogoUrl)
      ? opts.fallbackLogoUrl
      : NEUTRAL_BRAND_KIT.logoUrl;

  // validate brand fields through original schema so callers keep the same guarantee
  const brandKit = brandKitSchema.parse({ ...brandFields, logoUrl, primaryColor, secondaryColor });

  const contact: Partial<SignatureFields> = {};
  if (contactName) contact.fullName = contactName;
  if (contactRole) contact.jobTitle = contactRole;
  if (contactEmail) contact.email = contactEmail;
  if (contactPhone) contact.phone = contactPhone;

  // Socials: deterministic link-list matches win; LLM-extracted (validated) fill gaps.
  const fromLinks = socialsFromLinks(opts.links ?? []);
  contact.linkedin = fromLinks.linkedin ?? safeSocial(linkedin, SOCIAL_HOSTS.linkedin);
  contact.github = fromLinks.github ?? safeSocial(github, SOCIAL_HOSTS.github);
  contact.x = fromLinks.x ?? safeSocial(x, SOCIAL_HOSTS.x);
  contact.discord = fromLinks.discord ?? safeSocial(discord, SOCIAL_HOSTS.discord);

  // website: the LLM's value, else the site itself.
  const w = safeHref(website ?? '') ?? safeHref(opts.baseUrl ?? '');
  if (w) contact.website = w;

  // drop undefined keys so the route's "did we find anything" stays meaningful
  for (const k of Object.keys(contact) as (keyof SignatureFields)[]) {
    if (contact[k] == null) delete contact[k];
  }

  return { brandKit, contact };
}
