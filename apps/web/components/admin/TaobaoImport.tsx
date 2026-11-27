'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  importTaobaoProduct,
  searchTaobao,
  translateTaobaoItem,
  updateTaobaoPricing,
} from '@/app/admin/taobao/actions';
import { taobaoPrice } from '@/lib/taobao/pricing';
import { isTaobaoImageUrl } from '@/lib/taobao/validate';
import {
  TAOBAO_CATEGORIES,
  TAOBAO_CATEGORY_LABELS,
  type TaobaoCategory,
  type TaobaoItem,
  type TaobaoPricing,
  type TaobaoTranslation,
} from '@/lib/taobao/types';

interface Props {
  provider: { label: string; sample: boolean };
  translator: { id: 'claude' | 'sample'; label: string };
  initialPricing: TaobaoPricing;
  importedItemIds: string[];
}

interface Draft {
  item: TaobaoItem;
  translation: TaobaoTranslation;
  translator: 'claude' | 'sample';
}

const CATEGORY_EMOJI: Record<TaobaoCategory, string> = {
  bedding: '🛏️',
  duvet: '☁️',
  pillow: '💤',
  robe: '🥋',
  towel: '🧺',
};

const money = (value: number) => `${value.toLocaleString()}₮`;
const inputClass =
  'w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink disabled:opacity-50';

