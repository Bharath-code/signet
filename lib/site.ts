// Resolved at build/runtime. Set NEXT_PUBLIC_SITE_URL once a real domain exists;
// until then Vercel's production URL (auto-injected) or localhost is used.
// ponytail: env-derived, no hardcoded domain — flip the env var, everything follows.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const SITE_NAME = "Signet";

export const SITE_DESCRIPTION =
  "Paste your website. Signet reads your logo, colors, and font and builds a perfectly branded email signature — instantly. No template picker, no hex codes.";
