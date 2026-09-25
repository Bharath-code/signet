export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Shared by the landing and /app forms. Returns an error message, or null on success.
export async function joinWaitlist(email: string): Promise<string | null> {
  if (!EMAIL_RE.test(email)) return 'Enter a valid email address.';
  const res = await fetch('/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }).catch(() => null);
  return res?.ok ? null : "Couldn't save your email — try again.";
}
