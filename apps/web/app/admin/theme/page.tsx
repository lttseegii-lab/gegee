import Link from 'next/link';
import { getMenuColors } from '@/lib/theme/getTheme';
import { MenuColorPicker } from '@/components/admin/MenuColorPicker';

export const metadata = { title: 'Theme' };

export default async function AdminThemePage() {
  const initial = await getMenuColors();

  return (
    <div className="p-8 max-w-5xl">
      <nav className="text-[13px] text-ink/60 mb-4 flex items-center gap-2">
        <Link href="/admin" className="hover:text-ink">
          Admin
        </Link>
        <span className="text-ink/30">›</span>
        <span className="text-ink font-medium">Theme</span>
      </nav>

      <header className="mb-8">
        <h1 className="font-serif italic text-4xl">Theme — Menu өнгө</h1>
        <p className="text-sm text-ink/60 mt-2 max-w-prose">
          Үндсэн цэсний категори бүрд background өнгө сонгоно уу. Hover хийхэд
          дотрох dropdown болон tab нь сонгосон өнгөтэй болно. Customer
          frontend (gegeen.vercel.app)-руу автоматаар шинэчлэгдэнэ.
        </p>
      </header>

      <MenuColorPicker initial={initial} />

      <div className="mt-10 p-5 bg-white border border-border rounded-card text-sm text-ink/70">
        <h3 className="font-medium mb-2">💡 Хэрэглэгчид сэргэх хугацаа</h3>
        <ul className="space-y-1 list-disc list-inside">
          <li>Хадгалмагц <code>revalidatePath('/', 'layout')</code> дуудагдана</li>
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
