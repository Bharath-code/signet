'use client';

import posthog from 'posthog-js';

// PostHog-backed analytics. Same track(name, path?) interface as before —
// no call-site changes needed. PostHog handles session ID, dedup, GDPR,
// persistence, and the dashboard. We just capture events.
//
// Init happens in PostHogProvider (app/layout.tsx). If the key isn't set,
// posthog is a no-op — analytics must never break the product.

let initialized = false;

export function initPostHog() {
  if (initialized) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
  if (!key) return; // silently skip — dev without keys is fine
  posthog.init(key, {
    api_host: host,
    loaded: () => { initialized = true; },
    capture_pageview: false, // we fire page_view manually for /app vs / distinction
    autocapture: false, // no shadow-DOM noise — only our explicit events
  });
  initialized = true;
}

export function track(name: string, path?: string) {
  if (typeof window === 'undefined') return;
  try {
    posthog.capture(name, path ? { path } : undefined);
  } catch {
    // analytics must never break the product
  }
}
