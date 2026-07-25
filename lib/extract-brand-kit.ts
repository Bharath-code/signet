import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import type { BrandingProfile } from '@mendable/firecrawl-js';
import { brandKitSchema, NEUTRAL_BRAND_KIT } from './brand-kit-schema';
import { safeHref } from './render-signature';
import { brandColorsFromCss, isLinkBlue } from './extract-colors';
import { brandKitFromFirecrawl, type FirecrawlBrand } from './brand-from-firecrawl';
import { isLikelyImageUrl, pickEmailLogo } from './logo-url';
import { firecrawlClient, brandNameFromTitle, type FcExtractData } from './scrape-site';
import type { BrandKit, SignatureFields, BrandKitConfidence, FieldConfidence } from './types';
import type { SearchResultWeb } from '@mendable/firecrawl-js';

export { isLikelyImageUrl };

const VISION_TIMEOUT_MS = 35_000;

// Firecrawl self-reports how sure its brand extractor was. When its internal LLM
// fails it silently falls back to scraping computed styles and sets
// confidence.colors = 0 — that's how an unstyled page's browser-default link
// color (#0000ee) arrives labelled "primary". Measured on moritzlegal.com
// 2026-07-25: colors/overall both 0, __llm_metadata.llmSucceeded false.
// Not in the SDK's BrandingProfile type (it has an index signature), so read it
// defensively. Absent → treat as confident, preserving behavior on payloads
// that predate the field.
export function fcColorsConfident(branding?: BrandingProfile): boolean {
  const c = (branding as { confidence?: { colors?: unknown } } | undefined)?.confidence?.colors;
  return typeof c === 'number' ? c > 0 : true;
}

// Both LLM paths invent a phone number when a site publishes none — measured on
// moritzlegal.com 2026-07-25: "+1 (555) 555-5555". A fake number rendered in a
// signature someone copies into Gmail is worse than no number at all, so drop
// anything that doesn't look real. Bias to dropping: an omitted phone degrades
// gracefully (the row just isn't rendered), a wrong one doesn't.
export function realPhone(raw?: string): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim();
  const d = s.replace(/\D/g, '');
  if (d.length < 7 || d.length > 15) return undefined;      // E.164 bounds
  if (/^(\d)\1+$/.test(d)) return undefined;                 // 0000000, 5555555555
  if (/0?1?234567890?$/.test(d)) return undefined;           // 123-456-7890 keypad walk
  // North American fiction: the 555 exchange (NANP-reserved 555-0100..0199 plus
  // the Hollywood 555 block generally). Slice down to the exchange for each
  // NANP shape — 7-digit local, 10-digit, and 1+10 — and leave every other
  // length alone, so a real +44 1555… number isn't caught by digit coincidence.
  const local = d.length === 7 ? d
    : d.length === 10 ? d.slice(3)
    : d.length === 11 && d.startsWith('1') ? d.slice(4)
    : '';
  if (local.startsWith('555')) return undefined;
  return s;
}

// RFC 2606 / RFC 6761 reserved names, which exist precisely so nobody can own them.
const RESERVED_EMAIL_DOMAINS = /(^|\.)(example\.(com|net|org)|test|invalid|localhost|example)$/;
// Locals a model reaches for when the page shows no address.
const PLACEHOLDER_LOCALS = /^(your|youre?mail|my|me|email|e-mail|mail|info-?here|name|first(name)?|firstname\.lastname|last(name)?|user|username|someone|somebody|test|foo|bar|baz|demo|sample|placeholder|john\.?doe|jane\.?doe|hello-?there)$/;

