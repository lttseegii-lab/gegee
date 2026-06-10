import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  OnboardingProgress,
  parseStep,
  type OnboardingStep,
} from '@/components/onboarding/OnboardingProgress';
import { MoodPicker } from '@/components/onboarding/MoodPicker';
import { getOnboardingFlowers } from '@/lib/getOnboardingFlowers';
import { MemoryDateAdder } from '@/components/account/MemoryDateAdder';
import { FinishButton, DoneButton } from '@/components/onboarding/FinishButton';
import { GiftReveal } from '@/components/onboarding/GiftReveal';
import { MOODS_BY_KEY } from '@/lib/moods';
import { OCCASIONS, formatMonthDay } from '@/lib/memory/occasions';
import { safeNext } from '@/lib/url/safeNext';

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
  // Sanitize next: must be a safe same-origin relative path (rejects //evil.com).
  const next = safeNext(
    typeof searchParams.next === 'string' ? searchParams.next : '/'
  );
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

  // Admin-overridable flower list — falls back to static defaults
  const flowers =
    step === 'mood' || step === 'done'
      ? await getOnboardingFlowers()
      : [];

  return (
    <div>
      <OnboardingProgress current={step} />

      {step === 'welcome' && <WelcomeStep name={firstName} next={next} />}
      {step === 'mood' && (
        <MoodStep
          initial={profile?.signature_mood ?? null}
          next={next}
          flowers={flowers}
        />
      )}
      {step === 'memory' && <MemoryStep userId={user.id} next={next} />}
      {step === 'done' && (
        <DoneStep
          name={firstName}
          mood={profile?.signature_mood ?? null}
          next={next}
          bonusPoints={bonusPoints}
          flowers={flowers}
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
  flowers,
}: {
  initial: string | null;
  next: string;
  flowers: import('@/lib/onboarding-flowers').OnboardingFlower[];
}) {
  return (
    <section>
      <header className="mb-8 text-center">
        <div className="text-[11px] uppercase tracking-[0.2em] text-pinkHot mb-3">
          Алхам 1 / 2
        </div>
        <h2 className="font-serif italic text-3xl sm:text-4xl">
          Та аль цэцгэнд дуртай вэ?
        </h2>
      </header>

      <MoodPicker initial={initial} next={next} flowers={flowers} />
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
  flowers,
}: {
  name: string;
  mood: string | null;
  next: string;
  bonusPoints: number;
  flowers: import('@/lib/onboarding-flowers').OnboardingFlower[];
}) {
  // Prefer flower lookup (new framing); fall back to old MOODS for legacy
  // signature_mood values stored before the rebrand.
  const flower = mood ? flowers.find((f) => f.key === mood) ?? null : null;
  const m = !flower && mood ? MOODS_BY_KEY[mood] : null;
  const showCelebration = bonusPoints > 0;
  return (
    <section className="text-center max-w-xl mx-auto relative">
      {flower ? (
        <div className="mx-auto mb-6 w-24 h-24 rounded-full overflow-hidden border border-border shadow-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flower.image_url}
            alt={flower.label}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="text-6xl mb-6">{m?.emoji ?? '✨'}</div>
      )}
      <div className="text-[11px] uppercase tracking-[0.2em] text-pinkHot mb-3">
        Бэлэн
      </div>
      <h1 className="font-serif italic text-4xl sm:text-5xl mb-4">
        Баярлалаа, <em>{name || 'найз'}</em>
      </h1>

      {showCelebration && <GiftReveal bonusPoints={bonusPoints} />}

      {flower ? (
        <p className="text-ink/70 mb-10 leading-relaxed">
          Нандин мөчүүдээ бидэнд даатгасанд баярлалаа. Цэцэгчин найзууд нь
          хичээх болно.
        </p>
      ) : m ? (
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
