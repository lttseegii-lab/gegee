import Link from 'next/link';
import { UserMenu } from './UserMenu';
import { CartButton } from '@/components/cart/CartButton';
import { WishlistButton } from './WishlistButton';
import { NavTab } from './NavTab';
import {
  MEGA_TABS,
  type MegaTab,
  type MegaImageCard,
  type MegaLinkItem,
} from './megaMenuConfig';
import {
  getMenuColors,
  getMenuImages,
  getMenuSubcategories,
  tabLabelToCategoryKey,
} from '@/lib/theme/getTheme';
import {
  resolveColor,
  resolveGradient,
  colorToHex,
  type MenuImagesMap,
  type MenuColorMap,
  type MenuSubcategoriesMap,
} from '@/lib/theme/palette';

/**
 * Merge static MEGA_TABS config with DB-driven theme + subcategories + images.
 * Admin configures everything from /admin/theme.
 */
function applyTheme(
  tabs: MegaTab[],
  colors: MenuColorMap,
  images: MenuImagesMap,
  subcategories: MenuSubcategoriesMap,
): MegaTab[] {
  return tabs.map((tab) => {
    const cat = tabLabelToCategoryKey(tab.label);
    if (!cat) return tab;

    const stored = colors[cat];
    const color = resolveColor(stored);
    const bgHex = colorToHex(stored);
    const dbImages: MegaImageCard[] = (images[cat] ?? []).map((img) => ({
      label: img.label,
      href: img.href,
      bgClass: resolveGradient(img.gradient).bgClass,
      emoji: img.emoji,
      imageUrl: img.image_url,
    }));

    // Split subcategories into col1 / col2 (default col1 if column missing)
    const subs = subcategories[cat] ?? [];
    const col1: MegaLinkItem[] = subs
      .filter((s) => s.column !== 2)
      .map((s) => ({
        label: s.label,
        href: `/catalog/${cat}?filter=${encodeURIComponent(s.tag)}`,
        badge: s.badge ?? undefined,
      }));
    const col2: MegaLinkItem[] = subs
      .filter((s) => s.column === 2)
      .map((s) => ({
        label: s.label,
        href: `/catalog/${cat}?filter=${encodeURIComponent(s.tag)}`,
        badge: s.badge ?? undefined,
      }));

    return {
      ...tab,
      bgClass: color.bgClass,
      tabHoverClass: color.hoverClass,
      bgHex,
      images: dbImages,
      col1,
      col2,
    };
  });
}

export async function MainHeader() {
  const [menuColors, menuImages, menuSubcats] = await Promise.all([
    getMenuColors(),
    getMenuImages(),
    getMenuSubcategories(),
  ]);
  const tabs = applyTheme(MEGA_TABS, menuColors, menuImages, menuSubcats);

  return (
    <>
      <header className="bg-white border-b border-border">
      {/* Row 1: Promo bar */}
      <div className="bg-lilac py-2.5 text-[13px] text-ink">
        <div className="max-w-container mx-auto px-6 flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5">
            🌸 100,000₮-аас дээш захиалгад үнэгүй хүргэлт
          </span>
          <span className="hidden sm:flex items-center gap-4 text-ink/70">
            <span>UB express delivery</span>
            <span>·</span>
            <span>Care wildly</span>
          </span>
        </div>
      </div>

      {/* Row 2: Logo + Search + Account */}
      <div className="py-4">
        <div className="max-w-container mx-auto px-6 grid grid-cols-[auto_1fr_auto] gap-10 items-center">
          <Link href="/" className="inline-block" aria-label="Gegeen">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="Gegeen"
              width={56}
              height={64}
              style={{ width: 56, height: 64 }}
              className="max-w-none object-contain"
            />
          </Link>

          <div className="hidden md:flex">
            <div className="w-full bg-offwhite rounded-full border border-border px-4 py-3 flex items-center gap-3">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-ink/40"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                placeholder="Юу хайж байна вэ? — mood, баяр, цэцэг…"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-ink/40"
              />
            </div>
          </div>

          <nav className="flex items-center gap-4">
            <UserMenu />
            <WishlistButton />
            <CartButton />
          </nav>
        </div>
      </div>

      </header>

      {/* Row 3: Main nav — sticky; stays fixed at the top while scrolling */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-border">
        <ul className="max-w-container mx-auto px-6 flex items-center justify-center gap-10 py-0 text-[15px]">
          {tabs.map((tab) => (
            <NavTab key={tab.label} tab={tab} />
          ))}
        </ul>
      </nav>
    </>
  );
}
