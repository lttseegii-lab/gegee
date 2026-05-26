import Link from 'next/link';
import type { MegaTab, MegaLinkItem, MegaImageCard } from './megaMenuConfig';

export function MegaMenu({ tab }: { tab: MegaTab }) {
  if (!tab.hasMega) return null;

  return (
    <div
      className={`absolute top-full left-1/2 -translate-x-1/2 mt-0 w-[1020px] max-w-[calc(100vw-32px)] z-50 rounded-xl shadow-soft opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto ${tab.bgClass ?? 'bg-white'}`}
    >
      <div className="p-8 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_180px] gap-7">
        {/* Col 1 */}
        <div>
          {tab.col1Heading && (
            <h4 className="font-serif italic text-lg text-ink mb-4">
              {tab.col1Heading}
            </h4>
          )}
          <ul className="space-y-3.5">
            {(tab.col1 ?? []).map((item) => (
              <MegaLink key={item.label} item={item} />
            ))}
          </ul>
        </div>

        {/* Col 2 */}
        <div>
          <h4 className="font-serif italic text-lg text-transparent select-none mb-4">.</h4>
          <ul className="space-y-3.5">
            {(tab.col2 ?? []).map((item) => (
              <MegaLink key={item.label} item={item} />
            ))}
          </ul>
        </div>

        {/* Image cards */}
        {(tab.images ?? []).map((img) => (
          <MegaImage key={img.label} img={img} />
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
      className="bg-white rounded-xl overflow-hidden flex flex-col group/img hover:-translate-y-0.5 transition-transform"
    >
      <div
        className={`aspect-square ${img.bgClass} flex items-center justify-center text-5xl`}
      >
        {img.emoji}
      </div>
      <div className="px-3 py-3 text-sm font-medium text-ink flex items-center justify-between gap-1">
        <span>{img.label}</span>
        <span className="text-ink/40 group-hover/img:text-ink transition-colors">
          →
        </span>
      </div>
    </Link>
  );
}
