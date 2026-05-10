import Image from "next/image";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { px: number; text: string }> = {
  sm: { px: 32, text: "text-xl" },
  md: { px: 44, text: "text-3xl" },
  lg: { px: 64, text: "text-5xl" },
};

/**
 * Cromio brand mark — the swap glyph (`/cromio_bg.png`) followed by the
 * wordmark in Bebas Neue. `withWordmark={false}` renders just the icon.
 */
export function Logo({
  size = "md",
  withWordmark = true,
  className = "",
}: {
  size?: Size;
  withWordmark?: boolean;
  className?: string;
}) {
  const { px, text } = SIZES[size];
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/cromio_bg.png"
        alt="Cromio"
        width={px}
        height={px}
        priority
        className="shrink-0"
      />
      {withWordmark && (
        <span className={`font-display tracking-tight text-text ${text}`}>
          CROMIO
        </span>
      )}
    </span>
  );
}
