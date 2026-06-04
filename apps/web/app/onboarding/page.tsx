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
import { FlowerSalute } from '@/components/onboarding/FlowerSalute';
import { MOODS_BY_KEY } from '@/lib/moods';
import { OCCASIONS, formatMonthDay } from '@/lib/memory/occasions';

type SearchParams = {
  step?: string | string[];
  next?: string | string[];
  bonus?: string | string[];
};

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
  const bonusRaw =
    typeof searchParams.bonus === 'string' ? searchParams.bonus : '';
  const bonusPoints = Math.max(0, Math.min(50000, parseInt(bonusRaw, 10) || 0));

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
          bonusPoints={bonusPoints}
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
      <h1 className="font-serif italic text-4xl sm:text-5xl mb-10">
        Сайн уу, <em>{name || 'найз'}</em>
      </h1>

      <div className="flex justify-center">
        <Link
          href={`/onboarding?step=mood&next=${encodeURIComponent(next)}`}
          className="btn-primary"
        >
          Эхлэх →
        </Link>
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
        <h2 className="font-serif italic text-3xl sm:text-4xl">
          Та өөрийгөө цэцэгтэй зүйрлэх үү?
        </h2>
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
        <h2 className="font-serif italic text-3xl sm:text-4xl mb-4">
          Энэ л өдрийг мартаж болохгүй шүү
        </h2>
        <p className="text-ink/60 max-w-lg mx-auto leading-relaxed">
          Цэцэгчин найзууд нь мартаж болохгүй өдрийг нь сануулж, хамгийн
          тохиромжтой мөчид хамгийн сайхан цэцгийг хүргэхэд тусална.
        </p>
        <p className="text-ink/60 max-w-lg mx-auto leading-relaxed mt-3">
          Хайр, талархал, халамжаа зөв цагт нь илэрхийлэхэд бид үргэлж хамт
          байна.
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
  bonusPoints,
}: {
  name: string;
  mood: string | null;
  next: string;
  bonusPoints: number;
}) {
  const m = mood ? MOODS_BY_KEY[mood] : null;
  const showCelebration = bonusPoints > 0;
  return (
    <section className="text-center max-w-xl mx-auto relative">
      {showCelebration && <FlowerSalute />}

      <div className="text-6xl mb-6">{m?.emoji ?? '✨'}</div>
      <div className="text-[11px] uppercase tracking-[0.2em] text-pinkHot mb-3">
        Бэлэн
      </div>
      <h1 className="font-serif italic text-4xl sm:text-5xl mb-4">
        Баярлалаа, <em>{name || 'найз'}</em>
      </h1>

      {showCelebration && (
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-pinkHot/15 via-yellow-pale to-mint/40 border border-pinkHot/30 rounded-full px-5 py-3 mb-6 shadow-card">
          <span className="text-3xl">🎁</span>
          <div className="text-left">
            <div className="font-serif italic text-2xl text-ink leading-none">
              +{bonusPoints.toLocaleString()} оноо
            </div>
            <div className="text-[11px] uppercase tracking-wider text-ink/60 mt-1">
              Тавтай морилох бэлэг
            </div>
          </div>
        </div>
      )}

      {m ? (
        <p className="text-ink/70 mb-10 leading-relaxed">
          Та <strong>{m.label}</strong> {m.emoji}-ийг сонголоо. Бид танай{' '}
          mood-д тохирох цэцгийг үргэлж онцлоход бэлэн.
        </p>
      ) : (
        <p className="text-ink/70 mb-10 leading-relaxed">
          Нандин мөчүүдээ бидэнд даатгасанд баярлалаа. Цэцэгчин найзууд нь
          хичээнэ.
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
