// ============================================================
// Улаанбаатар хотын дүүрэг + хороо
// Source: Ulaanbaatar municipality administrative divisions
// (2023-2024 баримталсан тоо)
// ============================================================

export type District = {
  /** Storage value — Mongolian name without "дүүрэг" suffix */
  key: string;
  /** Display label */
  label: string;
  /** Total number of khoroos in this district */
  khoroos: number;
};

export const UB_DISTRICTS: District[] = [
  { key: 'Багануур',         label: 'Багануур',         khoroos: 5 },
  { key: 'Багахангай',       label: 'Багахангай',       khoroos: 2 },
  { key: 'Баянгол',          label: 'Баянгол',          khoroos: 23 },
  { key: 'Баянзүрх',         label: 'Баянзүрх',         khoroos: 28 },
  { key: 'Налайх',           label: 'Налайх',           khoroos: 8 },
  { key: 'Сонгинохайрхан',   label: 'Сонгинохайрхан',   khoroos: 32 },
  { key: 'Сүхбаатар',        label: 'Сүхбаатар',        khoroos: 20 },
  { key: 'Хан-Уул',          label: 'Хан-Уул',          khoroos: 25 },
  { key: 'Чингэлтэй',        label: 'Чингэлтэй',        khoroos: 19 },
];

/** Get khoroo count for a district key. Returns 0 for unknown districts. */
export function getKhorooCount(districtKey: string | null | undefined): number {
  if (!districtKey) return 0;
  return UB_DISTRICTS.find((d) => d.key === districtKey)?.khoroos ?? 0;
}

/** Build a list of khoroo labels: ["1-р хороо", "2-р хороо", …] */
export function listKhoroos(districtKey: string | null | undefined): string[] {
  const count = getKhorooCount(districtKey);
  return Array.from({ length: count }, (_, i) => `${i + 1}-р хороо`);
}
