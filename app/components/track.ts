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

// Register super properties — persisted by PostHog and attached to every
// subsequent event. Used for the logo A/B split so the existing funnel can be
// broken down by `logo_variant` with no call-site changes.
export function register(props: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try {
    posthog.register(props);
  } catch {
    // analytics must never break the product
  }
}

// Read a multivariate feature flag's variant key (undefined until flags load,
// or when PostHog is disabled). Calling it records the flag exposure.
export function getFeatureFlag(key: string): string | boolean | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return posthog.getFeatureFlag(key);
  } catch {
    return undefined;
  }
}

// Subscribe to flag (re)evaluation; returns an unsubscribe fn. Flags load
// asynchronously after init, so consumers re-resolve on this callback.
export function onFeatureFlags(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  try {
    return posthog.onFeatureFlags(cb) ?? (() => {});
  } catch {
    return () => {};
  }
}
