export function AlbumProgress({
  pct,
  className = "",
}: {
  pct: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5">
        <div
          className="h-full rounded-full bg-green-500 transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="min-w-[28px] text-right font-display text-[11px] font-bold text-text-2 tabular">
        {Math.round(pct * 10) / 10}%
      </span>
    </div>
  );
}
