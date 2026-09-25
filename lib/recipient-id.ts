// Pseudonymous analytics ID for an outreach recipient. PostHog gets this, never
// the address itself; outreach.csv carries the same ID per lead, so a click still
// maps back to a person on our side. Isomorphic: Web Crypto exists in Node 18+.
export async function recipientId(email: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email.trim().toLowerCase()));
  return 'r_' + [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}
