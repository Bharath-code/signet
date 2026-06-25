import type { Metadata } from 'next';
import LandingPage from './components/LandingPage';

export const metadata: Metadata = {
  title: 'Signet — Email Signature Generator | Paste URL, Get Branded Signatures',
  description:
    'Paste your company website. Signet reads your logo, colors, and fonts and builds a polished, email-safe signature — in seconds. Works with Gmail, Outlook, and Apple Mail. Free.',
};

export default function Page() {
  return <LandingPage />;
}
