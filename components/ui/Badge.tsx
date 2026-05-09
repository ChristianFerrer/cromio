import type { ReactNode } from "react";

export function Badge({
  kind = "default",
  className = "",
  children,
}: {
  kind?: "default" | "gold" | "green" | "blue";
  className?: string;
  children: ReactNode;
}) {
  const styles =
    kind === "gold"
      ? "bg-gradient-to-br from-gold-light via-gold to-gold-dark text-ink"
      : kind === "green"
        ? "bg-green-500 text-white"
        : kind === "blue"
          ? "bg-match-interest text-white"
          : "bg-line text-text";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-display text-[10px] uppercase tracking-wider ${styles} ${className}`}
    >
      {children}
    </span>
  );
}