// Same problem as realPhone, different tell. A signature email is worse than a
// phone when wrong — mail to it bounces, or worse, reaches an unrelated stranger.
// Syntax and placeholder checks catch the lazy inventions, but the decisive test
// is presence: a real address is visible somewhere in what we scraped, so an
// address the page never mentions was invented. `pageText` should be the full
// html + markdown; when omitted the presence check is skipped (callers without
// page content still get the cheap checks).
export function realEmail(raw?: string, pageText?: string): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim().replace(/^mailto:/i, '');
  const m = /^([\w.!#$%&'*+/=?^`{|}~-]+)@([\w-]+(?:\.[\w-]+)+)$/.exec(s);
  if (!m) return undefined;
  const [, localPart, domain] = m;
  if (RESERVED_EMAIL_DOMAINS.test(domain.toLowerCase())) return undefined;
  if (PLACEHOLDER_LOCALS.test(localPart.toLowerCase())) return undefined;
  if (pageText) {
    // Pages encode addresses a few ways (mailto escaping, &#64;). Normalize those
    // before searching so obfuscation doesn't read as fabrication.
    const hay = pageText.toLowerCase().replace(/%40|&#64;|&commat;/g, '@');
    if (!hay.includes(s.toLowerCase())) return undefined;
  }
  return s;
}

export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash';
export const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL ?? '';

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

export type ExtractOpts = {
  links?: string[];
  markdown?: string;
  baseUrl?: string;
  branding?: BrandingProfile;
  fallbackKit?: BrandKit;
  htmlSnippets?: string;
  cssVars?: string; // `--name: #hex` digest from rawHtml (see ScrapeResult.cssVars)
  validatedName?: string;
  lang?: string; // P3: <html lang="xx"> for CJK font mapping
  pageTitle?: string; // The page <title> from Firecrawl metadata (for contact name/title fallback)
  fcJson?: FcExtractData; // JSON-mode output from the primary scrape (replaces the old /extract call)
};

// P2: Use Firecrawl search to validate the company name extracted from a URL.
// Runs asynchronously without blocking the main extraction flow.
async function searchValidateCompanyName(name: string, url: string): Promise<string | undefined> {
  if (!name || name === NEUTRAL_BRAND_KIT.companyName || name.length < 2) return undefined;
  try {
    const domain = new URL(url).hostname.replace(/^www\./, '');
    const res = await firecrawlClient.search(`site:${domain} "${name}"`, { limit: 1 });
    const top = res.web?.[0];
    const title = top && 'title' in top ? (top as SearchResultWeb).title : undefined;
    if (title) {
      const fromTitle = brandNameFromTitle(title);
      if (fromTitle && fromTitle.length > 1 && fromTitle.toLowerCase() !== name.toLowerCase()) {
        return fromTitle;
      }
    }
  } catch { /* best-effort */ }
  return undefined;
}

export type ExtractResult = {
  brandKit: BrandKit;
  contact: Partial<SignatureFields>;
  // 'firecrawl' = deterministic kit, no LLM;
  // 'extract' = Firecrawl JSON mode (rides on the primary scrape; full page content, best for text);
  // 'vision'  = Gemini vision model (screenshot, best for visual fields);
  // 'degraded'= both LLM paths failed — NEUTRAL/scrape-meta fallback served.
  source: 'firecrawl' | 'extract' | 'vision' | 'degraded';
  confidence: BrandKitConfidence; // per-field confidence in the brand kit values
};

// Common job-title keywords — when brandNameFromTitle picks one of these as the
// shortest title segment (e.g. "Frontend Engineer" over "Bharathkumar Palanisamy"),
// the first segment is the person/company name instead.
const JOB_TITLE_KEYWORDS = /^(engineer|developer|designer|manager|director|lead|head|chief|founder|ceo|cto|coo|cfo|president|architect|analyst|consultant|specialist|product|sales|marketing|software|full.?stack|frontend|backend|devops|data|ai|ml|senior|staff|principal|intern|freelancer|contractor|owner|founder|maker|builder|writer|creator|researcher|scientist|operator|strategist|coordinator|associate|executive|vp|svp|growing|building)/i;

// When a company name from the fallbackKit looks like a job title (common on
// personal/portfolio sites), prefer the first segment of the page title.
function preferCompanyNameFromTitle(fallback: string, pageTitle: string): string {
  if (!JOB_TITLE_KEYWORDS.test(fallback)) return fallback;
  const parts = pageTitle.split(/\s*[|·:–—]\s*|\s+-\s+/).map(p => p.trim()).filter(Boolean);
  const first = parts[0];
  if (first && first.length >= 3 && !JOB_TITLE_KEYWORDS.test(first)) return first;
  return fallback;
}

// Extract contact info (name, role, email) from page content when the /extract
// call returns nothing. Deterministic, no external API cost.
function extractContactFromContent(htmlSnippets: string, markdown: string, pageTitle?: string): { fullName?: string; jobTitle?: string; email?: string } {
  const contact: { fullName?: string; jobTitle?: string; email?: string } = {};

  // Find email in the page content. Role-prefix inboxes (support@, privacy@…)
  // are the site's, not the user's — never surface one as their own address.
  const ROLE_INBOX = /^(support|privacy|info|contact|sales|help|admin|no-?reply|legal|press|security|careers|jobs|abuse|billing|marketing|feedback|webmaster|postmaster|team|office)@/i;
  const emails = (htmlSnippets + '\n' + markdown).match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) ?? [];
  const personal = emails.find((e) => !ROLE_INBOX.test(e));
  if (personal) contact.email = personal;

  // Use page title (from Firecrawl metadata) to extract name and role
  const title = pageTitle;
  if (!title) return contact;

  const parts = title.split(/\s*[|·:–—]\s*|\s+-\s+/).map(p => p.trim()).filter(Boolean);
  if (parts.length >= 1) {
    const first = parts[0];
    if (first.length >= 3 && !JOB_TITLE_KEYWORDS.test(first)) {
      contact.fullName = first;
    }
  }
  if (parts.length >= 2) {
    contact.jobTitle = parts.slice(1).join(' · ');
  }

  return contact;
}

// Socials are deterministic (link list); website is the site itself. No LLM —
// used when we skip the vision pass entirely.
function deterministicContact(opts: ExtractOpts): Partial<SignatureFields> {
  const contact: Partial<SignatureFields> = {};
  Object.assign(contact, socialsFromLinks(opts.links ?? []));
  const w = safeHref(opts.baseUrl ?? '');
  if (w) contact.website = w;
  return contact;
}

// Build per-field confidence from the sources that contributed to each value.
// 'exact' = Firecrawl server-side brand extractor (deterministic, purpose-built)
// 'high'  = page metadata / CSS vars / search validation / CJK-lang mapping /
//           scrape JSON mode (structured extraction from full page content)
// 'medium'= Gemini vision model (best-guess from screenshot+HTML)
// 'low'   = NEUTRAL_BRAND_KIT fallback (nothing confident available)
function buildConfidence(
  fc: FirecrawlBrand,
  css: { primary?: string; secondary?: string },
  fb: BrandKit,
  opts: { validatedName?: string; lang?: string },
  usedVision: boolean,
  fcExtractFields?: Partial<Record<keyof BrandKitConfidence, boolean>>,
): BrandKitConfidence {
  const extract = fcExtractFields ?? {};
  return {
    companyName: opts.validatedName
      ? 'high'
      : fb.companyName !== NEUTRAL_BRAND_KIT.companyName
        ? 'high'
        : extract.companyName
          ? 'high'
          : usedVision ? 'medium' : 'low',
    logoUrl: fc.logoUrl
      ? 'exact'
      : fb.logoUrl !== NEUTRAL_BRAND_KIT.logoUrl
        ? 'high'
        : extract.logoUrl
          ? 'high'
          : usedVision ? 'medium' : 'low',
    primaryColor: fc.primaryColor
      ? 'exact'
      : css.primary || fb.primaryColor !== NEUTRAL_BRAND_KIT.primaryColor
        ? 'high'
        : extract.primaryColor
          ? 'high'
          : usedVision ? 'medium' : 'low',
    secondaryColor: fc.secondaryColor
      ? 'exact'
      : css.secondary
        ? 'high'
        : extract.secondaryColor
          ? 'high'
          : usedVision ? 'medium' : 'low',
    fontFamily: fc.fontFamily
      ? 'exact'
      : opts.lang
        ? 'high'
        : extract.fontFamily
          ? 'high'
          : usedVision ? 'medium' : 'low',
  };
}

export async function extractBrandKit(html: string, screenshotUrl: string, opts: ExtractOpts = {}): Promise<ExtractResult> {
  const fb = opts.fallbackKit ?? NEUTRAL_BRAND_KIT;
  const fc = brandKitFromFirecrawl(opts.branding);
  // cssVars first: Firecrawl's cleaned `html` has no <style> blocks, so the
  // declarations only survive in the rawHtml digest. html still supplies <meta
  // theme-color> and any inline style= attributes.
  const css = brandColorsFromCss((opts.cssVars ?? '') + '\n' + html);
  // Full scraped content — what realEmail checks an LLM-supplied address against.
  // Uses raw html (not htmlSnippets, which is truncated for the prompt and would
  // drop real addresses that live outside the selected snippets).
  const pageText = html + '\n' + (opts.markdown ?? '');

  // If the fallback company name looks like a job title (common on personal sites),
  // prefer the first segment of the page title instead.
  const correctedFallbackName = opts.pageTitle
    ? preferCompanyNameFromTitle(fb.companyName, opts.pageTitle)
    : fb.companyName;
  const companyName = opts.validatedName ?? (correctedFallbackName !== NEUTRAL_BRAND_KIT.companyName ? correctedFallbackName : undefined);
  const fcConfident = fcColorsConfident(opts.branding);
  // Firecrawl's accent, dropped outright when it's a link-blue from a run its own
  // extractor reported as failed.
  const fcPrimary = fc.primaryColor && (fcConfident || !isLinkBlue(fc.primaryColor))
    ? fc.primaryColor : undefined;
  const cssPrimary = css.primary && !isLinkBlue(css.primary) ? css.primary : undefined;

  const det = {
    companyName,
    logoUrl: pickEmailLogo(fc.logoUrl, fb.logoUrl),
    // Firecrawl's branding extractor is a purpose-built brand-detection system — its
    // primaryColor is trustworthy even when it falls in the link-blue hue range (many
    // tech brands intentionally use saturated blues), so we skip isLinkBlue for it —
    // but only while Firecrawl reports it was actually confident. On a failed branding
    // run it degrades to computed styles, where a link-blue is a link, not a brand.
    // css.primary keeps the guard unconditionally (CSS scraping is more likely to pick
    // up incidental link colors). As a last resort, use fc.secondaryColor for
    // monochrome sites.
    // The fc.secondaryColor last resort is gated on confidence too. It's usually
    // the page's ink (#000): taking it when Firecrawl was confident and simply
    // found no accent is right (the site really is monochrome, and it saves a
    // vision call), but taking it after a FAILED branding run makes the kit look
    // complete, skips vision, and ships a black bar for a site that has a real
    // accent — the exact moritzlegal.com failure. When we don't trust the run,
    // leave this undefined so detComplete fails and the color goes to vision:
    // untrustworthy accents are judged, not guessed.
    // Precedence, most trustworthy first:
    //  1. Firecrawl's accent when it ISN'T a link-blue — its purpose-built extractor
    //     beats our regex, and real tech-brand blues live here.
    //  2. A vivid CSS brand token. This outranks a link-blue Firecrawl accent even
    //     when Firecrawl reports high confidence: measured on moritzlegal.com
    //     2026-07-26, it returned #0000ee at confidence 0.9 while the page's own
    //     tokens carried the real brand tan #b58159. Confidence means its extractor
    //     ran, not that a browser-default link color became a brand color.
    //  3. The link-blue itself, if that's genuinely all we have.
    //  4. Ink, only when the run was trustworthy (a real monochrome site). After a
    //     failed run this stays undefined so detComplete fails and vision judges.
    primaryColor:
      (fcPrimary && !isLinkBlue(fcPrimary) ? fcPrimary : undefined)
      ?? cssPrimary
      ?? fcPrimary
      ?? (fcConfident ? fc.secondaryColor : undefined),
    secondaryColor: fc.secondaryColor ?? css.secondary,
    fontFamily: fc.fontFamily,
  };

  // P3: When the page is in Japanese/Chinese/Korean and no deterministic font
  // exists, pre-set to Arial (universally CJK-safe on all email clients).
  // Without this, Gemini may hallucinate a non-email-safe CJK font.
  if (!det.fontFamily && opts.lang && /^(ja|zh|ko)/.test(opts.lang)) {
    det.fontFamily = 'Arial, Helvetica, sans-serif';
  }

  // A complete deterministic kit (name + logo + both colors + font) lets us skip the
  // vision pass — and signals a well-branded site whose title-derived name is reliable.
  const detComplete = !!(det.companyName && det.logoUrl && det.primaryColor && det.secondaryColor && det.fontFamily);

  // JSON mode rode on the primary scrape — no separate call needed for contact info
  // (name, title, email, phone) even when the brand kit is deterministically complete.
  const fcExtract = opts.fcJson ?? null;
  // Only spend a Firecrawl search to second-guess the name when we're NOT already
  // confident: skip it on the deterministic-complete fast path and when a validatedName
  // was supplied. Keeps the happy path free of an extra paid call + its latency.
  const nameSearchPromise = opts.validatedName || detComplete
    ? Promise.resolve(undefined)
    : searchValidateCompanyName(companyName ?? '', opts.baseUrl ?? '');

  // If deterministic data gave us a complete kit, skip Gemini entirely.
  // (Inline condition repeats detComplete so TS narrows det.* to non-undefined.)
  if (det.companyName && det.logoUrl && det.primaryColor && det.secondaryColor && det.fontFamily) {
    const [primaryColor, secondaryColor] = orderColors(det.primaryColor, det.secondaryColor);
    const searchName = await nameSearchPromise;
    // searchName from brandNameFromTitle may also pick a job-title segment — apply
    // the same correction here so the search can't overwrite the corrected name.
    const finalCompanyName = searchName ?? det.companyName;
    const correctedCompanyName = opts.pageTitle
      ? preferCompanyNameFromTitle(finalCompanyName, opts.pageTitle)
      : finalCompanyName;
    const brandKit = brandKitSchema.parse({
      companyName: correctedCompanyName,
      logoUrl: det.logoUrl,
      primaryColor,
      secondaryColor,
      fontFamily: det.fontFamily,
    });
    const contact: Partial<SignatureFields> = deterministicContact(opts);
    if (fcExtract?.contactName) contact.fullName = fcExtract.contactName;
    if (fcExtract?.contactRole) contact.jobTitle = fcExtract.contactRole;
    const fcEmail = realEmail(fcExtract?.contactEmail, pageText);
    if (fcEmail) contact.email = fcEmail;
    const fcPhone = realPhone(fcExtract?.contactPhone);
    if (fcPhone) contact.phone = fcPhone;
    // Fallback: extract contact info from page HTML if /extract returned nothing
    const htmlContact = extractContactFromContent(opts.htmlSnippets ?? '', opts.markdown ?? '', opts.pageTitle);
    if (!contact.fullName && htmlContact.fullName) contact.fullName = htmlContact.fullName;
    if (!contact.jobTitle && htmlContact.jobTitle) contact.jobTitle = htmlContact.jobTitle;
    if (!contact.email && htmlContact.email) contact.email = htmlContact.email;
    const confidence = buildConfidence(fc, css, fb, { ...opts, validatedName: searchName }, false);
    return { brandKit, contact, source: 'firecrawl', confidence };
  }

  // ─── Extraction: Gemini vision + Firecrawl JSON-mode data ────────────────
  // Gemini sees the screenshot (best for colors/font) and runs here, bounded
  // and may fail. `fcExtract` is not a concurrent call — it's the JSON-mode
  // result already produced server-side during the original scrape, passed in
  // via opts.fcJson. The merge below prefers that scrape data for text fields
  // (companyName, logoUrl, socials), Gemini for visual fields.
  const markdown = opts.markdown ? opts.markdown.slice(0, 10000) : '';
  const snippets = opts.htmlSnippets ?? '';
  const baseUrl = opts.baseUrl ? `Site URL: ${opts.baseUrl}` : '';

  const prompt = [
    'Extract an email-signature brand kit from this website. Follow the rules below strictly.\n',
    '---\n',
    'BRAND IDENTITY (from the SCREENSHOT primarily):',
    '- companyName: the business or site name (from <title> or visible branding, NOT a page heading)',
    '- logoUrl: absolute URL of the logo image (from HTML <img> tags, NOT the page URL)',
    '- primaryColor: the dominant brand accent color in #hex — vivid, saturated, NOT link-blue',
    '- secondaryColor: a supporting dark/neutral #hex (often text color or muted brand tone)',
    '- fontFamily: CSS font-family from the HTML, visible on heading/text in screenshot',
    '',
    'CONTACT INFO (from HTML/text ONLY — do not guess):',
    '- contactName, contactRole, contactEmail, contactPhone',
    '',
    'SOCIAL PROFILES (absolute URLs):',
    '- linkedin, github, x (x.com/twitter.com), discord',
    '',
    'DO NOT:',
    '- Use browser-default link blue (#00xxFF-ish) as primaryColor',
    '- Return generic fonts like "serif" or "sans-serif"',
    '- Make up emails, phones, or URLs not visible on the page',
    '- Return the page URL (https://site.com/) as logoUrl',
    '- Use a cookie-banner or footer-only color as brand color',
    '',
    baseUrl,
    markdown ? `\nPAGE TEXT:\n${markdown}` : '',
    snippets ? `\nHTML SNIPPETS (relevant page structure):\n${snippets}` : '',
  ].filter(Boolean).join('\n');

  const messages = [
    {
      role: 'user' as const,
      content: [
        { type: 'image' as const, image: new URL(screenshotUrl) },
        { type: 'text' as const, text: prompt },
      ],
    },
  ];
  const runModel = (modelId: string) =>
    generateObject({
      model: google(modelId),
      schema: combinedSchema,
      temperature: 0,
      messages,
      abortSignal: AbortSignal.timeout(VISION_TIMEOUT_MS),
    });

  let geminiResult: z.infer<typeof combinedSchema> | undefined = undefined;
  try {
    const { object } = await runModel(GEMINI_MODEL);
    geminiResult = object;
  } catch (err) {
    const canFallback = GEMINI_FALLBACK_MODEL && GEMINI_FALLBACK_MODEL !== GEMINI_MODEL;
    if (!canFallback) {
      console.warn(`vision unavailable (${(err as Error).message.slice(0, 80)}); serving deterministic kit`);
    } else {
      try {
        console.warn(`Gemini ${GEMINI_MODEL} failed (${(err as Error).message.slice(0, 80)}); retrying with ${GEMINI_FALLBACK_MODEL}`);
        const { object } = await runModel(GEMINI_FALLBACK_MODEL);
        geminiResult = object;
      } catch (err2) {
        console.warn(`vision unavailable (${(err2 as Error).message.slice(0, 80)}); serving deterministic kit`);
      }
    }
  }
  const geminiSucceeded = geminiResult !== undefined;

  // Check Firecrawl search validation (should be done by now)
  const searchName = await nameSearchPromise;

  // ─── Merge ────────────────────────────────────────────────────────────────
  // Priority per field type:
  //   Text fields (companyName, logoUrl, socials):
  //     det > /extract (full-page reader) > Gemini (screenshot guess) > NEUTRAL
  //   Visual fields (colors, font):
  //     det > Gemini (screenshot) > /extract > NEUTRAL
  //   Contact:
  //     det (from links) > /extract > Gemini

  const extractHas = (field: keyof FcExtractData): boolean => !!fcExtract?.[field];

  // Text fields — prefer /extract over Gemini
  const rawName = searchName ?? det.companyName ?? fcExtract?.companyName
    ?? geminiResult?.companyName ?? fb.companyName;
  // searchName from brandNameFromTitle may pick a job-title segment; correct it here too.
  const companyNameFinal = opts.pageTitle
    ? preferCompanyNameFromTitle(rawName, opts.pageTitle)
    : rawName;
  const logoUrl = det.logoUrl ?? pickEmailLogo(fcExtract?.logoUrl)
    ?? (geminiResult ? pickEmailLogo(geminiResult.logoUrl) : null)
    ?? fb.logoUrl;

  // Visual fields — prefer Gemini over /extract
  let primaryColor: string;
  let secondaryColor: string;
  if (geminiResult) {
    const [gp, gs] = orderColors(geminiResult.primaryColor, geminiResult.secondaryColor);
    primaryColor = det.primaryColor ?? gp;
    secondaryColor = det.secondaryColor ?? gs;
  } else {
    const [ep, es] = fcExtract?.primaryColor && fcExtract?.secondaryColor
      ? orderColors(fcExtract.primaryColor, fcExtract.secondaryColor)
      : ['#000000', '#000000'] as [string, string];
    primaryColor = det.primaryColor ?? ep;
    secondaryColor = det.secondaryColor ?? es;
  }
  const fontFamily = det.fontFamily ?? geminiResult?.fontFamily
    ?? fcExtract?.fontFamily ?? fb.fontFamily;

  const brandKit = brandKitSchema.parse({ companyName: companyNameFinal, logoUrl, primaryColor, secondaryColor, fontFamily });

  const contact: Partial<SignatureFields> = {};
  if (fcExtract?.contactName) contact.fullName = fcExtract.contactName;
  else if (geminiResult?.contactName) contact.fullName = geminiResult.contactName;
  if (fcExtract?.contactRole) contact.jobTitle = fcExtract.contactRole;
  else if (geminiResult?.contactRole) contact.jobTitle = geminiResult.contactRole;
  const email = realEmail(fcExtract?.contactEmail, pageText) ?? realEmail(geminiResult?.contactEmail, pageText);
  if (email) contact.email = email;
  const phone = realPhone(fcExtract?.contactPhone) ?? realPhone(geminiResult?.contactPhone);
  if (phone) contact.phone = phone;
  // Fallback: extract contact info from page HTML if both /extract and Gemini returned nothing
  const htmlContact = extractContactFromContent(opts.htmlSnippets ?? '', opts.markdown ?? '', opts.pageTitle);
  if (!contact.fullName && htmlContact.fullName) contact.fullName = htmlContact.fullName;
  if (!contact.jobTitle && htmlContact.jobTitle) contact.jobTitle = htmlContact.jobTitle;
  if (!contact.email && htmlContact.email) contact.email = htmlContact.email;

  // Social profiles — /extract reads full HTML which is more reliable than
  // the truncated snippets Gemini sees. Links from the scrape always win.
  const fromLinks = socialsFromLinks(opts.links ?? []);
  contact.linkedin = fromLinks.linkedin ?? (fcExtract?.linkedin ? safeSocial(fcExtract.linkedin, SOCIAL_HOSTS.linkedin) : undefined)
    ?? (geminiResult?.linkedin ? safeSocial(geminiResult.linkedin, SOCIAL_HOSTS.linkedin) : undefined);
  contact.github = fromLinks.github ?? (fcExtract?.github ? safeSocial(fcExtract.github, SOCIAL_HOSTS.github) : undefined)
    ?? (geminiResult?.github ? safeSocial(geminiResult.github, SOCIAL_HOSTS.github) : undefined);
  contact.x = fromLinks.x ?? (fcExtract?.x ? safeSocial(fcExtract.x, SOCIAL_HOSTS.x) : undefined)
    ?? (geminiResult?.x ? safeSocial(geminiResult.x, SOCIAL_HOSTS.x) : undefined);
  contact.discord = fromLinks.discord ?? (fcExtract?.discord ? safeSocial(fcExtract.discord, SOCIAL_HOSTS.discord) : undefined)
    ?? (geminiResult?.discord ? safeSocial(geminiResult.discord, SOCIAL_HOSTS.discord) : undefined);

  const w = safeHref(fcExtract?.website ?? '') ?? (geminiResult?.website ? safeHref(geminiResult.website) : null) ?? safeHref(opts.baseUrl ?? '');
  if (w) contact.website = w;

  for (const k of Object.keys(contact) as (keyof SignatureFields)[]) {
    if (contact[k] == null) delete contact[k];
  }

  // Source reflects which LLM contributed the majority of non-deterministic fields
  const extractUsed = extractHas('companyName') || extractHas('logoUrl');
  const source = extractUsed ? 'extract' : geminiSucceeded ? 'vision' : 'degraded';
  const fcExtractFields: Partial<Record<keyof BrandKitConfidence, boolean>> = {
    companyName: extractHas('companyName'),
    logoUrl: extractHas('logoUrl'),
    primaryColor: extractHas('primaryColor'),
    secondaryColor: extractHas('secondaryColor'),
    fontFamily: extractHas('fontFamily'),
  };
  const confidence = buildConfidence(fc, css, fb, opts, geminiSucceeded, fcExtractFields);
  return { brandKit, contact, source, confidence };
}
