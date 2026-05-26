import Image from 'next/image';
import Link from 'next/link';
import { productImageUrl } from '@/lib/ai/pollinations';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { HeartButton } from '@/components/product/HeartButton';
import type { Product } from '@/types/database';

const BADGE_STYLES: Record<string, string> = {
  'top-pick': 'bg-pinkHot text-white',
  'new-pill': 'bg-yellow text-ink',
  'letterbox-pill': 'bg-purpleSoft text-ink',
  'double-points': 'bg-mint text-ink',
};

const BADGE_LABELS: Record<string, string> = {
  'top-pick': 'Top Pick',
  'new-pill': 'Шинэ',
  'letterbox-pill': 'Letterbox',
  'double-points': 'Double Points',
};

export function ProductCard({ product }: { product: Product }) {
  const imageUrl = productImageUrl(product, 600, 600);
  const stars = '★'.repeat(Math.floor(product.rating ?? 0));

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block rounded-card overflow-hidden bg-white border border-border hover:shadow-card transition-shadow"
    >
      <div className="relative aspect-square bg-lilac/40 overflow-hidden">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized={imageUrl.includes('pollinations.ai')}
        />
        {product.badge && BADGE_LABELS[product.badge] && (
          <span
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
              BADGE_STYLES[product.badge] ?? 'bg-ink text-white'
            }`}
          >
            {BADGE_LABELS[product.badge]}
          </span>
        )}
        {product.pet_safe && (
          <span className="absolute bottom-3 left-3 px-2 py-1 rounded-full text-[10px] font-medium bg-white/90 text-ink">
            🐾 Pet-safe
          </span>
        )}
        <div className="absolute top-3 right-3">
          <HeartButton productId={product.id} size="sm" />
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-serif text-lg leading-tight group-hover:text-pinkHot transition-colors">
          {product.name}
        </h3>
        <div className="mt-1.5 text-xs text-ink/60 flex items-center gap-1.5">
          <span className="text-goldDeep">{stars}</span>
          <span>
            {product.rating?.toFixed(1) ?? '—'} · {(product.reviews ?? 0).toLocaleString()} review
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-ink/40 mr-1">эхлэл</span>
            <span className="font-semibold">{product.price.toLocaleString()}₮</span>
          </div>
          <AddToCartButton productId={product.id} variant="icon" />
        </div>
      </div>
    </Link>
  );
}
