import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const { email, source } = await req.json().catch(() => ({}));
  const isExport = source === 'export';

  if (!email || !EMAIL_RE.test(String(email))) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'no-key' }, { status: 503 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const ops: Promise<unknown>[] = [
    resend.emails.send({
      from: 'Signet Waitlist <onboarding@resend.dev>',
      to: 'kumarbharath63@gmail.com',
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
