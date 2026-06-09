import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Thanks ✻',
    template: '%s · Thanks',
  },
  description:
    'Mongolian florist. Curated bouquets, letterbox flowers, subscriptions, and gifts.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  ),
  openGraph: {
    title: 'Thanks ✻',
    description: 'Mongolian florist with curated bouquets.',
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
