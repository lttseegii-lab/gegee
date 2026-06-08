import { requireAdmin } from '@/lib/auth/admin';
import { getDiyFlowers, getDiyWraps } from '@/lib/diy/getDiyCatalog';
import { DiyFlowersPicker } from '@/components/admin/DiyFlowersPicker';
import { DiyWrapsPicker } from '@/components/admin/DiyWrapsPicker';

export const metadata = { title: 'DIY catalog' };

export default async function AdminDiyPage() {
  await requireAdmin();
  const [flowers, wraps] = await Promise.all([getDiyFlowers(), getDiyWraps()]);

  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <h1 className="font-serif italic text-4xl">DIY — Өөрийн гараар</h1>
        <p className="text-ink/60 mt-2 text-sm">
          “Өөрийн гараар” хэсэгт хэрэглэгчийн сонгодог цэцэг болон боолтыг энд
          удирдана.
        </p>
      </header>

      <section className="mb-12">
        <header className="mb-5">
          <h2 className="font-serif italic text-2xl">Цэцэг</h2>
          <p className="text-sm text-ink/60">
            Нэр, үнэ, зураг, өнгө, AI prompt-ыг засна. Цэцэг нэмж эсвэл устгаж
            болно.
          </p>
        </header>
        <DiyFlowersPicker initial={flowers} />
      </section>

      <section className="mb-12">
        <header className="mb-5">
          <h2 className="font-serif italic text-2xl">Боолт</h2>
          <p className="text-sm text-ink/60">
            Боолтын төрөл, тайлбар, үнэ, дэвсгэр өнгийг засна.
          </p>
        </header>
        <DiyWrapsPicker initial={wraps} />
      </section>
    </div>
  );
}
