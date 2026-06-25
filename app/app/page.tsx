import { Suspense } from 'react';
import type { Metadata } from 'next';
import SignatureDemo from '../components/SignatureDemo';

export const metadata: Metadata = {
  title: 'Signet — Generate your signature',
  description:
    'Paste your website URL and get a polished, on-brand email signature in ten seconds.',
};

export default function AppPage() {
  return (
    <Suspense>
      <SignatureDemo />
    </Suspense>
  );
}
