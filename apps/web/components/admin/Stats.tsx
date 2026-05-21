// Reusable KPI card for admin dashboard
export function StatCard({
  label,
  value,
  hint,
  accent = 'ink',
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: 'ink' | 'pinkHot' | 'sageDeep' | 'goldDeep';
}) {
  const accentClass = {
    ink: 'text-ink',
    pinkHot: 'text-pinkHot',
    sageDeep: 'text-sageDeep',
    goldDeep: 'text-goldDeep',
  }[accent];

  return (
    <div className="bg-white rounded-card border border-border p-6">
      <div className="text-[11px] uppercase tracking-wider text-ink/50 mb-2">
        {label}
      </div>
      <div className={`text-3xl font-serif italic ${accentClass}`}>{value}</div>
      {hint && <div className="text-xs text-ink/60 mt-2">{hint}</div>}
    </div>
  );
}
