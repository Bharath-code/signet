import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { redis, getClientIp } from '@/lib/redis';
import { EMAIL_RE } from '@/lib/waitlist';

// Each signup emails the founder, so an open endpoint is an inbox-flood and a
// Resend-quota drain. No Redis (local dev) = no limit.
const limiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 h'), prefix: 'wl', ephemeralCache: new Map(), analytics: false })
  : null;

export async function POST(req: Request) {
  const { email, source } = await req.json().catch(() => ({}));
  const isExport = source === 'export';

  if (!email || String(email).length > 254 || !EMAIL_RE.test(String(email))) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  // Fails open on a Redis error: a lost lead costs more than a few extra emails.
  const allowed = await limiter?.limit(getClientIp(req)).then((r) => r.success).catch(() => true);
  if (allowed === false) {
    return NextResponse.json({ error: 'rate-limited' }, { status: 429 });
  }

  const notifyTo = process.env.WAITLIST_NOTIFY_EMAIL;
  if (!process.env.RESEND_API_KEY || !notifyTo) {
    return NextResponse.json({ error: 'no-key' }, { status: 503 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const ops: Promise<unknown>[] = [
    resend.emails.send({
      from: 'Signet Waitlist <onboarding@resend.dev>',
      to: notifyTo,
      subject: `${isExport ? 'Export unlock' : 'Waitlist signup'}: ${email}`,
      text: `${email} ${isExport ? 'unlocked the layout export' : 'joined the Signet waitlist'}.`,
    }),
  ];

  // Optional: add to Resend Audience for bulk emailing later
  if (process.env.RESEND_AUDIENCE_ID) {
    ops.push(
      resend.contacts.create({
        email: String(email),
        audienceId: process.env.RESEND_AUDIENCE_ID,
        unsubscribed: false,
      })
    );
  }

  // allSettled: notification still fires even if audience upsert fails (or vice versa).
  // The Resend SDK resolves with { error } instead of throwing, so check both shapes.
  // The lead counts as captured if at least one op landed; if all failed, say so —
  // a silent 200 here means silently lost leads.
  const results = await Promise.allSettled(ops);
  const failures = results.map((r) =>
    r.status === 'rejected' ? String(r.reason) : (r.value as { error?: { message?: string } | null })?.error?.message,
  );
  if (failures.every(Boolean)) {
    console.error('waitlist capture failed:', failures.join(' | '));
    return NextResponse.json({ error: 'send-failed' }, { status: 502 });
  }
  failures.forEach((f) => f && console.warn('waitlist op failed (lead still captured):', f));

  return NextResponse.json({ ok: true });
}
