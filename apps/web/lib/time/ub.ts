// Date helpers pinned to the Asia/Ulaanbaatar zone (UTC+8, no DST).
//
// `new Date().toISOString().slice(0,10)` returns a UTC calendar day, which is
// one day behind for ~8 hours every night in Mongolia and even all day for a
// browser whose local midnight precedes UTC. Always derive "today" / a slot
// date through these helpers so the picker, checkout, and capacity all agree.
//
// Pure module — safe to import from both server and client components.

const UB_TZ = 'Asia/Ulaanbaatar';

/** Format an instant as YYYY-MM-DD in the Asia/Ulaanbaatar zone. */
export function ubDateString(d: Date = new Date()): string {
  // en-CA renders ISO-style YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: UB_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** Today's date (YYYY-MM-DD) in the Asia/Ulaanbaatar zone. */
export function ubToday(): string {
  return ubDateString(new Date());
}
