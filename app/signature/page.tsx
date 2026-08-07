import { Suspense } from 'react';
import type { Metadata } from 'next';
import SignatureDemo from '../components/SignatureDemo';

export const metadata: Metadata = {
  title: 'Signet — Your signature is ready',
  description: 'Your brand, already read. Edit your details, copy the signature, install it in a minute.',
  // Outreach landing page: every URL carries a different ?kit=, and none of it
  // belongs in search results.
  robots: { index: false, follow: false },
};

// SignatureDemo reads ?kit= via useSearchParams, so it cannot server-render —
// without a fallback the recipient stares at an empty page until the bundle
// hydrates, which reads as "the link is broken". This is the only thing the
// server can send, so it has to look deliberate.
function Skeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted">
        Building your signature
      </p>
      <div className="mt-8 space-y-4" aria-hidden>
        <div className="h-40 border border-line bg-white/40" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-32 border border-line bg-white/40" />
          <div className="h-32 border border-line bg-white/40" />
        </div>
      </div>
    </div>
  );
}

export default function SignaturePage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <SignatureDemo mode="concierge" />
    </Suspense>
  );
}
