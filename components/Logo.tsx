import Image from "next/image";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { px: number; pad: number; radius: number; text: string }> = {
  sm: { px: 24, pad: 4, radius: 8, text: "text-xl" },
  md: { px: 32, pad: 6, radius: 10, text: "text-3xl" },
  lg: { px: 48, pad: 8, radius: 14, text: "text-5xl" },
};

export function Logo({
  size = "md",
  withWordmark = true,
  className = "",
}: {
  size?: Size;
  withWordmark?: boolean;
  className?: string;
}) {
  const { px, pad, radius, text } = SIZES[size];
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="shrink-0 grid place-items-center shadow-sh1"
        style={{
          backgroundColor: "#1abc9c",
          padding: pad,
          borderRadius: radius,
        }}
      >
        <Image
          src="/cromio_lg.png"
          alt="Cromio"
          width={px}
          height={px}
          priority
        />
      </span>
      {withWordmark && (
        <span className={`font-display tracking-tight text-text ${text}`}>
          CROMIO
        </span>
      )}
    </span>
  );
}
