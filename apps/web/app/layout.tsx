import type { Metadata } from 'next';
import { MainHeader } from '@/components/header/MainHeader';
import { SiteFooter } from '@/components/header/SiteFooter';
import { CartProvider } from '@/components/cart/CartProvider';
import { CartDrawer } from '@/components/cart/CartDrawer';
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
      <body>
        <CartProvider>
          <MainHeader />
          {children}
          <SiteFooter />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
