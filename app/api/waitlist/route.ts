import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));

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
      subject: `Waitlist signup: ${email}`,
      text: `${email} joined the Signet waitlist.`,
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

  // allSettled: notification still fires even if audience upsert fails (or vice versa)
  await Promise.allSettled(ops);

  return NextResponse.json({ ok: true });
}
