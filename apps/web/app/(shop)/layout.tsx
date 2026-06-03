// Customer-facing layout — wraps everything outside /admin with MainHeader, Footer, Cart.
import { MainHeader } from '@/components/header/MainHeader';
import { SiteFooter } from '@/components/header/SiteFooter';
import { CartProvider } from '@/components/cart/CartProvider';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { WishlistDrawer } from '@/components/wishlist/WishlistDrawer';

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <MainHeader />
      {children}
      <SiteFooter />
      <CartDrawer />
      <WishlistDrawer />
    </CartProvider>
  );
}
