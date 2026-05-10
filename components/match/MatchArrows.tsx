export function MatchArrows({
  recibes,
  entregas,
  size = 18,
}: {
  recibes: number;
  entregas: number;
  size?: number;
}) {
  return (
    <div
      className="inline-flex items-center gap-1.5 font-display tabular leading-none"
      style={{ fontSize: size }}
    >
      <span className="inline-flex items-center gap-1 text-green-700">
        <span style={{ fontSize: size * 0.85 }}>▼</span>
        {recibes}
      </span>
      <span className="inline-flex items-center gap-1 text-trade-give">
        <span style={{ fontSize: size * 0.85 }}>▲</span>
        {entregas}
      </span>
    </div>
  );
}
