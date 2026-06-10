import { createClient } from '@/lib/supabase/server';
import { CapacityDayCard } from '@/components/admin/CapacityDayCard';

export const metadata = { title: 'Capacity' };

const DAYS_AHEAD = 14;
const DEFAULT_MAX = 50;

export default async function AdminCapacityPage() {
  const supabase = createClient();

  // Build next 14 days
  const todayStr = new Date().toISOString().slice(0, 10);
  const dates: string[] = [];
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  // Fetch existing records
  const { data: existing } = await supabase
    .from('daily_capacity')
    .select('*')
    .gte('date', dates[0])
    .lte('date', dates[dates.length - 1]);

  const recordMap = new Map((existing ?? []).map((r) => [r.date, r]));

  return (
    <div className="p-4 sm:p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="font-serif italic text-4xl">Capacity</h1>
        <p className="text-sm text-ink/60 mt-1">
          Өдрийн захиалгын дээд хязгаар + хаалттай байх өдрүүд. Default {DEFAULT_MAX}.
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {dates.map((date) => {
          const row = recordMap.get(date);
          return (
            <CapacityDayCard
              key={date}
              date={date}
              initialMax={row?.max_orders ?? DEFAULT_MAX}
              initialUsed={row?.current_orders ?? 0}
              initialClosed={row?.closed ?? false}
              isToday={date === todayStr}
            />
          );
        })}
      </div>

      <div className="mt-10 p-5 bg-white border border-border rounded-card text-sm text-ink/70">
        <h3 className="font-medium mb-2">💡 Capacity systems-ийн ажиллагаа</h3>
        <ul className="space-y-1 list-disc list-inside">
          <li>
            Хэрэглэгч сагсаа checkout хийхэд автоматаар <code>try_reserve_capacity()</code> дуудна
          </li>
          <li>
            Тухайн өдрийн <code>current_orders</code> {'<'} <code>max_orders</code> бөгөөд <code>closed=false</code> бол захиалга нэмэгдэнэ
          </li>
          <li>
            Дээд хязгаарт хүрвэл checkout-д «Энэ өдөр бөглөгдсөн» warning гарна
          </li>
          <li>Захиалга цуцлагдвал capacity автоматаар буцаагдана</li>
        </ul>
      </div>
    </div>
  );
}
