export function Avatar({
  alias,
  color,
  avatarUrl,
  size = 32,
}: {
  alias: string | null;
  color: string | null;
  avatarUrl: string | null;
  size?: number;
}) {
  const initials = (alias ?? "?").slice(0, 2).toUpperCase();
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={alias ?? ""}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 place-items-center rounded-full font-display text-white"
      style={{
        width: size,
        height: size,
        background: color ?? "#1FAE5A",
        fontSize: Math.max(10, Math.round(size * 0.4)),
      }}
    >
      {initials}
    </span>
  );
}
