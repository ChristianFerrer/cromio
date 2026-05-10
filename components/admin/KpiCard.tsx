export function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-md border border-line bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-text-2">
        {label}
      </p>
      <p className="mt-0.5 font-display text-2xl text-text">{value}</p>
      {sub && <p className="mt-0.5 truncate text-[10px] text-text-2">{sub}</p>}
    </div>
  );
}
