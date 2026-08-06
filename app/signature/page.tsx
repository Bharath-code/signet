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

export default function SignaturePage() {
  return (
    <Suspense>
      <SignatureDemo mode="concierge" />
    </Suspense>
  );
}
