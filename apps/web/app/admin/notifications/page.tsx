import { createServiceClient } from '@/lib/supabase/server';
import { assertAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { SendReminderButton } from './SendReminderButton';

const OCCASION_LABELS: Record<string, string> = {
  birthday:    'Төрсөн өдөр',
  anniversary: 'Ой',
  mothers_day: 'Эхийн баяр',
  fathers_day: 'Эцгийн баяр',
  graduation:  'Төгсөлт',
  just_because:'Бэлэг',
  memorial:    'Дурсгал',
  other:       'Тусгай өдөр',
};

const SMS_TYPE_LABELS: Record<string, string> = {
  order_status:    '📦 Захиалга',
  memory_reminder: '🌸 Сануулга',
};

function daysUntil(month: number, day: number): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let target = new Date(today.getFullYear(), month - 1, day);
  if (target < today) target = new Date(today.getFullYear() + 1, month - 1, day);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

export default async function NotificationsPage() {
  try {
    await assertAdmin();
  } catch {
    redirect('/auth');
  }

  const svc = createServiceClient();

  // Upcoming memory dates — next 14 days, reminders enabled, joined with profile
  const { data: rawDates } = await svc
    .from('memory_dates')
    .select('id, name, occasion, month, day, reminders_enabled, profiles!inner(name, phone)')
    .eq('reminders_enabled', true);

  const reminderRows = (rawDates ?? [])
    .map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const days = daysUntil(row.month ?? 1, row.day ?? 1);
      return {
        id:           row.id,
        name:         row.name,
        occasion:     row.occasion,
        month:        row.month ?? 1,
        day:          row.day ?? 1,
        days,
        customerName: (profile as { name: string; phone: string | null } | null)?.name ?? '—',
        phone:        (profile as { name: string; phone: string | null } | null)?.phone ?? null,
      };
    })
    .filter((r) => r.days >= 0 && r.days <= 14)
    .sort((a, b) => a.days - b.days);

  // Recent SMS log
  const { data: smsLog } = await svc
    .from('sms_log')
    .select('id, created_at, phone, message, type, ok, error')
    .order('created_at', { ascending: false })
    .limit(60);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-serif">Мэдэгдэл</h1>

      {/* ── Memory Garden reminders ── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink/50 mb-4">
          🌸 Ойрын тусгай өдрүүд — дараагийн 14 хоног
        </h2>

        {reminderRows.length === 0 ? (
          <p className="text-sm text-ink/40 py-8 text-center border border-dashed border-border rounded-xl">
            Дараагийн 14 хоногт сануулга идэвхтэй тусгай өдөр байхгүй.
          </p>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-offwhite text-xs text-ink/50 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Хэрэглэгч</th>
                  <th className="px-4 py-3 text-left">Тусгай өдөр</th>
                  <th className="px-4 py-3 text-left">Огноо</th>
                  <th className="px-4 py-3 text-left">Үлдсэн</th>
                  <th className="px-4 py-3 text-left">Утас</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reminderRows.map((row) => (
                  <tr key={row.id} className="hover:bg-offwhite/50">
                    <td className="px-4 py-3 font-medium">{row.customerName}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{row.name}</span>
                      <span className="ml-2 text-xs text-ink/40">
                        {OCCASION_LABELS[row.occasion] ?? row.occasion}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink/60">
                      {String(row.month).padStart(2, '0')}/{String(row.day).padStart(2, '0')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.days <= 2 ? 'bg-pinkHot/10 text-pinkHot' : 'bg-mint/30 text-ink/70'
                      }`}>
                        {row.days === 0 ? 'Өнөөдөр' :
                         row.days === 1 ? 'Маргааш' :
                         `${row.days} хоног`}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink/50">
                      {row.phone ?? <span className="text-pinkHot not-italic">байхгүй</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.phone
                        ? <SendReminderButton memoryDateId={row.id} />
                        : <span className="text-xs text-ink/30">SMS боломжгүй</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── SMS Log ── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink/50 mb-4">
          📋 Илгээсэн SMS-ийн түүх
        </h2>

        {!smsLog || smsLog.length === 0 ? (
          <p className="text-sm text-ink/40 py-8 text-center border border-dashed border-border rounded-xl">
            SMS илгээгдээгүй байна.
          </p>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-offwhite text-xs text-ink/50 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Огноо</th>
                  <th className="px-4 py-3 text-left">Утас</th>
                  <th className="px-4 py-3 text-left">Төрөл</th>
                  <th className="px-4 py-3 text-left">Мэссэж</th>
                  <th className="px-4 py-3 text-left">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {smsLog.map((row) => (
                  <tr key={row.id} className="hover:bg-offwhite/50">
                    <td className="px-4 py-3 text-ink/50 text-xs whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString('mn-MN', {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{row.phone}</td>
                    <td className="px-4 py-3 text-xs">
                      {SMS_TYPE_LABELS[row.type] ?? row.type}
                    </td>
                    <td className="px-4 py-3 text-ink/70 max-w-xs truncate">{row.message}</td>
                    <td className="px-4 py-3">
                      {row.ok
                        ? <span className="text-xs text-green-600 font-medium">✓ Илгээгдсэн</span>
                        : <span className="text-xs text-pinkHot font-medium" title={row.error ?? ''}>✕ Алдаа</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
