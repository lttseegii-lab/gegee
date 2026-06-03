import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  OnboardingProgress,
  parseStep,
  type OnboardingStep,
} from '@/components/onboarding/OnboardingProgress';
import { MoodPicker } from '@/components/onboarding/MoodPicker';
import { MemoryDateAdder } from '@/components/account/MemoryDateAdder';
import { FinishButton, DoneButton } from '@/components/onboarding/FinishButton';
import { MOODS_BY_KEY } from '@/lib/moods';
import { OCCASIONS, formatMonthDay } from '@/lib/memory/occasions';

type SearchParams = { step?: string | string[]; next?: string | string[] };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const step = parseStep(searchParams.step);
  const nextRaw = typeof searchParams.next === 'string' ? searchParams.next : '/';
  // Sanitize next: must be a relative path
  const next = nextRaw.startsWith('/') ? nextRaw : '/';

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, signature_mood, onboarded_at')
    .eq('id', user.id)
    .maybeSingle();

  // If user has already onboarded and they're not on the `done` step, send
  // them to `next` immediately — no value in re-running the flow.
  if (profile?.onboarded_at && step !== 'done') {
    redirect(next);
  }

  const firstName = (profile?.name ?? user.email ?? '').split(' ')[0];

  return (
    <div>
      <OnboardingProgress current={step} />

      {step === 'welcome' && <WelcomeStep name={firstName} next={next} />}
      {step === 'mood' && (
        <MoodStep initial={profile?.signature_mood ?? null} next={next} />
      )}
      {step === 'memory' && <MemoryStep userId={user.id} next={next} />}
      {step === 'done' && (
        <DoneStep
          name={firstName}
          mood={profile?.signature_mood ?? null}
          next={next}
        />
      )}
    </div>
  );
}

// ============================================================
// Step 1 — Welcome
// ============================================================
function WelcomeStep({ name, next }: { name: string; next: string }) {
  return (
    <section className="text-center max-w-xl mx-auto">
      <div className="text-6xl mb-6">🌸</div>
      <div className="text-[11px] uppercase tracking-[0.2em] text-pinkHot mb-3">
        Тавтай морил
      </div>
      <h1 className="font-serif italic text-4xl sm:text-5xl mb-4">
        Сайн уу, <em>{name || 'найз'}</em>
      </h1>
      <p className="text-ink/60 mb-10 leading-relaxed">
        Бид таны Gegeen Memory Garden-ийг 2 хурдан алхамаар бэлдэе. Хэдхэн
        минут — алгасч ч болно.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <Link
          href={`/onboarding?step=mood&next=${encodeURIComponent(next)}`}
          className="btn-primary w-full sm:w-auto"
        >
          Эхлэх →
        </Link>
        <FinishButton
          next={next}
          variant="skip"
          className="text-sm text-ink/60 hover:text-ink"
        />
      </div>
    </section>
  );
}

// ============================================================
// Step 2 — Mood / signature flower
// ============================================================
function MoodStep({
  initial,
  next,
}: {
  initial: string | null;
  next: string;
}) {
  return (
    <section>
      <header className="mb-8 text-center">
        <div className="text-[11px] uppercase tracking-[0.2em] text-pinkHot mb-3">
          Алхам 1 / 2
        </div>
        <h2 className="font-serif italic text-3xl sm:text-4xl mb-3">
          Танд аль нь ойр вэ?
        </h2>
        <p className="text-ink/60 max-w-lg mx-auto">
          Цэцэг бол сэтгэлийн илэрхийлэл. Танай мэдрэмжийг хамгийн сайн
          илэрхийлэх mood-оо сонгоно уу.
        </p>
      </header>

      <MoodPicker initial={initial} next={next} />
    </section>
  );
}

// ============================================================
// Step 3 — Memory Garden seed
// ============================================================
async function MemoryStep({ userId, next }: { userId: string; next: string }) {
  const supabase = createClient();
  const { data: dates } = await supabase
    .from('memory_dates')
    .select('id, name, month, day, year, occasion')
    .eq('user_id', userId)
    .order('month')
    .order('day');

  const count = dates?.length ?? 0;

  return (
    <section>
      <header className="mb-8 text-center">
        <div className="text-[11px] uppercase tracking-[0.2em] text-pinkHot mb-3">
          Алхам 2 / 2
        </div>
        <h2 className="font-serif italic text-3xl sm:text-4xl mb-3">
          Memory Garden
        </h2>
        <p className="text-ink/60 max-w-lg mx-auto leading-relaxed">
          Хайртай хүмүүсийнхээ чухал огноог бүртгээрэй. Бид сануулаад, тухайн
          үед цэцэг санал болгоно. Хүсвэл одоо нэг огноо нэмж эсвэл алгасч
          болно.
        </p>
      </header>

      {count > 0 && (
        <div className="bg-white border border-border rounded-card p-5 mb-4">
          <div className="text-[11px] uppercase tracking-wider text-ink/50 mb-3">
            Нэмсэн ({count})
          </div>
          <ul className="space-y-2">
            {(dates ?? []).map((d) => {
              const occ = OCCASIONS[d.occasion as keyof typeof OCCASIONS] ?? null;
              return (
                <li
                  key={d.id}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="text-xl">{occ?.icon ?? '✻'}</span>
                  <span className="font-medium">{d.name}</span>
                  <span className="text-ink/50">
                    · {formatMonthDay(d.month, d.day)}
                    {d.year ? ` · ${d.year}` : ''}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mb-8">
        <MemoryDateAdder />
      </div>

      <div className="flex items-center justify-between">
        <Link
          href={`/onboarding?step=mood&next=${encodeURIComponent(next)}`}
          className="text-sm text-ink/60 hover:text-ink"
        >
          ← Буцах
        </Link>
        <div className="flex items-center gap-3">
          {count === 0 && (
            <FinishButton
              next={next}
              variant="skip"
              className="text-sm text-ink/60 hover:text-ink"
            />
          )}
          <FinishButton
            next={next}
            label={count > 0 ? 'Дуусгах →' : 'Үргэлжлүүлэх →'}
            className="btn-primary"
          />
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Step 4 — Done
// ============================================================
function DoneStep({
  name,
  mood,
  next,
}: {
  name: string;
  mood: string | null;
  next: string;
}) {
  const m = mood ? MOODS_BY_KEY[mood] : null;
  return (
    <section className="text-center max-w-xl mx-auto">
      <div className="text-6xl mb-6">{m?.emoji ?? '✨'}</div>
      <div className="text-[11px] uppercase tracking-[0.2em] text-pinkHot mb-3">
        Бэлэн
      </div>
      <h1 className="font-serif italic text-4xl sm:text-5xl mb-4">
        Баярлалаа, <em>{name || 'найз'}</em>
      </h1>
      {m ? (
        <p className="text-ink/70 mb-10 leading-relaxed">
          Та <strong>{m.label}</strong> {m.emoji}-ийг сонголоо. Бид танай{' '}
          mood-д тохирох цэцгийг үргэлж онцлоход бэлэн.
        </p>
      ) : (
        <p className="text-ink/70 mb-10 leading-relaxed">
          Gegeen-руу тавтай морил. Хүссэн үедээ Memory Garden-доо буцаж
          огноо нэмж болно.
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <DoneButton next={next} label="Үргэлжлүүлэх →" className="btn-primary" />
        <DoneButton
          next="/catalog/all"
          label="Цэцэг үзэх"
          className="btn-ghost"
        />
      </div>
    </section>
  );
}
