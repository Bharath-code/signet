import { Redis } from '@upstash/redis';

// Upstash Redis (Vercel Marketplace) — env names are KV_*, not UPSTASH_*, so
// Redis.fromEnv() does not apply here. Absent env = local dev without the
// integration: callers fall back to in-process state or skip the check.
export const redis =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })
    : null;

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'local';
}
