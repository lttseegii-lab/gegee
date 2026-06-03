// Emotional moods — driven by Bloom & Wild / "Care wildly" research:
// flowers are a feelings purchase, not a category purchase.
// Each mood maps to product tags + a tone for AI message suggestions.

export interface Mood {
  key: string;
  label: string;
  emoji: string;
  /** One-line description shown under the tile */
  description: string;
  /** Background gradient class (must appear literally for Tailwind JIT) */
  bgClass: string;
  /** Product tags this mood matches against */
  tags: string[];
  /** Tone descriptor — used by the AI message generator */
  tone: string;
  /** Sample messages — used by CardMessageSuggest */
  sampleMessages: string[];
}

export const MOODS: Mood[] = [
  {
    key: 'love',
    label: 'Хайр',
    emoji: '❤️',
    description: 'Хайрт хүндээ зөөлөн хайраа илэрхийлэх',
    bgClass: 'bg-gradient-to-br from-pinkHot/30 to-blush',
    tags: ['romance', 'peony', 'rose', 'pink', 'anniversary'],
    tone: 'romantic',
    sampleMessages: [
      'Чамайг хайрлахдаа цаг гэж байхгүй.',
      'Чамтай хамт өнгөрүүлж буй өдөр болгон бэлэг шиг.',
      'Чи бол миний хамгийн анхны болоод сүүлчийн.',
      'Зүрх минь үргэлж чамтай.',
      'Чамаас хайртай хүн бай гэвэл одод л байх.',
    ],
  },
  {
    key: 'gratitude',
    label: 'Талархал',
    emoji: '🙏',
    description: 'Чин сэтгэлийн талархал илэрхийлэх',
    bgClass: 'bg-gradient-to-br from-mint to-yellow-pale',
    tags: ['thanks', 'gratitude', 'sage', 'eucalyptus', 'tulip'],
    tone: 'warm',
    sampleMessages: [
      'Танд маш их баярлалаа. Та надад үнэхээр их хэрэгтэй.',
      'Танай туслалцаа надад нэгэн хатуу үе шатанд гэрлийн туяа болсон.',
      'Үг хэлээд бараа хэлэх нь бэрх. Зүгээр л баярлалаа.',
      'Чин сэтгэлээсээ талархаж байна.',
      'Танай сэтгэл миний амьдралд гэрэл оруулдаг.',
    ],
  },
  {
    key: 'apology',
    label: 'Уучлал',
    emoji: '🌸',
    description: 'Чин сэтгэлийн уучлал гуйх',
    bgClass: 'bg-gradient-to-br from-purpleSoft to-blush',
    tags: ['apology', 'white', 'calm', 'lily', 'sympathy'],
    tone: 'sincere',
    sampleMessages: [
      'Уучлаарай. Танд гомдоосондоо чин сэтгэлээсээ харамсаж байна.',
      'Үг үйлдлээрээ та руу гомдоосонд минь намайг уучлана уу.',
      'Танай уучлал миний хувьд хамгийн чухал.',
      'Алдаагаа ухаарч байна. Дахиад ийм болгохгүй.',
      'Чин сэтгэлээ илэрхийлэх үг олдохгүй байна. Намайг уучлаарай.',
    ],
  },
  {
    key: 'celebration',
    label: 'Баяр',
    emoji: '🎉',
    description: 'Амжилт, баяр, гавьяа',
    bgClass: 'bg-gradient-to-br from-yellow-pale to-peach',
    tags: ['celebration', 'birthday', 'graduation', 'sunflower', 'colorful'],
    tone: 'joyful',
    sampleMessages: [
      'Танд баяр хүргэе! Энэ тусгай өдөр аз жаргалаар дүүрэн байг.',
      'Амжилт танай хөдөлмөрийн үр дүн. Баяр хүргэе!',
      'Чи бол үнэхээр гайхамшигтай. Энэ амжилт чиний эрх.',
      'Энэ өдрийг чамтай хамтаар тэмдэглэхэд маш баяртай байна.',
      'Чиний баяр бол миний баяр.',
    ],
  },
  {
    key: 'missing',
    label: 'Санаж байна',
    emoji: '🌷',
    description: 'Хол байгаа боловч санаж буй илэрхийлэл',
    bgClass: 'bg-gradient-to-br from-lilac to-purpleSoft',
    tags: ['just-because', 'tulip', 'lavender', 'soft', 'peony'],
    tone: 'tender',
    sampleMessages: [
      'Чамайг санаж байна. Удалгүй уулзах болно.',
      'Зай тус хол боловч сэтгэл ойр.',
      'Чамтай уулзах өдрийг тооцоолж байна.',
      'Чи бол миний өдөр бүрийн бодлын ширхэг.',
      'Хол байгаа ч хайр бүү дутаасан.',
    ],
  },
  {
    key: 'respect',
    label: 'Хүндлэл',
    emoji: '🤍',
    description: 'Эх, эцэг, багш, удирдагчид',
    bgClass: 'bg-gradient-to-br from-offwhite to-mint',
    tags: ['elegant', 'white', 'sage', 'lily', 'orchid'],
    tone: 'respectful',
    sampleMessages: [
      'Танд гүн хүндэтгэлээ илэрхийлж байна.',
      'Танай нөлөө миний амьдралд хэмжээлшгүй их.',
      'Танай шударга, гайхамшигтай хүмүүс ховор.',
      'Танай үлгэр жишээ үлдсэн.',
      'Танаас суралцсан зүйл миний амьдралын мэргэжил.',
    ],
  },
  {
    key: 'sympathy',
    label: 'Эмгэнэл',
    emoji: '🕊️',
    description: 'Хүнд цаг үеийнхэн дэмжих',
    bgClass: 'bg-gradient-to-br from-mint to-sageDeep/30',
    tags: ['sympathy', 'white', 'lily', 'calm', 'sage'],
    tone: 'gentle',
    sampleMessages: [
      'Танай зовлонг хуваалцахад үг үгүй боловч сэтгэл нь танд байна.',
      'Та ганцаараа биш. Бид танд хамт байна.',
      'Хүнд үеийн зовлонг тэвчиж байгаа танд хүчтэй сэтгэл хүсье.',
      'Тайвны мэндчилгээ.',
      'Танай зүрх амрыг олох болтугай.',
    ],
  },
  {
    key: 'just-because',
    label: 'Зүгээр л',
    emoji: '🌼',
    description: 'Шалтгаангүйгээр баяр өгөх',
    bgClass: 'bg-gradient-to-br from-cream-blush to-yellow-pale',
    tags: ['just-because', 'colorful', 'bouquet', 'spring', 'cheerful'],
    tone: 'playful',
    sampleMessages: [
      'Зүгээр л чамайг бодоод авлаа 🌸',
      'Өнөөдрийн хамгийн сайхан зүйл — чи.',
      'Шалтгаан хэрэгтэй гэж үү? Чамайг хайрладаг хангалттай.',
      'Жинхэнэ амьдрал бол ийм жижигхэн өдрүүдээс бүтдэг.',
      'Чамд бөгөөд цаг гарах болтугай.',
    ],
  },
];

export const MOODS_BY_KEY: Record<string, Mood> = Object.fromEntries(
  MOODS.map((m) => [m.key, m])
);

export function resolveMood(key: string | undefined | null): Mood | null {
  if (!key) return null;
  return MOODS_BY_KEY[key] ?? null;
}
