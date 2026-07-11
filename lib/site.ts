// Resolved at build/runtime. Set NEXT_PUBLIC_SITE_URL once a real domain exists;
// until then Vercel's production URL (auto-injected) or localhost is used.
// ponytail: env-derived, no hardcoded domain — flip the env var, everything follows.
// NEXT_PUBLIC_VERCEL_* is the same value inlined into the client bundle (Vercel
// "expose system env vars", on by default) — needed because SITE_URL now feeds
// client-copied signature HTML, not just server metadata.
const vercelProdUrl =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ??
  process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (vercelProdUrl ? `https://${vercelProdUrl}` : "http://localhost:3000");

export const SITE_NAME = "Signet";

export const SITE_DESCRIPTION =
  "Paste your website. Signet reads your logo, colors, and font and builds a perfectly branded email signature — instantly. No template picker, no hex codes.";
