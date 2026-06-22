import type { Metadata } from 'next';
import LandingPage from './components/LandingPage';

export const metadata: Metadata = {
  title: 'Signet — Your mark on every email',
  description:
    'Paste your company URL. Signet reads your brand — logo, colors, fonts — and generates polished email signatures for your whole team. Deploy to Google Workspace in one click.',
};

export default function Page() {
  return <LandingPage />;
}
