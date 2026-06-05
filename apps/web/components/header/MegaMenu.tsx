import Link from 'next/link';
import type { MegaTab, MegaLinkItem, MegaImageCard } from './megaMenuConfig';

export function MegaMenu({ tab }: { tab: MegaTab }) {
  if (!tab.hasMega) return null;

  const imageCount = (tab.images ?? []).length;

  // Dynamic grid template — text columns flex, each image card ~150px.
  // Combined with gap-5 (20px) and p-7 (28px) padding this keeps total
  // panel width well within typical viewports (≤ 880px for 2 images).
  const gridClass =
    imageCount === 0
      ? 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'
      : imageCount === 1
        ? 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px]'
        : 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)_150px_150px]';

  const widthClass =
    imageCount === 0
      ? 'w-[560px]'
      : imageCount === 1
        ? 'w-[760px]'
        : 'w-[880px]';

  // Right-anchored tabs: pin the panel to a fixed offset from the viewport's
  // right edge so it can never overflow regardless of where the tab sits in
  // the nav row. This uses an effective `right: calc(100vw - <li_right>)`
  // trick by overriding via inline style is overkill — using `right-6`
  // relative to the <li>'s right edge would still let the panel extend
  // leftward beyond viewport. The robust solution: cap the panel's
  // outer max width with our explicit widthClass which fits within ~1024px
  // viewports, then anchor to the tab's right edge.
  const anchorClass =
    tab.panelAlign === 'right'
      ? 'right-0'
      : tab.panelAlign === 'left'
        ? 'left-0'
        : 'left-1/2 -translate-x-1/2';

  // Prefer admin-configured hex (supports arbitrary colors). Fall back to the
  // preset Tailwind class for backward compatibility / SSR initial paint.
  const styleBg = tab.bgHex
    ? ({ backgroundColor: tab.bgHex } as React.CSSProperties)
    : undefined;
  const fallbackBgClass = tab.bgHex ? '' : (tab.bgClass ?? 'bg-white');

  return (
    <div
      style={styleBg}
      className={`absolute top-full ${anchorClass} mt-0 ${widthClass} max-w-[calc(100vw-32px)] z-50 rounded-xl shadow-soft opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-data-[closed=true]:opacity-0 group-data-[closed=true]:invisible group-data-[closed=true]:translate-y-2 group-data-[closed=true]:pointer-events-none transition-all duration-200 pointer-events-none group-hover:pointer-events-auto overflow-hidden ${fallbackBgClass}`}
    >
      <div className={`p-7 grid ${gridClass} gap-5`}>
        {/* Col 1 */}
        <div>
          {tab.col1Heading && (
            <Link
              href={tab.href}
              className="font-serif italic text-lg text-ink mb-4 inline-flex items-center gap-1.5 group/heading hover:text-pinkHot transition-colors"
            >
              {tab.col1Heading}
              <span className="text-ink/30 group-hover/heading:text-pinkHot transition-colors text-base">
                →
              </span>
            </Link>
          )}
          <ul className="space-y-3.5 mt-4">
            {(tab.col1 ?? []).map((item) => (
              <MegaLink key={item.label} item={item} />
            ))}
          </ul>
        </div>

        {/* Col 2 */}
        <div>
          <h4 className="font-serif italic text-lg text-transparent select-none mb-4">
            .
          </h4>
          <ul className="space-y-3.5">
            {(tab.col2 ?? []).map((item) => (
              <MegaLink key={item.label} item={item} />
            ))}
          </ul>
        </div>

        {/* Image cards (0–2) */}
        {(tab.images ?? []).map((img, idx) => (
          <MegaImage key={`${img.label}-${idx}`} img={img} />
        ))}
      </div>
    </div>
  );
}

function MegaLink({ item }: { item: MegaLinkItem }) {
  return (
    <li>
      <Link
        href={item.href}
        className="inline-flex items-center gap-2 text-[15px] text-ink hover:text-pinkHot transition-colors"
      >
        {item.label}
        {item.badge && (
          <span className="text-[10px] uppercase tracking-wider bg-yellow text-ink px-1.5 py-0.5 rounded">
            {item.badge === 'new' ? 'шинэ' : 'top'}
          </span>
        )}
      </Link>
    </li>
  );
}

function MegaImage({ img }: { img: MegaImageCard }) {
  return (
    <Link
      href={img.href}
      className="bg-white rounded-xl overflow-hidden flex flex-col group/img hover:-translate-y-0.5 transition-transform min-w-0"
    >
      <div
        className={`relative aspect-square ${img.imageUrl ? 'bg-ink/5' : img.bgClass} flex items-center justify-center text-4xl overflow-hidden`}
      >
        {img.imageUrl ? (
          // External URL — bypass next/image to skip host-allowlist config
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img.imageUrl}
            alt={img.label}
            loading="lazy"
            className="w-full h-full object-cover transition-transform group-hover/img:scale-105"
          />
        ) : (
          <span>{img.emoji}</span>
        )}
      </div>
      <div className="px-2.5 py-2.5 text-[13px] font-medium text-ink flex items-center justify-between gap-1">
        <span className="truncate">{img.label}</span>
        <span className="text-ink/40 group-hover/img:text-ink transition-colors shrink-0 text-base">
          →
        </span>
      </div>
    </Link>
  );
}
