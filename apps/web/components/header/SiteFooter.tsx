import Link from 'next/link';

const FOOTER_LINKS = {
  Дэлгүүр: [
    { label: 'Бүх бүтээгдэхүүн', href: '/catalog/all' },
    { label: 'Цэцэг', href: '/catalog/flowers' },
    { label: 'Ургамал', href: '/catalog/plants' },
    { label: 'Бэлэг', href: '/catalog/gifts' },
    { label: 'Карт', href: '/catalog/cards' },
    { label: 'Захиалгат', href: '/catalog/subs' },
  ],
  Тусламж: [
    { label: 'Хүргэлт', href: '/help/delivery' },
    { label: 'Буцаалт', href: '/help/returns' },
    { label: 'Холбоо барих', href: '/help/contact' },
    { label: 'FAQ', href: '/help/faq' },
  ],
  Бид: [
    { label: 'Бидний тухай', href: '/about' },
    { label: 'Care wildly', href: '/about/care-wildly' },
    { label: 'Sustainability', href: '/about/sustainability' },
    { label: 'Блог', href: '/blog' },
  ],
};

export function SiteFooter() {
  return (
    <footer className="bg-offwhite border-t border-border mt-20">
      <div className="max-w-container mx-auto px-6 py-16 grid lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12">
        <div>
          <div className="font-serif italic text-2xl mb-2">
            Thanks <span className="text-pinkHot">✻</span>
          </div>
          <p className="text-sm text-ink/60 max-w-sm">
            Мэдрэхүйг ойлгодог цэцгийн худалдаа. Care wildly.
          </p>
          <div className="mt-6 flex gap-4 text-sm text-ink/60">
            <span>★ 4.9 / 5</span>
            <span>·</span>
            <span>B Corp</span>
          </div>
        </div>

        {Object.entries(FOOTER_LINKS).map(([title, links]) => (
          <div key={title}>
            <h4 className="font-medium text-sm mb-4">{title}</h4>
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-ink/60 hover:text-ink"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="max-w-container mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-ink/50">
          <span>© 2026 Thanks. Бүх эрх хуулиар хамгаалагдсан.</span>
          <div className="flex gap-4">
            <Link href="/legal/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/legal/terms" className="hover:text-ink">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
