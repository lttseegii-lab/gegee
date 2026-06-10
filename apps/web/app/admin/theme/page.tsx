import Link from 'next/link';
import {
  getMenuColors,
  getMenuImages,
  getMenuSubcategories,
  getHeroBanners,
} from '@/lib/theme/getTheme';
import { getOnboardingFlowers } from '@/lib/getOnboardingFlowers';
import { MenuColorPicker } from '@/components/admin/MenuColorPicker';
import { MenuImagesPicker } from '@/components/admin/MenuImagesPicker';
import { MenuSubcategoriesPicker } from '@/components/admin/MenuSubcategoriesPicker';
import { HeroBannersPicker } from '@/components/admin/HeroBannersPicker';
import { OnboardingFlowersPicker } from '@/components/admin/OnboardingFlowersPicker';

export const metadata = { title: 'Theme' };

export default async function AdminThemePage() {
  const [colors, images, subcategories, heroBanners, onboardingFlowers] =
    await Promise.all([
      getMenuColors(),
      getMenuImages(),
      getMenuSubcategories(),
      getHeroBanners(),
      getOnboardingFlowers(),
    ]);

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <nav className="text-[13px] text-ink/60 mb-4 flex items-center gap-2">
        <Link href="/admin" className="hover:text-ink">
          Admin
        </Link>
        <span className="text-ink/30">›</span>
        <span className="text-ink font-medium">Theme</span>
      </nav>

      <header className="mb-8">
        <h1 className="font-serif italic text-4xl">Theme — Mega menu</h1>
        <p className="text-sm text-ink/60 mt-2 max-w-prose">
          Үндсэн цэсний өнгө болон mega menu-н зургуудыг тохируулна. Customer
          frontend (gegeen.vercel.app)-руу автоматаар шинэчлэгдэнэ.
        </p>
      </header>

      {/* Section: Colors */}
      <section className="mb-12">
        <header className="mb-5">
          <h2 className="font-serif italic text-2xl">Background өнгө</h2>
          <p className="text-sm text-ink/60 mt-1">
            Категори бүрд hover үед харагдах өнгө сонгох
          </p>
        </header>
        <MenuColorPicker initial={colors} />
      </section>

      {/* Section: Images */}
      <section className="mb-12">
        <header className="mb-5">
          <h2 className="font-serif italic text-2xl">Mega menu зургууд</h2>
          <p className="text-sm text-ink/60 mt-1">
            Категори тус бүрд 0, 1 эсвэл 2 зургийн карт сонгох. Хэт олон зураг
            байвал dropdown overflow болж дэлгэцнээс гарна.
          </p>
        </header>
        <MenuImagesPicker initial={images} />
      </section>

      {/* Section: Sub-categories */}
      <section className="mb-12">
        <header className="mb-5">
          <h2 className="font-serif italic text-2xl">Дэд цэс</h2>
          <p className="text-sm text-ink/60 mt-1 max-w-prose">
            Категори бүрд харагдах дэд цэсний линкүүд. Tag тус бүр нь
            бүтээгдэхүүний tag-тай тохирно. Шинэ дэд цэс нэмбэл product form
            дотор тэр tag-руу нэмж чагнуулна.
          </p>
        </header>
        <MenuSubcategoriesPicker initial={subcategories} />
      </section>

      {/* Section: Hero banners (homepage carousel) */}
      <section className="mb-12">
        <header className="mb-5">
          <h2 className="font-serif italic text-2xl">Нүүр хуудасны banner</h2>
          <p className="text-sm text-ink/60 mt-1 max-w-prose">
            Нүүр хуудасны hero хэсэгт автоматаар солигдох banner зургуудыг
            тохируулна. URL paste эсвэл файл upload хийж болно. Banner бүрд
            өөрийн гарчиг, тайлбартай.
          </p>
        </header>
        <HeroBannersPicker initial={heroBanners} />
      </section>

      {/* Section: Onboarding flowers */}
      <section className="mb-12">
        <header className="mb-5">
          <h2 className="font-serif italic text-2xl">Бүртгэлийн цэцгүүд</h2>
          <p className="text-sm text-ink/60 mt-1 max-w-prose">
            Шинэ хэрэглэгч бүртгэл хийх үед сонгох 10 цэцэг. Зураг, нэр,
            тайлбарыг өөрчилж болно. URL paste эсвэл файл upload хийж crop
            хийнэ. Зураг профайл аватар болж ч харагдана.
          </p>
        </header>
        <OnboardingFlowersPicker initial={onboardingFlowers} />
      </section>

      <div className="mt-10 p-5 bg-white border border-border rounded-card text-sm text-ink/70">
        <h3 className="font-medium mb-2">💡 Хэрэглэгчид сэргэх хугацаа</h3>
        <ul className="space-y-1 list-disc list-inside">
          <li>Хадгалмагц <code>{"revalidatePath('/', 'layout')"}</code> дуудагдана</li>
          <li>
            Нэг хэрэглэгч дараагийн хуудас зочлоход шинэ өнгийг харна (~1-2 сек)
          </li>
          <li>Vercel ISR cache автоматаар клэар хийгдэнэ</li>
          <li>
            Хэрэв тогтож харагдахгүй бол browser-аа hard refresh хий (Cmd+Shift+R)
          </li>
        </ul>
      </div>
    </div>
  );
}
