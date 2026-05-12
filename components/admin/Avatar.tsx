import { CROMIO_COLORS } from "@/lib/design/colors";

export function Avatar({
  alias,
  size = 32,
}: {
  alias: string | null;
  size?: number;
}) {
  const initials = (alias ?? "?").slice(0, 2).toUpperCase();
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 place-items-center rounded-full font-display text-white"
      style={{
        width: size,
        height: size,
        background: CROMIO_COLORS.green[500],
        fontSize: Math.max(10, Math.round(size * 0.4)),
      }}
    >
      {initials}
    </span>
  );
}