export function TaobaoImport({ provider, translator, initialPricing, importedItemIds }: Props) {
  const router = useRouter();
  const [pricing, setPricing] = useState(initialPricing);
  const [category, setCategory] = useState<TaobaoCategory>('bedding');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<TaobaoItem[] | null>(null);
  const [searchError, setSearchError] = useState('');
  const [imported, setImported] = useState(() => new Set(importedItemIds));
  const [busyId, setBusyId] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  const [isSearching, startSearch] = useTransition();
  const requestRef = useRef(0);

  function runSearch(nextCategory: TaobaoCategory, nextQuery: string) {
    const request = ++requestRef.current;
    setSearchError('');
    startSearch(async () => {
      const result = await searchTaobao(nextCategory, nextQuery);
      if (request !== requestRef.current) return; // a newer search superseded this one
      if (result.ok) setItems(result.items);
      else {
        setItems(null);
        setSearchError(result.error);
      }
    });
  }

  // Load the first category on mount.
  useEffect(() => {
    runSearch('bedding', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openDraft(item: TaobaoItem) {
    if (busyId) return;
    setBusyId(item.itemId);
    setNotice(null);
    const result = await translateTaobaoItem({
      itemId: item.itemId,
      titleZh: item.titleZh,
      attrsZh: item.attrsZh,
      skusZh: item.skusZh,
    });
    setBusyId('');
    if (result.ok) setDraft({ item, translation: result.translation, translator: result.translator });
    else setNotice({ error: true, text: result.error });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-2.5 py-1 rounded-full bg-white border border-border">
          Эх сурвалж · {provider.label}
        </span>
        <span className="px-2.5 py-1 rounded-full bg-white border border-border">
          Орчуулга · {translator.label}
        </span>
      </div>

      {provider.sample && (
        <div className="bg-yellow-pale border border-border rounded-card p-4 text-sm text-ink/80">
          Одоогоор <strong>жишиг өгөгдөл</strong> харагдаж байна. Эдгээр нь бодит Taobao бараа биш: үнэ,
          борлуулалтын тоо зохиомол. Жишиг барааг каталогт нэмж болох ч үргэлж идэвхгүй хадгалагдаж,
          хэрэглэгчид харагдахгүй.
          {translator.id === 'sample' &&
            ' Орчуулга ч мөн бэлэн жишиг бичвэр; ANTHROPIC_API_KEY тохируулбал Claude орчуулна.'}
        </div>
      )}

      <PricingForm pricing={pricing} onSaved={setPricing} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Барааны ангилал">
          {TAOBAO_CATEGORIES.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={category === key}
              onClick={() => {
                setCategory(key);
                runSearch(key, query);
              }}
              className={`px-4 py-2 min-h-[40px] rounded-full text-sm border transition-colors ${
                category === key
                  ? 'bg-ink text-white border-ink'
                  : 'bg-white text-ink border-border hover:border-ink'
              }`}
            >
              {TAOBAO_CATEGORY_LABELS[key]}
            </button>
          ))}
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            runSearch(category, query);
          }}
        >
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={80}
            placeholder="Түлхүүр үг: 全棉, хөвөн..."
            aria-label="Taobao бараа хайх"
            className="border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-ink w-56"
          />
          <button type="submit" className="btn-ghost !px-5 !py-2">
            Хайх
          </button>
        </form>
      </div>

      {notice && (
        <div
          role={notice.error ? 'alert' : 'status'}
          className={`bg-white border rounded-card p-3 text-sm ${
            notice.error ? 'border-pinkHot/40 text-pinkHot' : 'border-sageDeep/40 text-sageDeep'
          }`}
        >
          {notice.text}
        </div>
      )}

      {searchError ? (
        <Empty title="Хайлт амжилтгүй боллоо" text={searchError} />
      ) : items == null ? (
        <Empty title="Бараа хайж байна…" text="Түр хүлээнэ үү." />
      ) : items.length === 0 ? (
        <Empty title="Тохирох бараа олдсонгүй" text="Өөр түлхүүр үг эсвэл ангилал сонгоно уу." />
      ) : (
        <div
          className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${isSearching ? 'opacity-50' : ''}`}
          aria-busy={isSearching}
        >
          {items.map((item) => {
            const { price, cost } = taobaoPrice(item.priceCny, pricing);
            const done = imported.has(item.itemId);
            return (
              <article
                key={item.itemId}
                className="bg-white border border-border rounded-card overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] bg-lilac/30 flex items-center justify-center text-5xl">
                  {isTaobaoImageUrl(item.image) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span aria-hidden="true">{CATEGORY_EMOJI[item.category]}</span>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <p lang="zh-CN" className="text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
                    {item.titleZh}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink/55">
                    <span className="font-semibold text-ink">¥{item.priceCny}</span>
                    {item.sales > 0 && <span>{item.sales.toLocaleString()} борлуулалт</span>}
                    {item.skusZh.length > 0 && <span>{item.skusZh.length} сонголт</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 bg-offwhite rounded-lg p-3 mt-auto">
                    <div>
                      <div className="text-[11px] text-ink/50">Тооцоолсон үнэ</div>
                      <div className="font-semibold tabular-nums">{money(price)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-ink/50">Өртөг</div>
                      <div className="font-semibold tabular-nums">{money(cost)}</div>
                    </div>
                  </div>
                  {done ? (
                    <span className="text-xs font-medium text-sageDeep">✓ Каталогт нэмсэн</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openDraft(item)}
                      disabled={Boolean(busyId)}
                      className="btn-primary !py-2.5 w-full"
                    >
                      {busyId === item.itemId ? 'Орчуулж байна…' : 'Орчуулж нэмэх'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {draft && (
        <ImportDialog
          draft={draft}
          pricing={pricing}
          onClose={() => setDraft(null)}
          onImported={(active) => {
            setImported((prev) => new Set(prev).add(draft.item.itemId));
            setDraft(null);
            setNotice({
              error: false,
              text: active
                ? 'Бараа каталогт нэмэгдэж, дэлгүүрт харагдаж байна.'
                : 'Бараа каталогт идэвхгүй төлөвтэй нэмэгдлээ.',
            });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="bg-white border border-border rounded-card p-10 text-center">
      <div className="font-medium">{title}</div>
      <p className="text-sm text-ink/60 mt-1">{text}</p>
    </div>
  );
}

function PricingForm({
  pricing,
  onSaved,
}: {
  pricing: TaobaoPricing;
  onSaved: (pricing: TaobaoPricing) => void;
}) {
  const [values, setValues] = useState({
    cnyRate: String(pricing.cnyRate),
    marginPercent: String(pricing.marginPercent),
    cargoFee: String(pricing.cargoFee),
  });
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const fields: { key: keyof TaobaoPricing; label: string; help: string; max: number }[] = [
    { key: 'cnyRate', label: '1 юань (₮)', help: 'Банкны өдрийн ханшаар өөрөө шинэчилнэ.', max: 100000 },
    { key: 'marginPercent', label: 'Ашиг (%)', help: 'Өртөг дээр нэмэх хувь.', max: 1000 },
    { key: 'cargoFee', label: 'Карго, нэг бараанд (₮)', help: 'Хятадаас Улаанбаатар хүртэлх дундаж зардал.', max: 1000000 },
  ];

  return (
    <form
      className="bg-white border border-border rounded-card p-5"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await updateTaobaoPricing({
            cnyRate: Number(values.cnyRate),
            marginPercent: Number(values.marginPercent),
            cargoFee: Number(values.cargoFee),
          });
          if (result.ok) {
            onSaved(result.pricing);
            setMessage({ error: false, text: 'Хадгалагдлаа. Доорх үнүүд шинэчлэгдсэн.' });
          } else setMessage({ error: true, text: result.error });
        });
      }}
    >
      <h2 className="font-medium">Үнийн тооцоо</h2>
      <p className="text-xs text-ink/55 mt-1 mb-4">
        Өртөг = юанийн үнэ × ханш + карго. Зарах үнэ = өртөг + ашиг, 100₮-өөр дээш бүхэлтгэнэ.
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        {fields.map((field) => (
          <label key={field.key} className="block text-sm">
            <span className="font-medium">{field.label}</span>
            <input
              type="number"
              inputMode="numeric"
              min={field.key === 'cnyRate' ? 1 : 0}
              max={field.max}
              step={1}
              required
              value={values[field.key]}
              onChange={(event) => setValues((prev) => ({ ...prev, [field.key]: event.target.value }))}
              disabled={isPending}
              className={`${inputClass} mt-1.5`}
            />
            <span className="block text-xs text-ink/50 mt-1">{field.help}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button type="submit" disabled={isPending} className="btn-ghost !px-5 !py-2">
          {isPending ? 'Хадгалж байна…' : 'Тооцоо хадгалах'}
        </button>
        {message && (
          <span role="status" className={`text-xs ${message.error ? 'text-pinkHot' : 'text-sageDeep'}`}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}

function ImportDialog({
  draft,
  pricing,
  onClose,
  onImported,
}: {
  draft: Draft;
  pricing: TaobaoPricing;
  onClose: () => void;
  onImported: (active: boolean) => void;
}) {
  const { item, translation } = draft;
  const suggested = taobaoPrice(item.priceCny, pricing);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  function submit(form: HTMLFormElement) {
    const data = new FormData(form);
    setError('');
    startTransition(async () => {
      const result = await importTaobaoProduct({
        category: item.category,
        name: String(data.get('name') ?? ''),
        description: String(data.get('description') ?? ''),
        details: String(data.get('details') ?? '').split('\n'),
        variants: translation.variants,
        price: Number(data.get('price')),
        cost: Number(data.get('cost')),
        active: data.get('active') === 'on',
        source: {
          itemId: item.itemId,
          titleZh: item.titleZh,
          priceCny: item.priceCny,
          url: item.url,
          image: item.image,
          sample: item.sample,
        },
      });
      if (result.ok) onImported(result.active);
      else setError(result.error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="taobao-import-title">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <form
        className="relative bg-white w-full sm:max-w-xl max-h-[92vh] overflow-y-auto overscroll-contain rounded-t-card sm:rounded-card p-5 sm:p-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit(event.currentTarget);
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="taobao-import-title" className="font-serif italic text-2xl">
            Орчуулгаа хянаад нэмэх
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Хаах"
            className="w-11 h-11 -mr-2 -mt-2 inline-flex items-center justify-center text-ink/50 hover:text-ink text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="bg-offwhite rounded-lg p-3">
          <div className="text-[11px] uppercase tracking-wider text-ink/45">Эх гарчиг · ¥{item.priceCny}</div>
          <p lang="zh-CN" className="text-sm mt-1">
            {item.titleZh}
          </p>
          <p className="text-xs text-ink/55 mt-1.5">
            {draft.translator === 'claude'
              ? 'Claude орчуулсан. Нийтлэхээсээ өмнө нэр, үзүүлэлтийг уншиж шалгана уу.'
              : 'Жишиг орчуулга. Claude API түлхүүр холбоогүй байна.'}
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-pinkHot">
            {error}
          </p>
        )}

        <label className="block text-sm">
          <span className="font-medium">Барааны нэр</span>
          <input name="name" type="text" required minLength={2} maxLength={80} defaultValue={translation.name} disabled={isPending} className={`${inputClass} mt-1.5`} />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Товч тайлбар</span>
          <textarea name="description" rows={2} maxLength={180} defaultValue={translation.description} disabled={isPending} className={`${inputClass} mt-1.5`} />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Үзүүлэлт</span>
          <textarea name="details" rows={5} maxLength={1400} defaultValue={translation.details.join('\n')} disabled={isPending} className={`${inputClass} mt-1.5`} />
          <span className="block text-xs text-ink/50 mt-1">Мөр бүр нэг үзүүлэлт. Дээд тал нь 8 мөр.</span>
        </label>

        {translation.variants.length > 0 && (
          <div className="text-sm">
            <span className="font-medium">Сонголтууд</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {translation.variants.map((value) => (
                <span key={value} className="text-xs px-2.5 py-1 rounded-full bg-offwhite border border-border">
                  {value}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="font-medium">Зарах үнэ (₮)</span>
            <input name="price" type="number" inputMode="numeric" required min={1} max={5000000} step={1} defaultValue={suggested.price} disabled={isPending} className={`${inputClass} mt-1.5`} />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Нэгжийн өртөг (₮)</span>
            <input name="cost" type="number" inputMode="numeric" required min={0} max={5000000} step={1} defaultValue={suggested.cost} disabled={isPending} className={`${inputClass} mt-1.5`} />
          </label>
        </div>

        {item.sample ? (
          <p className="text-xs text-ink/60 bg-yellow-pale rounded-lg p-3">
            Жишиг бараа тул идэвхгүй хадгалагдана. Хэрэглэгчид харагдахгүй, идэвхжүүлэх боломжгүй.
          </p>
        ) : (
          <label className="flex items-center gap-2 text-sm min-h-[44px]">
            <input name="active" type="checkbox" defaultChecked disabled={isPending} className="w-4 h-4" />
            Дэлгүүрт шууд харуулах
          </label>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} disabled={isPending} className="btn-ghost !px-5 !py-2.5">
            Болих
          </button>
          <button type="submit" disabled={isPending} className="btn-primary !py-2.5">
            {isPending ? 'Нэмж байна…' : 'Каталогт нэмэх'}
          </button>
        </div>
      </form>
    </div>
  );
}
