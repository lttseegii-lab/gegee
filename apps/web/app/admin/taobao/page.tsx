import { createClient } from '@/lib/supabase/server';
import { getTaobaoProvider } from '@/lib/taobao/provider';
import { DEFAULT_TAOBAO_PRICING, parsePricing } from '@/lib/taobao/pricing';
import { translatorStatus } from '@/lib/taobao/translate';
import { TaobaoImport } from '@/components/admin/TaobaoImport';

export const metadata = { title: 'Taobao импорт' };
export const dynamic = 'force-dynamic';

export default async function AdminTaobaoPage() {
  // Admin-only tables: RLS lets the signed-in admin read them (layout already
  // ran requireAdmin()).
  const supabase = createClient();
  const [settings, sources] = await Promise.all([
    supabase.from('admin_settings').select('value').eq('key', 'taobao_pricing').maybeSingle(),
    supabase.from('product_sources').select('item_id').eq('source', 'taobao'),
  ]);

  const provider = getTaobaoProvider();
  const translator = translatorStatus();

  return (
    <div className="p-4 sm:p-8 max-w-7xl">
      <header className="mb-6">
        <h1 className="font-serif italic text-4xl">Taobao импорт</h1>
        <p className="text-sm text-ink/60 mt-1">
          Ор дэрний бараа хайж, монгол хэл рүү орчуулж, үнээ тооцоод каталогтоо нэмнэ.
        </p>
      </header>

      {settings.error || sources.error ? (
        <div className="bg-yellow-pale border border-border rounded-card p-5 text-sm">
          <div className="font-medium mb-1">Өгөгдлийн сан бэлэн биш байна</div>
          <p className="text-ink/70">
            <code>supabase/migrations/0027_taobao_import.sql</code> migration-ийг ажиллуулсны дараа энэ
            хуудас нээгдэнэ.
          </p>
        </div>
      ) : (
        <TaobaoImport
          provider={{ label: provider.label, sample: provider.sample }}
          translator={translator}
          initialPricing={parsePricing(settings.data?.value) ?? DEFAULT_TAOBAO_PRICING}
          importedItemIds={(sources.data ?? []).map((row) => row.item_id)}
        />
      )}
    </div>
  );
}
