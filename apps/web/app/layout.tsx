import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Gegeen — AI Atelier',
    template: '%s · Gegeen',
  },
  description:
    'AI-powered Mongolian florist. Curated bouquets, letterbox flowers, subscriptions, and gifts.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  ),
  openGraph: {
    title: 'Gegeen — AI Atelier',
    description: 'Mongolian florist with AI-curated bouquets.',
    type: 'website',
    locale: 'mn_MN',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn">
      <body>{children}</body>
    </html>
  );
}
