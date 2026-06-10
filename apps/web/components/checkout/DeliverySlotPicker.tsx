'use client';

import { useMemo, useState } from 'react';

import { ubDateString } from '@/lib/time/ub';

export interface DeliveryPlan {
  date: string;        // YYYY-MM-DD
  slot: 'asap' | '10-13' | '14-17' | '18-21';
  is_surprise: boolean;
  recipient_phone: string;
}

const SLOTS: { key: DeliveryPlan['slot']; label: string; detail: string }[] = [
  { key: 'asap',  label: 'Хамгийн хурдан', detail: 'Цаг хүртэл 90 минут' },
  { key: '10-13', label: 'Өглөө',         detail: '10:00–13:00' },
  { key: '14-17', label: 'Үд',            detail: '14:00–17:00' },
  { key: '18-21', label: 'Орой',          detail: '18:00–21:00' },
];

function fmtDate(d: Date): string {
  // Asia/Ulaanbaatar, not UTC — otherwise the "today" chip and the date we send
  // to the server land a day behind for UTC+8 users.
  return ubDateString(d);
}

function dayLabel(d: Date): { day: string; mn: string } {
  const days = ['Ня','Да','Мя','Лх','Пү','Ба','Бя'];
  return {
    day: d.getDate().toString().padStart(2, '0'),
    mn: days[d.getDay()],
  };
}

interface Props {
  initial?: Partial<DeliveryPlan>;
  /** Form prefix for field names (default: empty) */
  onChange?: (plan: DeliveryPlan) => void;
}

export function DeliverySlotPicker({ initial, onChange }: Props) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [date, setDate] = useState<string>(initial?.date ?? fmtDate(today));
  const [slot, setSlot] = useState<DeliveryPlan['slot']>(
    initial?.slot ?? 'asap'
  );
  const [surprise, setSurprise] = useState<boolean>(initial?.is_surprise ?? false);
  const [recipientPhone, setRecipientPhone] = useState<string>(
    initial?.recipient_phone ?? ''
  );

  // Next 7 days
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, [today]);

  function update(patch: Partial<DeliveryPlan>) {
    const nextDate = patch.date ?? date;
    let nextSlot = patch.slot ?? slot;
    // ASAP is only valid for today. If the user picks a future day while ASAP is
    // selected, move them to the first real window — otherwise the order RPC
    // rejects "asap + future date" and checkout silently fails.
    if (nextSlot === 'asap' && nextDate !== fmtDate(today)) {
      nextSlot = '10-13';
    }
    const next: DeliveryPlan = {
      date: nextDate,
      slot: nextSlot,
      is_surprise: patch.is_surprise ?? surprise,
      recipient_phone: patch.recipient_phone ?? recipientPhone,
    };
    setDate(nextDate);
    setSlot(nextSlot);
    if (patch.is_surprise !== undefined) setSurprise(patch.is_surprise);
    if (patch.recipient_phone !== undefined) setRecipientPhone(patch.recipient_phone);
    onChange?.(next);
  }

  const isToday = date === fmtDate(today);

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs uppercase tracking-wider text-ink/60 mb-2">
          Хүргэх өдөр
        </label>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((d) => {
            const v = fmtDate(d);
            const isActive = v === date;
            const lbl = dayLabel(d);
            const isFirst = v === fmtDate(today);
            return (
              <button
                key={v}
                type="button"
                onClick={() => update({ date: v })}
                className={`flex flex-col items-center py-2.5 px-2 rounded-lg border transition-colors ${
                  isActive
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white text-ink border-border hover:border-ink'
                }`}
              >
                <span className="text-[10px] uppercase tracking-wider opacity-60">
                  {lbl.mn}
                </span>
                <span className="text-lg font-medium">{lbl.day}</span>
                {isFirst && (
                  <span className="text-[9px] mt-0.5 opacity-60">өнөөдөр</span>
                )}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="delivery_date" value={date} />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-ink/60 mb-2">
          Цаг
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SLOTS.map((s) => {
            const isActive = slot === s.key;
            // ASAP only available for today
            const disabled = s.key === 'asap' && !isToday;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => !disabled && update({ slot: s.key })}
                disabled={disabled}
                className={`flex flex-col items-start text-left p-3 rounded-lg border transition-colors ${
                  disabled
                    ? 'bg-offwhite text-ink/30 border-border cursor-not-allowed'
                    : isActive
                      ? 'bg-ink text-white border-ink'
                      : 'bg-white text-ink border-border hover:border-ink'
                }`}
              >
                <span className="text-sm font-medium">{s.label}</span>
                <span
                  className={`text-[11px] mt-0.5 ${
                    isActive ? 'opacity-70' : 'text-ink/50'
                  }`}
                >
                  {s.detail}
                </span>
              </button>
            );
          })}
        </div>
        <input type="hidden" name="delivery_slot" value={slot} />
      </div>

      <div>
        <label className="flex items-start gap-3 cursor-pointer p-3 bg-blush/40 rounded-lg border border-border">
          <input
            type="checkbox"
            checked={surprise}
            onChange={(e) => update({ is_surprise: e.target.checked })}
            className="mt-0.5 rounded"
            name="is_surprise"
            value="true"
          />
          <div>
            <div className="text-sm font-medium">🎁 Нууц бэлэг</div>
            <div className="text-xs text-ink/60 mt-0.5">
              Хүлээн авагчид урьдчилан мэдэгдэхгүй. Бид зөвхөн хүргэх өдөр
              утсаар нь холбож хаягийг баталгаажуулна.
            </div>
          </div>
        </label>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
          Хүлээн авагчийн утас
          {!surprise && <span className="text-pinkHot ml-0.5">*</span>}
        </label>
        <input
          type="tel"
          name="recipient_phone"
          value={recipientPhone}
          onChange={(e) => update({ recipient_phone: e.target.value })}
          placeholder="+976 9999 9999"
          required={!surprise}
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
        />
        <p className="text-xs text-ink/50 mt-1">
          {surprise
            ? 'Заавал биш — нууц бэлэгт таны хаягийн утсаар холбогдоно'
            : 'Хүргэлтийн үед утсаар холбогдоход хэрэгтэй'}
        </p>
      </div>
    </div>
  );
}
