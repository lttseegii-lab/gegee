import Link from 'next/link';
import { UserMenu } from './UserMenu';
import { CartButton } from '@/components/cart/CartButton';
import { WishlistButton } from './WishlistButton';
import { MegaMenu } from './MegaMenu';
import { MEGA_TABS, type MegaTab } from './megaMenuConfig';
import { getMenuColors, tabLabelToCategoryKey } from '@/lib/theme/getTheme';
import { resolveColor } from '@/lib/theme/palette';

/**
 * Merge static MEGA_TABS config with DB-driven theme colors.
 * Admin can change colors in /admin/theme.
 */
function applyTheme(
  tabs: MegaTab[],
  colors: Awaited<ReturnType<typeof getMenuColors>>
): MegaTab[] {
  return tabs.map((tab) => {
    const cat = tabLabelToCategoryKey(tab.label);
    if (!cat) return tab;
    const color = resolveColor(colors[cat]);
    return {
      ...tab,
      bgClass: color.bgClass,
      tabHoverClass: color.hoverClass,
    };
  });
}

export async function MainHeader() {
  const menuColors = await getMenuColors();
  const tabs = applyTheme(MEGA_TABS, menuColors);

  return (
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
          <Link
            href="/"
            className="font-serif italic text-[28px] leading-none text-ink no-underline"
          >
            Gegeen<span className="font-light"> ✻</span>
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

      {/* Row 3: Main nav */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur border-t border-border">
        <ul className="max-w-container mx-auto px-6 flex items-center justify-center gap-10 py-0 text-[15px]">
          {tabs.map((tab) => (
            <li key={tab.label} className="relative group">
              <Link
                href={tab.href}
                className={`flex items-center gap-2 py-4 px-3 rounded-t-lg transition-colors relative z-10 hover:text-ink ${tab.tabHoverClass ?? ''} ${tab.hasMega ? 'group-hover:font-semibold' : 'hover:text-pinkHot'}`}
              >
                {tab.label}
                {tab.badge && (
                  <span className="badge-yellow">
                    {tab.badge === 'new' ? 'шинэ' : 'top'}
                  </span>
                )}
              </Link>
              {tab.hasMega && <MegaMenu tab={tab} />}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
