// Mega menu config — each top-level tab can declare its own dropdown:
//   - background color (Tailwind class)
//   - 2 columns of sub-category links
//   - up to 2 image-card CTAs on the right

export interface MegaLinkItem {
  label: string;
  href: string;
  badge?: 'new' | 'top';
}

export interface MegaImageCard {
  label: string;
  href: string;
  /** Tailwind background color class for the placeholder (until we have real images) */
  bgClass: string;
  emoji?: string;
}

export interface MegaTab {
  /** Tab label shown in the nav */
  label: string;
  /** Default destination when the tab itself is clicked */
  href: string;
  badge?: 'new' | 'top';
  /** If false, no mega menu — just a plain link */
  hasMega: boolean;
  /** Tailwind class for mega background (e.g., "bg-blush") */
  bgClass?: string;
  /** Tailwind class for tab on hover — must match bgClass color */
  tabHoverClass?: string;
  col1Heading?: string;
  col1?: MegaLinkItem[];
  col2?: MegaLinkItem[];
  images?: MegaImageCard[];
}

export const MEGA_TABS: MegaTab[] = [
  {
    label: 'Өөрийн гараар',
    href: '/diy',
    badge: 'new',
    hasMega: false,
  },
  {
    label: 'Цэцэг',
    href: '/catalog/flowers',
    hasMega: true,
    bgClass: 'bg-blush',
    tabHoverClass: 'group-hover:bg-blush',
    col1Heading: 'Бүгд',
    col1: [
      { label: 'Ээжийн өдрийн цэцэг', href: '/catalog/flowers', badge: 'new' },
      { label: 'Хаврын цэцэг', href: '/catalog/flowers?filter=p-low' },
      { label: 'Пион', href: '/catalog/flowers', badge: 'new' },
      { label: 'Наран цэцэг', href: '/catalog/flowers' },
      { label: 'Letterbox цэцэг', href: '/catalog/flowers?filter=letterbox' },
      { label: 'Гар утаст баглаа', href: '/catalog/flowers?filter=hand-tied' },
    ],
    col2: [
      { label: 'Нэмэлттэй цэцэг', href: '/catalog/flowers', badge: 'new' },
      { label: 'Хатсан цэцэг', href: '/catalog/flowers?filter=dried' },
      { label: 'Тансаг цэцэг', href: '/catalog/flowers?filter=premium' },
      { label: 'Сар тутмын цэцэг', href: '/catalog/subs' },
      { label: 'Vase-тай цэцэг', href: '/catalog/flowers', badge: 'new' },
      { label: 'Эко цуглуулга', href: '/catalog/flowers' },
    ],
    images: [
      {
        label: 'Letterbox цэцэг',
        href: '/catalog/flowers?filter=letterbox',
        bgClass: 'bg-gradient-to-br from-pinkHot/30 to-blush',
        emoji: '✉️',
      },
      {
        label: 'Гар утаст баглаа',
        href: '/catalog/flowers?filter=hand-tied',
        bgClass: 'bg-gradient-to-br from-lilac to-purpleSoft',
        emoji: '💐',
      },
    ],
  },
  {
    label: 'Ургамал',
    href: '/catalog/plants',
    hasMega: true,
    bgClass: 'bg-mint',
    tabHoverClass: 'group-hover:bg-mint',
    col1Heading: 'Бүгд',
    col1: [
      { label: 'House plant', href: '/catalog/plants?filter=houseplant' },
      { label: 'Орхид', href: '/catalog/plants?filter=orchid' },
      { label: 'Суккулент', href: '/catalog/plants?filter=succulent' },
      { label: 'Жижиг ургамал', href: '/catalog/plants' },
    ],
    col2: [
      { label: 'Pet-safe ургамал', href: '/catalog/plants?filter=pet-safe', badge: 'new' },
      { label: '80K хүртэл', href: '/catalog/plants?filter=p-low' },
      { label: 'Гэрэлд сайн', href: '/catalog/plants' },
      { label: 'Тэжээвэрт аюулгүй', href: '/catalog/plants?filter=pet-safe' },
    ],
    images: [
      {
        label: 'House plant',
        href: '/catalog/plants?filter=houseplant',
        bgClass: 'bg-gradient-to-br from-mint to-sageDeep/30',
        emoji: '🪴',
      },
      {
        label: 'Pet-safe',
        href: '/catalog/plants?filter=pet-safe',
        bgClass: 'bg-gradient-to-br from-mint/60 to-yellow/40',
        emoji: '🐾',
      },
    ],
  },
  {
    label: 'Бэлэг',
    href: '/catalog/gifts',
    hasMega: true,
    bgClass: 'bg-lilac',
    tabHoverClass: 'group-hover:bg-lilac',
    col1Heading: 'Бүгд',
    col1: [
      { label: 'Hamper цуглуулга', href: '/catalog/gifts?filter=hamper' },
      { label: 'Шоколад', href: '/catalog/gifts?filter=chocolate' },
      { label: 'Дарс', href: '/catalog/gifts?filter=wine' },
      { label: 'Цай', href: '/catalog/gifts?filter=tea' },
    ],
    col2: [
      { label: 'Тансаг бэлэг', href: '/catalog/gifts?filter=p-high' },
      { label: 'Шинэ нярай', href: '/catalog/gifts' },
      { label: 'Шинэ гэр', href: '/catalog/gifts' },
      { label: 'Корпорацийн', href: '/catalog/gifts' },
    ],
    images: [
      {
        label: 'Hamper',
        href: '/catalog/gifts?filter=hamper',
        bgClass: 'bg-gradient-to-br from-lilac to-purpleSoft/60',
        emoji: '🧺',
      },
      {
        label: 'Шоколад',
        href: '/catalog/gifts?filter=chocolate',
        bgClass: 'bg-gradient-to-br from-purpleSoft to-blush',
        emoji: '🍫',
      },
    ],
  },
  {
    label: 'Карт',
    href: '/catalog/cards',
    badge: 'new',
    hasMega: true,
    bgClass: 'bg-purpleSoft',
    tabHoverClass: 'group-hover:bg-purpleSoft',
    col1Heading: 'Бүгд',
    col1: [
      { label: 'Төрсөн өдрийн card', href: '/catalog/cards?filter=birthday' },
      { label: 'Талархал card', href: '/catalog/cards?filter=thanks' },
      { label: 'Тайтгарал card', href: '/catalog/cards?filter=sympathy' },
    ],
    col2: [
      { label: 'Хурим & сүй', href: '/catalog/cards' },
      { label: 'Шинэ нярай', href: '/catalog/cards' },
      { label: 'AI Co-writer', href: '/catalog/cards', badge: 'new' },
    ],
    images: [
      {
        label: 'Card цуглуулга',
        href: '/catalog/cards',
        bgClass: 'bg-gradient-to-br from-purpleSoft to-lilac',
        emoji: '💌',
      },
      {
        label: 'AI Co-writer',
        href: '/catalog/cards',
        bgClass: 'bg-gradient-to-br from-yellow-pale to-purpleSoft',
        emoji: '✨',
      },
    ],
  },
  {
    label: 'Захиалгат',
    href: '/catalog/subs',
    hasMega: true,
    bgClass: 'bg-peach',
    tabHoverClass: 'group-hover:bg-peach',
    col1Heading: 'Бүгд',
    col1: [
      { label: 'Petite Weekly', href: '/catalog/subs?filter=weekly' },
      { label: 'Signature Atelier', href: '/catalog/subs?filter=monthly' },
      { label: 'Premium', href: '/catalog/subs?filter=premium' },
    ],
    col2: [
      { label: '7 хоног тутам', href: '/catalog/subs?filter=weekly' },
      { label: 'Сар тутам', href: '/catalog/subs?filter=monthly' },
      { label: 'Pause/Skip удирдлага', href: '/account/profile' },
    ],
    images: [
      {
        label: 'Signature Atelier',
        href: '/catalog/subs?filter=monthly',
        bgClass: 'bg-gradient-to-br from-peach to-yellow-pale',
        emoji: '📦',
      },
      {
        label: 'Petite Weekly',
        href: '/catalog/subs?filter=weekly',
        bgClass: 'bg-gradient-to-br from-yellow-pale to-blush',
        emoji: '🌸',
      },
    ],
  },
  {
    label: 'Бүгд',
    href: '/catalog/all',
    hasMega: false,
  },
];
